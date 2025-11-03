import { useQueryClient } from '@tanstack/react-query';
import { useEventListener } from '@/hooks/use-real-time-events';

/**
 * Sistema de invalidação automática de cache baseado em eventos
 * Conecta o sistema de eventos em tempo real com o React Query
 */

// Mapeamento de eventos para queries que devem ser invalidadas
const EVENT_TO_QUERIES_MAP = {
  transaction_created: ['transactions', 'dashboard', 'accounts', 'balance'],
  transaction_updated: ['transactions', 'dashboard', 'accounts', 'balance'],
  transaction_deleted: ['transactions', 'dashboard', 'accounts', 'balance'],
  balance_updated: ['balance', 'dashboard', 'accounts'],
  account_updated: ['accounts', 'dashboard', 'balance'],
  goal_updated: ['goals', 'dashboard'],
  trip_updated: ['trips', 'dashboard'],
  dashboard_updated: ['dashboard']
} as const;

/**
 * Hook para invalidação automática de cache baseada em eventos
 * Deve ser usado em componentes de nível superior (como layouts ou providers)
 */
export function useAutoInvalidateCache() {
  const queryClient = useQueryClient();

  // Função para invalidar queries baseada no evento
  const invalidateQueriesForEvent = (eventType: string) => {
    const queriesToInvalidate = EVENT_TO_QUERIES_MAP[eventType as keyof typeof EVENT_TO_QUERIES_MAP];

    if (queriesToInvalidate) {
      console.log(`🔄 Invalidando cache para evento: ${eventType}`, queriesToInvalidate);

      queriesToInvalidate.forEach(queryKey => {
        queryClient.invalidateQueries({
          queryKey: [queryKey],
          exact: false // Invalida todas as queries que começam com essa chave
        });
      });
    }
  };

  // Escutar todos os eventos de transações
  useEventListener(['transaction_created', 'transaction_updated', 'transaction_deleted'], (event) => {
    invalidateQueriesForEvent(event.type);
  });

  // Escutar eventos de saldo
  useEventListener('balance_updated', (event) => {
    invalidateQueriesForEvent(event.type);
  });

  // Escutar eventos de contas
  useEventListener('account_updated', (event) => {
    invalidateQueriesForEvent(event.type);
  });

  // Escutar eventos de metas
  useEventListener('goal_updated', (event) => {
    invalidateQueriesForEvent(event.type);
  });

  // Escutar eventos de viagens
  useEventListener('trip_updated', (event) => {
    invalidateQueriesForEvent(event.type);
  });

  // Escutar eventos de dashboard
  useEventListener('dashboard_updated', (event) => {
    invalidateQueriesForEvent(event.type);
  });

  return {
    invalidateQueriesForEvent,
    queryClient
  };
}

/**
 * Utilitários para invalidação manual de cache
 */
export const cacheInvalidationUtils = {
  // Invalidar cache de transações
  invalidateTransactions: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },

  // Invalidar cache de contas
  invalidateAccounts: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  },

  // Invalidar cache de dashboard
  invalidateDashboard: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  },

  // Invalidar cache de saldo
  invalidateBalance: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ['balance'] });
  },

  // Invalidar cache de metas
  invalidateGoals: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
  },

  // Invalidar cache de viagens
  invalidateTrips: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ['trips'] });
  },

  // Invalidar tudo
  invalidateAll: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries();
  }
};
