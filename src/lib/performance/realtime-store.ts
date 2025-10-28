/**
 * 🚀 Real-time Data Store
 * Reactive data store with intelligent caching and batch updates
 */

import { optimisticUpdates, OptimisticOperation } from './optimistic-updates';

interface StoreSubscription {
  id: string;
  callback: (data: any) => void;
  selector?: (data: any) => any;
  lastValue?: any;
}

interface BatchUpdate {
  key: string;
  data: any;
  timestamp: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

class RealTimeDataStore {
  private data = new Map<string, any>();
  private subscriptions = new Map<string, Set<StoreSubscription>>();
  private cache = new Map<string, CacheEntry>();
  private batchQueue: BatchUpdate[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private subscriptionCounter = 0;
  
  // Configuration
  private readonly BATCH_DELAY = 50; // ms
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  
  // Statistics
  private stats = {
    reads: 0,
    writes: 0,
    cacheHits: 0,
    cacheMisses: 0,
    subscriptions: 0,
    batchUpdates: 0
  };

  constructor() {
    // Clean up cache periodically
    setInterval(() => this.cleanupCache(), 60000); // Every minute
    
    // Listen for cache invalidation events
    if (typeof window !== 'undefined') {
      window.addEventListener('invalidate-cache', (event: CustomEvent) => {
        const { entity } = event.detail;
        console.log(`🗑️ [RealTimeStore] Invalidating cache for: ${entity}`);
        
        if (entity) {
          // Remove specific entity from cache
          this.data.delete(entity);
          this.cache.delete(entity);
          
          // Notify subscribers that data was invalidated
          this.notifySubscribers(entity, null);
        } else {
          // Clear all cache if no specific entity
          this.clear();
        }
      });
    }
  }

  /**
   * Subscribe to data changes with optional selector
   */
  subscribe(
    key: string, 
    callback: (data: any) => void,
    selector?: (data: any) => any
  ): () => void {
    const subscriptionId = `sub_${++this.subscriptionCounter}`;
    
    const subscription: StoreSubscription = {
      id: subscriptionId,
      callback,
      selector
    };

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    
    this.subscriptions.get(key)!.add(subscription);
    this.stats.subscriptions++;

    // Send current data immediately
    const currentData = this.getData(key);
    if (currentData !== undefined) {
      const selectedData = selector ? selector(currentData) : currentData;
      subscription.lastValue = selectedData;
      callback(selectedData);
    }

    // Return unsubscribe function
    return () => {
      const keySubscriptions = this.subscriptions.get(key);
      if (keySubscriptions) {
        keySubscriptions.delete(subscription);
        if (keySubscriptions.size === 0) {
          this.subscriptions.delete(key);
        }
      }
      this.stats.subscriptions--;
    };
  }

  /**
   * Update data and notify subscribers
   */
  updateData(key: string, data: any, immediate: boolean = false): void {
    if (immediate) {
      this.performUpdate(key, data);
    } else {
      this.queueBatchUpdate(key, data);
    }
  }

  /**
   * Get data with caching
   */
  getData(key: string): any {
    this.stats.reads++;
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      cached.accessCount++;
      cached.lastAccessed = Date.now();
      this.stats.cacheHits++;
      return cached.data;
    }

    // Get from main store
    const data = this.data.get(key);
    
    if (data !== undefined) {
      // Cache the data
      this.setCacheEntry(key, data);
      this.stats.cacheMisses++;
    }

    return data;
  }

  /**
   * Set data directly (for initial loading)
   */
  setData(key: string, data: any): void {
    this.data.set(key, data);
    this.setCacheEntry(key, data);
    this.notifySubscribers(key, data);
    this.stats.writes++;
  }

  /**
   * Batch multiple updates for performance
   */
  batchUpdate(updates: Record<string, any>): void {
    const timestamp = Date.now();
    
    Object.entries(updates).forEach(([key, data]) => {
      this.batchQueue.push({ key, data, timestamp });
    });

    this.scheduleBatchProcess();
  }

