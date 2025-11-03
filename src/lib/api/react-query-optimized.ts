import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Optimized React Query configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: 'always',
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: 'always',
      // Background refetch interval (5 minutes)
      refetchInterval: 5 * 60 * 1000,
      // Only refetch in background if window is focused
      refetchIntervalInBackground: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistent cache management
export const queryKeys = {
  // Financial data
  accounts: ['accounts'] as const,
  transactions: (filters?: any) => ['transactions', filters] as const,
  unifiedFinancial: ['unified-financial'] as const,

  // Investments
  investments: ['investments'] as const,
  investmentPortfolio: ['investment-portfolio'] as const,

  // Trips
  trips: ['trips'] as const,
  activeTrips: ['trips', 'active'] as const,
  trip: (id: string) => ['trips', id] as const,

  // Goals and budgets
  goals: ['goals'] as const,
  budgets: ['budgets'] as const,

  // Categories
  categories: ['categories'] as const,

  // Reports
  reports: (type: string, params?: any) => ['reports', type, params] as const,
};

// Cache invalidation helpers
export const invalidateQueries = {
  // Invalidate all financial data
  allFinancial: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
    queryClient.invalidateQueries({ queryKey: queryKeys.unifiedFinancial });
  },

  // Invalidate investments
  investments: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.investments });
    queryClient.invalidateQueries({ queryKey: queryKeys.investmentPortfolio });
  },

  // Invalidate trips
  trips: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.trips });
    queryClient.invalidateQueries({ queryKey: queryKeys.activeTrips });
  },

  // Invalidate specific trip
  trip: (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.trip(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.trips });
  },

  // Invalidate all data
  all: () => {
    queryClient.invalidateQueries();
  },
};

// Prefetch helpers
export const prefetchQueries = {
  // Prefetch essential data on app start
  essential: async () => {
    const promises = [
      queryClient.prefetchQuery({
        queryKey: queryKeys.accounts,
        queryFn: () => fetch('/api/accounts').then(res => res.json()),
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.unifiedFinancial,
        queryFn: () => fetch('/api/unified-financial/optimized').then(res => res.json()),
        staleTime: 2 * 60 * 1000,
      }),
    ];

    await Promise.allSettled(promises);
  },

  // Prefetch trips data
  trips: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.trips,
      queryFn: () => fetch('/api/trips').then(res => res.json()),
      staleTime: 5 * 60 * 1000,
    });
  },
};

// Optimistic update helpers
export const optimisticUpdates = {
  // Add transaction optimistically
  addTransaction: (newTransaction: any) => {
    queryClient.setQueryData(queryKeys.transactions(), (old: any) => {
      if (!old) return [newTransaction];
      return [newTransaction, ...old];
    });
  },

  // Update transaction optimistically
  updateTransaction: (id: string, updates: any) => {
    queryClient.setQueryData(queryKeys.transactions(), (old: any[]) => {
      if (!old) return [];
      return old.map(transaction =>
        transaction.id === id ? { ...transaction, ...updates } : transaction
      );
    });
  },

  // Remove transaction optimistically
  removeTransaction: (id: string) => {
    queryClient.setQueryData(queryKeys.transactions(), (old: any[]) => {
      if (!old) return [];
      return old.filter(transaction => transaction.id !== id);
    });
  },

  // Add trip optimistically
  addTrip: (newTrip: any) => {
    queryClient.setQueryData(queryKeys.trips, (old: any) => {
      if (!old) return [newTrip];
      return [newTrip, ...old];
    });
  },

  // Update trip optimistically
  updateTrip: (id: string, updates: any) => {
    queryClient.setQueryData(queryKeys.trips, (old: any[]) => {
      if (!old) return [];
      return old.map(trip =>
        trip.id === id ? { ...trip, ...updates } : trip
      );
    });
  },
};

// Background sync for offline support
export const backgroundSync = {
  // Sync pending operations when online
  syncPendingOperations: async () => {
    const pendingOperations = JSON.parse(
      localStorage.getItem('pendingOperations') || '[]'
    );

    for (const operation of pendingOperations) {
      try {
        await fetch(operation.endpoint, {
          method: operation.method,
          headers: operation.headers,
          body: operation.body,
        });

        // Remove successful operation from pending list
        const updatedOperations = pendingOperations.filter(
          (op: any) => op.id !== operation.id
        );
        localStorage.setItem('pendingOperations', JSON.stringify(updatedOperations));

      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
      }
    }

    // Refresh all data after sync
    invalidateQueries.all();
  },

  // Add operation to pending list for offline sync
  addPendingOperation: (operation: any) => {
    const pendingOperations = JSON.parse(
      localStorage.getItem('pendingOperations') || '[]'
    );

    pendingOperations.push({
      ...operation,
      id: Date.now().toString(),
      timestamp: Date.now(),
    });

    localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
  },
};

// Performance monitoring
export const performanceMonitoring = {
  // Track query performance
  trackQueryPerformance: (queryKey: string, duration: number) => {
    const metrics = JSON.parse(localStorage.getItem('queryMetrics') || '{}');

    if (!metrics[queryKey]) {
      metrics[queryKey] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        lastExecuted: 0,
      };
    }

    metrics[queryKey].count++;
    metrics[queryKey].totalTime += duration;
    metrics[queryKey].avgTime = metrics[queryKey].totalTime / metrics[queryKey].count;
    metrics[queryKey].lastExecuted = Date.now();

    localStorage.setItem('queryMetrics', JSON.stringify(metrics));
  },

  // Get performance metrics
  getMetrics: () => {
    return JSON.parse(localStorage.getItem('queryMetrics') || '{}');
  },

  // Clear metrics
  clearMetrics: () => {
    localStorage.removeItem('queryMetrics');
  },
};

export default queryClient;
