/**
 * 🔒 HOOK WRAPPER - use-reports
 * 
 * REGRA: Este hook é apenas um wrapper fino para o useUnified.
 * PROIBIDO: Qualquer cálculo direto de valores financeiros.
 * OBRIGATÓRIO: Todos os dados devem vir do useUnified hook.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useUnified } from '@/contexts/unified-context-simple';
import type { Transaction, Account } from '@/types';

// Tipos para relatórios
export interface ReportFilters {
  period: 'last30days' | 'last3months' | 'last6months' | 'thisYear' | 'custom';
  startDate?: string;
  endDate?: string;
  category?: string;
  account?: string;
}

export interface ReportData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  accountBalances: Array<Account & { balance: number }>;
}

// Chaves de consulta para relatórios
export const reportKeys = {
  all: ['reports'] as const,
  dashboard: (filters?: ReportFilters) => [...reportKeys.all, 'dashboard', filters] as const,
  metrics: (filters?: ReportFilters) => [...reportKeys.all, 'metrics', filters] as const,
};

// 🔒 FUNÇÃO INTERNA PARA APLICAR FILTROS DE PERÍODO
function _getFilteredTransactions(
  transactions: Transaction[], 
  filters?: ReportFilters
): Transaction[] {
  if (!filters || filters.period === 'thisYear') {
    const currentYear = new Date().getFullYear();
    return transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
  }

  const now = new Date();
  let startDate: Date;

  switch (filters.period) {
    case 'last30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last3months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case 'last6months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case 'custom':
      if (filters.startDate && filters.endDate) {
        return transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= new Date(filters.startDate!) && 
                 transactionDate <= new Date(filters.endDate!);
        });
      }
      return transactions;
    default:
      return transactions;
  }

  return transactions.filter(t => new Date(t.date) >= startDate);
}

// Hook principal para relatórios usando useUnified
export function useReportsDashboard(filters?: ReportFilters) {
  const { transactions, accounts, balances, loading, error } = useUnified();

  return useQuery({
    queryKey: reportKeys.dashboard(filters),
    queryFn: (): ReportData => {
      // 🔒 TRATAMENTO DE ERROS
      if (error) {
        throw new Error(`Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`);
      }

      if (!balances) {
        throw new Error('Dados financeiros não disponíveis');
      }
      
      // 🔒 USAR DADOS PRÉ-CALCULADOS DO useUnified - SEM CÁLCULOS DIRETOS
      const totalBalance = balances.totalBalance || 0;
      const totalIncome = balances.totalIncome || 0;
      const totalExpenses = balances.totalExpenses || 0;
      
      // 🔒 USAR DADOS MENSAIS PRÉ-CALCULADOS
      const monthlyData = balances.monthlyReports || [];
      
      // 🔒 USAR BREAKDOWN DE CATEGORIAS PRÉ-CALCULADO
      const categoryBreakdown = balances.categoryStats || balances.expensesByCategory || [];
      
      // 🔒 USAR SALDOS DE CONTAS PRÉ-CALCULADOS
      const accountBalances = (accounts || []).map(account => ({
        ...account,
        balance: balances.accountBalances?.[account.id] || 0
      }));

      return {
        totalIncome,
        totalExpenses,
        balance: totalBalance,
        monthlyData,
        categoryBreakdown,
        accountBalances
      };
    },
    enabled: !loading && !error,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    retry: (failureCount, error) => {
      // Não tentar novamente em caso de erro de dados
      if (error.message?.includes('Dados financeiros não disponíveis')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// 🔒 FUNÇÃO UTILITÁRIA PARA OBTER MESES NO PERÍODO
function _getMonthsInPeriod(filters?: ReportFilters): string[] {
  const months = [];
  const now = new Date();
  
  if (!filters || filters.period === 'thisYear') {
    // Todos os meses do ano atual
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(now.getFullYear(), month, 1);
      months.push(monthDate.toISOString().slice(0, 7));
    }
    return months;
  }

  let monthsCount = 6; // padrão
  switch (filters.period) {
    case 'last30days':
      monthsCount = 1;
      break;
    case 'last3months':
      monthsCount = 3;
      break;
    case 'last6months':
      monthsCount = 6;
      break;
  }

  for (let i = monthsCount - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthDate.toISOString().slice(0, 7));
  }

  return months;
}

// 🔒 FUNÇÃO UTILITÁRIA PARA OBTER DATAS DO PERÍODO
function _getPeriodDates(filters?: ReportFilters): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  
  if (!filters || filters.period === 'thisYear') {
    const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    return { startDate, endDate };
  }

  let startDate: string;
  switch (filters.period) {
    case 'last30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case 'last3months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0];
      break;
    case 'last6months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0];
      break;
    case 'custom':
      return {
        startDate: filters.startDate || endDate,
        endDate: filters.endDate || endDate
      };
    default:
      startDate = endDate;
  }

  return { startDate, endDate };
}

// 🔒 FUNÇÃO UTILITÁRIA PARA BREAKDOWN DE CATEGORIAS
function _getCategoryBreakdown(transactions: Transaction[]): Array<{
  name: string;
  amount: number;
  percentage: number;
  color: string;
}> {
  const categoryTotals = new Map<string, number>();
  let totalExpenses = 0;

  // Calcular totais por categoria (apenas despesas) - fallback necessário
  transactions.forEach(transaction => {
    if (transaction.type === 'expense' && transaction.category) {
      const current = categoryTotals.get(transaction.category) || 0;
      const amount = Math.abs(transaction.amount);
      categoryTotals.set(transaction.category, current + amount);
      totalExpenses += amount;
    }
  });

  // Converter para array e calcular percentuais
  const categories = Array.from(categoryTotals.entries()).map(([name, amount], index) => ({
    name,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    color: _getCategoryColor(index)
  }));

  // Ordenar por valor decrescente
  return categories.sort((a, b) => b.amount - a.amount);
}

// 🔒 FUNÇÃO UTILITÁRIA PARA CORES DAS CATEGORIAS
function _getCategoryColor(index: number): string {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
    '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
  ];
  return colors[index % colors.length];
}

// 🔒 HOOK WRAPPER - useFinancialMetrics
export function useFinancialMetrics(filters?: ReportFilters) {
  const { transactions, accounts, balances, loading, error } = useUnified();

  return useQuery({
    queryKey: reportKeys.metrics(filters),
    queryFn: () => {
      // 🔒 TRATAMENTO DE ERROS
      if (error) {
        throw new Error(`Erro ao carregar métricas: ${error.message || 'Erro desconhecido'}`);
      }

      if (!balances) {
        throw new Error('Dados de métricas não disponíveis');
      }
      
      // 🔒 USAR DADOS PRÉ-CALCULADOS DO useUnified EXCLUSIVAMENTE
      return {
        totalIncome: balances.totalIncome || 0,
        totalExpenses: balances.totalExpenses || 0,
        balance: balances.totalBalance || 0,
        monthlyReports: balances.monthlyReports || [],
        averageMonthlyIncome: balances.averageMonthlyIncome || 0,
        averageMonthlyExpenses: balances.averageMonthlyExpenses || 0,
        monthlyGrowth: balances.monthlyGrowth || { income: 0, expenses: 0 }
      };
    },
    enabled: !loading && !error,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    retry: (failureCount, error) => {
      // Não tentar novamente em caso de erro de dados
      if (error.message?.includes('Dados de métricas não disponíveis')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
