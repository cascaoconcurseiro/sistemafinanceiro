/**
 * SERVIÇO DE FATURAS
 * Gerencia faturas de cartão de crédito com criação automática
 */

import { prisma } from '@/lib/prisma';
import { DoubleEntryService } from './double-entry-service';
import { ValidationService } from './validation-service';
import { IdempotencyService } from './idempotency-service';

export class InvoiceService {
  /**
   * Paga fatura e cria próxima automaticamente
   */
  static async payInvoice(
    invoiceId: string,
    accountId: string,
    userId: string,
    operationUuid?: string,
    paidBy?: string
  ) {
    // ✅ IDEMPOTÊNCIA
    const finalOperationUuid = IdempotencyService.validateOrGenerate(operationUuid);
    
    if (await IdempotencyService.checkDuplicate(finalOperationUuid)) {
      const existing = await IdempotencyService.getByOperationUuid(finalOperationUuid);
      console.log(`⚠️ Pagamento de fatura duplicado: ${finalOperationUuid}`);
      return existing;
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Buscar fatura
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { creditCard: true }
      });

      if (!invoice) {
        throw new Error('Fatura não encontrada');
      }

      if (invoice.userId !== userId) {
        throw new Error('Fatura não pertence ao usuário');
      }

      if (invoice.status === 'paid') {
        throw new Error('Fatura já foi paga');
      }

      // 2. Validar saldo
      await ValidationService.validateAccountBalance(accountId, Number(invoice.totalAmount));

      // 3. Criar transação de pagamento
      const payment = await tx.transaction.create({
        data: {
          userId,
          accountId,
          amount: -Number(invoice.totalAmount),
          type: 'DESPESA',
          description: `Pagamento Fatura ${invoice.creditCard.name} - ${this.formatPeriod(invoice.dueDate)}`,
          date: new Date(),
          status: 'cleared',
          invoiceId,
          operationUuid: finalOperationUuid,
          createdBy: paidBy
        }
      });

      console.log(`✅ Pagamento criado: ${payment.id} (R$ ${invoice.totalAmount})`);

      // 4. Criar lançamentos contábeis
      await DoubleEntryService.createJournalEntries(tx, payment);

      // 5. Marcar fatura como paga
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAt: new Date()
        }
      });

      console.log(`✅ Fatura marcada como paga: ${invoiceId}`);

      // 6. ✅ CRIAR PRÓXIMA FATURA AUTOMATICAMENTE
      const nextInvoice = await this.createNextInvoice(tx, invoice);

      console.log(`✅ Próxima fatura criada: ${nextInvoice.id}`);

      // 7. Atualizar saldo do cartão
      await tx.creditCard.update({
        where: { id: invoice.creditCardId },
        data: { currentBalance: 0 } // Zera após pagamento
      });

      // 8. Atualizar saldo da conta
      await this.updateAccountBalance(tx, accountId);

      return {
        payment,
        invoice,
        nextInvoice
      };
    });
  }

  /**
   * Cria próxima fatura automaticamente
   */
  private static async createNextInvoice(tx: any, currentInvoice: any) {
    const nextClosingDate = this.calculateNextClosingDate(
      currentInvoice.closingDate,
      currentInvoice.creditCard.closingDay
    );

    const nextDueDate = this.calculateNextDueDate(
      nextClosingDate,
      currentInvoice.creditCard.dueDay
    );

    return await tx.invoice.create({
      data: {
        userId: currentInvoice.userId,
        creditCardId: currentInvoice.creditCardId,
        closingDate: nextClosingDate,
        dueDate: nextDueDate,
        totalAmount: 0,
        status: 'open'
      }
    });
  }

  /**
   * Calcula próxima data de fechamento
   */
  private static calculateNextClosingDate(currentClosing: Date, closingDay: number): Date {
    const next = new Date(currentClosing);
    next.setMonth(next.getMonth() + 1);
    next.setDate(closingDay);
    return next;
  }

  /**
   * Calcula próxima data de vencimento
   */
  private static calculateNextDueDate(closingDate: Date, dueDay: number): Date {
    const dueDate = new Date(closingDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(dueDay);
    return dueDate;
  }

  /**
   * Formata período da fatura
   */
  private static formatPeriod(date: Date): string {
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  }

  /**
   * Busca ou cria fatura atual do cartão
   */
  static async getCurrentInvoice(creditCardId: string, userId: string) {
    const card = await prisma.creditCard.findUnique({
      where: { id: creditCardId }
    });

    if (!card) {
      throw new Error('Cartão não encontrado');
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Buscar fatura aberta do mês atual
    let invoice = await prisma.invoice.findFirst({
      where: {
        creditCardId,
        userId,
        status: 'open',
        closingDate: {
          gte: new Date(currentYear, currentMonth, 1),
          lte: new Date(currentYear, currentMonth + 1, 0)
        }
      }
    });

    // Se não existe, criar
    if (!invoice) {
      const closingDate = new Date(currentYear, currentMonth, card.closingDay);
      const dueDate = new Date(currentYear, currentMonth + 1, card.dueDay);

      invoice = await prisma.invoice.create({
        data: {
          userId,
          creditCardId,
          closingDate,
          dueDate,
          totalAmount: 0,
          status: 'open'
        }
      });

      console.log(`✅ Fatura criada automaticamente: ${invoice.id}`);
    }

    return invoice;
  }

  /**
   * Adiciona transação à fatura
   */
  static async addTransactionToInvoice(
    transactionId: string,
    creditCardId: string,
    userId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar transação
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // 2. Buscar ou criar fatura atual
      const invoice = await this.getCurrentInvoice(creditCardId, userId);

      // 3. Vincular transação à fatura
      await tx.transaction.update({
        where: { id: transactionId },
        data: { invoiceId: invoice.id }
      });

      // 4. Atualizar total da fatura
      const invoiceTransactions = await tx.transaction.findMany({
        where: {
          invoiceId: invoice.id,
          deletedAt: null
        }
      });

      const total = invoiceTransactions.reduce((sum, t) => {
        return sum + Math.abs(Number(t.amount));
      }, 0);

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { totalAmount: total }
      });

      // 5. Atualizar saldo do cartão
      await tx.creditCard.update({
        where: { id: creditCardId },
        data: { currentBalance: total }
      });

      return { invoice, transaction };
    });
  }

  /**
   * Atualiza saldo da conta
   */
  private static async updateAccountBalance(tx: any, accountId: string) {
    const transactions = await tx.transaction.findMany({
      where: {
        accountId,
        deletedAt: null
      }
    });

    const balance = transactions.reduce((sum: number, t: any) => {
      return sum + Number(t.amount);
    }, 0);

    await tx.account.update({
      where: { id: accountId },
      data: { balance }
    });
  }
}
