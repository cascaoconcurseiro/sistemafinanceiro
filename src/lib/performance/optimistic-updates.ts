/**
 * 🚀 Optimistic Update Manager
 * Provides instant UI updates with server confirmation and rollback capabilities
 */

import { v4 as uuidv4 } from 'uuid';

export interface OptimisticOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  originalData?: any;
  timestamp: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'ROLLED_BACK';
  retryCount: number;
  maxRetries: number;
}

interface OperationCallbacks {
  onPending?: (operation: OptimisticOperation) => void;
  onConfirmed?: (operation: OptimisticOperation) => void;
  onFailed?: (operation: OptimisticOperation, error: any) => void;
  onRolledBack?: (operation: OptimisticOperation) => void;
}

class OptimisticUpdateManager {
  private operations = new Map<string, OptimisticOperation>();
  private subscribers = new Map<string, Set<(data: any) => void>>();
  private entityData = new Map<string, any>();
  private callbacks = new Map<string, OperationCallbacks>();

  // Statistics
  private stats = {
    totalOperations: 0,
    confirmedOperations: 0,
    failedOperations: 0,
    rolledBackOperations: 0
  };

  /**
   * Apply optimistic update immediately to UI
   */
  applyOptimisticUpdate(
    entity: string,
    type: OptimisticOperation['type'],
    data: any,
    originalData?: any,
    callbacks?: OperationCallbacks,
    maxRetries: number = 3
  ): string {
    const operationId = uuidv4();

    const operation: OptimisticOperation = {
      id: operationId,
      type,
      entity,
      data,
      originalData,
      timestamp: Date.now(),
      status: 'PENDING',
      retryCount: 0,
      maxRetries
    };

    // Store operation
    this.operations.set(operationId, operation);
    if (callbacks) {
      this.callbacks.set(operationId, callbacks);
    }

    // Apply update to local data immediately
    this.applyUpdateToLocalData(entity, type, data, originalData);

    // Notify subscribers
    this.notifySubscribers(entity);

    // Call pending callback
    callbacks?.onPending?.(operation);

    this.stats.totalOperations++;

    console.log(`🚀 Optimistic update applied: ${type} ${entity}`, { operationId, data });

    return operationId;
  }

