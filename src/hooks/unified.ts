import { useState, useEffect, useCallback, useMemo } from 'react';

// Types for unified hooks
export interface UnifiedState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface UnifiedActions<T> {
  set: (data: T) => void;
  update: (updater: (prev: T | null) => T) => void;
  clear: () => void;
  refresh: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface UnifiedHookOptions<T> {
  key: string;
  initialData?: T;
  autoLoad?: boolean;
  loadFunction?: () => Promise<T>;
  saveFunction?: (data: T) => Promise<void>;
  validateFunction?: (data: T) => boolean;
  transformFunction?: (data: any) => T;
}

// Main unified hook
export function useUnifiedState<T>(options: UnifiedHookOptions<T>): [UnifiedState<T>, UnifiedActions<T>] {
  const {
    key,
    initialData = null,
    autoLoad = false,
    loadFunction,
    saveFunction,
    validateFunction,
    transformFunction,
  } = options;

  const [state, setState] = useState<UnifiedState<T>>({
    data: initialData,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  // Load data from database on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && loadFunction) {
      loadFunction()
        .then(data => {
          const transformedData = transformFunction ? transformFunction(data) : data;

          if (!validateFunction || validateFunction(transformedData)) {
            setState(prev => ({
              ...prev,
              data: transformedData,
              lastUpdated: new Date().toISOString(),
            }));
          }
        })
        .catch(error => {
          console.error(`Error loading ${key} from database:`, error);
          setState(prev => ({
            ...prev,
            error: `Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          }));
        });
    }
  }, [key, loadFunction, transformFunction, validateFunction]); // Adicionando dependências necessárias

  // Auto-load data if specified
  useEffect(() => {
    if (autoLoad && loadFunction && !state.data && !state.loading) {
      refresh();
    }
  }, [autoLoad, loadFunction, state.data, state.loading]); // Removendo refresh das dependências para evitar loop

  // Save to database whenever data changes
  useEffect(() => {
    if (state.data && saveFunction && typeof window !== 'undefined') {
      saveFunction(state.data)
        .catch(error => {
          console.error(`Error saving ${key} to database:`, error);
        });
    }
  }, [key, state.data, state.lastUpdated, saveFunction]);

  const set = useCallback((data: T) => {
    if (validateFunction && !validateFunction(data)) {
      setState(prev => ({
        ...prev,
        error: 'Dados inválidos fornecidos',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      data,
      error: null,
      lastUpdated: new Date().toISOString(),
    }));

    // Save to external source if function provided
    if (saveFunction) {
      saveFunction(data).catch(error => {
        console.error(`Error saving ${key}:`, error);
        setState(prev => ({
          ...prev,
          error: `Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        }));
      });
    }
  }, [validateFunction, saveFunction, key]);

