'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  creditCardId: string;
  month: number;
  year: number;
  totalAmount: number;
  paidAmount: number;
  isPaid: boolean;
  dueDate: string;
  [key: string]: any;
}

// Hook para buscar faturas
export function useInvoices(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters || {});
      const response = await fetch(`/api/invoices?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar faturas');
      return response.json();
    },
    staleTime: 30000,
  });
}

// Hook para buscar fatura específica
export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) throw new Error('Erro ao buscar fatura');
      return response.json();
    },
    enabled: !!id,
  });
}

// Hook para pagar fatura (Optimistic Update)
export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      accountId,
      amount,
    }: {
      invoiceId: string;
      accountId: string;
      amount: number;
    }) => {
      const response = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, amount }),
      });
      if (!response.ok) throw new Error('Erro ao pagar fatura');
      return response.json();
    },

    onMutate: async ({ invoiceId, amount }) => {
      await queryClient.cancelQueries({ queryKey: ['invoices'] });

      const previousInvoices = queryClient.getQueryData(['invoices']);
      const previousInvoice = queryClient.getQueryData(['invoices', invoiceId]);

      // Atualiza fatura instantaneamente
      queryClient.setQueriesData({ queryKey: ['invoices'] }, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          invoices: old.invoices?.map((inv: Invoice) => {
            if (inv.id === invoiceId) {
              const newPaidAmount = inv.paidAmount + amount;
              return {
                ...inv,
                paidAmount: newPaidAmount,
                isPaid: newPaidAmount >= inv.totalAmount,
              };
            }
            return inv;
          }),
        };
      });

      // Atualiza detalhe
      queryClient.setQueryData(['invoices', invoiceId], (old: any) => {
        if (!old) return old;
        const newPaidAmount = old.paidAmount + amount;
        return {
          ...old,
          paidAmount: newPaidAmount,
          isPaid: newPaidAmount >= old.totalAmount,
        };
      });

      return { previousInvoices, previousInvoice };
    },

    onError: (err, { invoiceId }, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(['invoices'], context.previousInvoices);
      }
      if (context?.previousInvoice) {
        queryClient.setQueryData(['invoices', invoiceId], context.previousInvoice);
      }
      toast.error('Erro ao pagar fatura');
    },

    onSuccess: ({ accountId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(accountId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Fatura paga com sucesso!');
    },
  });
}

// Hook para marcar fatura como paga
export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Erro ao marcar fatura como paga');
      return response.json();
    },

    onMutate: async (invoiceId) => {
      await queryClient.cancelQueries({ queryKey: ['invoices'] });

      const previousInvoices = queryClient.getQueryData(['invoices']);
      const previousInvoice = queryClient.getQueryData(['invoices', invoiceId]);

      // Marca como paga instantaneamente
      queryClient.setQueriesData({ queryKey: ['invoices'] }, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          invoices: old.invoices?.map((inv: Invoice) =>
            inv.id === invoiceId
              ? { ...inv, isPaid: true, paidAmount: inv.totalAmount }
              : inv
          ),
        };
      });

      queryClient.setQueryData(['invoices', invoiceId], (old: any) => {
        if (!old) return old;
        return { ...old, isPaid: true, paidAmount: old.totalAmount };
      });

      return { previousInvoices, previousInvoice };
    },

    onError: (err, invoiceId, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(['invoices'], context.previousInvoices);
      }
      if (context?.previousInvoice) {
        queryClient.setQueryData(['invoices', invoiceId], context.previousInvoice);
      }
      toast.error('Erro ao marcar fatura como paga');
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Fatura marcada como paga!');
    },
  });
}
