/**
 * 🏦 FINANCE ENGINE - Motor Financeiro Centralizado
 * 
 * REGRA CRÍTICA: Todos os cálculos financeiros DEVEM passar por este motor.
 * PROIBIDO: Cálculos financeiros em componentes ou hooks.
 * OBRIGATÓRIO: Usar este motor para garantir consistência de dados.
 */

import { Decimal } from 'decimal.js';
import type { Account, Transaction, Goal, Budget } from '@/types';
import { getUserBalances } from '@/lib/balance-manager';

export interface FinancialData {
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  accountBalances?: Record<string, number>; // Saldos pré-calculados
}

export interface FinancialMetrics {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  accountBalances: Record<string, number>;
  categorySpending: Record<string, number>;
  goalsProgress: number;
  budgetUtilization: Record<string, { spent: number; budget: number; percentage: number }>;
  incomeVsExpenses: {
    labels: string[];
    income: number[];
    expenses: number[];
  };
  netWorthTrend: {
    labels: string[];
    values: number[];
  };
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  cashFlowProjection: Array<{
    month: string;
    projected: number;
    actual?: number;
  }>;
}

export class FinanceEngine {
  private data: FinancialData;

  constructor(data: FinancialData) {
    this.data = data;
  }

  /**
   * Calcula todas as métricas financeiras
   */
  calculateMetrics(dateRange?: { start: Date; end: Date }): FinancialMetrics {
    const filteredTransactions = this.filterTransactionsByDate(
      this.data.transactions, 
      dateRange
    );

    return {
      totalBalance: this.calculateTotalBalance(),
      monthlyIncome: this.calculateMonthlyIncome(filteredTransactions),
      monthlyExpenses: this.calculateMonthlyExpenses(filteredTransactions),
      monthlyBalance: this.calculateMonthlyBalance(filteredTransactions),
      accountBalances: this.calculateAccountBalances(),
      categorySpending: this.calculateCategorySpending(filteredTransactions),
      goalsProgress: this.calculateGoalsProgress(),
      budgetUtilization: this.calculateBudgetUtilization(filteredTransactions),
      incomeVsExpenses: this.calculateIncomeVsExpenses(),
      netWorthTrend: this.calculateNetWorthTrend(),
      topExpenseCategories: this.calculateTopExpenseCategories(filteredTransactions),
      cashFlowProjection: this.calculateCashFlowProjection()
    };
  }

  /**
   * Calcula saldo total de todas as contas ativas
   */
  private calculateTotalBalance(): number {
    // Usar saldos pré-calculados se disponíveis
    if (this.data.accountBalances) {
      return Object.values(this.data.accountBalances)
        .reduce((total, balance) => new Decimal(total).plus(balance).toNumber(), 0);
    }
    
    // Fallback para cálculo manual (não recomendado)
    return this.data.accounts
      .filter(account => account.isActive)
      .reduce((total, account) => {
        // Nota: account.balance foi removido, este é apenas fallback
        return new Decimal(total).plus(0).toNumber();
      }, 0);
  }

  /**
   * Calcula receita mensal
   */
  private calculateMonthlyIncome(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((total, transaction) => {
        return new Decimal(total).plus(transaction.amount).toNumber();
      }, 0);
  }

