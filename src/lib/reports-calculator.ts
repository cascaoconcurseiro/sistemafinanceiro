'use client';

import { Transaction } from '@/types';

// Interfaces para relatórios
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  period?: string;
  category?: string;
  accountId?: string;
}

export interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  transactionCount: number;
}

export interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
  netFlow: number;
  transactionCount: number;
}

export interface AccountBreakdownData {
  name: string;
  balance: number;
  type: string;
  transactionCount: number;
}

export interface ReportData {
  period: string;
  income: number;
  expenses: number;
  netFlow: number;
  categories: CategoryData[];
  monthlyTrend: MonthlyTrendData[];
  accountsBreakdown: AccountBreakdownData[];
  totalTransactions: number;
  averageTransactionAmount: number;
  largestExpense: number;
  largestIncome: number;
}

// Cores para gráficos
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

/**
 * Calcula o período de data baseado no filtro
 */
export function calculateDateRange(filters?: ReportFilters): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (filters?.startDate && filters?.endDate) {
    startDate = new Date(filters.startDate);
    endDate = new Date(filters.endDate);
  } else {
    switch (filters?.period) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }
  }

  return { startDate, endDate };
}

/**
 * Filtra transações baseado nos critérios fornecidos
 */
export function filterTransactions(transactions: Transaction[], filters?: ReportFilters): Transaction[] {
  if (!transactions || transactions.length === 0) return [];

  const { startDate, endDate } = calculateDateRange(filters);

  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    
    // Filtro por data
    if (transactionDate < startDate || transactionDate > endDate) {
      return false;
    }

    // Filtro por categoria
    if (filters?.category && filters.category !== 'all' && transaction.category !== filters.category) {
      return false;
    }

    // Filtro por conta
    if (filters?.accountId && filters.accountId !== 'all' && transaction.accountId?.toString() !== filters.accountId) {
      return false;
    }

    return true;
  });
}

/**
 * Calcula dados de categorias baseado nas transações
 */
export function calculateCategoryData(transactions: Transaction[]): CategoryData[] {
  const categoryMap: { [key: string]: { amount: number; count: number } } = {};
  let totalExpenses = 0;

  // Processar apenas despesas para categorias
  transactions
    .filter(t => t.type === 'expense')
    .forEach(transaction => {
      const amount = Math.abs(transaction.amount);
      totalExpenses += amount;
      
      if (!categoryMap[transaction.category]) {
        categoryMap[transaction.category] = { amount: 0, count: 0 };
      }
      
      categoryMap[transaction.category].amount += amount;
      categoryMap[transaction.category].count += 1;
    });

  return Object.entries(categoryMap)
    .sort(([, a], [, b]) => b.amount - a.amount)
    .slice(0, 10) // Top 10 categorias
    .map(([name, data], index) => ({
      name,
      amount: data.amount,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      color: COLORS[index % COLORS.length],
      transactionCount: data.count,
    }));
}

/**
 * Calcula tendência mensal baseada nas transações
 */
export function calculateMonthlyTrend(transactions: Transaction[]): MonthlyTrendData[] {
  const monthlyMap: { [key: string]: { income: number; expenses: number; count: number } } = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { income: 0, expenses: 0, count: 0 };
    }

    monthlyMap[monthKey].count += 1;

    if (transaction.type === 'income') {
      monthlyMap[monthKey].income += transaction.amount;
    } else if (transaction.type === 'expense') {
      monthlyMap[monthKey].expenses += Math.abs(transaction.amount);
    }
  });

  return Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      }),
      income: data.income,
      expenses: data.expenses,
      netFlow: data.income - data.expenses,
      transactionCount: data.count,
    }));
}

/**
 * Calcula breakdown de contas baseado nas transações
 */
export function calculateAccountsBreakdown(
  transactions: Transaction[], 
  accounts: any[]
): AccountBreakdownData[] {
  const accountTransactionCount: { [key: string]: number } = {};

  // Contar transações por conta
  transactions.forEach(transaction => {
    const accountId = transaction.accountId?.toString() || 'unknown';
    accountTransactionCount[accountId] = (accountTransactionCount[accountId] || 0) + 1;
  });

  return accounts.map(account => ({
    name: account.name,
    balance: account.balance || 0,
    type: account.type,
    transactionCount: accountTransactionCount[account.id?.toString()] || 0,
  }));
}

/**
 * Calcula estatísticas gerais baseadas nas transações
 */
export function calculateGeneralStats(transactions: Transaction[]) {
  if (!transactions || transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netFlow: 0,
      totalTransactions: 0,
      averageTransactionAmount: 0,
      largestExpense: 0,
      largestIncome: 0,
    };
  }

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netFlow = totalIncome - totalExpenses;

  const allAmounts = transactions.map(t => Math.abs(t.amount));
  const averageTransactionAmount = allAmounts.length > 0 
    ? allAmounts.reduce((sum, amount) => sum + amount, 0) / allAmounts.length 
    : 0;

  const largestExpense = expenseTransactions.length > 0 
    ? Math.max(...expenseTransactions.map(t => Math.abs(t.amount))) 
    : 0;

  const largestIncome = incomeTransactions.length > 0 
    ? Math.max(...incomeTransactions.map(t => t.amount)) 
    : 0;

  return {
    totalIncome,
    totalExpenses,
    netFlow,
    totalTransactions: transactions.length,
    averageTransactionAmount,
    largestExpense,
    largestIncome,
  };
}

/**
 * Função principal para calcular todos os dados do relatório
 */
export function calculateReportData(
  transactions: Transaction[], 
  accounts: any[], 
  filters?: ReportFilters
): ReportData {
  const filteredTransactions = filterTransactions(transactions, filters);
  const stats = calculateGeneralStats(filteredTransactions);
  const categories = calculateCategoryData(filteredTransactions);
  const monthlyTrend = calculateMonthlyTrend(filteredTransactions);
  const accountsBreakdown = calculateAccountsBreakdown(filteredTransactions, accounts);

  return {
    period: filters?.period || '6months',
    income: stats.totalIncome,
    expenses: stats.totalExpenses,
    netFlow: stats.netFlow,
    categories,
    monthlyTrend,
    accountsBreakdown,
    totalTransactions: stats.totalTransactions,
    averageTransactionAmount: stats.averageTransactionAmount,
    largestExpense: stats.largestExpense,
    largestIncome: stats.largestIncome,
  };
}

/**
 * Calcula métricas de performance financeira
 */
export function calculateFinancialMetrics(transactions: Transaction[], filters?: ReportFilters) {
  const filteredTransactions = filterTransactions(transactions, filters);
  const { startDate, endDate } = calculateDateRange(filters);
  
  const monthsDiff = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  const stats = calculateGeneralStats(filteredTransactions);
  
  return {
    ...stats,
    monthlyAverageIncome: stats.totalIncome / monthsDiff,
    monthlyAverageExpenses: stats.totalExpenses / monthsDiff,
    monthlyAverageNetFlow: stats.netFlow / monthsDiff,
    savingsRate: stats.totalIncome > 0 ? (stats.netFlow / stats.totalIncome) * 100 : 0,
    expenseRatio: stats.totalIncome > 0 ? (stats.totalExpenses / stats.totalIncome) * 100 : 0,
  };
}
