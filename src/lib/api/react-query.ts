import { QueryClient } from '@tanstack/react-query'

// Configuração otimizada do QueryClient para sistema financeiro
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 10 minutos para dados financeiros (aumentado)
      staleTime: 10 * 60 * 1000,
      // Manter cache por 30 minutos (aumentado)
      gcTime: 30 * 60 * 1000,
      // Retry em caso de erro
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Desabilitado para evitar chamadas excessivas
      refetchOnWindowFocus: false,
      // Refetch quando reconecta à internet
      refetchOnReconnect: true,
      // Não refetch automaticamente em mount se dados ainda são fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations uma vez em caso de erro de rede
      retry: 1,
      retryDelay: 1000,
    },
  },
})

// Chaves de query organizadas por domínio
export const queryKeys = {
  // Transações
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
    byCategory: (category: string) => [...queryKeys.transactions.all, 'category', category] as const,
    byAccount: (accountId: string) => [...queryKeys.transactions.all, 'account', accountId] as const,
  },

  // Contas
  accounts: {
    all: ['accounts'] as const,
    lists: () => [...queryKeys.accounts.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.accounts.lists(), filters] as const,
    details: () => [...queryKeys.accounts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.accounts.details(), id] as const,
    metrics: (id: string) => [...queryKeys.accounts.detail(id), 'metrics'] as const,
  },

  // Metas
  goals: {
    all: ['goals'] as const,
    lists: () => [...queryKeys.goals.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.goals.lists(), filters] as const,
    details: () => [...queryKeys.goals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.goals.details(), id] as const,
  },

  // Orçamentos
  budgets: {
    all: ['budgets'] as const,
    lists: () => [...queryKeys.budgets.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.budgets.lists(), filters] as const,
    details: () => [...queryKeys.budgets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.budgets.details(), id] as const,
  },

  // Investimentos
  investments: {
    all: ['investments'] as const,
    lists: () => [...queryKeys.investments.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.investments.lists(), filters] as const,
    details: () => [...queryKeys.investments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.investments.details(), id] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    metrics: () => [...queryKeys.dashboard.all, 'metrics'] as const,
    cashflow: () => [...queryKeys.dashboard.all, 'cashflow'] as const,
    activities: () => [...queryKeys.dashboard.all, 'activities'] as const,
    wealth: () => [...queryKeys.dashboard.all, 'wealth'] as const,
  },

  // Cartões de crédito
  creditCards: {
    all: ['creditCards'] as const,
    lists: () => [...queryKeys.creditCards.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.creditCards.lists(), filters] as const,
    details: () => [...queryKeys.creditCards.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.creditCards.details(), id] as const,
  },
} as const

// Utilitários para invalidação de cache
export const invalidateQueries = {
  // Invalidar todas as queries relacionadas a transações
  transactions: () => queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),

  // Invalidar queries específicas de uma conta
  account: (accountId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(accountId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byAccount(accountId) })
  },

  // Invalidar dashboard (usado após mudanças importantes)
  dashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),

  // Invalidar tudo (usar com parcimônia)
  all: () => queryClient.invalidateQueries(),
}