  /**
   * Calcula despesas mensais
   */
  private calculateMonthlyExpenses(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.type === 'expense' || t.type === 'shared')
      .reduce((total, transaction) => {
        return new Decimal(total).plus(Math.abs(transaction.amount)).toNumber();
      }, 0);
  }

  /**
   * Calcula saldo mensal (receita - despesas)
   */
  private calculateMonthlyBalance(transactions: Transaction[]): number {
    const income = this.calculateMonthlyIncome(transactions);
    const expenses = this.calculateMonthlyExpenses(transactions);
    return new Decimal(income).minus(expenses).toNumber();
  }

  /**
   * Calcula saldo individual de cada conta
   */
  private calculateAccountBalances(): Record<string, number> {
    // Usar saldos pré-calculados se disponíveis
    if (this.data.accountBalances) {
      return this.data.accountBalances;
    }
    
    // Fallback: retornar saldos zerados
    const balances: Record<string, number> = {};
    this.data.accounts.forEach(account => {
      balances[account.id] = 0; // Será calculado dinamicamente
    });

    return balances;
  }

  /**
   * Calcula gastos por categoria
   */
  private calculateCategorySpending(transactions: Transaction[]): Record<string, number> {
    const spending: Record<string, number> = {};

    transactions
      .filter(t => t.type === 'expense' || t.type === 'shared')
      .forEach(transaction => {
        const category = transaction.category || 'Outros';
        const currentAmount = spending[category] || 0;
        spending[category] = new Decimal(currentAmount)
          .plus(Math.abs(transaction.amount))
          .toNumber();
      });

    return spending;
  }

  /**
   * Calcula progresso das metas
   */
  private calculateGoalsProgress(): number {
    if (this.data.goals.length === 0) return 0;

    const totalProgress = this.data.goals.reduce((sum, goal) => {
      const progress = new Decimal(goal.current)
        .dividedBy(goal.target)
        .times(100)
        .toNumber();
      return sum + Math.min(progress, 100);
    }, 0);

    return totalProgress / this.data.goals.length;
  }

  /**
   * Calcula utilização do orçamento
   */
  private calculateBudgetUtilization(transactions: Transaction[]): Record<string, { spent: number; budget: number; percentage: number }> {
    const utilization: Record<string, { spent: number; budget: number; percentage: number }> = {};

    this.data.budgets.forEach(budget => {
      const categoryTransactions = transactions.filter(t => 
        t.category === budget.category && 
        (t.type === 'expense' || t.type === 'shared')
      );

      const spent = categoryTransactions.reduce((total, t) => 
        new Decimal(total).plus(Math.abs(t.amount)).toNumber(), 0
      );

      const budgetAmount = new Decimal(budget.amount).toNumber();
      const percentage = budgetAmount > 0 ? 
        new Decimal(spent).dividedBy(budgetAmount).times(100).toNumber() : 0;

      utilization[budget.category] = {
        spent,
        budget: budgetAmount,
        percentage: Math.min(percentage, 100)
      };
    });

    return utilization;
  }

  /**
   * Calcula receita vs despesas por mês
   */
  private calculateIncomeVsExpenses(): { labels: string[]; income: number[]; expenses: number[] } {
    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    // Últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = date.toISOString().slice(0, 7); // YYYY-MM
      monthlyData[key] = { income: 0, expenses: 0 };
    }

    this.data.transactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().slice(0, 7);
      if (monthlyData[monthKey]) {
        if (transaction.type === 'income') {
          monthlyData[monthKey].income = new Decimal(monthlyData[monthKey].income)
            .plus(transaction.amount)
            .toNumber();
        } else if (transaction.type === 'expense' || transaction.type === 'shared') {
          monthlyData[monthKey].expenses = new Decimal(monthlyData[monthKey].expenses)
            .plus(Math.abs(transaction.amount))
            .toNumber();
        }
      }
    });

    const labels = Object.keys(monthlyData).sort();
    const income = labels.map(label => monthlyData[label].income);
    const expenses = labels.map(label => monthlyData[label].expenses);

    return { labels, income, expenses };
  }

  /**
   * Calcula tendência do patrimônio líquido
   */
  private calculateNetWorthTrend(): { labels: string[]; values: number[] } {
    // Implementação simplificada - pode ser expandida
    const labels: string[] = [];
    const values: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      labels.push(date.toISOString().slice(0, 7));
      
      // Calcular patrimônio líquido para o mês
      // Por simplicidade, usar saldo atual - pode ser melhorado
      values.push(this.calculateTotalBalance());
    }

    return { labels, values };
  }

  /**
   * Calcula top categorias de despesas
   */
  private calculateTopExpenseCategories(transactions: Transaction[]): Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }> {
    const categorySpending = this.calculateCategorySpending(transactions);
    const totalExpenses = Object.values(categorySpending).reduce((sum, amount) => 
      new Decimal(sum).plus(amount).toNumber(), 0
    );

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    return Object.entries(categorySpending)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? 
          new Decimal(amount).dividedBy(totalExpenses).times(100).toNumber() : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }

  /**
   * Calcula projeção de fluxo de caixa
   */
  private calculateCashFlowProjection(): Array<{ month: string; projected: number; actual?: number }> {
    const projection: Array<{ month: string; projected: number; actual?: number }> = [];

    // Calcular média mensal dos últimos 3 meses
    const recentTransactions = this.data.transactions.filter(t => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return t.date >= threeMonthsAgo;
    });

    const avgMonthlyIncome = this.calculateMonthlyIncome(recentTransactions) / 3;
    const avgMonthlyExpenses = this.calculateMonthlyExpenses(recentTransactions) / 3;
    const avgMonthlyBalance = new Decimal(avgMonthlyIncome).minus(avgMonthlyExpenses).toNumber();

    // Projetar próximos 12 meses
    let currentBalance = this.calculateTotalBalance();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthKey = date.toISOString().slice(0, 7);
      
      currentBalance = new Decimal(currentBalance).plus(avgMonthlyBalance).toNumber();
      
      projection.push({
        month: monthKey,
        projected: currentBalance
      });
    }

    return projection;
  }

  /**
   * Filtra transações por período
   */
  private filterTransactionsByDate(
    transactions: Transaction[], 
    dateRange?: { start: Date; end: Date }
  ): Transaction[] {
    if (!dateRange) {
      // Retornar transações do mês atual por padrão
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      return transactions.filter(t => 
        t.date >= startOfMonth && t.date <= endOfMonth
      );
    }

    return transactions.filter(t => 
      t.date >= dateRange.start && t.date <= dateRange.end
    );
  }

  /**
   * Valida integridade dos dados financeiros
   */
  validateDataIntegrity(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Verificar se todas as transações têm contas válidas
    this.data.transactions.forEach(transaction => {
      const account = this.data.accounts.find(a => a.id === transaction.accountId);
      if (!account) {
        errors.push(`Transação ${transaction.id} referencia conta inexistente ${transaction.accountId}`);
      }
    });

    // Verificar se saldos das contas estão consistentes
    this.data.accounts.forEach(account => {
      const accountTransactions = this.data.transactions.filter(t => t.accountId === account.id);
      const calculatedBalance = accountTransactions.reduce((balance, transaction) => {
        if (transaction.type === 'income') {
          return new Decimal(balance).plus(transaction.amount).toNumber();
        } else {
          return new Decimal(balance).minus(Math.abs(transaction.amount)).toNumber();
        }
      }, 0);

      const storedBalance = new Decimal(account.balance).toNumber();
      const difference = Math.abs(calculatedBalance - storedBalance);

      if (difference > 0.01) { // Tolerância de 1 centavo
        errors.push(`Saldo da conta ${account.name} inconsistente. Calculado: ${calculatedBalance}, Armazenado: ${storedBalance}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Factory function para criar instância do Finance Engine
 */
export function createFinanceEngine(data: FinancialData): FinanceEngine {
  return new FinanceEngine(data);
}

/**
 * Função utilitária para calcular métricas rapidamente
 */
export function calculateFinancialMetrics(
  data: FinancialData, 
  dateRange?: { start: Date; end: Date }
): FinancialMetrics {
  const engine = createFinanceEngine(data);
  return engine.calculateMetrics(dateRange);
}