import { useQuery } from '@tanstack/react-query';
import type { Transaction } from '@/lib/data-layer/types';

export function useSharedExpenses() {
  return useQuery({
    queryKey: ['shared-expenses'],
    queryFn: async (): Promise<{ data: Transaction[], allTransactions: Transaction[] }> => {
      try {

        // Buscar transações compartilhadas da API unificada
        const response = await fetch('/api/unified-financial', {
          credentials: 'include',
          cache: 'no-cache'
        });

        if (!response.ok) {

          throw new Error(`Erro ${response.status}`);
        }

        const result = await response.json();

        // TEMPORÁRIO: Retornar todas as transações para debug
        const sharedTransactions = (result.transactions || []).filter(
          (transaction: Transaction) => {
            const hasSharedWith = transaction.sharedWith &&
              (Array.isArray(transaction.sharedWith) ? transaction.sharedWith.length > 0 :
               typeof transaction.sharedWith === 'string' && transaction.sharedWith.length > 0);
            return hasSharedWith;
          }
        );

        // Retornar tanto as compartilhadas quanto todas as transações
        return {
          data: sharedTransactions,
          allTransactions: result.transactions || []
        };
      } catch (error) {
        console.error('Erro ao buscar despesas compartilhadas:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });
}
