import { QueryClient } from '@tanstack/react-query';

// Configuração do React Query para sincronização automática
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch automaticamente quando a janela ganha foco
      refetchOnWindowFocus: true,
      // Refetch automaticamente quando reconecta à internet
      refetchOnReconnect: true,
      // Tempo de cache dos dados (5 minutos)
      staleTime: 5 * 60 * 1000,
      // Tempo para manter dados em cache (10 minutos)
      cacheTime: 10 * 60 * 1000,
      // Retry automático em caso de erro
      retry: 3,
      // Intervalo entre retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry automático para mutations
      retry: 1,
      // Invalidar queries relacionadas após mutation bem-sucedida
      onSuccess: () => {
        // Invalidar todas as queries para garantir dados atualizados
        queryClient.invalidateQueries();
      },
    },
  },
});

// Chaves de query padronizadas para organização
export const queryKeys = {
  // Transações
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.transactions.details(), id] as const,
    summary: (userId: number, startDate?: Date, endDate?: Date) => 
      [...queryKeys.transactions.all, 'summary', userId, startDate, endDate] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    summary: (userId: number, period: string) => 
      [...queryKeys.dashboard.all, 'summary', userId, period] as const,
    wealth: (userId: number) => 
      [...queryKeys.dashboard.all, 'wealth', userId] as const,
    cashflow: (userId: number, startDate: Date, endDate: Date) => 
      [...queryKeys.dashboard.all, 'cashflow', userId, startDate, endDate] as const,
    investments: (userId: number) => 
      [...queryKeys.dashboard.all, 'investments', userId] as const,
    goals: (userId: number) => 
      [...queryKeys.dashboard.all, 'goals', userId] as const,
    activities: (userId: number, limit: number) => 
      [...queryKeys.dashboard.all, 'activities', userId, limit] as const,
    categories: (userId: number) => 
      [...queryKeys.dashboard.all, 'categories', userId] as const,
    accounts: (userId: number) => 
      [...queryKeys.dashboard.all, 'accounts', userId] as const,
    transactions: (userId: number) => 
      [...queryKeys.dashboard.all, 'transactions', userId] as const,
  },
  
  // Contas
  accounts: {
    all: ['accounts'] as const,
    lists: () => [...queryKeys.accounts.all, 'list'] as const,
    list: (userId: number) => [...queryKeys.accounts.lists(), userId] as const,
    details: () => [...queryKeys.accounts.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.accounts.details(), id] as const,
  },
  
  // Investimentos
  investments: {
    all: ['investments'] as const,
    lists: () => [...queryKeys.investments.all, 'list'] as const,
    list: (userId: number) => [...queryKeys.investments.lists(), userId] as const,
    details: () => [...queryKeys.investments.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.investments.details(), id] as const,
  },
  
  // Metas
  goals: {
    all: ['goals'] as const,
    lists: () => [...queryKeys.goals.all, 'list'] as const,
    list: (userId: number) => [...queryKeys.goals.lists(), userId] as const,
    details: () => [...queryKeys.goals.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.goals.details(), id] as const,
  },
  
  // Viagens
  trips: {
    all: ['trips'] as const,
    lists: () => [...queryKeys.trips.all, 'list'] as const,
    list: (userId: number) => [...queryKeys.trips.lists(), userId] as const,
    details: () => [...queryKeys.trips.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.trips.details(), id] as const,
  },
};

// Funções utilitárias para invalidação de cache
export const invalidateQueries = {
  // Invalidar todas as queries de transações
  transactions: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  },
  
  // Invalidar todas as queries do dashboard
  dashboard: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  },
  
  // Invalidar todas as queries de contas
  accounts: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
  },
  
  // Invalidar todas as queries de investimentos
  investments: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
  },
  
  // Invalidar todas as queries de metas
  goals: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
  },
  
  // Invalidar todas as queries de viagens
  trips: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
  },
  
  // Invalidar tudo (usar com cuidado)
  all: () => {
    queryClient.invalidateQueries();
  },
};

// Configurações específicas para diferentes tipos de dados
export const queryConfigs = {
  // Dados que mudam frequentemente (transações, saldos)
  realTime: {
    staleTime: 0, // Sempre considerar stale
    cacheTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 30 * 1000, // Refetch a cada 30 segundos
  },
  
  // Dados que mudam moderadamente (investimentos, metas)
  moderate: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 2 * 60 * 1000, // Refetch a cada 2 minutos
  },
  
  // Dados que mudam raramente (configurações, perfis)
  stable: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    refetchInterval: false, // Não refetch automático
  },
};

// Hook personalizado para sincronização em tempo real
export const useRealTimeSync = () => {
  const syncData = () => {
    // Invalidar queries críticas para sincronização
    invalidateQueries.transactions();
    invalidateQueries.dashboard();
    invalidateQueries.accounts();
  };
  
  return { syncData };
};