  /**
   * Create optimistic update with real-time sync
   */
  createOptimisticUpdate(
    key: string,
    type: OptimisticOperation['type'],
    data: any,
    apiCall: () => Promise<any>,
    originalData?: any
  ): Promise<any> {
    // Apply optimistic update immediately
    const operationId = optimisticUpdates.applyOptimisticUpdate(
      key,
      type,
      data,
      originalData,
      {
        onPending: () => {
          // Update local store immediately
          this.applyOptimisticChange(key, type, data, originalData);
        },
        onConfirmed: (operation) => {
          console.log(`✅ Optimistic update confirmed for ${key}`);
        },
        onFailed: (operation, error) => {
          console.warn(`❌ Optimistic update failed for ${key}:`, error);
          // Data is already rolled back by OptimisticUpdateManager
          this.syncFromOptimisticStore(key);
        },
        onRolledBack: (operation) => {
          console.log(`🔄 Optimistic update rolled back for ${key}`);
          this.syncFromOptimisticStore(key);
        }
      }
    );

    // Execute API call
    return apiCall()
      .then(result => {
        // Confirm optimistic update with server data
        optimisticUpdates.confirmUpdate(operationId, result);
        this.updateData(key, result, true);
        return result;
      })
      .catch(error => {
        // Fail optimistic update
        optimisticUpdates.failOperation(operationId, error);
        throw error;
      });
  }

  /**
   * Prefetch related data based on current data
   */
  prefetchRelatedData(currentKey: string, currentData: any): void {
    // Define prefetch strategies based on data type
    const prefetchStrategies: Record<string, (data: any) => string[]> = {
      'accounts': (data) => ['transactions', 'account-balances'],
      'transactions': (data) => ['categories', 'accounts'],
      'dashboard': (data) => ['accounts', 'transactions', 'recent-activity'],
      'user': (data) => ['preferences', 'settings']
    };

    const strategy = prefetchStrategies[currentKey];
    if (strategy && currentData) {
      const relatedKeys = strategy(currentData);
      
      relatedKeys.forEach(key => {
        // Only prefetch if not already cached
        if (!this.cache.has(key) || this.isCacheExpired(key)) {
          this.prefetchData(key);
        }
      });
    }
  }

  /**
   * Check if store has pending operations
   */
  hasPendingOperations(key: string): boolean {
    return optimisticUpdates.hasPendingOperations(key);
  }

  /**
   * Get pending operations for debugging
   */
  getPendingOperations(key?: string): OptimisticOperation[] {
    return optimisticUpdates.getPendingOperations(key);
  }

  /**
   * Clear all data and subscriptions
   */
  clear(): void {
    this.data.clear();
    this.cache.clear();
    this.subscriptions.clear();
    this.batchQueue = [];
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  /**
   * Get store statistics
   */
  getStats(): typeof this.stats & { cacheHitRate: number } {
    const totalCacheRequests = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 
      ? (this.stats.cacheHits / totalCacheRequests) * 100 
      : 0;

    return {
      ...this.stats,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100
    };
  }

  // Private methods

  private queueBatchUpdate(key: string, data: any): void {
    this.batchQueue.push({
      key,
      data,
      timestamp: Date.now()
    });

    this.scheduleBatchProcess();
  }

  private scheduleBatchProcess(): void {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.processBatchQueue();
      this.batchTimeout = null;
    }, this.BATCH_DELAY);
  }

  private processBatchQueue(): void {
    if (this.batchQueue.length === 0) return;

    // Group updates by key
    const groupedUpdates = new Map<string, any>();
    
    this.batchQueue.forEach(update => {
      groupedUpdates.set(update.key, update.data);
    });

    // Apply all updates
    groupedUpdates.forEach((data, key) => {
      this.performUpdate(key, data);
    });

    this.batchQueue = [];
    this.stats.batchUpdates++;
  }

