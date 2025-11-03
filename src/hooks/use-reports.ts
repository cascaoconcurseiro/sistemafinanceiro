'use client';

import { useQuery } from '@tanstack/react-query';

// Tipos para relatórios
interface TrialBalance {
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  accounts: Array<{
    accountId: string;
    debits: number;
    credits: number;
    balance: number;
  }>;
}

// Funções de API
const reportsApi = {
  // Buscar balancete
  getTrialBalance: async (): Promise<TrialBalance> => {
    const response = await fetch('/api/reports/trial-balance');
    if (!response.ok) {
      throw new Error('Erro ao buscar balancete');
    }
    const result = await response.json();
    return result.data;
  },
};

// Hook para buscar balancete
export function useTrialBalance() {
  return useQuery({
    queryKey: ['reports', 'trial-balance'],
    queryFn: reportsApi.getTrialBalance,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}
