/**
 * Sistema de Cache HTTP
 * Implementa cache em memória e headers HTTP
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpar cache expirado a cada 5 minutos
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

export const cache = new MemoryCache();

/**
 * Headers de cache HTTP
 */
export const cacheHeaders = {
  /**
   * Cache público por 1 hora
   */
  public: {
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  },
  
  /**
   * Cache privado por 5 minutos
   */
  private: {
    'Cache-Control': 'private, max-age=300',
  },
  
  /**
   * Sem cache
   */
  noCache: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  
  /**
   * Cache para recursos estáticos (1 ano)
   */
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
};

/**
 * Wrapper para cache de funções
 */
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = cache.get<T>(key);
  
  if (cached !== null) {
    return Promise.resolve(cached);
  }
  
  return fn().then(result => {
    cache.set(key, result, ttlSeconds);
    return result;
  });
}
