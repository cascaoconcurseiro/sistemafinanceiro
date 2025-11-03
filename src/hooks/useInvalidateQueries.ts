/**
 * 🔄 HOOK DE INVALIDAÇÃO DE CACHE
 *
 * Garante que os dados sejam recarregados após mutações
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['unified-financial'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  }, [queryClient]);

  const invalidateTransactions = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['unified-financial'] });
  }, [queryClient]);

  const invalidateAccounts = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['unified-financial'] });
  }, [queryClient]);

  const invalidateCategories = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, [queryClient]);

  const invalidateGoals = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['unified-financial'] });
  }, [queryClient]);

  const invalidateBudgets = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['budgets'] });
    queryClient.invalidateQueries({ queryKey: ['unified-financial'] });
  }, [queryClient]);

  return {
    invalidateAll,
    invalidateTransactions,
    invalidateAccounts,
    invalidateCategories,
    invalidateGoals,
    invalidateBudgets,
  };
}
