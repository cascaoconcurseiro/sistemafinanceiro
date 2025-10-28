/**
 * 🏦 MANUAL FINANCE ENGINE
 * Padrão para apps de entrada manual (YNAB, PocketGuard, Goodbudget, etc.)
 */

import { Decimal } from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT_CARD = 'credit_card',
  CASH = 'cash',
  INVESTMENT = 'investment',
  LOAN = 'loan'
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export interface ManualAccount {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: Decimal;
  currency: string;
  isActive: boolean;
  isBudgetAccount: boolean; // Para orçamento zero-based (YNAB style)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManualTransaction {
  id: string;
  userId: string;
  accountId: string;
  amount: Decimal;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  type: TransactionType;
  date: Date;
  
  // Recursos manuais específicos
  payee?: string; // Beneficiário
  memo?: string; // Observações
  checkNumber?: string;
  isCleared: boolean; // Reconciliação manual
  isReconciled: boolean;
  
  // Parcelamento manual
  isInstallment: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  parentTransactionId?: string;
  
  // Transferências
  transferAccountId?: string;
  transferTransactionId?: string;
  
  // Flags
  isRecurring: boolean;
  recurringRule?: RecurringRule;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // A cada X períodos
  endDate?: Date;
  endAfterOccurrences?: number;
  nextDate: Date;
}

export interface ManualCategory {
  id: string;
  name: string;
  parentId?: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  isSystem: boolean;
  sortOrder: number;
  
  // Orçamento integrado (YNAB style)
  budgetAmount?: Decimal;
  budgetPeriod?: 'monthly' | 'yearly';
  
