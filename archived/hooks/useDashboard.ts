import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryConfigs, invalidateQueries } from '@/lib/react-query';
import { useAuth } from '@/components/enhanced-auth-provider';

// Tipos para dashboard
interface WealthMetrics {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
  investedAssets: number;
  realEstate: number;
  lastUpdated: string;
}

interface CashflowMetrics {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  savingsRate: number;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
}

interface InvestmentMetrics {
  totalInvested: number;
  currentValue: number;
  totalReturn: number;
  returnPercentage: number;
  monthlyDividends: number;
  portfolioByBroker: Array<{
    broker: string;
    value: number;
    percentage: number;
  }>;
  portfolioByAsset: Array<{
    asset: string;
    value: number;
    percentage: number;
  }>;
}

interface GoalMetrics {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalTargetAmount: number;
  totalProgress: number;
  averageProgress: number;
  goals: Array<{
    id: number;
    name: string;
    targetAmount: number;
    currentAmount: number;
    progress: number;
    status: string;
    deadline?: string;
  }>;
}

interface RecentActivity {
  id: number;
  type: 'transaction' | 'investment' | 'goal' | 'trip';
  description: string;
  amount?: number;
  date: string;
  category?: string;
}

interface DashboardSummary {
  wealth: WealthMetrics;
  cashflow: CashflowMetrics;
  investments: InvestmentMetrics;
  goals: GoalMetrics;
  recentActivities: RecentActivity[];
  lastUpdated: string;
}

