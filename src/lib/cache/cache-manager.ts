/**
 * Sistema de Cache Local
 * Armazena dados no localStorage com expiração
 */

const CACHE_PREFIX = 'suagrana_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  /**
   * Salvar dados no cache
   */
  static set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    try {
      const cacheKey = CACHE_PREFIX + key;
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      console.warn('Erro ao salvar cache:', error);
    }
  }

  /**
   * Buscar dados do cache
   * Retorna null se não existir ou estiver expirado
   */
  static get<T>(key: string): T | null {
    try {
      const cacheKey = CACHE_PREFIX + key;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const item: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();
      const age = now - item.timestamp;

      // Verificar se expirou
      if (age > item.ttl) {
        this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Erro ao ler cache:', error);
      return null;
    }
  }

  /**
   * Remover item do cache
   */
  static remove(key: string): void {
    try {
      const cacheKey = CACHE_PREFIX + key;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Erro ao remover cache:', error);
    }
  }

  /**
   * Limpar todo o cache
   */
  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }

  /**
   * Verificar se tem cache válido
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }
}
