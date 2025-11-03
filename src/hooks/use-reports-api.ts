'use client';

import { useQuery } from '@tanstack/react-query';

// Tipos para relatórios da API
export interface CashFlowData {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
    netFlow: number;
    accumulatedBalance: number;
  }>;
}

export interface CategorySpendingData {
  period: string;
  totalExpenses: number;
  categories: Array<{
    name: string;
    amount: number;
    count: number;
    percentage: number;
    color: string;
  }>;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  period?: '7d' | '30d' | '90d' | '1y' | 'current_month';
}

// Chaves de consulta para relatórios da API
export const reportApiKeys = {
  all: ['reports-api'] as const,
  cashFlow: (filters?: ReportFilters) => [...reportApiKeys.all, 'cash-flow', filters] as const,
  categorySpending: (filters?: ReportFilters) => [...reportApiKeys.all, 'category-spending', filters] as const,
};

// Funções de API
const reportApi = {
  getCashFlow: async (filters?: ReportFilters): Promise<CashFlowData> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await fetch(`/api/reports/cash-flow?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar fluxo de caixa: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar fluxo de caixa');
    }

    return result.data;
  },

  getCategorySpending: async (filters?: ReportFilters): Promise<CategorySpendingData> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await fetch(`/api/reports/category-spending?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar gastos por categoria: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar gastos por categoria');
    }

    return result.data;
  },
};

/**
 * Hook para buscar dados de fluxo de caixa da API
 */
export function useCashFlowReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportApiKeys.cashFlow(filters),
    queryFn: () => reportApi.getCashFlow(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error: any) => {
      // Não retry em erros de autenticação
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook para buscar dados de gastos por categoria da API
 */
export function useCategorySpendingReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportApiKeys.categorySpending(filters),
    queryFn: () => reportApi.getCategorySpending(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error: any) => {
      // Não retry em erros de autenticação
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook combinado para relatórios completos
 */
export function useReportsApi(filters?: ReportFilters) {
  const cashFlowQuery = useCashFlowReport(filters);
  const categorySpendingQuery = useCategorySpendingReport(filters);

  return {
    cashFlow: cashFlowQuery,
    categorySpending: categorySpendingQuery,
    isLoading: cashFlowQuery.isLoading || categorySpendingQuery.isLoading,
    error: cashFlowQuery.error || categorySpendingQuery.error,
    refetch: () => {
      cashFlowQuery.refetch();
      categorySpendingQuery.refetch();
    },
  };
}
