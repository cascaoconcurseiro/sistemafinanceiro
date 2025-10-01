'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TransactionAdapter } from '../lib/services/transaction-adapter';

interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'shared';
  category: string;
  date: string;
  accountId?: string;
  notes?: string;
  tags?: string[];
}

// Hook para buscar todas as transações
export function useUnifiedTransactions() {
  return useQuery({
    queryKey: ['unified-transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions?limit=100');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar transações');
      }

      // Transformar dados para formato do frontend
      const transformedTransactions = data.data.map((transaction: any) =>
        TransactionAdapter.postgrestoFrontend(transaction)
      );

      return {
        items: transformedTransactions,
        total: data.pagination?.total || transformedTransactions.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 100,
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// Hook para criar transação
export function useCreateUnifiedTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionData: CreateTransactionData) => {
      // Buscar IDs necessários
      const [defaultIds, accountId, categoryId] = await Promise.all([
        TransactionAdapter.getDefaultIds(),
        TransactionAdapter.getAccountId(transactionData.accountId || 'Conta Corrente'),
        TransactionAdapter.getCategoryId(transactionData.category),
      ]);

      // Transformar dados para formato da API
      const postgresData = TransactionAdapter.frontendToPostgres(
        transactionData,
        {
          ...defaultIds,
          accountId,
          categoryId,
        }
      );

      console.log('🚀 Enviando para API:', postgresData);

      // Enviar para API
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postgresData),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar transação');
      }

      return TransactionAdapter.postgrestoFrontend(result.data);
    },
    onSuccess: (newTransaction) => {
      // Invalidar cache de transações
      queryClient.invalidateQueries({ queryKey: ['unified-transactions'] });
      
      // Adicionar ao cache imediatamente para UX melhor
      queryClient.setQueryData(['unified-transactions'], (old: any) => {
        if (!old) return { items: [newTransaction], total: 1 };
        
        return {
          ...old,
          items: [newTransaction, ...old.items],
          total: old.total + 1,
        };
      });

      toast.success('Transação criada com sucesso!');
      console.log('✅ Transação criada:', newTransaction);
    },
    onError: (error: any) => {
      const message = error?.message || 'Erro ao criar transação';
      toast.error(message);
      console.error('❌ Erro ao criar transação:', error);
    },
  });
}

// Hook para atualizar transação
export function useUpdateUnifiedTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar transação');
      }

      return TransactionAdapter.postgrestoFrontend(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-transactions'] });
      toast.success('Transação atualizada com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.message || 'Erro ao atualizar transação';
      toast.error(message);
    },
  });
}

// Hook para deletar transação
export function useDeleteUnifiedTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir transação');
      }

      return id;
    },
    onSuccess: (deletedId) => {
      // Remover do cache
      queryClient.setQueryData(['unified-transactions'], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          items: old.items.filter((transaction: any) => transaction.id !== deletedId),
          total: Math.max(0, old.total - 1),
        };
      });

      toast.success('Transação excluída com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.message || 'Erro ao excluir transação';
      toast.error(message);
    },
  });
}