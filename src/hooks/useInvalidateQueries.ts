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
    console.log('🔄 [Invalidate] Invalidando TODOS os caches');
    queryClient.invalidateQueries({ queryKey: ['unified-financial'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  }, [queryClient]);
  
  const invalidateTransactions = useCallback(() => {
    console.log('🔄 [Invalidate] Invalidando transações');
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['unified-financial'] });
  }, [queryClient]);
  
  const invalidateAccounts = useCallback(() => {
    console.log('🔄 [Invalidate] Invalidando contas');
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['unified-financial'] });
  }, [queryClient]);
  
  const invalidateCategories = useCallback(() => {
    console.log('🔄 [Invalidate] Invalidando categorias');
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, [queryClient]);
  
  const invalidateGoals = useCallback(() => {
    console.log('🔄 [Invalidate] Invalidando metas');
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['unified-financial'] });
  }, [queryClient]);
  
  const invalidateBudgets = useCallback(() => {
    console.log('🔄 [Invalidate] Invalidando orçamentos');
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