  /**
   * Confirm operation success
   */
  confirmUpdate(operationId: string, serverData?: any): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      console.warn(`Operation ${operationId} not found for confirmation`);
      return;
    }

    operation.status = 'CONFIRMED';

    // Update with server data if provided
    if (serverData) {
      this.applyUpdateToLocalData(operation.entity, operation.type, serverData, operation.originalData);
      this.notifySubscribers(operation.entity);
    }

    // Call confirmed callback
    const callbacks = this.callbacks.get(operationId);
    callbacks?.onConfirmed?.(operation);

    this.stats.confirmedOperations++;

    console.log(`✅ Operation confirmed: ${operationId}`);

    // Clean up after delay
    setTimeout(() => {
      this.operations.delete(operationId);
      this.callbacks.delete(operationId);
    }, 30000); // Keep for 30 seconds for debugging
  }

  /**
   * Handle operation failure and potentially retry or rollback
   */
  failOperation(operationId: string, error: any): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      console.warn(`Operation ${operationId} not found for failure handling`);
      return;
    }

    operation.retryCount++;

    // Try to retry if under limit
    if (operation.retryCount <= operation.maxRetries) {
      console.log(`🔄 Retrying operation ${operationId} (${operation.retryCount}/${operation.maxRetries})`);

      // Exponential backoff
      const delay = Math.pow(2, operation.retryCount) * 1000;
      setTimeout(() => {
        this.retryOperation(operationId);
      }, delay);

      return;
    }

    // Max retries reached, rollback
    operation.status = 'FAILED';
    this.rollbackOperation(operationId, error);
  }

  /**
   * Rollback optimistic update
   */
  rollbackOperation(operationId: string, error?: any): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      console.warn(`Operation ${operationId} not found for rollback`);
      return;
    }

    operation.status = 'ROLLED_BACK';

    // Revert the optimistic update
    this.revertUpdateFromLocalData(operation);

    // Notify subscribers
    this.notifySubscribers(operation.entity);

    // Call callbacks
    const callbacks = this.callbacks.get(operationId);
    callbacks?.onFailed?.(operation, error);
    callbacks?.onRolledBack?.(operation);

    this.stats.failedOperations++;
    this.stats.rolledBackOperations++;

    console.log(`❌ Operation rolled back: ${operationId}`, error);

    // Clean up
    setTimeout(() => {
      this.operations.delete(operationId);
      this.callbacks.delete(operationId);
    }, 5000);
  }

  /**
   * Retry a failed operation
   */
  private retryOperation(operationId: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    // This would typically trigger the original API call again
    // The actual retry logic should be implemented by the caller
    console.log(`🔄 Operation ${operationId} ready for retry`);

    // Emit retry event for external handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('optimistic:retry', {
        detail: { operationId, operation }
      }));
    }
  }

  /**
   * Apply update to local data store
   */
  private applyUpdateToLocalData(
    entity: string,
    type: OptimisticOperation['type'],
    data: any,
    originalData?: any
  ): void {
    const currentData = this.entityData.get(entity) || [];

    switch (type) {
      case 'CREATE':
        if (Array.isArray(currentData)) {
          this.entityData.set(entity, [...currentData, data]);
        } else {
          this.entityData.set(entity, data);
        }
        break;

      case 'UPDATE':
        if (Array.isArray(currentData)) {
          const updated = currentData.map(item =>
            item.id === data.id ? { ...item, ...data } : item
          );
          this.entityData.set(entity, updated);
        } else {
          this.entityData.set(entity, { ...currentData, ...data });
        }
        break;

      case 'DELETE':
        if (Array.isArray(currentData)) {
          const filtered = currentData.filter(item => item.id !== data.id);
          this.entityData.set(entity, filtered);
        } else {
          this.entityData.delete(entity);
        }
        break;
    }
  }

  /**
   * Revert update from local data store
   */
  private revertUpdateFromLocalData(operation: OptimisticOperation): void {
    const { entity, type, data, originalData } = operation;
    const currentData = this.entityData.get(entity) || [];

    switch (type) {
      case 'CREATE':
        if (Array.isArray(currentData)) {
          const filtered = currentData.filter(item => item.id !== data.id);
          this.entityData.set(entity, filtered);
        } else {
          this.entityData.delete(entity);
        }
        break;

      case 'UPDATE':
        if (originalData) {
          if (Array.isArray(currentData)) {
            const reverted = currentData.map(item =>
              item.id === data.id ? originalData : item
            );
            this.entityData.set(entity, reverted);
          } else {
            this.entityData.set(entity, originalData);
          }
        }
        break;

      case 'DELETE':
        if (originalData) {
          if (Array.isArray(currentData)) {
            this.entityData.set(entity, [...currentData, originalData]);
          } else {
            this.entityData.set(entity, originalData);
          }
        }
        break;
    }
  }

  /**
   * Subscribe to entity data changes
   */
  subscribe(entity: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(entity)) {
      this.subscribers.set(entity, new Set());
    }

    this.subscribers.get(entity)!.add(callback);

    // Return unsubscribe function
    return () => {
      const entitySubscribers = this.subscribers.get(entity);
      if (entitySubscribers) {
        entitySubscribers.delete(callback);
        if (entitySubscribers.size === 0) {
          this.subscribers.delete(entity);
        }
      }
    };
  }

  /**
   * Notify subscribers of data changes
   */
  private notifySubscribers(entity: string): void {
    const subscribers = this.subscribers.get(entity);
    if (subscribers) {
      const data = this.entityData.get(entity);
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Subscriber callback error for ${entity}:`, error);
        }
      });
    }
  }

  /**
   * Get current data for entity
   */
  getData(entity: string): any {
    return this.entityData.get(entity);
  }

  /**
   * Set data for entity (for initial loading)
   */
  setData(entity: string, data: any): void {
    this.entityData.set(entity, data);
    this.notifySubscribers(entity);
  }

  /**
   * Get pending operations for entity
   */
  getPendingOperations(entity?: string): OptimisticOperation[] {
    const operations = Array.from(this.operations.values());

    if (entity) {
      return operations.filter(op => op.entity === entity && op.status === 'PENDING');
    }

    return operations.filter(op => op.status === 'PENDING');
  }

  /**
   * Check if entity has pending operations
   */
  hasPendingOperations(entity: string): boolean {
    return this.getPendingOperations(entity).length > 0;
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & { successRate: number } {
    const successRate = this.stats.totalOperations > 0
      ? (this.stats.confirmedOperations / this.stats.totalOperations) * 100
      : 0;

    return {
      ...this.stats,
      successRate: Math.round(successRate * 100) / 100
    };
  }

  /**
   * Clear all data and operations
   */
  clear(): void {
    this.operations.clear();
    this.subscribers.clear();
    this.entityData.clear();
    this.callbacks.clear();
    this.stats = {
      totalOperations: 0,
      confirmedOperations: 0,
      failedOperations: 0,
      rolledBackOperations: 0
    };
  }

  /**
   * Print statistics for debugging
   */
  printStats(): void {
    const stats = this.getStats();
        console.log(`   Total Operations: ${stats.totalOperations}`);
    console.log(`   Confirmed: ${stats.confirmedOperations}`);
    console.log(`   Failed: ${stats.failedOperations}`);
    console.log(`   Rolled Back: ${stats.rolledBackOperations}`);
    console.log(`   Success Rate: ${stats.successRate}%`);
  }
}

// Singleton instance
export const optimisticUpdates = new OptimisticUpdateManager();

export default OptimisticUpdateManager;
