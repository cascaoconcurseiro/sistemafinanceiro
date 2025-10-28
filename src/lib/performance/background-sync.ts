/**
 * 🚀 Background Synchronization System
 * Handles offline operations and automatic sync when connection is restored
 */

import { realTimeStore } from './realtime-store';
import { optimisticUpdates } from './optimistic-updates';

interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  endpoint: string;
  method: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

class BackgroundSyncManager {
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private networkStatus: NetworkStatus;
  
  // Configuration
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff
  private readonly MAX_QUEUE_SIZE = 1000;
  
  // Statistics
  private stats = {
    totalOperations: 0,
    syncedOperations: 0,
    failedOperations: 0,
    queuedOperations: 0,
    networkChanges: 0
  };

  constructor() {
    this.networkStatus = this.getNetworkStatus();
    this.initializeNetworkMonitoring();
    this.startSyncInterval();
    this.loadQueueFromStorage();
  }

  /**
   * Queue operation for background sync
   */
  queueOperation(
    type: SyncOperation['type'],
    entity: string,
    data: any,
    endpoint: string,
    method: string = 'POST',
    priority: SyncOperation['priority'] = 'MEDIUM'
  ): string {
    const operation: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      data,
      endpoint,
      method,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
      priority
    };

    // Check queue size limit
    if (this.syncQueue.length >= this.MAX_QUEUE_SIZE) {
      // Remove oldest low priority operations
      this.evictLowPriorityOperations();
    }

    this.syncQueue.push(operation);
    this.sortQueueByPriority();
    this.saveQueueToStorage();
    
    this.stats.totalOperations++;
    this.stats.queuedOperations++;
    
    console.log(`📤 Operation queued for sync: ${type} ${entity}`, { operationId: operation.id });