// API functions
const api = {
  // Buscar resumo completo do dashboard
  getDashboardSummary: async (userId: number, period: string = '30d') => {
    const response = await fetch(`/api/dashboard/summary?userId=${userId}&period=${period}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard summary');
    }
    return response.json();
  },

  // Buscar métricas de patrimônio
  getWealthMetrics: async (userId: number) => {
    const response = await fetch(`/api/dashboard/wealth?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch wealth metrics');
    }
    return response.json();
  },

  // Buscar métricas de fluxo de caixa
  getCashflowMetrics: async (userId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`/api/dashboard/cashflow?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch cashflow metrics');
    }
    return response.json();
  },

  // Buscar métricas de investimentos
  getInvestmentMetrics: async (userId: number) => {
    const response = await fetch(`/api/dashboard/investments?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch investment metrics');
    }
    return response.json();
  },

  // Buscar métricas de metas
  getGoalMetrics: async (userId: number) => {
    const response = await fetch(`/api/dashboard/goals?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch goal metrics');
    }
    return response.json();
  },

  // Buscar atividades recentes
  getRecentActivities: async (userId: number, limit: number = 10) => {
    const response = await fetch(`/api/dashboard/activities?userId=${userId}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recent activities');
    }
    return response.json();
  },

  // Buscar métricas customizadas
  getCustomMetrics: async (userId: number, metrics: string[], startDate?: string, endDate?: string) => {
    const response = await fetch('/api/dashboard/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        metrics,
        startDate,
        endDate,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch custom metrics');
    }
    return response.json();
  },

  // Forçar refresh das views materializadas
  refreshDashboard: async () => {
    const response = await fetch('/api/dashboard/refresh');
    if (!response.ok) {
      throw new Error('Failed to refresh dashboard');
    }
    return response.json();
  },

  // Funções específicas para os novos hooks
  getGoalsMetrics: async (userId: number) => {
    const response = await fetch(`/api/dashboard/goals?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch goals metrics');
    }
    return response.json();
  },

  getAccountsMetrics: async (userId: number) => {
    const response = await fetch(`/api/accounts?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch accounts metrics');
    }
    return response.json();
  },

  getCategoriesMetrics: async (userId: number) => {
    const response = await fetch(`/api/categories?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories metrics');
    }
    return response.json();
  },

  getTransactionsMetrics: async (userId: number) => {
    const response = await fetch(`/api/transactions?userId=${userId}&summary=true`);
    if (!response.ok) {
      throw new Error('Failed to fetch transactions metrics');
    }
    return response.json();
  },
};

// Hook para resumo completo do dashboard
export const useDashboardSummary = (userId: number, period: string = '30d') => {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(userId, period),
    queryFn: () => api.getDashboardSummary(userId, period),
    enabled: !!userId,
    ...queryConfigs.realTime, // Dados em tempo real
  });
};

// Hook para métricas de patrimônio
export const useWealthMetrics = (userId: number) => {
  return useQuery({
    queryKey: queryKeys.dashboard.wealth(userId),
    queryFn: () => api.getWealthMetrics(userId),
    enabled: !!userId,
    ...queryConfigs.realTime,
  });
};

// Hook para métricas de fluxo de caixa
export const useCashflowMetrics = (
  userId: number,
  startDate?: Date,
  endDate?: Date
) => {
  return useQuery({
    queryKey: queryKeys.dashboard.cashflow(
      userId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    ),
    queryFn: () => api.getCashflowMetrics(
      userId,
      startDate?.toISOString(),
      endDate?.toISOString()
    ),
    enabled: !!userId,
    ...queryConfigs.realTime,
  });
};

// Hook para métricas de investimentos
export const useInvestmentMetrics = (userId: number) => {
  return useQuery({
    queryKey: queryKeys.dashboard.investments(userId),
    queryFn: () => api.getInvestmentMetrics(userId),
    enabled: !!userId,
    ...queryConfigs.moderate, // Investimentos mudam menos frequentemente
  });
};

// Hook para métricas de metas
export const useGoalMetrics = (userId: number) => {
  return useQuery({
    queryKey: queryKeys.dashboard.goals(userId),
    queryFn: () => api.getGoalMetrics(userId),
    enabled: !!userId,
    ...queryConfigs.moderate,
  });
};

// Hook para atividades recentes
export const useRecentActivities = (userId: number, limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.dashboard.activities(userId, limit),
    queryFn: () => api.getRecentActivities(userId, limit),
    enabled: !!userId,
    ...queryConfigs.realTime,
  });
};

// Hook para métricas customizadas
export const useCustomMetrics = (
  userId: number,
  metrics: string[],
  startDate?: Date,
  endDate?: Date
) => {
  return useQuery({
    queryKey: ['dashboard', 'custom', userId, metrics, startDate, endDate],
    queryFn: () => api.getCustomMetrics(
      userId,
      metrics,
      startDate?.toISOString(),
      endDate?.toISOString()
    ),
    enabled: !!userId && metrics.length > 0,
    ...queryConfigs.realTime,
  });
};

// Hook para refresh manual do dashboard
export const useDashboardRefresh = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.refreshDashboard,
    onSuccess: () => {
      // Invalidar todas as queries do dashboard
      invalidateQueries.dashboard();
      invalidateQueries.transactions();
      invalidateQueries.accounts();
      invalidateQueries.investments();
      invalidateQueries.goals();
    },
    onError: (error) => {
      console.error('Error refreshing dashboard:', error);
    },
  });
};

// Hook para sincronização automática do dashboard
export const useDashboardSync = () => {
  const queryClient = useQueryClient();

  const syncDashboard = () => {
    invalidateQueries.dashboard();
  };

  const syncSpecificMetric = (metric: string, userId: number) => {
    switch (metric) {
      case 'wealth':
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.dashboard.wealth(userId) 
        });
        break;
      case 'cashflow':
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.dashboard.all,
          predicate: (query) => query.queryKey.includes('cashflow')
        });
        break;
      case 'investments':
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.dashboard.investments(userId) 
        });
        break;
      case 'goals':
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.dashboard.goals(userId) 
        });
        break;
      case 'activities':
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.dashboard.all,
          predicate: (query) => query.queryKey.includes('activities')
        });
        break;
      default:
        syncDashboard();
    }
  };

  return {
    syncDashboard,
    syncSpecificMetric,
  };
};

// Hook para monitoramento de mudanças em tempo real
export const useDashboardRealTime = (userId: number) => {
  const { syncDashboard } = useDashboardSync();

  // Configurar intervalo para sincronização automática
  const startRealTimeSync = (intervalMs: number = 30000) => {
    const interval = setInterval(() => {
      syncDashboard();
    }, intervalMs);

    return () => clearInterval(interval);
  };

  return {
    startRealTimeSync,
    syncDashboard,
  };
};

// Hook principal que retorna todos os hooks específicos do dashboard
export const useDashboard = () => {
  // Obter userId da autenticação
  const { user } = useAuth();
  const userId = user?.id ? parseInt(user.id) || 1 : 1;

  // Hooks específicos para cada seção do dashboard
  const useFluxoCaixa = () => useCashflowMetrics(userId);
  const usePatrimonio = () => useWealthMetrics(userId);
  const useMetas = () => useGoalsMetrics(userId);
  const useInvestimentos = () => useInvestmentMetrics(userId);
  const useContas = () => useAccountsMetrics(userId);
  const useCategorias = () => useCategoriesMetrics(userId);
  const useTransacoes = () => useTransactionsMetrics(userId);

  // Hook para resumo geral do dashboard
  const useDashboardData = () => useDashboardSummary(userId);

  return {
    useFluxoCaixa,
    usePatrimonio,
    useMetas,
    useInvestimentos,
    useContas,
    useCategorias,
    useTransacoes,
    useDashboardData,
    // Hooks de controle
    refresh: useDashboardRefresh(),
    sync: useDashboardSync(),
    realTime: useDashboardRealTime(userId),
  };
};

// Hooks específicos para métricas que ainda não foram implementados
const useGoalsMetrics = (userId: number) => {
  return useQuery({
    queryKey: queryKeys.dashboard.goals(userId),
    queryFn: () => api.getGoalsMetrics(userId),
    enabled: !!userId,
    ...queryConfigs.realTime,
  });
};

const useAccountsMetrics = (userId: number) => {
  return useQuery({
    queryKey: queryKeys.dashboard.accounts(userId),
    queryFn: () => api.getAccountsMetrics(userId),
    enabled: !!userId,
    ...queryConfigs.realTime,
  });
};

const useCategoriesMetrics = (userId: number) => {
  return useQuery({
    queryKey: queryKeys.dashboard.categories(userId),
    queryFn: () => api.getCategoriesMetrics(userId),
    enabled: !!userId,
    ...queryConfigs.realTime,
  });
};

const useTransactionsMetrics = (userId: number) => {
  return useQuery({
    queryKey: queryKeys.dashboard.transactions(userId),
    queryFn: () => api.getTransactionsMetrics(userId),
    enabled: !!userId,
    ...queryConfigs.realTime,
  });
};