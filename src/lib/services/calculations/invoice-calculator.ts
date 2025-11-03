/**
 * CALCULADORA DE FATURAS
 * Recalcula totais de faturas de cartão de crédito
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class InvoiceCalculator {
  /**
   * Recalcula o total de uma fatura específica
   */
  static async recalculateInvoiceTotal(
    tx: Prisma.TransactionClient,
    invoiceId: string
  ): Promise<void> {
    // Buscar todas as transações da fatura
    const transactions = await tx.transaction.findMany({
      where: {
        invoiceId,
        status: { not: 'CANCELLED' },
        type: 'DESPESA',
      },
      select: { amount: true },
    });

    // Calcular total
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );

    // Atualizar fatura
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { totalAmount },
    });
  }

  /**
   * Recalcula todas as faturas de um cartão
   */
  static async recalculateCardInvoices(
    tx: Prisma.TransactionClient,
    creditCardId: string
  ): Promise<void> {
    const invoices = await tx.invoice.findMany({
      where: { creditCardId },
      select: { id: true },
    });

    for (const invoice of invoices) {
      await this.recalculateInvoiceTotal(tx, invoice.id);
    }
  }

  /**
   * Recalcula todas as faturas de um usuário
   */
  static async recalculateAllInvoices(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Buscar todos os cartões do usuário
      const cards = await tx.creditCard.findMany({
        where: { userId },
        select: { id: true },
      });

      // Recalcular faturas de cada cartão
      for (const card of cards) {
        await this.recalculateCardInvoices(tx, card.id);
      }
    });
  }

  /**
   * Verifica se uma fatura está consistente
   */
  static async checkInvoiceConsistency(invoiceId: string): Promise<{
    isConsistent: boolean;
    currentTotal: number;
    calculatedTotal: number;
    difference: number;
  }> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { totalAmount: true },
    });

    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        invoiceId,
        status: { not: 'CANCELLED' },
        type: 'DESPESA',
      },
      select: { amount: true },
    });

    const calculatedTotal = transactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );

    const currentTotal = Number(invoice.totalAmount);
    const difference = Math.abs(currentTotal - calculatedTotal);
    const isConsistent = difference < 0.01; // Tolerância de 1 centavo

    return {
      isConsistent,
      currentTotal,
      calculatedTotal,
      difference,
    };
  }

  /**
   * Paga uma fatura
   */
  static async payInvoice(
    invoiceId: string,
    paymentAccountId: string,
    paymentDate: Date
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { creditCard: true },
      });

      if (!invoice) {
        throw new Error('Fatura não encontrada');
      }

      if (invoice.status === 'paid') {
        throw new Error('Fatura já está paga');
      }

      // Atualizar status da fatura
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAt: paymentDate,
        },
      });

      // Criar transação de pagamento
      const paymentTransaction = await tx.transaction.create({
        data: {
          userId: invoice.creditCard.userId,
          accountId: paymentAccountId,
          amount: -Math.abs(Number(invoice.totalAmount)),
          description: `Pagamento Fatura ${invoice.month + 1}/${invoice.year}`,
          type: 'DESPESA',
          date: paymentDate,
          status: 'cleared',
          categoryId: null, // Ou categoria específica de pagamento de fatura
        },
      });

      // Atualizar saldo da conta
      const account = await tx.account.findUnique({
        where: { id: paymentAccountId },
      });

      if (account) {
        const transactions = await tx.transaction.findMany({
          where: {
            accountId: paymentAccountId,
            status: { not: 'CANCELLED' },
          },
          select: { amount: true, type: true },
        });

        const balance = transactions.reduce((acc, t) => {
          const amount = Number(t.amount);
          return t.type === 'RECEITA' ? acc + amount : acc - Math.abs(amount);
        }, 0);

        await tx.account.update({
          where: { id: paymentAccountId },
          data: { balance },
        });
      }

      // Zerar saldo usado do cartão (currentBalance)
      await tx.creditCard.update({
        where: { id: invoice.creditCardId },
        data: { currentBalance: 0 },
      });

      return {
        invoice: updatedInvoice,
        paymentTransaction,
      };
    });
  }

  /**
   * Gera fatura para um mês específico
   */
  static async generateInvoice(
    creditCardId: string,
    month: number,
    year: number
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // Verificar se fatura já existe
      const existing = await tx.invoice.findUnique({
        where: {
          creditCardId_month_year: {
            creditCardId,
            month,
            year,
          },
        },
      });

      if (existing) {
        return existing;
      }

      // Buscar transações do período
      const card = await tx.creditCard.findUnique({
        where: { id: creditCardId },
      });

      if (!card) {
        throw new Error('Cartão não encontrado');
      }

      // Calcular período de fechamento
      const closingDate = new Date(year, month, card.closingDay);
      const previousClosingDate = new Date(year, month - 1, card.closingDay);

      const transactions = await tx.transaction.findMany({
        where: {
          creditCardId,
          type: 'DESPESA',
          status: { not: 'CANCELLED' },
          date: {
            gt: previousClosingDate,
            lte: closingDate,
          },
        },
        select: { amount: true },
      });

      const totalAmount = transactions.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0
      );

      // Criar fatura
      const dueDate = new Date(year, month, card.dueDay);

      const invoice = await tx.invoice.create({
        data: {
          userId: card.userId,
          creditCardId,
          month,
          year,
          dueDate,
          totalAmount,
          status: 'PENDING',
        },
      });

      // Vincular transações à fatura
      await tx.transaction.updateMany({
        where: {
          creditCardId,
          type: 'DESPESA',
          status: { not: 'CANCELLED' },
          date: {
            gt: previousClosingDate,
            lte: closingDate,
          },
          invoiceId: null,
        },
        data: {
          invoiceId: invoice.id,
        },
      });

      return invoice;
    });
  }
}
