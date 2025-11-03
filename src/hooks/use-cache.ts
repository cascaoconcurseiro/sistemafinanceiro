/**
 * Hook para integração do sistema de cache com React
 * 
 * Fornece interface reativa para cache de dados e autenticação
 */

import { useState, useEffect, useCallback } from 'react';
import { authCache } from '@/lib/cache/auth-cache-manager';
import { dataCache } from '@/lib/cache/data-cache-manager';

interface UseCacheOptions {
  key: string;
  fetcher?: () => Promise<any>;
  ttl?: number;
  tags?: string[];
  preload?: string[];
  backgroundUpdate?: boolean;
}

interface CacheResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
  isFromCache: boolean;
}

/**
 * Hook principal para cache de dados
 */
export function useCache<T = any>(options: UseCacheOptions): CacheResult<T> {
  const { key, fetcher, ttl, tags = [], preload = [], backgroundUpdate = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // Função para buscar dados
  const fetchData = useCallback(async (useCache = true) => {
    try {
      setIsLoading(true);
      setError(null);

      // Tentar buscar do cache primeiro
      if (useCache) {
        const cachedData = dataCache.get(key);
        if (cachedData) {
          setData(cachedData);
          setIsFromCache(true);
          setIsLoading(false);
          
          // Atualizar em background se habilitado
          if (backgroundUpdate) {
            dataCache.updateInBackground(key);
          }
          
          return;
        }
      }

      // Buscar da API se não estiver em cache ou forçado
      if (fetcher) {
        const freshData = await fetcher();
        
        // Armazenar no cache
        dataCache.set(key, freshData, ttl, tags);
        
        setData(freshData);
        setIsFromCache(false);
      }
    } catch (err) {
      setError(err as Error);
      console.error(`🔄 [useCache] Erro ao buscar ${key}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, tags, backgroundUpdate]);

  // Função para invalidar cache
  const invalidate = useCallback(() => {
    dataCache.invalidate(key);
    setData(null);
    setIsFromCache(false);
  }, [key]);

  // Função para revalidar (buscar novamente)
  const refetch = useCallback(async () => {
    await fetchData(false); // Forçar busca da API
  }, [fetchData]);

  // Efeito inicial
  useEffect(() => {
    fetchData();
    
    // Pré-carregar dados relacionados
    if (preload.length > 0) {
      dataCache.preload(preload);
    }
  }, [fetchData, preload]);

  // Escutar atualizações do cache
  useEffect(() => {
    const handleCacheUpdate = (event: CustomEvent) => {
      if (event.detail.key === key) {
        setData(event.detail.data);
        setIsFromCache(true);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cache-updated', handleCacheUpdate as EventListener);
      
      return () => {
        window.removeEventListener('cache-updated', handleCacheUpdate as EventListener);
      };
    }
  }, [key]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
    isFromCache
  };
}

/**
 * Hook para autenticação com cache
 */
export function useAuthCache() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação
  const checkAuth = useCallback(() => {
    setIsLoading(true);
    
    const validToken = authCache.getValidToken();
    const authenticated = authCache.isAuthenticated();
    const session = authCache.getSessionInfo();
    
    setToken(validToken);
    setIsAuthenticated(authenticated);
    setSessionInfo(session);
    setIsLoading(false);
  }, []);

  // Login com cache
  const login = useCallback((token: string, expiresIn: number, refreshToken?: string, userId?: string) => {
    authCache.storeToken(token, expiresIn, refreshToken, userId);
    checkAuth();
  }, [checkAuth]);

  // Logout com limpeza de cache
  const logout = useCallback(() => {
    authCache.clearAuth();
    dataCache.clear(); // Limpar também cache de dados
    setToken(null);
    setIsAuthenticated(false);
    setSessionInfo(null);
  }, []);

  // Renovar token
  const refreshToken = useCallback(async () => {
    try {
      const newToken = await authCache.refreshToken();
      if (newToken) {
        checkAuth();
        return newToken;
      }
      return null;
    } catch (error) {
      console.error('🔄 [useAuthCache] Erro ao renovar token:', error);
      return null;
    }
  }, [checkAuth]);

  // Efeito inicial
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    token,
    sessionInfo,
    isLoading,
    login,
    logout,
    refreshToken,
    checkAuth
  };
}

/**
 * Hook para estatísticas de cache
 */
export function useCacheStats() {
  const [stats, setStats] = useState({
    auth: authCache.getStats(),
    data: dataCache.getStats()
  });

  useEffect(() => {
    const updateStats = () => {
      setStats({
        auth: authCache.getStats(),
        data: dataCache.getStats()
      });
    };

    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(updateStats, 30 * 1000);
    
    // Atualizar imediatamente
    updateStats();

    return () => clearInterval(interval);
  }, []);

  return stats;
}

/**
 * Hook para cache de dados financeiros específicos
 */
export function useFinancialData(endpoint: string, options?: Partial<UseCacheOptions>) {
  return useCache({
    key: endpoint.replace('/api/', '').replace('/', '_'),
    fetcher: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      return response.json();
    },
    tags: ['financial'],
    backgroundUpdate: true,
    ...options
  });
}

/**
 * Hook para invalidação em lote
 */
export function useCacheInvalidation() {
  const invalidateFinancialData = useCallback(() => {
    dataCache.invalidate('financial');
    console.log('🔄 [useCacheInvalidation] Cache de dados financeiros invalidado');
  }, []);

  const invalidateUserData = useCallback(() => {
    dataCache.invalidate('user');
    console.log('🔄 [useCacheInvalidation] Cache de dados do usuário invalidado');
  }, []);

  const invalidateAll = useCallback(() => {
    dataCache.clear();
    console.log('🔄 [useCacheInvalidation] Todo cache de dados limpo');
  }, []);

  return {
    invalidateFinancialData,
    invalidateUserData,
    invalidateAll
  };
}