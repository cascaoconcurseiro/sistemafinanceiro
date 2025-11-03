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
import { DoubleEntryService } from './double-entry-service';
import { DuplicateDetector } from './duplicate-detector';
import { SecurityLogger } from './security-logger';
import { IdempotencyService } from './idempotency-service';
import { TemporalValidationService } from './temporal-validation-service';
import { any } from 'zod';

// ============================================
// TIPOS
// ============================================

interface CreateTransactionOptions {
  transaction: TransactionInput;
  createJournalEntries?: boolean;
  linkToInvoice?: boolean;
  operationUuid?: string; // ✅ NOVO: UUID para idempotência
  createdBy?: string; // ✅ NOVO: Quem criou
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
    const { transaction, createJournalEntries = true, linkToInvoice = true, operationUuid, createdBy } = options;

    // ✅ IDEMPOTÊNCIA: Validar ou gerar UUID
    const finalOperationUuid = IdempotencyService.validateOrGenerate(operationUuid);
    
    // ✅ IDEMPOTÊNCIA: Verificar se operação já foi executada
    if (await IdempotencyService.checkDuplicate(finalOperationUuid)) {
      const existing = await IdempotencyService.getByOperationUuid(finalOperationUuid);
      console.log(`⚠️ Operação duplicada detectada: ${finalOperationUuid}`);
      return existing; // Retorna transação existente (idempotente)
    }

    // Validar dados
    const validatedTransaction = validateOrThrow(TransactionSchema, transaction);

    // ✅ VALIDAÇÃO TEMPORAL: Verificar data e período fechado
    await TemporalValidationService.validateTransactionDate(
      validatedTransaction.userId,
      validatedTransaction.date,
      validatedTransaction.accountId,
      validatedTransaction.creditCardId
    );

    // ✅ DETECTAR DUPLICATAS (por conteúdo)
    const duplicate = await DuplicateDetector.detectDuplicate(
      validatedTransaction.userId,
      Math.abs(Number(validatedTransaction.amount)),
      validatedTransaction.description,
      validatedTransaction.date
    );

    if (duplicate.isDuplicate) {
      await SecurityLogger.logDuplicateDetected(
        validatedTransaction.userId,
        validatedTransaction,
        duplicate.existingId!
      );
      
      throw new Error(
        `Transação duplicada detectada! ` +
        `Uma transação similar foi criada recentemente (ID: ${duplicate.existingId}).`
      );
    }