  const update = useCallback((updater: (prev: T | null) => T) => {
    setState(prev => {
      const newData = updater(prev.data);

      if (validateFunction && !validateFunction(newData)) {
        return {
          ...prev,
          error: 'Dados atualizados são inválidos',
        };
      }

      const newState = {
        ...prev,
        data: newData,
        error: null,
        lastUpdated: new Date().toISOString(),
      };

      // Save to external source if function provided
      if (saveFunction) {
        saveFunction(newData).catch(error => {
          console.error(`Error saving ${key}:`, error);
          setState(current => ({
            ...current,
            error: `Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          }));
        });
      }

      return newState;
    });
  }, [validateFunction, saveFunction, key]);

  const clear = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
    });

    // Dados são limpos apenas do estado, não do banco de dados
    console.log(`Dados do ${key} limpos do estado local`);
  }, [key]);

  const refresh = useCallback(async () => {
    if (!loadFunction) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await loadFunction();
      const transformedData = transformFunction ? transformFunction(data) : data;

      if (validateFunction && !validateFunction(transformedData)) {
        throw new Error('Dados carregados são inválidos');
      }

      setState(prev => ({
        ...prev,
        data: transformedData,
        loading: false,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar dados',
      }));
    }
  }, [loadFunction, transformFunction, validateFunction]);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const actions = useMemo(() => ({
    set,
    update,
    clear,
    refresh,
    setLoading,
    setError,
  }), [set, update, clear, refresh, setLoading, setError]);

  return [state, actions];
}

// Specialized hooks using the unified hook

// Hook for managing arrays
export function useUnifiedArray<T>(
  key: string,
  options: Omit<UnifiedHookOptions<T[]>, 'key'> = {}
) {
  const [state, actions] = useUnifiedState<T[]>({
    key,
    initialData: [],
    ...options,
  });

  const arrayActions = useMemo(() => ({
    ...actions,
    add: (item: T) => {
      actions.update(prev => [...(prev || []), item]);
    },
    remove: (predicate: (item: T) => boolean) => {
      actions.update(prev => (prev || []).filter(item => !predicate(item)));
    },
    removeById: (id: string | number) => {
      actions.update(prev => (prev || []).filter((item: any) => item.id !== id));
    },
    updateItem: (predicate: (item: T) => boolean, updater: (item: T) => T) => {
      actions.update(prev =>
        (prev || []).map(item => predicate(item) ? updater(item) : item)
      );
    },
    updateById: (id: string | number, updater: (item: T) => T) => {
      actions.update(prev =>
        (prev || []).map((item: any) => item.id === id ? updater(item) : item)
      );
    },
    sort: (compareFn: (a: T, b: T) => number) => {
      actions.update(prev => [...(prev || [])].sort(compareFn));
    },
    filter: (predicate: (item: T) => boolean) => {
      actions.update(prev => (prev || []).filter(predicate));
    },
  }), [actions]);

  return [state, arrayActions] as const;
}

// Hook for managing objects/maps
export function useUnifiedMap<T>(
  key: string,
  options: Omit<UnifiedHookOptions<Record<string, T>>, 'key'> = {}
) {
  const [state, actions] = useUnifiedState<Record<string, T>>({
    key,
    initialData: {},
    ...options,
  });

  const mapActions = useMemo(() => ({
    ...actions,
    setItem: (key: string, value: T) => {
      actions.update(prev => ({ ...(prev || {}), [key]: value }));
    },
    removeItem: (key: string) => {
      actions.update(prev => {
        const newMap = { ...(prev || {}) };
        delete newMap[key];
        return newMap;
      });
    },
    updateItem: (key: string, updater: (prev: T | undefined) => T) => {
      actions.update(prev => ({
        ...(prev || {}),
        [key]: updater((prev || {})[key]),
      }));
    },
    hasItem: (key: string) => {
      return state.data ? key in state.data : false;
    },
    getItem: (key: string) => {
      return state.data ? state.data[key] : undefined;
    },
    keys: () => {
      return state.data ? Object.keys(state.data) : [];
    },
    values: () => {
      return state.data ? Object.values(state.data) : [];
    },
    entries: () => {
      return state.data ? Object.entries(state.data) : [];
    },
  }), [actions, state.data]);

  return [state, mapActions] as const;
}

// Hook for managing counters/numbers
export function useUnifiedCounter(
  key: string,
  initialValue = 0,
  options: Omit<UnifiedHookOptions<number>, 'key' | 'initialData'> = {}
) {
  const [state, actions] = useUnifiedState<number>({
    key,
    initialData: initialValue,
    ...options,
  });

  const counterActions = useMemo(() => ({
    ...actions,
    increment: (amount = 1) => {
      actions.update(prev => (prev || 0) + amount);
    },
    decrement: (amount = 1) => {
      actions.update(prev => (prev || 0) - amount);
    },
    multiply: (factor: number) => {
      actions.update(prev => (prev || 0) * factor);
    },
    divide: (divisor: number) => {
      if (divisor === 0) {
        actions.setError('Não é possível dividir por zero');
        return;
      }
      actions.update(prev => (prev || 0) / divisor);
    },
    reset: () => {
      actions.set(initialValue);
    },
  }), [actions, initialValue]);

  return [state, counterActions] as const;
}

// Hook for managing boolean flags
export function useUnifiedFlag(
  key: string,
  initialValue = false,
  options: Omit<UnifiedHookOptions<boolean>, 'key' | 'initialData'> = {}
) {
  const [state, actions] = useUnifiedState<boolean>({
    key,
    initialData: initialValue,
    ...options,
  });

  const flagActions = useMemo(() => ({
    ...actions,
    toggle: () => {
      actions.update(prev => !prev);
    },
    setTrue: () => {
      actions.set(true);
    },
    setFalse: () => {
      actions.set(false);
    },
  }), [actions]);

  return [state, flagActions] as const;
}

// Hook for managing form state
export function useUnifiedForm<T extends Record<string, any>>(
  key: string,
  initialData: T,
  options: Omit<UnifiedHookOptions<T>, 'key' | 'initialData'> = {}
) {
  const [state, actions] = useUnifiedState<T>({
    key,
    initialData,
    ...options,
  });

  const formActions = useMemo(() => ({
    ...actions,
    setField: <K extends keyof T>(field: K, value: T[K]) => {
      actions.update(prev => ({ ...(prev || initialData), [field]: value }));
    },
    setFields: (fields: Partial<T>) => {
      actions.update(prev => ({ ...(prev || initialData), ...fields }));
    },
    resetField: <K extends keyof T>(field: K) => {
      actions.update(prev => ({ ...(prev || initialData), [field]: initialData[field] }));
    },
    reset: () => {
      actions.set(initialData);
    },
    getField: <K extends keyof T>(field: K): T[K] | undefined => {
      return state.data ? state.data[field] : initialData[field];
    },
  }), [actions, state.data, initialData]);

  return [state, formActions] as const;
}

// Hook for managing async operations
export function useUnifiedAsync<T, P extends any[] = []>(
  key: string,
  asyncFunction: (...args: P) => Promise<T>,
  options: Omit<UnifiedHookOptions<T>, 'key' | 'loadFunction'> = {}
) {
  const [state, actions] = useUnifiedState<T>({
    key,
    ...options,
  });

  const execute = useCallback(async (...args: P) => {
    actions.setLoading(true);
    actions.setError(null);

    try {
      const result = await asyncFunction(...args);
      actions.set(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      actions.setError(errorMessage);
      throw error;
    } finally {
      actions.setLoading(false);
    }
  }, [asyncFunction, actions]);

  const asyncActions = useMemo(() => ({
    ...actions,
    execute,
  }), [actions, execute]);

  return [state, asyncActions] as const;
}

// Hook for managing cache with TTL
export function useUnifiedCache<T>(
  key: string,
  ttlMinutes = 60,
  options: Omit<UnifiedHookOptions<T>, 'key'> = {}
) {
  const [state, actions] = useUnifiedState<T>({
    key: `${key}_cache`,
    ...options,
  });

  const [cacheInfo, setCacheInfo] = useState<{
    expiresAt: string | null;
    isExpired: boolean;
  }>({
    expiresAt: null,
    isExpired: false,
  });

  // Check cache expiration on mount and data changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Cache é gerenciado apenas em memória, sem localStorage
      const isExpired = cacheInfo.expiresAt ? new Date() > new Date(cacheInfo.expiresAt) : false;

      if (isExpired) {
        actions.clear();
        setCacheInfo({ expiresAt: null, isExpired: true });
      }
    }
  }, [key, cacheInfo.expiresAt]); // Removendo actions das dependências para evitar loop

  const setWithTTL = useCallback((data: T) => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    actions.set(data);
    setCacheInfo({ expiresAt: expiresAt.toISOString(), isExpired: false });
  }, [actions, ttlMinutes]);

  const clearCache = useCallback(() => {
    actions.clear();
    setCacheInfo({ expiresAt: null, isExpired: false });
  }, [actions]);

  const cacheActions = useMemo(() => ({
    ...actions,
    setWithTTL,
    clearCache,
    isExpired: cacheInfo.isExpired,
    expiresAt: cacheInfo.expiresAt,
  }), [actions, setWithTTL, clearCache, cacheInfo]);

  return [state, cacheActions] as const;
}

// Specific hooks for the application
export function useUnifiedTransactions() {
  const [state, actions] = useUnifiedArray('transactions', {
    autoLoad: false,
    validateFunction: (data) => Array.isArray(data),
  });

  return {
    data: state.data,
    isLoading: state.loading,
    error: state.error,
    ...actions,
  };
}

export function useUnifiedAccounts() {
  const [state, actions] = useUnifiedArray('accounts', {
    autoLoad: false,
    validateFunction: (data) => Array.isArray(data),
  });

  return {
    data: state.data,
    isLoading: state.loading,
    error: state.error,
    ...actions,
  };
}

export function useUnifiedDashboard() {
  const [state, actions] = useUnifiedState({
    key: 'dashboard',
    autoLoad: false,
  });

  return {
    data: state.data,
    isLoading: state.loading,
    error: state.error,
    ...actions,
  };
}

export function useUnifiedCreateTransaction() {
  const transactions = useUnifiedTransactions();

  const mutateAsync = useCallback(async (transaction: any) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    transactions.add(newTransaction);
    return newTransaction;
  }, [transactions]);

  return {
    mutateAsync,
  };
}

export function useUnifiedCreateAccount() {
  const accounts = useUnifiedAccounts();

  const mutateAsync = useCallback(async (account: any) => {
    const newAccount = {
      ...account,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    accounts.add(newAccount);
    return newAccount;
  }, [accounts]);

  return {
    mutateAsync,
  };
}

export function useGlobalSync() {
  const forceGlobalSync = useCallback(() => {
    // Trigger global sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('global-sync'));
    }
  }, []);

  const refreshCurrentPage = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  const clearAllCache = useCallback(() => {
    // Cache é gerenciado apenas em memória, não há localStorage para limpar
    console.log('Cache limpo da memória - localStorage não é mais utilizado');
  }, []);

  return {
    forceGlobalSync,
    refreshCurrentPage,
    clearAllCache,
  };
}

export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);

  const getSyncStatus = useCallback(() => {
    return {
      total: 0,
      fetching: 0,
      stale: 0,
      error: 0,
      success: 0,
    };
  }, []);

  useEffect(() => {
    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = () => setIsSyncing(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('sync-start', handleSyncStart);
      window.addEventListener('sync-end', handleSyncEnd);

      return () => {
        window.removeEventListener('sync-start', handleSyncStart);
        window.removeEventListener('sync-end', handleSyncEnd);
      };
    }
  }, []);

  return {
    getSyncStatus,
    isSyncing: () => isSyncing,
  };
}

// Export all hooks
export {
  useUnifiedState as default,
};