  private performUpdate(key: string, data: any): void {
    this.data.set(key, data);
    this.setCacheEntry(key, data);
    this.notifySubscribers(key, data);
    this.stats.writes++;

    // Prefetch related data
    this.prefetchRelatedData(key, data);
  }

  private notifySubscribers(key: string, data: any): void {
    const keySubscriptions = this.subscriptions.get(key);
    if (!keySubscriptions) return;

    keySubscriptions.forEach(subscription => {
      try {
        const selectedData = subscription.selector 
          ? subscription.selector(data) 
          : data;

        // Only notify if data actually changed
        if (selectedData !== subscription.lastValue) {
          subscription.lastValue = selectedData;
          subscription.callback(selectedData);
        }
      } catch (error) {
        console.error(`Subscription callback error for ${key}:`, error);
      }
    });
  }

  private setCacheEntry(key: string, data: any): void {
    // Cleanup cache if too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastUsedCacheEntry();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_TTL,
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }

  private isCacheExpired(key: string): boolean {
    const cached = this.cache.get(key);
    return !cached || Date.now() >= cached.expiresAt;
  }

  private evictLeastUsedCacheEntry(): void {
    let leastUsedKey = '';
    let leastUsedCount = Infinity;
    let oldestAccess = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.accessCount < leastUsedCount || 
          (entry.accessCount === leastUsedCount && entry.lastAccessed < oldestAccess)) {
        leastUsedKey = key;
        leastUsedCount = entry.accessCount;
        oldestAccess = entry.lastAccessed;
      }
    });

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now >= entry.expiresAt) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  private applyOptimisticChange(
    key: string,
    type: OptimisticOperation['type'],
    data: any,
    originalData?: any
  ): void {
    const currentData = this.getData(key) || [];
    
    switch (type) {
      case 'CREATE':
        if (Array.isArray(currentData)) {
          this.updateData(key, [...currentData, data], true);
        } else {
          this.updateData(key, data, true);
        }
        break;
        
      case 'UPDATE':
        if (Array.isArray(currentData)) {
          const updated = currentData.map(item => 
            item.id === data.id ? { ...item, ...data } : item
          );
          this.updateData(key, updated, true);
        } else {
          this.updateData(key, { ...currentData, ...data }, true);
        }
        break;
        
      case 'DELETE':
        if (Array.isArray(currentData)) {
          const filtered = currentData.filter(item => item.id !== data.id);
          this.updateData(key, filtered, true);
        } else {
          this.updateData(key, null, true);
        }
        break;
    }
  }

  private syncFromOptimisticStore(key: string): void {
    const optimisticData = optimisticUpdates.getData(key);
    if (optimisticData !== undefined) {
      this.updateData(key, optimisticData, true);
    }
  }

  private async prefetchData(key: string): Promise<void> {
    // This would typically make an API call to prefetch data
    // For now, we'll just log the prefetch attempt
    console.log(`🔄 Prefetching data for: ${key}`);
    
    // Emit prefetch event for external handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('store:prefetch', {
        detail: { key }
      }));
    }
  }

  /**
   * Print statistics for debugging
   */
  printStats(): void {
    const stats = this.getStats();
    console.log('📊 Real-time Store Statistics:');
    console.log(`   Reads: ${stats.reads}`);
    console.log(`   Writes: ${stats.writes}`);
    console.log(`   Cache Hits: ${stats.cacheHits}`);
    console.log(`   Cache Misses: ${stats.cacheMisses}`);
    console.log(`   Cache Hit Rate: ${stats.cacheHitRate}%`);
    console.log(`   Active Subscriptions: ${stats.subscriptions}`);
    console.log(`   Batch Updates: ${stats.batchUpdates}`);
  }
}

// Singleton instance
export const realTimeStore = new RealTimeDataStore();

export default RealTimeDataStore;