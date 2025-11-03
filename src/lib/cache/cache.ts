// Sistema de cache simples para melhorar performance das APIs
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos padrão

  // Gerar chave de cache baseada nos parâmetros
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  // Verificar se uma entrada está expirada
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  // Obter dados do cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Armazenar dados no cache
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
  }

  // Invalidar cache por padrão de chave
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Limpar todo o cache
  clear(): void {
    this.cache.clear();
  }

  // Obter estatísticas do cache
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      timestamp: now
    };
  }

  // Limpeza automática de entradas expiradas
  cleanup(): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Instância global do cache
export const apiCache = new SimpleCache();

// Funções helper para cache de transações
export const transactionCache = {
  // Cache para resumo de transações
  getSummary: (params: Record<string, any>) => {
    const key = apiCache['generateKey']('summary', params);
    return apiCache.get(key);
  },

  setSummary: (params: Record<string, any>, data: any) => {
    const key = apiCache['generateKey']('summary', params);
    // Cache de resumo por 10 minutos
    apiCache.set(key, data, 10 * 60 * 1000);
  },

  // Cache para lista de transações
  getTransactions: (params: Record<string, any>) => {
    const key = apiCache['generateKey']('transactions', params);
    return apiCache.get(key);
  },

  setTransactions: (params: Record<string, any>, data: any) => {
    const key = apiCache['generateKey']('transactions', params);
    // Cache de lista por 2 minutos
    apiCache.set(key, data, 2 * 60 * 1000);
  },

  // Invalidar cache quando transações são modificadas
  invalidateAll: () => {
    apiCache.invalidatePattern('summary');
    apiCache.invalidatePattern('transactions');
  },

  // Invalidar cache específico por período
  invalidateByPeriod: (year?: number, month?: number) => {
    if (year && month) {
      apiCache.invalidatePattern(`year:${year}|month:${month}`);
    } else if (year) {
      apiCache.invalidatePattern(`year:${year}`);
    } else {
      // Se não especificado, invalidar tudo
      transactionCache.invalidateAll();
    }
  }
};

// Middleware para limpeza automática do cache
setInterval(() => {
  apiCache.cleanup();
}, 5 * 60 * 1000); // Limpeza a cada 5 minutos

export default apiCache;
