'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { toast } from 'sonner';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
  [key: string]: any;
}

// Hook para buscar contas
export function useAccounts(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.accounts.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters || {});
      const response = await fetch(`/api/accounts?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar contas');
      return response.json();
    },
    staleTime: 60000, // 1 minuto
  });
}

// Hook para buscar uma conta específica
export function useAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/accounts/${id}`);
      if (!response.ok) throw new Error('Erro ao buscar conta');
      return response.json();
    },
    enabled: !!id,
  });
}

// Hook para criar conta
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Account>) => {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao criar conta');
      return response.json();
    },

    onMutate: async (newAccount) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.accounts.all });

      const previousAccounts = queryClient.getQueryData(queryKeys.accounts.lists());

      queryClient.setQueriesData(
        { queryKey: queryKeys.accounts.lists() },
        (old: any) => {
          if (!old) return old;

          const tempAccount = {
            ...newAccount,
            id: `temp-${Date.now()}`,
            balance: newAccount.balance || 0,
            createdAt: new Date().toISOString(),
          };

          return {
            ...old,
            accounts: [tempAccount, ...(old.accounts || [])],
          };
        }
      );

      return { previousAccounts };
    },

    onError: (err, newAccount, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(queryKeys.accounts.lists(), context.previousAccounts);
      }
      toast.error('Erro ao criar conta');
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Conta criada com sucesso!');
    },
  });
}

// Hook para atualizar conta
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Account> }) => {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atualizar conta');
      return response.json();
    },

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.accounts.all });

      const previousAccounts = queryClient.getQueryData(queryKeys.accounts.lists());
      const previousAccount = queryClient.getQueryData(queryKeys.accounts.detail(id));

      // Atualiza lista
      queryClient.setQueriesData(
        { queryKey: queryKeys.accounts.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            accounts: old.accounts?.map((a: Account) =>
              a.id === id ? { ...a, ...data } : a
            ),
          };
        }
      );

      // Atualiza detalhe
      queryClient.setQueryData(queryKeys.accounts.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previousAccounts, previousAccount };
    },

    onError: (err, { id }, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(queryKeys.accounts.lists(), context.previousAccounts);
      }
      if (context?.previousAccount) {
        queryClient.setQueryData(queryKeys.accounts.detail(id), context.previousAccount);
      }
      toast.error('Erro ao atualizar conta');
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Conta atualizada!');
    },
  });
}

// Hook para deletar conta
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar conta');
      return response.json();
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.accounts.all });

      const previousAccounts = queryClient.getQueryData(queryKeys.accounts.lists());

      queryClient.setQueriesData(
        { queryKey: queryKeys.accounts.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            accounts: old.accounts?.filter((a: Account) => a.id !== id),
          };
        }
      );

      return { previousAccounts };
    },

    onError: (err, id, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(queryKeys.accounts.lists(), context.previousAccounts);
      }
      toast.error('Erro ao deletar conta');
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Conta deletada!');
    },
  });
}

// Hook para transferência entre contas (Optimistic Update duplo)
export function useTransferBetweenAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fromAccountId,
      toAccountId,
      amount,
      description,
    }: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      description?: string;
    }) => {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAccountId, toAccountId, amount, description }),
      });
      if (!response.ok) throw new Error('Erro ao transferir');
      return response.json();
    },

    onMutate: async ({ fromAccountId, toAccountId, amount }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.accounts.all });

      const previousAccounts = queryClient.getQueryData(queryKeys.accounts.lists());

      // Atualiza saldos INSTANTANEAMENTE
      queryClient.setQueriesData(
        { queryKey: queryKeys.accounts.lists() },
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            accounts: old.accounts?.map((a: Account) => {
              if (a.id === fromAccountId) {
                return { ...a, balance: a.balance - amount };
              }
              if (a.id === toAccountId) {
                return { ...a, balance: a.balance + amount };
              }
              return a;
            }),
          };
        }
      );

      // Atualiza detalhes individuais
      queryClient.setQueryData(queryKeys.accounts.detail(fromAccountId), (old: any) => {
        if (!old) return old;
        return { ...old, balance: old.balance - amount };
      });

      queryClient.setQueryData(queryKeys.accounts.detail(toAccountId), (old: any) => {
        if (!old) return old;
        return { ...old, balance: old.balance + amount };
      });

      return { previousAccounts };
    },

    onError: (err, variables, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(queryKeys.accounts.lists(), context.previousAccounts);
      }
      toast.error('Erro ao realizar transferência');
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Transferência realizada!');
    },
  });
}
