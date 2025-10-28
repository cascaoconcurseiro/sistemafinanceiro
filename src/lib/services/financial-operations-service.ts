/**
 * SERVIÇO DE OPERAÇÕES FINANCEIRAS
 * Garante atomicidade e integridade em todas as operações
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  TransactionSchema,
  validateOrThrow,
  type TransactionInput,
} from '@/lib/validation/schemas';
import { ValidationService } from './validation-service';

// ============================================
// TIPOS
// ============================================

interface CreateTransactionOptions {
  transaction: TransactionInput;
  createJournalEntries?: boolean;
  linkToInvoice?: boolean;
}

interface CreateInstallmentsOptions {
  baseTransaction: TransactionInput;
  totalInstallments: number;
  firstDueDate: Date;
  frequency: 'monthly' | 'weekly' | 'daily';
}

interface CreateTransferOptions {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: Date;
  userId: string;
}

interface CreateSharedExpenseOptions {
  transaction: TransactionInput;
  sharedWith: string[]; // IDs dos participantes
  splitType: 'equal' | 'percentage' | 'custom';
  splits?: Record<string, number>; // Para custom
}

// ============================================
// SERVIÇO PRINCIPAL
// ============================================

export class FinancialOperationsService {
  /**
   * CRIAR TRANSAÇÃO COM ATOMICIDADE
   * Garante que todas as operações relacionadas sejam criadas ou nenhuma
   */
  static async createTransaction(options: CreateTransactionOptions) {
    const { transaction, createJournalEntries = true, linkToInvoice = true } = options;

    // Validar dados
    const validatedTransaction = validateOrThrow(TransactionSchema, transaction);

    // ✅ VALIDAÇÃO COMPLETA DE CONSISTÊNCIA
    await ValidationService.validateTransaction(validatedTransaction);

    // ✅ VALIDAR LIMITE DE CARTÃO (se for despesa de cartão)
    if (validatedTransaction.type === 'DESPESA' && validatedTransaction.creditCardId) {
      await this.validateCreditCardLimit(validatedTransaction.creditCardId, Math.abs(Number(validatedTransaction.amount)));
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Criar transação
      const createdTransaction = await tx.transaction.create({
        data: {
          ...validatedTransaction,
          date: validatedTransaction.date,
          sharedWith: Array.isArray(validatedTransaction.sharedWith)
            ? JSON.stringify(validatedTransaction.sharedWith)
            : validatedTransaction.sharedWith,
        },
      });

      // 2. Criar lançamentos contábeis (partidas dobradas)
      if (createJournalEntries) {
        await this.createJournalEntriesForTransaction(tx, createdTransaction);
      }

      // 3. Vincular a fatura de cartão (se aplicável)
      if (linkToInvoice && createdTransaction.creditCardId) {
        await this.linkTransactionToInvoice(tx, createdTransaction);
      }

      // 4. Atualizar saldo da conta
      if (createdTransaction.accountId) {
        await this.updateAccountBalance(tx, createdTransaction.accountId);
      }

      // 5. Atualizar saldo do cartão
      if (createdTransaction.creditCardId) {
        await this.updateCreditCardBalance(tx, createdTransaction.creditCardId);
      }

      return createdTransaction;
    });
  }

  /**
   * CRIAR PARCELAMENTO COM INTEGRIDADE
   * Garante que todas as parcelas sejam criadas atomicamente
   */
  static async createInstallments(options: CreateInstallmentsOptions) {
    const { baseTransaction, totalInstallments, firstDueDate, frequency } = options;

    // Validar transação base
    const validatedTransaction = validateOrThrow(TransactionSchema, {
      ...baseTransaction,
      isInstallment: true,
      totalInstallments,
    });

    return await prisma.$transaction(async (tx) => {
      // 1. Criar transação pai
      const parentTransaction = await tx.transaction.create({
        data: {
          ...validatedTransaction,
          date: validatedTransaction.date,
          installmentNumber: 1,
          totalInstallments,
          installmentGroupId: `inst_${Date.now()}`,
          sharedWith: Array.isArray(validatedTransaction.sharedWith)
            ? JSON.stringify(validatedTransaction.sharedWith)
            : validatedTransaction.sharedWith,
        },
      });

      // 2. Criar parcelas na tabela Installment
      const installments = [];
      const amountPerInstallment = Number(validatedTransaction.amount) / totalInstallments;

      for (let i = 1; i <= totalInstallments; i++) {
        const dueDate = this.calculateDueDate(firstDueDate, i - 1, frequency);

        const installment = await tx.installment.create({
          data: {
            transactionId: parentTransaction.id,
            userId: validatedTransaction.userId,
            installmentNumber: i,
            totalInstallments,
            amount: amountPerInstallment,
            dueDate,
            status: i === 1 ? 'paid' : 'pending',
            paidAt: i === 1 ? new Date() : null,
            description: `${validatedTransaction.description} - Parcela ${i}/${totalInstallments}`,
          },
        });

        installments.push(installment);
      }

      // 3. Criar lançamentos contábeis para a primeira parcela
      await this.createJournalEntriesForTransaction(tx, parentTransaction);

      // 4. Atualizar saldo
      if (parentTransaction.accountId) {
        await this.updateAccountBalance(tx, parentTransaction.accountId);
      }

      return {
        parentTransaction,
        installments,
      };
    });
  }

  /**
   * CRIAR TRANSFERÊNCIA COM ATOMICIDADE
   * Garante que débito e crédito sejam criados juntos
   */
  static async createTransfer(options: CreateTransferOptions) {
    const { fromAccountId, toAccountId, amount, description, date, userId } = options;

    if (fromAccountId === toAccountId) {
      throw new Error('Conta de origem e destino não podem ser iguais');
    }

    const transferId = `transfer_${Date.now()}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Criar transação de débito (saída)
      const debitTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId: fromAccountId,
          amount: -Math.abs(amount),
          description: `${description} (Transferência para)`,
          type: 'DESPESA',
          date,
          status: 'cleared',
          isTransfer: true,
          transferId,
          transferType: 'debit',
        },
      });

      // 2. Criar transação de crédito (entrada)
      const creditTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId: toAccountId,
          amount: Math.abs(amount),
          description: `${description} (Transferência de)`,
          type: 'RECEITA',
          date,
          status: 'cleared',
          isTransfer: true,
          transferId,
          transferType: 'credit',
        },
      });

      // 3. Criar lançamentos contábeis
      await this.createJournalEntriesForTransaction(tx, debitTransaction);
      await this.createJournalEntriesForTransaction(tx, creditTransaction);

      // 4. Atualizar saldos
      await this.updateAccountBalance(tx, fromAccountId);
      await this.updateAccountBalance(tx, toAccountId);

      return {
        debitTransaction,
        creditTransaction,
        transferId,
      };
    });
  }

  /**
   * CRIAR DESPESA COMPARTILHADA COM ATOMICIDADE
   * Garante que todas as dívidas sejam criadas
   */
  static async createSharedExpense(options: CreateSharedExpenseOptions) {
    const { transaction, sharedWith, splitType, splits } = options;

    // Validar transação
    const validatedTransaction = validateOrThrow(TransactionSchema, {
      ...transaction,
      isShared: true,
      sharedWith,
    });

    return await prisma.$transaction(async (tx) => {
      // 1. Calcular divisão
      const totalAmount = Math.abs(Number(validatedTransaction.amount));
      const splitAmounts = this.calculateSplits(totalAmount, sharedWith, splitType, splits);

      // 2. Criar transação principal
      const createdTransaction = await tx.transaction.create({
        data: {
          ...validatedTransaction,
          date: validatedTransaction.date,
          isShared: true,
          sharedWith: JSON.stringify(sharedWith),
          totalSharedAmount: totalAmount,
          myShare: splitAmounts[validatedTransaction.userId] || 0,
        },
      });

      // 3. Criar dívidas para cada participante
      const debts = [];
      for (const [participantId, amount] of Object.entries(splitAmounts)) {
        if (participantId !== validatedTransaction.userId && amount > 0) {
          const debt = await tx.sharedDebt.create({
            data: {
              userId: validatedTransaction.userId,
              creditorId: validatedTransaction.userId, // Quem pagou
              debtorId: participantId, // Quem deve
              originalAmount: amount,
              currentAmount: amount,
              paidAmount: 0,
              description: createdTransaction.description,
              status: 'active',
              transactionId: createdTransaction.id,
            },
          });
          debts.push(debt);
        }
      }

      // 4. Criar lançamentos contábeis
      await this.createJournalEntriesForTransaction(tx, createdTransaction);

      // 5. Atualizar saldo
      if (createdTransaction.accountId) {
        await this.updateAccountBalance(tx, createdTransaction.accountId);
      }

      return {
        transaction: createdTransaction,
        debts,
      };
    });
  }

  /**
   * DELETAR TRANSAÇÃO COM CASCATA
   * Garante que todas as entidades relacionadas sejam deletadas
   */
  static async deleteTransaction(transactionId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar transação
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId },
        include: {
          journalEntries: true,
        },
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // 2. Verificar se é parcelamento
      if (transaction.isInstallment && transaction.installmentGroupId) {
        // Deletar todas as parcelas do grupo
        await tx.installment.deleteMany({
          where: { transactionId: transaction.id },
        });
      }

      // 3. Verificar se é transferência
      if (transaction.isTransfer && transaction.transferId) {
        // Deletar transação vinculada
        await tx.transaction.updateMany({
          where: {
            transferId: transaction.transferId,
            id: { not: transactionId },
          },
          data: { deletedAt: new Date() },
        });
      }

      // 4. Deletar lançamentos contábeis
      await tx.journalEntry.deleteMany({
        where: { transactionId },
      });

      // 5. Deletar dívidas compartilhadas
      await tx.sharedDebt.deleteMany({
        where: { transactionId },
      });

      // 6. Soft delete da transação
      await tx.transaction.update({
        where: { id: transactionId },
        data: { deletedAt: new Date() },
      });

      // 7. Atualizar saldos
      if (transaction.accountId) {
        await this.updateAccountBalance(tx, transaction.accountId);
      }

      if (transaction.creditCardId) {
        await this.updateCreditCardBalance(tx, transaction.creditCardId);
      }

      return { success: true };
    });
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Criar lançamentos contábeis (partidas dobradas)
   * ✅ CORRIGIDO: Agora cria lançamentos em contas diferentes
   */
  private static async createJournalEntriesForTransaction(
    tx: Prisma.TransactionClient,
    transaction: any
  ) {
    const amount = Math.abs(Number(transaction.amount));
    const accountId = transaction.accountId || transaction.creditCardId;

    if (!accountId) {
      throw new Error('Transação deve ter accountId ou creditCardId');
    }

    // Buscar conta para determinar o tipo
    const account = await tx.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Conta não encontrada');
    }

    if (transaction.type === 'RECEITA') {
      // RECEITA: Débito na conta (aumenta ativo), Crédito em conta de receita
      // Conta ATIVO aumenta (débito)
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: accountId,
          entryType: 'DEBITO',
          amount,
          description: `${transaction.description} (Entrada)`,
        },
      });

      // Conta RECEITA aumenta (crédito) - usar categoria ou conta padrão
      const revenueAccountId = await this.getOrCreateRevenueAccount(tx, transaction.userId, transaction.categoryId);
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: revenueAccountId,
          entryType: 'CREDITO',
          amount,
          description: `${transaction.description} (Receita)`,
        },
      });
    } else if (transaction.type === 'DESPESA') {
      // DESPESA: Débito em conta de despesa, Crédito na conta (diminui ativo)
      // Conta DESPESA aumenta (débito) - usar categoria ou conta padrão
      const expenseAccountId = await this.getOrCreateExpenseAccount(tx, transaction.userId, transaction.categoryId);
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: expenseAccountId,
          entryType: 'DEBITO',
          amount,
          description: `${transaction.description} (Despesa)`,
        },
      });

      // Conta ATIVO diminui (crédito)
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: accountId,
          entryType: 'CREDITO',
          amount,
          description: `${transaction.description} (Saída)`,
        },
      });
    }
  }

  /**
   * Buscar ou criar conta de receita para categoria
   */
  private static async getOrCreateRevenueAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    categoryId?: string
  ): Promise<string> {
    // Buscar conta de receita existente
    let account = await tx.account.findFirst({
      where: {
        userId,
        type: 'RECEITA',
        name: categoryId ? `Receita - ${categoryId}` : 'Receitas Gerais',
      },
    });

    if (!account) {
      // Criar conta de receita
      account = await tx.account.create({
        data: {
          userId,
          name: categoryId ? `Receita - ${categoryId}` : 'Receitas Gerais',
          type: 'RECEITA',
          balance: 0,
          currency: 'BRL',
          isActive: true,
        },
      });
    }

    return account.id;
  }

  /**
   * Buscar ou criar conta de despesa para categoria
   */
  private static async getOrCreateExpenseAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    categoryId?: string
  ): Promise<string> {
    // Buscar conta de despesa existente
    let account = await tx.account.findFirst({
      where: {
        userId,
        type: 'DESPESA',
        name: categoryId ? `Despesa - ${categoryId}` : 'Despesas Gerais',
      },
    });

    if (!account) {
      // Criar conta de despesa
      account = await tx.account.create({
        data: {
          userId,
          name: categoryId ? `Despesa - ${categoryId}` : 'Despesas Gerais',
          type: 'DESPESA',
          balance: 0,
          currency: 'BRL',
          isActive: true,
        },
      });
    }

    return account.id;
  }

  /**
   * Vincular transação a fatura de cartão
   */
  private static async linkTransactionToInvoice(
    tx: Prisma.TransactionClient,
    transaction: any
  ) {
    if (!transaction.creditCardId) return;

    // Buscar cartão
    const card = await tx.creditCard.findUnique({
      where: { id: transaction.creditCardId },
    });

    if (!card) return;

    // Calcular mês/ano da fatura baseado na data de fechamento
    const transactionDate = new Date(transaction.date);
    const { month, year } = this.calculateInvoiceMonthYear(
      transactionDate,
      card.closingDay
    );

    // Buscar ou criar fatura
    let invoice = await tx.invoice.findFirst({
      where: {
        creditCardId: card.id,
        month,
        year,
      },
    });

    if (!invoice) {
      // Criar fatura
      const dueDate = new Date(year, month, card.dueDay);
      invoice = await tx.invoice.create({
        data: {
          creditCardId: card.id,
          userId: transaction.userId,
          month,
          year,
          totalAmount: 0,
          paidAmount: 0,
          dueDate,
          isPaid: false,
          status: 'open',
        },
      });
    }

    // Vincular transação à fatura
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { invoiceId: invoice.id },
    });

    // Atualizar total da fatura
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        totalAmount: {
          increment: Math.abs(Number(transaction.amount)),
        },
      },
    });
  }

  /**
   * Atualizar saldo da conta baseado em JournalEntry
   * ✅ CORRIGIDO: Agora considera apenas transações não deletadas
   */
  private static async updateAccountBalance(
    tx: Prisma.TransactionClient,
    accountId: string
  ) {
    // ✅ Buscar apenas entradas de transações não deletadas
    const entries = await tx.journalEntry.findMany({
      where: { 
        accountId,
        transaction: {
          deletedAt: null,
        },
      },
      include: {
        transaction: true,
      },
    });

    // Calcular saldo: Débito - Crédito
    const balance = entries.reduce((sum, entry) => {
      if (entry.entryType === 'DEBITO') {
        return sum + Number(entry.amount);
      } else {
        return sum - Number(entry.amount);
      }
    }, 0);

    // Atualizar saldo
    await tx.account.update({
      where: { id: accountId },
      data: { balance },
    });
  }

  /**
   * Atualizar saldo do cartão de crédito
   */
  private static async updateCreditCardBalance(
    tx: Prisma.TransactionClient,
    creditCardId: string
  ) {
    // Buscar todas as transações do cartão
    const transactions = await tx.transaction.findMany({
      where: {
        creditCardId,
        deletedAt: null,
      },
    });

    // Calcular saldo
    const balance = transactions.reduce((sum, t) => {
      return sum + Number(t.amount);
    }, 0);

    // Atualizar saldo
    await tx.creditCard.update({
      where: { id: creditCardId },
      data: { currentBalance: Math.abs(balance) },
    });
  }

  /**
   * Calcular data de vencimento de parcela
   */
  private static calculateDueDate(
    firstDueDate: Date,
    installmentIndex: number,
    frequency: 'monthly' | 'weekly' | 'daily'
  ): Date {
    const dueDate = new Date(firstDueDate);

    switch (frequency) {
      case 'monthly':
        dueDate.setMonth(dueDate.getMonth() + installmentIndex);
        break;
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + installmentIndex * 7);
        break;
      case 'daily':
        dueDate.setDate(dueDate.getDate() + installmentIndex);
        break;
    }

    return dueDate;
  }

  /**
   * Calcular mês/ano da fatura baseado na data de fechamento
   */
  private static calculateInvoiceMonthYear(
    transactionDate: Date,
    closingDay: number
  ): { month: number; year: number } {
    const day = transactionDate.getDate();
    let month = transactionDate.getMonth();
    let year = transactionDate.getFullYear();

    // Se a transação é após o dia de fechamento, vai para a próxima fatura
    if (day > closingDay) {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    return { month, year };
  }

  /**
   * Calcular divisão de despesa compartilhada
   * ✅ CORRIGIDO: Agora valida que a soma dos splits = totalAmount
   */
  private static calculateSplits(
    totalAmount: number,
    participants: string[],
    splitType: 'equal' | 'percentage' | 'custom',
    customSplits?: Record<string, number>
  ): Record<string, number> {
    const splits: Record<string, number> = {};

    if (splitType === 'equal') {
      const amountPerPerson = totalAmount / participants.length;
      participants.forEach((id) => {
        splits[id] = amountPerPerson;
      });
    } else if (splitType === 'percentage' && customSplits) {
      // ✅ Validar que soma das porcentagens = 100%
      const totalPercentage = Object.values(customSplits).reduce((sum, p) => sum + p, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error(`Soma das porcentagens deve ser 100%, atual: ${totalPercentage}%`);
      }

      participants.forEach((id) => {
        const percentage = customSplits[id] || 0;
        splits[id] = (totalAmount * percentage) / 100;
      });
    } else if (splitType === 'custom' && customSplits) {
      // ✅ Validar que soma dos valores = totalAmount
      const totalSplit = Object.values(customSplits).reduce((sum, v) => sum + v, 0);
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        throw new Error(`Soma dos valores deve ser ${totalAmount}, atual: ${totalSplit}`);
      }

      participants.forEach((id) => {
        splits[id] = customSplits[id] || 0;
      });
    }

    return splits;
  }

  // ============================================
  // ✅ NOVOS MÉTODOS - VALIDAÇÕES
  // ============================================

  /**
   * Validar saldo da conta antes de criar despesa
   */
  private static async validateAccountBalance(accountId: string, amount: number) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Conta não encontrada');
    }

    if (account.type === 'ATIVO' && Number(account.balance) < amount) {
      throw new Error(`Saldo insuficiente. Disponível: R$ ${account.balance}, Necessário: R$ ${amount}`);
    }
  }

  /**
   * Validar limite do cartão antes de criar despesa
   */
  private static async validateCreditCardLimit(creditCardId: string, amount: number) {
    const card = await prisma.creditCard.findUnique({
      where: { id: creditCardId },
    });

    if (!card) {
      throw new Error('Cartão não encontrado');
    }

    const availableLimit = Number(card.limit) - Number(card.currentBalance);
    if (availableLimit < amount) {
      throw new Error(`Limite insuficiente. Disponível: R$ ${availableLimit}, Necessário: R$ ${amount}`);
    }
  }

  // ============================================
  // ✅ NOVOS MÉTODOS - OPERAÇÕES FALTANTES
  // ============================================

  /**
   * EDITAR TRANSAÇÃO COM VALIDAÇÃO
   * Garante integridade ao editar
   */
  static async updateTransaction(
    transactionId: string,
    userId: string,
    updates: Partial<TransactionInput>
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar transação original
      const original = await tx.transaction.findFirst({
        where: { id: transactionId, userId },
      });

      if (!original) {
        throw new Error('Transação não encontrada');
      }

      // 2. Validar se pode editar
      if (original.isInstallment && original.parentTransactionId) {
        throw new Error('Não é possível editar parcela individual. Edite a transação pai.');
      }

      if (original.isTransfer) {
        throw new Error('Não é possível editar transferência. Delete e crie novamente.');
      }

      // 3. Deletar lançamentos contábeis antigos
      await tx.journalEntry.deleteMany({
        where: { transactionId },
      });

      // 4. Preparar dados para atualização (remover campos que não podem ser alterados)
      const { userId: _userId, id: _id, ...updateData } = updates as any;

      // 5. Converter dados para o formato do Prisma
      const prismaUpdateData: any = {
        ...updateData,
        updatedAt: new Date(),
      };

      // Converter arrays para JSON strings se necessário
      if (prismaUpdateData.sharedWith && Array.isArray(prismaUpdateData.sharedWith)) {
        prismaUpdateData.sharedWith = JSON.stringify(prismaUpdateData.sharedWith);
      }

      // 6. Atualizar transação
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: prismaUpdateData,
      });

      // 6. Criar novos lançamentos contábeis
      await this.createJournalEntriesForTransaction(tx, updated);

      // 7. Atualizar saldos
      if (updated.accountId) {
        await this.updateAccountBalance(tx, updated.accountId);
      }

      if (updated.creditCardId) {
        await this.updateCreditCardBalance(tx, updated.creditCardId);
      }

      // 8. Se mudou conta, atualizar saldo da conta antiga
      if (original.accountId && original.accountId !== updated.accountId) {
        await this.updateAccountBalance(tx, original.accountId);
      }

      return updated;
    });
  }

  /**
   * PAGAR PARCELA
   * Marca parcela como paga e cria transação
   */
  static async payInstallment(installmentId: string, userId: string, paymentDate?: Date) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar parcela com transação relacionada
      const installment = await tx.installment.findFirst({
        where: { id: installmentId, userId },
      });

      if (!installment) {
        throw new Error('Parcela não encontrada');
      }

      if (installment.status === 'paid') {
        throw new Error('Parcela já está paga');
      }

      // 2. Buscar transação relacionada
      const relatedTransaction = await tx.transaction.findUnique({
        where: { id: installment.transactionId },
      });

      if (!relatedTransaction) {
        throw new Error('Transação relacionada não encontrada');
      }

      // 3. Marcar como paga
      await tx.installment.update({
        where: { id: installmentId },
        data: {
          status: 'paid',
          paidAt: paymentDate || new Date(),
        },
      });

      // 4. Criar transação de pagamento (se não for a primeira parcela)
      if (installment.installmentNumber > 1) {
        const paymentTransaction = await tx.transaction.create({
          data: {
            userId,
            accountId: relatedTransaction.accountId,
            creditCardId: relatedTransaction.creditCardId,
            categoryId: relatedTransaction.categoryId,
            amount: -Math.abs(Number(installment.amount)),
            description: `${installment.description || 'Parcela'} - Pagamento`,
            type: 'DESPESA',
            date: paymentDate || new Date(),
            status: 'cleared',
            parentTransactionId: installment.transactionId,
            installmentNumber: installment.installmentNumber,
            totalInstallments: installment.totalInstallments,
          },
        });

        // Criar lançamentos contábeis
        await this.createJournalEntriesForTransaction(tx, paymentTransaction);

        // Atualizar saldo
        if (paymentTransaction.accountId) {
          await this.updateAccountBalance(tx, paymentTransaction.accountId);
        }

        return { installment, paymentTransaction };
      }

      return { installment };
    });
  }

  /**
   * PAGAR DÍVIDA COMPARTILHADA
   * Marca dívida como paga e cria transação
   */
  static async paySharedDebt(
    debtId: string,
    userId: string,
    accountId: string,
    amount: number,
    paymentDate?: Date
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar dívida
      const debt = await tx.sharedDebt.findFirst({
        where: { id: debtId },
      });

      if (!debt) {
        throw new Error('Dívida não encontrada');
      }

      // 2. Validar permissão (deve ser o devedor)
      if (debt.debtorId !== userId) {
        throw new Error('Você não tem permissão para pagar esta dívida');
      }

      if (debt.status === 'paid') {
        throw new Error('Dívida já está paga');
      }

      // 3. Validar valor
      if (amount > Number(debt.currentAmount)) {
        throw new Error(`Valor maior que o devido. Devido: R$ ${debt.currentAmount}`);
      }

      // 4. Criar transação de pagamento
      const paymentTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId,
          amount: -Math.abs(amount),
          description: `Pagamento de dívida - ${debt.description}`,
          type: 'DESPESA',
          date: paymentDate || new Date(),
          status: 'cleared',
          isShared: true,
          paidBy: debt.creditorId,
        },
      });

      // 5. Criar lançamentos contábeis
      await this.createJournalEntriesForTransaction(tx, paymentTransaction);

      // 6. Atualizar dívida
      const newPaidAmount = Number(debt.paidAmount) + amount;
      const newCurrentAmount = Number(debt.originalAmount) - newPaidAmount;

      await tx.sharedDebt.update({
        where: { id: debtId },
        data: {
          paidAmount: newPaidAmount,
          currentAmount: newCurrentAmount,
          status: newCurrentAmount <= 0 ? 'paid' : 'active',
          paidAt: newCurrentAmount <= 0 ? (paymentDate || new Date()) : null,
        },
      });

      // 7. Atualizar saldo
      await this.updateAccountBalance(tx, accountId);

      return { debt, paymentTransaction };
    });
  }

  /**
   * RECALCULAR TODOS OS SALDOS
   * Útil para corrigir inconsistências
   */
  static async recalculateAllBalances(userId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar todas as contas do usuário
      const accounts = await tx.account.findMany({
        where: { userId, deletedAt: null },
      });

      // 2. Recalcular saldo de cada conta
      for (const account of accounts) {
        await this.updateAccountBalance(tx, account.id);
      }

      // 3. Buscar todos os cartões do usuário
      const cards = await tx.creditCard.findMany({
        where: { userId },
      });

      // 4. Recalcular saldo de cada cartão
      for (const card of cards) {
        await this.updateCreditCardBalance(tx, card.id);
      }

      return {
        accountsUpdated: accounts.length,
        cardsUpdated: cards.length,
      };
    });
  }

  /**
   * VERIFICAR INTEGRIDADE DAS PARTIDAS DOBRADAS
   * Retorna transações com partidas desbalanceadas
   */
  static async verifyDoubleEntryIntegrity(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      include: {
        journalEntries: true,
      },
    });

    const unbalanced = [];

    for (const transaction of transactions) {
      const debits = transaction.journalEntries
        .filter(e => e.entryType === 'DEBITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const credits = transaction.journalEntries
        .filter(e => e.entryType === 'CREDITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      if (Math.abs(debits - credits) > 0.01) {
        unbalanced.push({
          transactionId: transaction.id,
          description: transaction.description,
          debits,
          credits,
          difference: debits - credits,
        });
      }
    }

    return {
      total: transactions.length,
      unbalanced: unbalanced.length,
      issues: unbalanced,
    };
  }
}
