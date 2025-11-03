'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { toast } from 'sonner';

// Tipos
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  accountId: string;
  categoryId?: string;
  isPaid: boolean;
  [key: string]: any;
}

interface CreateTransactionData {
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  accountId: string;
  categoryId?: string;
  isPaid?: boolean;
  [key: string]: any;
}

// Hook para buscar transações com cache
export function useTransactions(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams(filters || {});
      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar transações');
      return response.json();
    },
    staleTime: 30000, // 30 segundos
  });
}

// Hook para criar transação com Optimistic Update
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao criar transação');
      return response.json();
    },

    // OPTIMISTIC UPDATE - Atualiza UI ANTES da API responder
    onMutate: async (newTransaction) => {
      // Cancela queries em andamento
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      // Salva estado anterior (para rollback)
      const previousTransactions = queryClient.getQueryData(queryKeys.transactions.lists());

      // Atualiza cache otimisticamente
      queryClient.setQueriesData(
        { queryKey: queryKeys.transactions.lists() },
        (old: any) => {
          if (!old) return old;

          const tempTransaction = {
            ...newTransaction,
            id: `temp-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            ...old,
            transactions: [tempTransaction, ...(old.transactions || [])],
          };
        }
      );

      return { previousTransactions };
    },

    // Se der erro, reverte
    onError: (err, newTransaction, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          queryKeys.transactions.lists(),
          context.previousTransactions
        );
      }
      toast.error('Erro ao criar transação');
    },

    // Quando sucesso, revalida do servidor
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(data.accountId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Transação criada com sucesso!');
    },
  });
}

// Hook para atualizar transação com Optimistic Update
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Transaction> }) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atualizar transação');
      return response.json();
    },

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      const previousTransactions = queryClient.getQueryData(queryKeys.transactions.lists());

      // Atualiza otimisticamente
      queryClient.setQueriesData(
        { queryKey: queryKeys.transactions.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            transactions: old.transactions?.map((t: Transaction) =>
              t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
            ),
          };
        }
      );

      return { previousTransactions };
    },

    onError: (err, variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          queryKeys.transactions.lists(),
          context.previousTransactions
        );
      }
      toast.error('Erro ao atualizar transação');
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(data.accountId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Transação atualizada!');
    },
  });
}

// Hook para deletar transação com Optimistic Update
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar transação');
      return response.json();
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      const previousTransactions = queryClient.getQueryData(queryKeys.transactions.lists());

      // Remove otimisticamente
      queryClient.setQueriesData(
        { queryKey: queryKeys.transactions.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            transactions: old.transactions?.filter((t: Transaction) => t.id !== id),
          };
        }
      );

      return { previousTransactions };
    },

    onError: (err, id, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          queryKeys.transactions.lists(),
          context.previousTransactions
        );
      }
      toast.error('Erro ao deletar transação');
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Transação deletada!');
    },
  });
}

// Hook para marcar como pago/não pago (toggle rápido)
export function useToggleTransactionPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPaid }: { id: string; isPaid: boolean }) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar status');
      return response.json();
    },

    onMutate: async ({ id, isPaid }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      const previousTransactions = queryClient.getQueryData(queryKeys.transactions.lists());

      // Atualiza instantaneamente
      queryClient.setQueriesData(
        { queryKey: queryKeys.transactions.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            transactions: old.transactions?.map((t: Transaction) =>
              t.id === id ? { ...t, isPaid, updatedAt: new Date().toISOString() } : t
            ),
          };
        }
      );

      return { previousTransactions };
    },

    onError: (err, variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          queryKeys.transactions.lists(),
          context.previousTransactions
        );
      }
      toast.error('Erro ao atualizar status');
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(data.accountId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
