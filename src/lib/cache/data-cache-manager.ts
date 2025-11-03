/**
 * Data Cache Manager
 * 
 * Gerencia cache de dados financeiros com invalidação inteligente,
 * pré-carregamento e sincronização automática.
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  tags: string[];
  version: number;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  lastCleanup: number;
}

export class DataCacheManager {
  private static instance: DataCacheManager;
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    totalEntries: 0,
    hitRate: 0,
    totalHits: 0,
    totalMisses: 0,
    lastCleanup: Date.now()
  };
  
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly LONG_TTL = 30 * 60 * 1000; // 30 minutos
  private readonly SHORT_TTL = 1 * 60 * 1000; // 1 minuto
  private readonly MAX_CACHE_SIZE = 100;
  
  // Configurações de TTL por tipo de dados
  private readonly TTL_CONFIG = {
    accounts: this.LONG_TTL,
    transactions: this.DEFAULT_TTL,
    categories: this.LONG_TTL,
    'credit-cards': this.LONG_TTL,
    budgets: this.DEFAULT_TTL,
    goals: this.DEFAULT_TTL,
    'unified-financial': this.SHORT_TTL, // Dados que mudam frequentemente
    analytics: this.DEFAULT_TTL,
    notifications: this.SHORT_TTL
  };

  private constructor() {
    this.loadFromStorage();
    this.startCleanupInterval();
    this.startStatsInterval();
  }

  static getInstance(): DataCacheManager {
    if (!DataCacheManager.instance) {
      DataCacheManager.instance = new DataCacheManager();
    }
    return DataCacheManager.instance;
  }

  /**
   * Armazena dados no cache com TTL baseado no tipo
   */
  set(key: string, data: any, ttl?: number, tags: string[] = []): void {
    // Determinar TTL baseado no tipo de dados
    const dataType = this.extractDataType(key);
    const finalTTL = ttl || this.TTL_CONFIG[dataType] || this.DEFAULT_TTL;
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: finalTTL,
      tags: [...tags, dataType],
      version: 1
    };
    
    this.cache.set(key, entry);
    this.stats.totalEntries = this.cache.size;
    
    // Limitar tamanho do cache
    this.enforceMaxSize();
    
    console.log(`💾 [DataCache] Armazenado: ${key} (TTL: ${finalTTL}ms, Tags: ${tags.join(', ')})`);
    this.saveToStorage();
  }

  /**
   * Obtém dados do cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.totalMisses++;
      this.updateHitRate();
      return null;
    }
    
    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.totalMisses++;
      this.updateHitRate();
      console.log(`💾 [DataCache] Expirado: ${key}`);
      return null;
    }
    
    this.stats.totalHits++;
    this.updateHitRate();
    console.log(`💾 [DataCache] Hit: ${key}`);
    return entry.data;
  }

  /**
   * Invalida cache por padrão ou tags
   */
  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      // Invalidar por tag ou padrão de chave
      if (entry.tags.includes(pattern) || key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.totalEntries = this.cache.size;
    
    if (keysToDelete.length > 0) {
      console.log(`💾 [DataCache] Invalidados ${keysToDelete.length} itens para padrão: ${pattern}`);
      this.saveToStorage();
    }
  }

  /**
   * Pré-carrega dados das próximas páginas prováveis
   */
  async preload(keys: string[]): Promise<void> {
    const preloadPromises = keys.map(async (key) => {
      // Só pré-carregar se não estiver em cache
      if (!this.cache.has(key)) {
        try {
          const url = this.keyToUrl(key);
          if (url) {
            console.log(`💾 [DataCache] Pré-carregando: ${key}`);
            const response = await fetch(url);
            
            if (response.ok) {
              const data = await response.json();
              this.set(key, data, undefined, ['preloaded']);
            }
          }
        } catch (error) {
          console.error(`💾 [DataCache] Erro no pré-carregamento de ${key}:`, error);
        }
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Atualiza dados em background sem bloquear interface
   */
  async updateInBackground(key: string): Promise<void> {
    try {
      const url = this.keyToUrl(key);
      if (!url) return;

      console.log(`💾 [DataCache] Atualizando em background: ${key}`);
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Verificar se dados mudaram
        const currentData = this.get(key);
        if (JSON.stringify(currentData) !== JSON.stringify(data)) {
          this.set(key, data, undefined, ['background-updated']);
          console.log(`💾 [DataCache] Dados atualizados em background: ${key}`);
          
          // Emitir evento para componentes React
          this.emitCacheUpdate(key, data);
        }
      }
    } catch (error) {
      console.error(`💾 [DataCache] Erro na atualização em background de ${key}:`, error);
    }
  }

  /**
   * Sincroniza dados quando conexão é restaurada
   */
  async syncPendingData(): Promise<void> {
    console.log('💾 [DataCache] Sincronizando dados pendentes...');
    
    // Buscar dados que podem estar desatualizados
    const keysToSync: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      // Sincronizar dados que estão há mais de 2 minutos no cache
      if (Date.now() - entry.timestamp > 2 * 60 * 1000) {
        keysToSync.push(key);
      }
    }
    
    // Atualizar em lotes para não sobrecarregar
    const batchSize = 5;
    for (let i = 0; i < keysToSync.length; i += batchSize) {
      const batch = keysToSync.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(key => this.updateInBackground(key))
      );
      
      // Pequena pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Converte chave de cache para URL da API
   */
  private keyToUrl(key: string): string | null {
    const urlMappings: Record<string, string> = {
      'accounts': '/api/accounts',
      'transactions': '/api/transactions',
      'categories': '/api/categories',
      'credit-cards': '/api/credit-cards',
      'budgets': '/api/budgets',
      'goals': '/api/goals',
      'unified-financial': '/api/unified-financial',
      'notifications': '/api/notifications'
    };

    // Verificar mapeamentos diretos
    if (urlMappings[key]) {
      return urlMappings[key];
    }

    // Verificar padrões com ID
    for (const [pattern, baseUrl] of Object.entries(urlMappings)) {
      if (key.startsWith(pattern + '_')) {
        const id = key.replace(pattern + '_', '');
        return `${baseUrl}/${id}`;
      }
    }

    return null;
  }

  /**
   * Extrai tipo de dados da chave
   */
  private extractDataType(key: string): string {
    const parts = key.split('_');
    return parts[0] || 'unknown';
  }

  /**
   * Emite evento de atualização de cache
   */
  private emitCacheUpdate(key: string, data: any): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('cache-updated', {
        detail: { key, data }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Atualiza taxa de hit do cache
   */
  private updateHitRate(): void {
    const total = this.stats.totalHits + this.stats.totalMisses;
    this.stats.hitRate = total > 0 ? this.stats.totalHits / total : 0;
  }

  /**
   * Limita tamanho do cache removendo entradas mais antigas
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) return;

    // Converter para array e ordenar por timestamp
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    // Remover entradas mais antigas
    const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => {
      this.cache.delete(key);
      console.log(`💾 [DataCache] Removido por limite de tamanho: ${key}`);
    });
  }

  /**
   * Limpeza automática de entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.totalEntries = this.cache.size;
    this.stats.lastCleanup = now;
    
    if (keysToDelete.length > 0) {
      console.log(`💾 [DataCache] Limpeza: ${keysToDelete.length} entradas expiradas removidas`);
      this.saveToStorage();
    }
  }

  private startCleanupInterval(): void {
    // Limpeza a cada 2 minutos
    setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000);
  }

  private startStatsInterval(): void {
    // Atualizar estatísticas a cada minuto
    setInterval(() => {
      console.log(`💾 [DataCache] Stats - Entradas: ${this.stats.totalEntries}, Hit Rate: ${(this.stats.hitRate * 100).toFixed(1)}%`);
    }, 60 * 1000);
  }

  /**
   * Persistência no localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('data_cache', JSON.stringify(cacheData));
      localStorage.setItem('data_cache_stats', JSON.stringify(this.stats));
    } catch (error) {
      console.error('💾 [DataCache] Erro ao salvar no localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('data_cache');
      const storedStats = localStorage.getItem('data_cache_stats');
      
      if (stored) {
        const cacheData = JSON.parse(stored);
        this.cache = new Map(cacheData);
        this.cleanup(); // Limpar entradas expiradas
      }
      
      if (storedStats) {
        this.stats = { ...this.stats, ...JSON.parse(storedStats) };
      }
    } catch (error) {
      console.error('💾 [DataCache] Erro ao carregar do localStorage:', error);
      localStorage.removeItem('data_cache');
      localStorage.removeItem('data_cache_stats');
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      totalEntries: 0,
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0,
      lastCleanup: Date.now()
    };
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('data_cache');
      localStorage.removeItem('data_cache_stats');
    }
    
    console.log('💾 [DataCache] Cache limpo completamente');
  }
}

// Instância singleton
export const dataCache = DataCacheManager.getInstance();