  // Metas de categoria
  targetAmount?: Decimal;
  targetDate?: Date;
  targetType?: 'spending' | 'savings' | 'debt_payoff';
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManualBudget {
  id: string;
  userId: string;
  name: string;
  period: 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  
  // Orçamento zero-based
  totalIncome: Decimal;
  totalAllocated: Decimal;
  totalSpent: Decimal;
  
  // Categorias do orçamento
  categories: BudgetCategory[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCategory {
  categoryId: string;
  allocated: Decimal; // Valor alocado
  spent: Decimal; // Valor gasto
  available: Decimal; // Disponível (allocated - spent)
  carryOver: Decimal; // Valor transportado do mês anterior
  goal?: CategoryGoal;
}

export interface CategoryGoal {
  type: 'target_balance' | 'monthly_funding' | 'target_date';
  targetAmount: Decimal;
  targetDate?: Date;
  monthlyContribution?: Decimal;
}

export interface ManualGoal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'emergency_fund' | 'debt_payoff' | 'savings' | 'purchase';
  targetAmount: Decimal;
  currentAmount: Decimal;
  targetDate?: Date;
  
  // Configurações de poupança
  monthlyContribution?: Decimal;
  linkedCategoryId?: string; // Categoria vinculada para poupança automática
  
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Manual Finance Engine - Focado em entrada manual de dados
 */
export class ManualFinanceEngine {
  private accounts: ManualAccount[] = [];
  private transactions: ManualTransaction[] = [];
  private categories: ManualCategory[] = [];
  private budgets: ManualBudget[] = [];
  private goals: ManualGoal[] = [];

  constructor(data: {
    accounts: ManualAccount[];
    transactions: ManualTransaction[];
    categories: ManualCategory[];
    budgets: ManualBudget[];
    goals: ManualGoal[];
  }) {
    this.accounts = data.accounts;
    this.transactions = data.transactions;
    this.categories = data.categories;
    this.budgets = data.budgets;
    this.goals = data.goals;
  }

  /**
   * Calcula saldo atual da conta (saldo inicial + transações)
   */
  calculateAccountBalance(accountId: string, asOfDate?: Date): Decimal {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) return new Decimal(0);

    let balance = account.initialBalance;
    
    const relevantTransactions = this.transactions.filter(t => 
      t.accountId === accountId && 
      (!asOfDate || t.date <= asOfDate)
    );

    for (const transaction of relevantTransactions) {
      if (transaction.type === TransactionType.INCOME) {
        balance = balance.plus(transaction.amount);
      } else if (transaction.type === TransactionType.EXPENSE) {
        balance = balance.minus(transaction.amount);
      } else if (transaction.type === TransactionType.TRANSFER) {
        if (transaction.transferAccountId === accountId) {
          // Transferência recebida
          balance = balance.plus(transaction.amount);
        } else {
          // Transferência enviada
          balance = balance.minus(transaction.amount);
        }
      }
    }

    return balance;
  }

  /**
   * Reconciliação manual de conta
   */
  reconcileAccount(accountId: string, statementBalance: Decimal, statementDate: Date): {
    calculatedBalance: Decimal;
    difference: Decimal;
    unreconciledTransactions: ManualTransaction[];
    isBalanced: boolean;
  } {
    const calculatedBalance = this.calculateAccountBalance(accountId, statementDate);
    const difference = statementBalance.minus(calculatedBalance);
    
    const unreconciledTransactions = this.transactions.filter(t =>
      t.accountId === accountId &&
      t.date <= statementDate &&
      !t.isReconciled
    );

    return {
      calculatedBalance,
      difference,
      unreconciledTransactions,
      isBalanced: difference.abs().lt(0.01) // Tolerância de 1 centavo
    };
  }

  /**
   * Orçamento zero-based (estilo YNAB)
   */
  calculateZeroBasedBudget(budgetId: string): {
    totalIncome: Decimal;
    totalAllocated: Decimal;
    totalSpent: Decimal;
    unallocated: Decimal; // Income - Allocated
    categories: Array<{
      category: ManualCategory;
      allocated: Decimal;
      spent: Decimal;
      available: Decimal;
      percentUsed: number;
      status: 'under' | 'on_track' | 'over';
    }>;
  } {
    const budget = this.budgets.find(b => b.id === budgetId);
    if (!budget) throw new Error(`Budget ${budgetId} not found`);

    const totalIncome = budget.totalIncome;
    const totalAllocated = budget.totalAllocated;
    const unallocated = totalIncome.minus(totalAllocated);

    const categoryAnalysis = budget.categories.map(budgetCat => {
      const category = this.categories.find(c => c.id === budgetCat.categoryId)!;
      const percentUsed = budgetCat.allocated.gt(0) ? 
        budgetCat.spent.dividedBy(budgetCat.allocated).times(100).toNumber() : 0;
      
      let status: 'under' | 'on_track' | 'over';
      if (percentUsed > 100) status = 'over';
      else if (percentUsed > 80) status = 'on_track';
      else status = 'under';

      return {
        category,
        allocated: budgetCat.allocated,
        spent: budgetCat.spent,
        available: budgetCat.available,
        percentUsed,
        status
      };
    });

    return {
      totalIncome,
      totalAllocated,
      totalSpent: budget.totalSpent,
      unallocated,
      categories: categoryAnalysis
    };
  }

  /**
   * Análise de fluxo de caixa com projeções
   */
  analyzeCashFlow(months: number = 12): {
    historical: Array<{
      month: Date;
      income: Decimal;
      expenses: Decimal;
      netFlow: Decimal;
      endingBalance: Decimal;
    }>;
    projected: Array<{
      month: Date;
      projectedIncome: Decimal;
      projectedExpenses: Decimal;
      projectedNetFlow: Decimal;
      projectedBalance: Decimal;
    }>;
  } {
    // Análise histórica
    const historical = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      const monthTransactions = this.transactions.filter(t =>
        t.date >= monthStart && t.date <= monthEnd && t.type !== TransactionType.TRANSFER
      );

      const income = monthTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));

      const expenses = monthTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));

      const netFlow = income.minus(expenses);
      const endingBalance = this.calculateTotalBalance(monthEnd);

      historical.push({
        month: monthStart,
        income,
        expenses,
        netFlow,
        endingBalance
      });
    }

    // Projeção baseada em transações recorrentes e médias
    const projected = [];
    const avgIncome = historical.reduce((sum, h) => sum.plus(h.income), new Decimal(0)).dividedBy(historical.length);
    const avgExpenses = historical.reduce((sum, h) => sum.plus(h.expenses), new Decimal(0)).dividedBy(historical.length);
    
    let currentBalance = this.calculateTotalBalance();

    for (let i = 1; i <= months; i++) {
      const projectedMonth = new Date();
      projectedMonth.setMonth(projectedMonth.getMonth() + i, 1);

      const recurringIncome = this.calculateRecurringTransactions(projectedMonth, TransactionType.INCOME);
      const recurringExpenses = this.calculateRecurringTransactions(projectedMonth, TransactionType.EXPENSE);

      const projectedIncome = recurringIncome.gt(0) ? recurringIncome : avgIncome;
      const projectedExpenses = recurringExpenses.gt(0) ? recurringExpenses : avgExpenses;
      const projectedNetFlow = projectedIncome.minus(projectedExpenses);

      currentBalance = currentBalance.plus(projectedNetFlow);

      projected.push({
        month: projectedMonth,
        projectedIncome,
        projectedExpenses,
        projectedNetFlow,
        projectedBalance: currentBalance
      });
    }

    return { historical, projected };
  }

  /**
   * Sugestões inteligentes de categorização
   */
  suggestCategory(description: string, amount: Decimal, payee?: string): Array<{
    categoryId: string;
    confidence: number;
    reason: string;
  }> {
    const suggestions = [];
    const lowerDesc = description.toLowerCase();
    const lowerPayee = payee?.toLowerCase() || '';

    // Buscar por transações similares
    const similarTransactions = this.transactions.filter(t => {
      const similarity = this.calculateStringSimilarity(
        t.description.toLowerCase(), 
        lowerDesc
      );
      const payeeSimilarity = t.payee ? 
        this.calculateStringSimilarity(t.payee.toLowerCase(), lowerPayee) : 0;
      
      return similarity > 0.7 || payeeSimilarity > 0.8;
    });

    // Agrupar por categoria e calcular confiança
    const categoryFrequency: Record<string, number> = {};
    for (const transaction of similarTransactions) {
      categoryFrequency[transaction.categoryId] = 
        (categoryFrequency[transaction.categoryId] || 0) + 1;
    }

    for (const [categoryId, frequency] of Object.entries(categoryFrequency)) {
      const confidence = Math.min(frequency / similarTransactions.length, 0.95);
      suggestions.push({
        categoryId,
        confidence,
        reason: `${frequency} transações similares encontradas`
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Detecção de padrões de gastos
   */
  detectSpendingPatterns(): Array<{
    pattern: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    averageAmount: Decimal;
    categoryId: string;
    confidence: number;
    nextExpectedDate?: Date;
  }> {
    const patterns = [];
    const categoryGroups = this.groupTransactionsByCategory();

    for (const [categoryId, transactions] of categoryGroups) {
      if (transactions.length < 3) continue;

      const frequency = this.detectTransactionFrequency(transactions);
      if (frequency) {
        const averageAmount = transactions
          .reduce((sum, t) => sum.plus(t.amount), new Decimal(0))
          .dividedBy(transactions.length);

        const confidence = this.calculatePatternConfidence(transactions, frequency);
        const nextExpectedDate = this.predictNextTransaction(transactions, frequency);

        patterns.push({
          pattern: `Regular ${frequency} spending`,
          frequency,
          averageAmount,
          categoryId,
          confidence,
          nextExpectedDate
        });
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  // Métodos auxiliares privados
  private calculateTotalBalance(asOfDate?: Date): Decimal {
    return this.accounts
      .filter(a => a.isActive)
      .reduce((sum, account) => 
        sum.plus(this.calculateAccountBalance(account.id, asOfDate)), 
        new Decimal(0)
      );
  }

  private calculateRecurringTransactions(month: Date, type: TransactionType): Decimal {
    return this.transactions
      .filter(t => t.type === type && t.isRecurring)
      .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  private groupTransactionsByCategory(): Map<string, ManualTransaction[]> {
    const groups = new Map();
    for (const transaction of this.transactions) {
      if (!groups.has(transaction.categoryId)) {
        groups.set(transaction.categoryId, []);
      }
      groups.get(transaction.categoryId).push(transaction);
    }
    return groups;
  }

  private detectTransactionFrequency(transactions: ManualTransaction[]): 'daily' | 'weekly' | 'monthly' | null {
    // Implementar detecção de frequência baseada nas datas
    return 'monthly'; // Simplificado
  }

  private calculatePatternConfidence(transactions: ManualTransaction[], frequency: string): number {
    // Calcular confiança baseada na regularidade
    return 0.8; // Simplificado
  }

  private predictNextTransaction(transactions: ManualTransaction[], frequency: string): Date {
    // Prever próxima transação baseada no padrão
    const lastTransaction = transactions[transactions.length - 1];
    const nextDate = new Date(lastTransaction.date);
    
    if (frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    }
    
    return nextDate;
  }
}

export default ManualFinanceEngine;