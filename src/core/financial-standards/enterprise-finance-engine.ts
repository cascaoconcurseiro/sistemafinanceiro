/**
 * 🏦 ENTERPRISE FINANCE ENGINE
 * Padrão usado por grandes apps de finanças pessoais (Mint, YNAB, PocketGuard, etc.)
 */

import { Decimal } from 'decimal.js';

// Configuração de precisão decimal para cálculos financeiros
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings', 
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
  LOAN = 'loan',
  CASH = 'cash'
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense', 
  TRANSFER = 'transfer'
}

export enum TransactionStatus {
  PENDING = 'pending',
  CLEARED = 'cleared',
  RECONCILED = 'reconciled'
}

export interface EnterpriseAccount {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: Decimal;
  currency: string;
  isActive: boolean;
  institutionName?: string;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseTransaction {
  id: string;
  userId: string;
  accountId: string;
  amount: Decimal;
  description: string;
  categoryId: string;
  type: TransactionType;
  status: TransactionStatus;
  date: Date;
  isRecurring: boolean;
  merchantName?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseCategory {
  id: string;
  name: string;
  parentId?: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  isSystem: boolean;
  budgetAmount?: Decimal;
}

export interface EnterpriseBudget {
  id: string;
  userId: string;
  categoryId: string;
  amount: Decimal;
  spent: Decimal;
  period: 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface EnterpriseGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: Decimal;
  currentAmount: Decimal;
  targetDate?: Date;
  type: 'savings' | 'debt_payoff' | 'emergency_fund';
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
}

/**
 * Enterprise Finance Engine - Padrão de grandes apps
 */
export class EnterpriseFinanceEngine {
  private accounts: EnterpriseAccount[] = [];
  private transactions: EnterpriseTransaction[] = [];
  private categories: EnterpriseCategory[] = [];
  private budgets: EnterpriseBudget[] = [];
  private goals: EnterpriseGoal[] = [];

  constructor(data: {
    accounts: EnterpriseAccount[];
    transactions: EnterpriseTransaction[];
    categories: EnterpriseCategory[];
    budgets: EnterpriseBudget[];
    goals: EnterpriseGoal[];
  }) {
    this.accounts = data.accounts;
    this.transactions = data.transactions;
    this.categories = data.categories;
    this.budgets = data.budgets;
    this.goals = data.goals;
  }

  /**
   * Calcula saldo de conta com precisão decimal
   */
  calculateAccountBalance(accountId: string): Decimal {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) return new Decimal(0);

    const transactions = this.transactions.filter(t => 
      t.accountId === accountId && t.status !== TransactionStatus.PENDING
    );

    let balance = new Decimal(0);
    for (const transaction of transactions) {
      if (transaction.type === TransactionType.INCOME) {
        balance = balance.plus(transaction.amount);
      } else if (transaction.type === TransactionType.EXPENSE) {
        balance = balance.minus(transaction.amount);
      }
    }

    return balance;
  }

  /**
   * Calcula patrimônio líquido
   */
  calculateNetWorth(): Decimal {
    let assets = new Decimal(0);
    let liabilities = new Decimal(0);

    for (const account of this.accounts.filter(a => a.isActive)) {
      const balance = this.calculateAccountBalance(account.id);
      
      if (this.isAssetAccount(account.type)) {
        assets = assets.plus(balance);
      } else if (this.isLiabilityAccount(account.type)) {
        liabilities = liabilities.plus(balance.abs());
      }
    }

    return assets.minus(liabilities);
  }

  /**
   * Análise de fluxo de caixa mensal
   */
  calculateCashFlow(month: Date): {
    income: Decimal;
    expenses: Decimal;
    netFlow: Decimal;
    byCategory: Record<string, Decimal>;
  } {
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const monthTransactions = this.transactions.filter(t =>
      t.date >= startDate && t.date <= endDate && t.type !== TransactionType.TRANSFER
    );

    let income = new Decimal(0);
    let expenses = new Decimal(0);
    const byCategory: Record<string, Decimal> = {};

    for (const transaction of monthTransactions) {
      const category = this.categories.find(c => c.id === transaction.categoryId);
      const categoryName = category?.name || 'Uncategorized';

      if (!byCategory[categoryName]) {
        byCategory[categoryName] = new Decimal(0);
      }

      if (transaction.type === TransactionType.INCOME) {
        income = income.plus(transaction.amount);
        byCategory[categoryName] = byCategory[categoryName].plus(transaction.amount);
      } else if (transaction.type === TransactionType.EXPENSE) {
        expenses = expenses.plus(transaction.amount);
        byCategory[categoryName] = byCategory[categoryName].plus(transaction.amount);
      }
    }

    return {
      income,
      expenses,
      netFlow: income.minus(expenses),
      byCategory
    };
  }

  /**
   * Análise de orçamento
   */
  analyzeBudget(budgetId: string): {
    budget: EnterpriseBudget;
    spent: Decimal;
    remaining: Decimal;
    percentUsed: number;
    isOverBudget: boolean;
  } {
    const budget = this.budgets.find(b => b.id === budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    const spent = this.transactions
      .filter(t => 
        t.categoryId === budget.categoryId &&
        t.date >= budget.startDate &&
        t.date <= budget.endDate &&
        t.type === TransactionType.EXPENSE
      )
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));

    const remaining = budget.amount.minus(spent);
    const percentUsed = budget.amount.gt(0) ? 
      spent.dividedBy(budget.amount).times(100).toNumber() : 0;

    return {
      budget,
      spent,
      remaining,
      percentUsed,
      isOverBudget: spent.gt(budget.amount)
    };
  }

