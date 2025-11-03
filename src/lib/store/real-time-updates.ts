/**
 * Real-time Updates System
 * 
 * Sistema para atualizações instantâneas na interface,
 * sincronização de estado entre componentes e prevenção de re-renders.
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useFinancialStore } from './financial-store';
import { dataCache } from '@/lib/cache/data-cache-manager';

// Tipos para eventos de atualização
export interface UpdateEvent {
  type: 'create' | 'update' | 'delete' | 'sync';
  entity: 'account' | 'transaction' | 'category' | 'creditCard' | 'budget';
  id: string;
  data?: any;
  timestamp: number;
  source: 'local' | 'remote' | 'cache';
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number | null;
  pendingOperations: number;
  syncInProgress: boolean;
  errors: string[];
}

// Event Emitter para comunicação entre componentes
class UpdateEventEmitter {
  private listeners: Map<string, Set<(event: UpdateEvent) => void>> = new Map();
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingOperations: 0,
    syncInProgress: false,
    errors: [],
  };

  // Emitir evento de atualização
  emit(event: UpdateEvent): void {
    const entityListeners = this.listeners.get(event.entity);
    const allListeners = this.listeners.get('*');

    if (entityListeners) {
      entityListeners.forEach(listener => listener(event));
    }

    if (allListeners) {
      allListeners.forEach(listener => listener(event));
    }

    console.log(`🔄 [RealTimeUpdates] Evento emitido:`, event);
  }

  // Registrar listener para entidade específica
  on(entity: string, listener: (event: UpdateEvent) => void): () => void {
    if (!this.listeners.has(entity)) {
      this.listeners.set(entity, new Set());
    }

    this.listeners.get(entity)!.add(listener);

    // Retornar função de cleanup
    return () => {
      this.listeners.get(entity)?.delete(listener);
    };
  }

  // Registrar listener para status de sincronização
  onSyncStatus(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(listener);

    // Emitir status atual imediatamente
    listener(this.syncStatus);

    return () => {
      this.syncListeners.delete(listener);
    };
  }

  // Atualizar status de sincronização
  updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.syncListeners.forEach(listener => listener(this.syncStatus));
  }

  // Obter status atual
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }
}

// Instância global do event emitter
export const updateEmitter = new UpdateEventEmitter();

// Hook para escutar atualizações de entidades específicas
export function useRealTimeUpdates(entity: string | string[]) {
  const [updates, setUpdates] = useState<UpdateEvent[]>([]);
  const entitiesRef = useRef(Array.isArray(entity) ? entity : [entity]);

  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    entitiesRef.current.forEach(entityName => {
      const cleanup = updateEmitter.on(entityName, (event) => {
        setUpdates(prev => [...prev.slice(-9), event]); // Manter últimos 10 eventos
      });
      cleanupFunctions.push(cleanup);
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  return updates;
}

// Hook para status de sincronização
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(updateEmitter.getSyncStatus());

  useEffect(() => {
    return updateEmitter.onSyncStatus(setStatus);
  }, []);

  return status;
}

// Hook otimizado para prevenir re-renders desnecessários
export function useOptimizedSelector<T>(
  selector: (state: any) => T,
  equalityFn?: (a: T, b: T) => boolean
) {
  const store = useFinancialStore();
  const previousValueRef = useRef<T>();
  const previousSelectorRef = useRef(selector);

  // Verificar se o seletor mudou
  const selectorChanged = previousSelectorRef.current !== selector;
  if (selectorChanged) {
    previousSelectorRef.current = selector;
  }

  const currentValue = useMemo(() => {
    return selector(store);
  }, [store, selector]);

  // Usar função de igualdade customizada ou comparação shallow
  const hasChanged = useMemo(() => {
    if (previousValueRef.current === undefined) return true;
    
    if (equalityFn) {
      return !equalityFn(previousValueRef.current, currentValue);
    }
    
    // Comparação shallow padrão
    return !shallowEqual(previousValueRef.current, currentValue);
  }, [currentValue, equalityFn]);

  if (hasChanged || selectorChanged) {
    previousValueRef.current = currentValue;
  }

  return previousValueRef.current as T;
}

// Comparação shallow para objetos e arrays
function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    
    return true;
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key) || a[key] !== b[key]) return false;
    }
    
    return true;
  }
  
  return false;
}

// Sistema de sincronização automática
export class RealTimeSyncManager {
  private static instance: RealTimeSyncManager;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 30 * 1000; // 30 segundos
  private readonly RETRY_DELAY = 5 * 1000; // 5 segundos
  private retryCount = 0;
  private maxRetries = 3;

  private constructor() {
    this.setupNetworkListeners();
    this.startAutoSync();
  }

  static getInstance(): RealTimeSyncManager {
    if (!RealTimeSyncManager.instance) {
      RealTimeSyncManager.instance = new RealTimeSyncManager();
    }
    return RealTimeSyncManager.instance;
  }

  // Configurar listeners de rede
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('🌐 [RealTimeSync] Conexão restaurada');
      updateEmitter.updateSyncStatus({ 
        isOnline: true,
        errors: [] 
      });
      
      // Sincronizar imediatamente quando voltar online
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('🌐 [RealTimeSync] Conexão perdida');
      updateEmitter.updateSyncStatus({ 
        isOnline: false 
      });
    });

    // Detectar mudanças de visibilidade da página
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        // Sincronizar quando a página voltar a ficar visível
        this.syncAll();
      }
    });
  }

  // Iniciar sincronização automática
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !updateEmitter.getSyncStatus().syncInProgress) {
        this.syncAll();
      }
    }, this.SYNC_INTERVAL);
  }

  // Sincronizar todos os dados
  async syncAll(): Promise<void> {
    if (!navigator.onLine) {
      console.log('🌐 [RealTimeSync] Offline - pulando sincronização');
      return;
    }

    const status = updateEmitter.getSyncStatus();
    if (status.syncInProgress) {
      console.log('🔄 [RealTimeSync] Sincronização já em andamento');
      return;
    }

    updateEmitter.updateSyncStatus({ 
      syncInProgress: true,
      errors: [] 
    });

    try {
      console.log('🔄 [RealTimeSync] Iniciando sincronização completa');

      // Sincronizar dados do cache
      await dataCache.syncPendingData();

      // Sincronizar store
      const store = useFinancialStore.getState();
      await store.syncAll();

      // Emitir eventos de sincronização
      ['account', 'transaction', 'category', 'creditCard', 'budget'].forEach(entity => {
        updateEmitter.emit({
          type: 'sync',
          entity: entity as any,
          id: '*',
          timestamp: Date.now(),
          source: 'remote',
        });
      });

      updateEmitter.updateSyncStatus({
        syncInProgress: false,
        lastSync: Date.now(),
        pendingOperations: 0,
      });

      this.retryCount = 0;
      console.log('✅ [RealTimeSync] Sincronização concluída');

    } catch (error) {
      console.error('❌ [RealTimeSync] Erro na sincronização:', error);

      this.retryCount++;
      const shouldRetry = this.retryCount <= this.maxRetries;

      updateEmitter.updateSyncStatus({
        syncInProgress: false,
        errors: [`Erro na sincronização: ${error}`],
      });

      if (shouldRetry) {
        console.log(`🔄 [RealTimeSync] Tentativa ${this.retryCount}/${this.maxRetries} em ${this.RETRY_DELAY}ms`);
        
        setTimeout(() => {
          this.syncAll();
        }, this.RETRY_DELAY);
      } else {
        console.error('❌ [RealTimeSync] Máximo de tentativas excedido');
        this.retryCount = 0;
      }
    }
  }

  // Sincronizar entidade específica
  async syncEntity(entity: string, id?: string): Promise<void> {
    if (!navigator.onLine) return;

    try {
      const store = useFinancialStore.getState();
      
      switch (entity) {
        case 'account':
          await store.loadAccounts();
          break;
        case 'transaction':
          await store.loadTransactions();
          break;
        case 'category':
          await store.loadCategories();
          break;
        case 'creditCard':
          await store.loadCreditCards();
          break;
        case 'budget':
          await store.loadBudgets();
          break;
      }

      updateEmitter.emit({
        type: 'sync',
        entity: entity as any,
        id: id || '*',
        timestamp: Date.now(),
        source: 'remote',
      });

    } catch (error) {
      console.error(`❌ [RealTimeSync] Erro ao sincronizar ${entity}:`, error);
    }
  }

  // Parar sincronização automática
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Reiniciar sincronização automática
  restartAutoSync(): void {
    this.stopAutoSync();
    this.startAutoSync();
  }
}

// Hook para integração com componentes
export function useRealTimeSync() {
  const syncManager = useMemo(() => RealTimeSyncManager.getInstance(), []);
  const syncStatus = useSyncStatus();

  const syncAll = useCallback(() => {
    syncManager.syncAll();
  }, [syncManager]);

  const syncEntity = useCallback((entity: string, id?: string) => {
    syncManager.syncEntity(entity, id);
  }, [syncManager]);

  return {
    syncStatus,
    syncAll,
    syncEntity,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.syncInProgress,
    lastSync: syncStatus.lastSync,
    errors: syncStatus.errors,
  };
}

// Hook para operações otimistas
export function useOptimisticUpdates() {
  const store = useFinancialStore();

  const performOptimisticUpdate = useCallback(async <T>(
    operation: () => Promise<T>,
    optimisticUpdate: () => void,
    rollback: () => void,
    entity: string,
    id: string
  ): Promise<T> => {
    // Aplicar update otimista
    optimisticUpdate();

    // Emitir evento de atualização local
    updateEmitter.emit({
      type: 'update',
      entity: entity as any,
      id,
      timestamp: Date.now(),
      source: 'local',
    });

    try {
      // Executar operação real
      const result = await operation();

      // Emitir evento de confirmação
      updateEmitter.emit({
        type: 'update',
        entity: entity as any,
        id,
        data: result,
        timestamp: Date.now(),
        source: 'remote',
      });

      return result;

    } catch (error) {
      // Reverter update otimista
      rollback();

      // Emitir evento de erro
      updateEmitter.emit({
        type: 'update',
        entity: entity as any,
        id,
        timestamp: Date.now(),
        source: 'local',
      });

      throw error;
    }
  }, []);

  return { performOptimisticUpdate };
}

// Inicializar sistema de sincronização
if (typeof window !== 'undefined') {
  RealTimeSyncManager.getInstance();
}

// Adicionar import do useState que estava faltando
import { useState } from 'react';