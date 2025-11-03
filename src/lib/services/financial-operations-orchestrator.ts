/**
 * ORQUESTRADOR DE OPERAÇÕES FINANCEIRAS
 *
 * Mantém compatibilidade com o código existente enquanto usa a nova arquitetura modular.
 * Este arquivo substitui o antigo financial-operations-service.ts de 928 linhas.
 *
 * ARQUITETURA MODULAR:
 * - /transactions/transaction-creator.ts - Criação de transações simples
 * - /transactions/installment-creator.ts - Criação de parcelamentos
 * - /transactions/transfer-creator.ts - Criação de transferências
 * - /transactions/transaction-validator.ts - Validações
 * - /calculations/balance-calculator.ts - Cálculos de saldo
 */

import { TransactionCreator } from './transactions/transaction-creator';
import { InstallmentCreator } from './transactions/installment-creator';
import { TransferCreator } from './transactions/transfer-creator';
import { TransactionValidator } from './transactions/transaction-validator';
import { SharedExpenseCreator } from './transactions/shared-expense-creator';
import { BalanceCalculator } from './calculations/balance-calculator';
import { InvoiceCalculator } from './calculations/invoice-calculator';
import { TripCalculator } from './calculations/trip-calculator';
import { GoalCalculator } from './calculations/goal-calculator';
import { BudgetCalculator } from './calculations/budget-calculator';
import {
  CreateTransactionOptions,
  CreateInstallmentsOptions,
  CreateTransferOptions,
  CreateSharedExpenseOptions,
} from './transactions/types';

/**
 * Classe principal que orquestra todas as operações financeiras
 * Mantém a mesma interface do serviço antigo para compatibilidade
 */
export class FinancialOperationsService {
  /**
   * Cria uma transação simples
   * @deprecated Use TransactionCreator.create() diretamente
   */
  static async createTransaction(options: CreateTransactionOptions) {
    return await TransactionCreator.create(options);
  }

  /**
   * Cria um parcelamento
   * @deprecated Use InstallmentCreator.create() diretamente
   */
  static async createInstallments(options: CreateInstallmentsOptions) {
    return await InstallmentCreator.create(options);
  }

  /**
   * Cria uma transferência entre contas
   * @deprecated Use TransferCreator.create() diretamente
   */
  static async createTransfer(options: CreateTransferOptions) {
    return await TransferCreator.create(options);
  }

  /**
   * Valida limite de cartão de crédito
   * @deprecated Use TransactionValidator.validateCreditCardLimit() diretamente
   */
  static async validateCreditCardLimit(creditCardId: string, amount: number) {
    return await TransactionValidator.validateCreditCardLimit(creditCardId, amount);
  }

  /**
   * Valida saldo de conta
   * @deprecated Use TransactionValidator.validateAccountBalance() diretamente
   */
  static async validateAccountBalance(accountId: string, amount: number) {
    return await TransactionValidator.validateAccountBalance(accountId, amount);
  }

  /**
   * Recalcula todos os saldos de um usuário
   * @deprecated Use BalanceCalculator.recalculateAllBalances() diretamente
   */
  static async recalculateAllBalances(userId: string) {
    return await BalanceCalculator.recalculateAllBalances(userId);
  }

  /**
   * Cria despesa compartilhada
   */
  static async createSharedExpense(options: CreateSharedExpenseOptions) {
    return await SharedExpenseCreator.create(options);
  }

  /**
   * Recalcula total de uma fatura
   */
  static async recalculateInvoiceTotal(invoiceId: string) {
    return await prisma.$transaction(async (tx) => {
      await InvoiceCalculator.recalculateInvoiceTotal(tx, invoiceId);
    });
  }

  /**
   * Recalcula todas as faturas de um usuário
   */
  static async recalculateAllInvoices(userId: string) {
    return await InvoiceCalculator.recalculateAllInvoices(userId);
  }

  /**
   * Recalcula gastos de uma viagem
   */
  static async recalculateTripSpent(tripId: string) {
    return await prisma.$transaction(async (tx) => {
      await TripCalculator.recalculateTripSpent(tx, tripId);
    });
  }

  /**
   * Recalcula todas as viagens de um usuário
   */
  static async recalculateAllTrips(userId: string) {
    return await TripCalculator.recalculateAllTrips(userId);
  }

  /**
   * Recalcula progresso de uma meta
   */
  static async recalculateGoalAmount(goalId: string) {
    return await prisma.$transaction(async (tx) => {
      await GoalCalculator.recalculateGoalAmount(tx, goalId);
    });
  }

  /**
   * Recalcula todas as metas de um usuário
   */
  static async recalculateAllGoals(userId: string) {
    return await GoalCalculator.recalculateAllGoals(userId);
  }

  /**
   * Recalcula gastos de um orçamento
   */
  static async recalculateBudgetSpent(budgetId: string) {
    return await prisma.$transaction(async (tx) => {
      await BudgetCalculator.recalculateBudgetSpent(tx, budgetId);
    });
  }

  /**
   * Recalcula todos os orçamentos de um usuário
   */
  static async recalculateAllBudgets(userId: string) {
    return await BudgetCalculator.recalculateAllBudgets(userId);
  }
}

// Import do prisma para os métodos de fatura
import { prisma } from '@/lib/prisma';

// Exports para facilitar migração gradual
export {
  TransactionCreator,
  InstallmentCreator,
  TransferCreator,
  TransactionValidator,
  SharedExpenseCreator,
  BalanceCalculator,
  InvoiceCalculator,
  TripCalculator,
  GoalCalculator,
  BudgetCalculator,
};

export type {
  CreateTransactionOptions,
  CreateInstallmentsOptions,
  CreateTransferOptions,
  CreateSharedExpenseOptions,
};