  /**
   * Progresso das metas
   */
  calculateGoalProgress(goalId: string): {
    goal: EnterpriseGoal;
    progressPercent: number;
    remainingAmount: Decimal;
    monthsToTarget?: number;
    suggestedMonthlyAmount?: Decimal;
  } {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }

    const progressPercent = goal.targetAmount.gt(0) ?
      goal.currentAmount.dividedBy(goal.targetAmount).times(100).toNumber() : 0;

    const remainingAmount = goal.targetAmount.minus(goal.currentAmount);

    let monthsToTarget: number | undefined;
    let suggestedMonthlyAmount: Decimal | undefined;

    if (goal.targetDate) {
      const now = new Date();
      const monthsDiff = (goal.targetDate.getFullYear() - now.getFullYear()) * 12 + 
                        (goal.targetDate.getMonth() - now.getMonth());
      
      if (monthsDiff > 0) {
        monthsToTarget = monthsDiff;
        suggestedMonthlyAmount = remainingAmount.dividedBy(monthsDiff);
      }
    }

    return {
      goal,
      progressPercent,
      remainingAmount,
      monthsToTarget,
      suggestedMonthlyAmount
    };
  }

  /**
   * Detecção de gastos anômalos
   */
  detectAnomalousSpending(): Array<{
    transaction: EnterpriseTransaction;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    const anomalies = [];
    const categoryAverages = this.calculateCategoryAverages();

    for (const transaction of this.transactions) {
      if (transaction.type !== TransactionType.EXPENSE) continue;

      const categoryAvg = categoryAverages[transaction.categoryId];
      if (!categoryAvg) continue;

      const deviation = transaction.amount.dividedBy(categoryAvg).toNumber();

      if (deviation > 3) {
        anomalies.push({
          transaction,
          reason: `Amount is ${deviation.toFixed(1)}x higher than category average`,
          severity: deviation > 5 ? 'high' : 'medium' as 'high' | 'medium'
        });
      }
    }

    return anomalies;
  }

  /**
   * Projeção de fluxo de caixa
   */
  projectCashFlow(months: number): Array<{
    month: Date;
    projectedBalance: Decimal;
    projectedIncome: Decimal;
    projectedExpenses: Decimal;
  }> {
    const projection = [];
    const monthlyAverages = this.calculateMonthlyAverages();
    let currentBalance = this.calculateTotalBalance();

    for (let i = 0; i < months; i++) {
      const projectedMonth = new Date();
      projectedMonth.setMonth(projectedMonth.getMonth() + i + 1);

      currentBalance = currentBalance
        .plus(monthlyAverages.income)
        .minus(monthlyAverages.expenses);

      projection.push({
        month: projectedMonth,
        projectedBalance: currentBalance,
        projectedIncome: monthlyAverages.income,
        projectedExpenses: monthlyAverages.expenses
      });
    }

    return projection;
  }

  // Métodos auxiliares privados
  private isAssetAccount(type: AccountType): boolean {
    return [AccountType.CHECKING, AccountType.SAVINGS, AccountType.INVESTMENT, AccountType.CASH].includes(type);
  }

  private isLiabilityAccount(type: AccountType): boolean {
    return [AccountType.CREDIT_CARD, AccountType.LOAN].includes(type);
  }

  private calculateTotalBalance(): Decimal {
    return this.accounts
      .filter(a => a.isActive)
      .reduce((sum, account) => sum.plus(this.calculateAccountBalance(account.id)), new Decimal(0));
  }

  private calculateCategoryAverages(): Record<string, Decimal> {
    const categoryTotals: Record<string, { sum: Decimal; count: number }> = {};

    for (const transaction of this.transactions) {
      if (transaction.type !== TransactionType.EXPENSE) continue;

      if (!categoryTotals[transaction.categoryId]) {
        categoryTotals[transaction.categoryId] = { sum: new Decimal(0), count: 0 };
      }

      categoryTotals[transaction.categoryId].sum = categoryTotals[transaction.categoryId].sum.plus(transaction.amount);
      categoryTotals[transaction.categoryId].count++;
    }

    const averages: Record<string, Decimal> = {};
    for (const [categoryId, data] of Object.entries(categoryTotals)) {
      averages[categoryId] = data.sum.dividedBy(data.count);
    }

    return averages;
  }

  private calculateMonthlyAverages(): { income: Decimal; expenses: Decimal } {
    const last12Months = [];
    for (let i = 0; i < 12; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      last12Months.push(this.calculateCashFlow(month));
    }

    const totalIncome = last12Months.reduce((sum, month) => sum.plus(month.income), new Decimal(0));
    const totalExpenses = last12Months.reduce((sum, month) => sum.plus(month.expenses), new Decimal(0));

    return {
      income: totalIncome.dividedBy(12),
      expenses: totalExpenses.dividedBy(12)
    };
  }
}

export default EnterpriseFinanceEngine;