    // Try immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      this.syncPendingOperations();
    }

    return operation.id;
  }

  /**
   * Sync all pending operations
   */
  async syncPendingOperations(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log(`🔄 Starting background sync (${this.syncQueue.length} operations)`);

    const operationsToSync = [...this.syncQueue];
    const syncResults: { success: number; failed: number } = { success: 0, failed: 0 };

    for (const operation of operationsToSync) {
      try {
        const success = await this.syncOperation(operation);
        
        if (success) {
          this.removeOperationFromQueue(operation.id);
          syncResults.success++;
          this.stats.syncedOperations++;
        } else {
          syncResults.failed++;
          this.stats.failedOperations++;
        }
        
        // Small delay between operations to avoid overwhelming the server
        await this.delay(100);
        
      } catch (error) {
        console.error(`Sync operation failed: ${operation.id}`, error);
        syncResults.failed++;
        this.stats.failedOperations++;
      }
    }

    this.isSyncing = false;
    this.saveQueueToStorage();
    
    console.log(`✅ Background sync completed: ${syncResults.success} success, ${syncResults.failed} failed`);
    
    // Emit sync completion event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync:completed', {
        detail: { results: syncResults, remainingOperations: this.syncQueue.length }
      }));
    }
  }

  /**
   * Sync individual operation
   */
  private async syncOperation(operation: SyncOperation): Promise<boolean> {
    try {
      const response = await fetch(operation.endpoint, {
        method: operation.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operation.data)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update real-time store with server response
        if (result.data) {
          realTimeStore.updateData(operation.entity, result.data, true);
        }
        
        console.log(`✅ Sync successful: ${operation.type} ${operation.entity}`);
        return true;
        
      } else {
        // Handle different error types
        if (response.status >= 400 && response.status < 500) {
          // Client error - don't retry
          console.warn(`❌ Client error during sync: ${response.status} ${response.statusText}`);
          return false;
        } else {
          // Server error - retry
          operation.retryCount++;
          if (operation.retryCount <= operation.maxRetries) {
            console.warn(`🔄 Server error, will retry: ${response.status} ${response.statusText}`);
            this.scheduleRetry(operation);
          }
          return false;
        }
      }
      
    } catch (error) {
      // Network error - retry
      operation.retryCount++;
      if (operation.retryCount <= operation.maxRetries) {
        console.warn(`🔄 Network error, will retry:`, error);
        this.scheduleRetry(operation);
      } else {
        console.error(`❌ Max retries exceeded for operation: ${operation.id}`, error);
      }
      return false;
    }
  }

  /**
   * Schedule retry for failed operation
   */
  private scheduleRetry(operation: SyncOperation): void {
    const delay = this.RETRY_DELAYS[Math.min(operation.retryCount - 1, this.RETRY_DELAYS.length - 1)];
    
    setTimeout(() => {
      if (this.isOnline) {
        this.syncOperation(operation);
      }
    }, delay);
  }

  /**
   * Remove operation from queue
   */
  private removeOperationFromQueue(operationId: string): void {
    const index = this.syncQueue.findIndex(op => op.id === operationId);
    if (index !== -1) {
      this.syncQueue.splice(index, 1);
      this.stats.queuedOperations--;
    }
  }

  /**
   * Sort queue by priority and timestamp
   */
  private sortQueueByPriority(): void {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    
    this.syncQueue.sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Evict low priority operations when queue is full
   */
  private evictLowPriorityOperations(): void {
    const lowPriorityOps = this.syncQueue.filter(op => op.priority === 'LOW');
    const toRemove = Math.min(lowPriorityOps.length, Math.ceil(this.MAX_QUEUE_SIZE * 0.1));
    
    // Remove oldest low priority operations
    lowPriorityOps
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, toRemove)
      .forEach(op => this.removeOperationFromQueue(op.id));
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.handleNetworkChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleNetworkChange(false);
    });

    // Monitor connection quality if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.updateNetworkStatus();
      });
    }

    // Initial network status
    this.isOnline = navigator.onLine;
    this.updateNetworkStatus();
  }

  /**
   * Handle network status change
   */
  private handleNetworkChange(isOnline: boolean): void {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;
    this.stats.networkChanges++;
    
    console.log(`🌐 Network status changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    
    if (isOnline && !wasOnline) {
      // Just came back online - sync pending operations
      console.log('🔄 Connection restored, syncing pending operations...');
      setTimeout(() => this.syncPendingOperations(), 1000); // Small delay to ensure connection is stable
    }

    // Emit network change event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('network:change', {
        detail: { isOnline, wasOnline, queuedOperations: this.syncQueue.length }
      }));
    }
  }

  /**
   * Update network status information
   */
  private updateNetworkStatus(): void {
    this.networkStatus = this.getNetworkStatus();
  }

  /**
   * Get current network status
   */
  private getNetworkStatus(): NetworkStatus {
    const defaultStatus: NetworkStatus = {
      isOnline: true,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0
    };

    if (typeof window === 'undefined') return defaultStatus;

    const connection = (navigator as any).connection;
    if (!connection) return { ...defaultStatus, isOnline: navigator.onLine };

    return {
      isOnline: navigator.onLine,
      connectionType: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0
    };
  }

  /**
   * Start sync interval
   */
  private startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncPendingOperations();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop sync interval
   */
  private stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueueToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.warn('Failed to save sync queue to storage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueueFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        this.stats.queuedOperations = this.syncQueue.length;
        console.log(`📥 Loaded ${this.syncQueue.length} operations from storage`);
      }
    } catch (error) {
      console.warn('Failed to load sync queue from storage:', error);
      localStorage.removeItem('sync_queue');
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sync statistics
   */
  getStats(): typeof this.stats & { 
    successRate: number; 
    isOnline: boolean; 
    queueSize: number;
    networkStatus: NetworkStatus;
  } {
    const successRate = this.stats.totalOperations > 0 
      ? (this.stats.syncedOperations / this.stats.totalOperations) * 100 
      : 0;

    return {
      ...this.stats,
      successRate: Math.round(successRate * 100) / 100,
      isOnline: this.isOnline,
      queueSize: this.syncQueue.length,
      networkStatus: this.networkStatus
    };
  }

  /**
   * Get pending operations
   */
  getPendingOperations(): SyncOperation[] {
    return [...this.syncQueue];
  }

  /**
   * Clear all pending operations
   */
  clearQueue(): void {
    this.syncQueue = [];
    this.stats.queuedOperations = 0;
    this.saveQueueToStorage();
  }

  /**
   * Force sync now
   */
  forceSyncNow(): Promise<void> {
    return this.syncPendingOperations();
  }

  /**
   * Cleanup and stop background sync
   */
  destroy(): void {
    this.stopSyncInterval();
    this.saveQueueToStorage();
  }

  /**
   * Print statistics for debugging
   */
  printStats(): void {
    const stats = this.getStats();
    console.log('📊 Background Sync Statistics:');
    console.log(`   Total Operations: ${stats.totalOperations}`);
    console.log(`   Synced: ${stats.syncedOperations}`);
    console.log(`   Failed: ${stats.failedOperations}`);
    console.log(`   Queued: ${stats.queuedOperations}`);
    console.log(`   Success Rate: ${stats.successRate}%`);
    console.log(`   Network Changes: ${stats.networkChanges}`);
    console.log(`   Online: ${stats.isOnline}`);
    console.log(`   Connection: ${stats.networkStatus.effectiveType}`);
  }
}

// Singleton instance
export const backgroundSync = new BackgroundSyncManager();

export default BackgroundSyncManager;