    // ✅ VALIDAÇÃO COMPLETA DE CONSISTÊNCIA
    try {
      await ValidationService.validateTransaction(validatedTransaction);
    } catch (error) {
      await SecurityLogger.logFailedValidation(
        validatedTransaction.userId,
        error instanceof Error ? error.message : 'Erro de validação',
        validatedTransaction
      );
      throw error;
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
          operationUuid: finalOperationUuid, // ✅ IDEMPOTÊNCIA
          createdBy, // ✅ AUDITORIA
        },
      });

      // 2. Criar lançamentos contábeis (partidas dobradas)
      if (createJournalEntries) {
        await this.createJournalEntriesForTransaction(tx, createdTransaction);
      }

      // 3. Vincular a fatura de cartão (se aplicável)
      // TODO: Implementar quando tabela Invoice existir
      // if (linkToInvoice && createdTransaction.creditCardId) {
      //   await this.linkTransactionToInvoice(tx, createdTransaction);
      // }

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
   * Funciona como cartão de crédito real:
   * - Cria apenas as PARCELAS mensais (ex: Parcela 1/5 - R$ 20)
   * - Cada parcela tem nota com valor total (ex: "Total da compra: R$ 100")
   * - Parcelas aparecem nas faturas dos meses corretos
   */
  static async createInstallments(options: CreateInstallmentsOptions) {
    const { baseTransaction, totalInstallments, firstDueDate, frequency } = options;

    const installmentGroupId = `inst_${Date.now()}`;
    const totalAmount = Math.abs(Number(baseTransaction.amount));
    const amountPerInstallment = totalAmount / totalInstallments;

    return await prisma.$transaction(async (tx) => {
      const installments = [];
      const installmentTransactions = [];

      // ✅ CRIAR APENAS AS PARCELAS (não cria transação mãe)
      for (let i = 1; i <= totalInstallments; i++) {
        const dueDate = this.calculateDueDate(firstDueDate, i - 1, frequency);
        const isPaid = i === 1; // Primeira parcela já venceu

        // Transação da parcela (aparece na fatura do mês)
        const validatedInstallment = validateOrThrow(TransactionSchema, {
          ...baseTransaction,
          amount: -amountPerInstallment, // Valor da parcela
          date: dueDate,
          description: baseTransaction.description, // Nome original (ex: "Bolsa")
          notes: `Parcela ${i}/${totalInstallments} • Total da compra: R$ ${totalAmount.toFixed(2)}`, // ✅ Nota com valor total
          isInstallment: true,
          installmentNumber: i,
          totalInstallments,
          status: isPaid ? 'cleared' : 'pending',
        });

        const installmentTransaction = await tx.transaction.create({
          data: {
            ...validatedInstallment,
            date: dueDate,
            installmentNumber: i,
            totalInstallments,
            installmentGroupId,
            sharedWith: Array.isArray(validatedInstallment.sharedWith)
              ? JSON.stringify(validatedInstallment.sharedWith)
              : validatedInstallment.sharedWith,
          },
        });

        installmentTransactions.push(installmentTransaction);

        // Registro na tabela Installment
        const installment = await tx.installment.create({
          data: {
            transactionId: installmentTransaction.id,
            userId: validatedInstallment.userId,
            installmentNumber: i,
            totalInstallments,
            amount: amountPerInstallment,
            dueDate,
            status: isPaid ? 'paid' : 'pending',
            paidAt: isPaid ? new Date() : null,
            description: `${baseTransaction.description} - Parcela ${i}/${totalInstallments}`,
          },
        });

        installments.push(installment);

        // Criar lançamentos contábeis apenas para parcelas pagas
        if (isPaid) {
          await this.createJournalEntriesForTransaction(tx, installmentTransaction);
        }
      }

      // ✅ ATUALIZAR SALDO
      // Se for cartão de crédito: não afeta saldo agora (vai na fatura)
      // Se for conta: debita apenas a primeira parcela
      if (!baseTransaction.creditCardId && installmentTransactions[0]?.accountId) {
        await this.updateAccountBalance(tx, installmentTransactions[0].accountId);
      }

      return {
        parentTransaction: installmentTransactions[0], // Primeira parcela como referência
        installmentTransactions, // Todas as parcelas
        installments, // Registros de controle
        totalAmount, // Valor total da compra
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

  // ✅ MÉTODO deleteTransaction MOVIDO PARA O FINAL DO ARQUIVO (linha ~1321)
  // Para evitar duplicação e manter a versão mais completa

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
    // ✅ CORREÇÃO: Não criar lançamentos contábeis para cartões de crédito
    // Cartões têm sistema de faturamento próprio
    if (transaction.creditCardId) {
      console.log('ℹ️ [FinancialOperations] Pulando lançamentos contábeis para cartão de crédito');
      return;
    }

    // ✅ NOVO: Se é compartilhada, usar myShare em vez do valor total
    const amount = transaction.isShared && transaction.myShare
      ? Math.abs(Number(transaction.myShare))
      : Math.abs(Number(transaction.amount));
    
    const accountId = transaction.accountId;
    
    console.log(`💰 [FinancialOperations] Criando lançamentos:`, {
      isShared: transaction.isShared,
      totalAmount: transaction.amount,
      myShare: transaction.myShare,
      amountUsed: amount
    });

    if (!accountId) {
      throw new Error('Transação deve ter accountId');
    }

    // Buscar conta
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
   * VINCULAR TRANSAÇÃO À FATURA DO CARTÃO

  /**
   * ATUALIZAR SALDO DO CARTÃO DE CRÉDITO

  /**
   * VALIDAR LIMITE DO CARTÃO

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

  /**
   * ATUALIZAR TRANSAÇÃO
   * Atualiza uma transação existente com validação
   */
  async updateTransaction(transactionId: string, updates: Partial<TransactionInput>, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar transação
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId, deletedAt: null },
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // 2. ✅ DELETAR LANÇAMENTOS CONTÁBEIS ANTIGOS
      await tx.journalEntry.deleteMany({
        where: { transactionId },
      });
      console.log('✅ [updateTransaction] Lançamentos antigos deletados');

      // 3. Preparar dados para atualização
      const updateData: any = { ...updates };
      
      // Converter arrays para JSON string
      if (updateData.sharedWith && Array.isArray(updateData.sharedWith)) {
        updateData.sharedWith = JSON.stringify(updateData.sharedWith);
      }
      
      // Converter metadata para JSON string
      if (updateData.metadata && typeof updateData.metadata === 'object') {
        updateData.metadata = JSON.stringify(updateData.metadata);
      }

      // 4. Atualizar transação
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: updateData,
      });

      // 5. ✅ CRIAR NOVOS LANÇAMENTOS CONTÁBEIS
      await DoubleEntryService.createJournalEntries(tx, updatedTransaction);
      console.log('✅ [updateTransaction] Novos lançamentos criados');

      // 4. Se mudou o status para 'cleared', atualizar saldos
      if (updates.status === 'cleared' && transaction.status !== 'cleared') {
        if (updatedTransaction.accountId) {
          await FinancialOperationsService.updateAccountBalance(tx, updatedTransaction.accountId);
        }
        if (updatedTransaction.creditCardId) {
          await FinancialOperationsService.updateCreditCardBalance(tx, updatedTransaction.creditCardId);
        }
      }

      // 5. Se mudou de 'cleared' para outro status, recalcular saldos
      if (transaction.status === 'cleared' && updates.status && updates.status !== 'cleared') {
        if (updatedTransaction.accountId) {
          await FinancialOperationsService.updateAccountBalance(tx, updatedTransaction.accountId);
        }
        if (updatedTransaction.creditCardId) {
          await FinancialOperationsService.updateCreditCardBalance(tx, updatedTransaction.creditCardId);
        }
      }

      return updatedTransaction;
    });
  }

  /**
   * DELETAR TRANSAÇÃO COM SOFT DELETE E ATUALIZAÇÃO DE SALDO
   * ✅ CORREÇÃO: Usa soft delete (deletedAt) em vez de delete físico
   * ✅ CORREÇÃO: Atualiza saldo da conta após deleção
   */
  static async deleteTransaction(transactionId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar transação
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId, deletedAt: null },
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      console.log('🗑️ [deleteTransaction] Deletando transação:', {
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        accountId: transaction.accountId,
        creditCardId: transaction.creditCardId,
        isInstallment: transaction.isInstallment,
        installmentGroupId: transaction.installmentGroupId,
      });

      // 2. Se for parcela, buscar todas as parcelas do grupo
      let transactionsToDelete = [transaction];
      
      if (transaction.isInstallment && transaction.installmentGroupId) {
        const allInstallments = await tx.transaction.findMany({
          where: {
            installmentGroupId: transaction.installmentGroupId,
            userId,
            deletedAt: null,
          },
        });
        
        console.log(`🗑️ [deleteTransaction] Encontradas ${allInstallments.length} parcelas no grupo`);
        transactionsToDelete = allInstallments;
      }

      // 2.5. ✅ NOVO: Verificar se é pagamento de fatura compartilhada e reverter status
      const metadata = transaction.metadata ? JSON.parse(transaction.metadata as string) : null;
      const isSharedExpensePayment = metadata?.type === 'shared_expense_payment';
      
      if (isSharedExpensePayment) {
        console.log('💰 [deleteTransaction] É pagamento de fatura compartilhada - revertendo status');
        
        const originalTransactionId = metadata.originalTransactionId;
        const billingItemId = metadata.billingItemId;
        
        // Se é uma dívida (ID começa com 'debt-')
        if (billingItemId?.startsWith('debt-')) {
          const debtId = billingItemId.replace('debt-', '');
          
          // Reativar a dívida
          await tx.sharedDebt.update({
            where: { id: debtId },
            data: {
              status: 'active',
              paidAt: null,
            },
          });
          
          console.log(`✅ [deleteTransaction] Dívida ${debtId} reativada - volta a aparecer na fatura`);
        }
        // Se é uma transação compartilhada
        else if (originalTransactionId) {
          // A transação original já existe e não foi marcada como paga
          // Ela automaticamente volta a aparecer na fatura como pendente
          console.log(`✅ [deleteTransaction] Transação compartilhada ${originalTransactionId} volta a ficar pendente na fatura`);
        }
      }

      // 3. ✅ SOFT DELETE de todas as transações (não deleta fisicamente)
      for (const txToDelete of transactionsToDelete) {
        await tx.transaction.update({
          where: { id: txToDelete.id },
          data: {
            deletedAt: new Date(),
            status: 'cancelled',
          },
        });
        
        console.log(`✅ [deleteTransaction] Transação marcada como deletada: ${txToDelete.id}`);
      }

      // 4. ✅ CRÍTICO: Atualizar saldo da conta
      if (transaction.accountId) {
        console.log(`💰 [deleteTransaction] Atualizando saldo da conta: ${transaction.accountId}`);
        await this.updateAccountBalance(tx, transaction.accountId);
      }

      // 5. ✅ CRÍTICO: Atualizar saldo do cartão de crédito
      if (transaction.creditCardId) {
        console.log(`💳 [deleteTransaction] Atualizando saldo do cartão: ${transaction.creditCardId}`);
        await this.updateCreditCardBalance(tx, transaction.creditCardId);
      }

      // 6. Deletar lançamentos contábeis (journal entries)
      for (const txToDelete of transactionsToDelete) {
        await tx.journalEntry.deleteMany({
          where: { transactionId: txToDelete.id },
        });
      }

      // 7. Criar registro de auditoria
      await tx.transactionAudit.create({
        data: {
          transactionId: transaction.id,
          action: 'DELETE',
          oldValue: JSON.stringify(transaction),
          newValue: null,
          userId,
          timestamp: new Date(),
        },
      });

      console.log(`✅ [deleteTransaction] Deleção concluída. ${transactionsToDelete.length} transação(ões) deletada(s)`);

      return {
        success: true,
        deletedCount: transactionsToDelete.length,
        transactionIds: transactionsToDelete.map(t => t.id),
        revertedSharedExpense: isSharedExpensePayment, // ✅ Indica se reverteu pagamento de fatura
      };
    });
  }

  /**
   * ATUALIZAR STATUS DA TRANSAÇÃO
   * Marca transação como paga ou pendente, atualizando lançamentos contábeis
   */
  static async updateTransactionStatus(
    transactionId: string, 
    userId: string, 
    newStatus: 'pending' | 'cleared' | 'reconciled'
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar transação
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId, deletedAt: null },
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      const oldStatus = transaction.status;

      console.log('🔄 [FinancialOperations] Atualizando status:', {
        id: transactionId,
        description: transaction.description,
        oldStatus,
        newStatus
      });

      // 2. Atualizar status
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: newStatus },
      });

      // 3. Se mudou de pending → cleared, criar lançamentos contábeis
      if (oldStatus === 'pending' && newStatus === 'cleared') {
        console.log('✅ [FinancialOperations] Criando lançamentos contábeis (transação foi paga)');
        await this.createJournalEntriesForTransaction(tx, updated);
      }

      // 4. Se mudou de cleared → pending, deletar lançamentos contábeis
      if (oldStatus === 'cleared' && newStatus === 'pending') {
        console.log('🗑️ [FinancialOperations] Deletando lançamentos contábeis (transação voltou para pendente)');
        const deletedEntries = await tx.journalEntry.deleteMany({
          where: { transactionId },
        });
        console.log(`✅ [FinancialOperations] ${deletedEntries.count} lançamentos deletados`);
      }

      // 5. Atualizar saldos
      if (updated.accountId) {
        await this.updateAccountBalance(tx, updated.accountId);
        console.log('✅ [FinancialOperations] Saldo da conta atualizado');
      }

      if (updated.creditCardId) {
        await this.updateCreditCardBalance(tx, updated.creditCardId);
        console.log('✅ [FinancialOperations] Saldo do cartão atualizado');
      }

      // 6. Se for parcela, atualizar registro de Installment
      if (updated.isInstallment) {
        const installmentStatus = newStatus === 'cleared' ? 'paid' : 'pending';
        await tx.installment.updateMany({
          where: { transactionId },
          data: { 
            status: installmentStatus,
            paidAt: newStatus === 'cleared' ? new Date() : null
          }
        });
        console.log(`✅ [FinancialOperations] Parcela marcada como ${installmentStatus}`);
      }

      console.log('🎉 [FinancialOperations] Status atualizado com sucesso');

      return updated;
    });
  }

}
