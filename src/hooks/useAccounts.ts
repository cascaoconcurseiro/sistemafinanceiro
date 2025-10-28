/**
 * @deprecated Este hook está DEPRECADO!
 * 
 * ⚠️ NÃO USE MAIS ESTE HOOK!
 * 
 * Use o contexto unificado em vez disso:
 * 
 * ```typescript
 * import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
 * 
 * const { accounts, loading, error } = useUnifiedFinancial();
 * ```
 * 
 * O contexto unificado oferece:
 * - ✅ Dados centralizados
 * - ✅ Cache automático
 * - ✅ Sincronização entre componentes
 * - ✅ Menos requisições à API
 * - ✅ Melhor performance
 * 
 * Este hook será removido em versões futuras.
 */

import { useState, useEffect } from 'react';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

/**
 * @deprecated Use useUnifiedFinancial() do contexto unificado
 */
export function useAccounts() {
  console.warn(
    '⚠️ [useAccounts] DEPRECADO: Este hook está obsoleto! ' +
    'Use useUnifiedFinancial() do contexto unificado em vez disso. ' +
    'Veja: src/contexts/unified-financial-context.tsx'
  );
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccountsAndCards() {
      try {
        console.log('🏦 [useAccounts] Iniciando busca de contas e cartões...');
        setLoading(true);
        
        // Buscar contas e cartões das APIs reais
        const [accountsResponse, cardsResponse] = await Promise.all([
          fetch('/api/accounts', { credentials: 'include' }),
          fetch('/api/credit-cards', { credentials: 'include' })
        ]);
        
        const accountsData = accountsResponse.ok ? await accountsResponse.json() : [];
        const cardsData = cardsResponse.ok ? (await cardsResponse.json()).data || [] : [];
        
        // ✅ CORREÇÃO: Filtrar apenas contas ATIVAS e tipos válidos (incluindo tipos legados)
        const validAccountTypes = ['ATIVO', 'PASSIVO', 'checking', 'savings', 'investment'];
        const allAccounts: Account[] = [
          // Contas bancárias (ATIVO, PASSIVO e tipos legados - excluir RECEITA e DESPESA)
          ...accountsData
            .filter((account: any) => 
              account.isActive && 
              validAccountTypes.includes(account.type)
            )
            .map((account: any) => ({
              id: account.id,
              name: account.name,
              type: account.type,
              balance: account.balance || 0,
              isActive: account.isActive
            })),
          // Cartões de crédito (apenas ATIVOS)
          ...cardsData
            .filter((card: any) => card.isActive)
            .map((card: any) => ({
              id: `card-${card.id}`,
              name: `💳 ${card.name}`, // Adicionar emoji para diferenciar
              type: 'credit_card',
              balance: card.limit - card.currentBalance, // Limite disponível
              isActive: card.isActive,
              creditLimit: card.limit,
              closingDay: card.closingDay,
              dueDay: card.dueDay
            }))
        ];
        
        console.log('🏦 [useAccounts] Dados carregados:', {
          contas: accountsData.length,
          cartoes: cardsData.length,
          total: allAccounts.length
        });
        
        setAccounts(allAccounts);
        setError(null);
        
      } catch (err) {
        console.error('❌ [useAccounts] Erro:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar contas');
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAccountsAndCards();
  }, []);

  return { accounts, loading, error };
}
