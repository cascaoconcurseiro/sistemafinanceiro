import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Investment } from '@/types/financial';

// Query keys para investimentos
export const investmentKeys = {
  all: ['investments'] as const,
  lists: () => [...investmentKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...investmentKeys.lists(), { filters }] as const,
  details: () => [...investmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...investmentKeys.details(), id] as const,
};

// Hook para buscar todos os investimentos
export function useInvestments(filters?: {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: investmentKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.type) params.append('type', filters.type);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/investments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar investimentos');
      }

      const result = await response.json();
      
      // A API retorna diretamente investments, portfolio e pagination
      return {
        investments: result.investments || [],
        portfolio: result.portfolio || {},
        pagination: result.pagination || {},
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar um investimento específico
export function useInvestment(id: string) {
  return useQuery({
    queryKey: investmentKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/investments/${id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar investimento');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar investimento');
      }

      return result.data;
    },
    enabled: !!id,
  });
}

// Hook para criar investimento
export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      symbol?: string;
      type: string;
      quantity: number;
      purchasePrice: number;
      currentPrice?: number;
      purchaseDate: string;
      maturityDate?: string;
      broker?: string;
      fees?: number;
      notes?: string;
      status?: string;
    }) => {
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar investimento');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar investimento');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() });
      toast.success('Investimento criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar investimento:', error);
      toast.error(error.message || 'Erro ao criar investimento');
    },
  });
}

// Hook para atualizar investimento
export function useUpdateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Investment>;
    }) => {
      const response = await fetch('/api/investments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar investimento');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar investimento');
      }

      return result.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() });
      toast.success('Investimento atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar investimento:', error);
      toast.error(error.message || 'Erro ao atualizar investimento');
    },
  });
}

// Hook para deletar investimento
export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/investments?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar investimento');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar investimento');
      }

      return result;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() });
      toast.success('Investimento deletado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar investimento:', error);
      toast.error(error.message || 'Erro ao deletar investimento');
    },
  });
}

// Hook para buscar valor total dos investimentos
export function useInvestmentsValue() {
  return useQuery({
    queryKey: [...investmentKeys.all, 'value'],
    queryFn: async () => {
      const response = await fetch('/api/investments');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar valor dos investimentos');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar valor dos investimentos');
      }

      return result.portfolio || {
        currentValue: 0,
        totalInvested: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        totalAssets: 0,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

// Hook para buscar investimentos por tipo/categoria
export function useInvestmentsByType() {
  return useQuery({
    queryKey: [...investmentKeys.all, 'by-type'],
    queryFn: async () => {
      const response = await fetch('/api/investments');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar investimentos por tipo');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar investimentos por tipo');
      }

      const investments = result.data || [];
      
      const investmentsByType = investments.reduce(
        (acc: Record<string, Investment[]>, investment: Investment) => {
          const type = investment.type || 'other';
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(investment);
          return acc;
        },
        {}
      );

      return investmentsByType;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}