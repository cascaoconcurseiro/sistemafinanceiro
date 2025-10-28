import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  id: string;
  type: 'transaction' | 'account' | 'goal';
  data: any;
  timestamp: number;
  synced: boolean;
}

interface OfflineStorageState {
  isSupported: boolean;
  pendingSync: OfflineData[];
  isLoading: boolean;
  error: string | null;
}

interface OfflineStorageActions {
  saveOfflineData: (type: OfflineData['type'], data: any) => Promise<void>;
  syncPendingData: () => Promise<void>;
  clearSyncedData: () => Promise<void>;
  getPendingCount: () => number;
}

const DB_NAME = 'SuaGranaOffline';
const DB_VERSION = 1;
const STORE_NAME = 'offlineData';

export function useOfflineStorage(): OfflineStorageState & OfflineStorageActions {
  const [state, setState] = useState<OfflineStorageState>({
    isSupported: false,
    pendingSync: [],
    isLoading: true,
    error: null,
  });

  // Inicializar IndexedDB
  const initDB = useCallback(async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }, []);

  // Carregar dados pendentes
  const loadPendingData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      
      const request = index.getAll(false); // Apenas não sincronizados
      
      return new Promise<OfflineData[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Erro ao carregar dados offline:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao carregar dados offline',
        isLoading: false 
      }));
      return [];
    }
  }, [initDB]);

  // Salvar dados offline
  const saveOfflineData = useCallback(async (
    type: OfflineData['type'], 
    data: any
  ): Promise<void> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const offlineData: OfflineData = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        synced: false,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.add(offlineData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Atualizar estado local
      setState(prev => ({
        ...prev,
        pendingSync: [...prev.pendingSync, offlineData],
      }));

    } catch (error) {
      console.error('Erro ao salvar dados offline:', error);
      throw new Error('Erro ao salvar dados offline');
    }
  }, [initDB]);

  // Sincronizar dados pendentes
  const syncPendingData = useCallback(async (): Promise<void> => {
    try {
      const pendingData = await loadPendingData();
      
      for (const item of pendingData) {
        try {
          // Aqui você implementaria a lógica de sincronização com a API
          // Por exemplo, enviar para o servidor baseado no tipo
          await syncItemWithServer(item);
          
          // Marcar como sincronizado
          const db = await initDB();
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          const updatedItem = { ...item, synced: true };
          await new Promise<void>((resolve, reject) => {
            const request = store.put(updatedItem);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
          
        } catch (error) {
          console.error(`Erro ao sincronizar item ${item.id}:`, error);
          // Continuar com os próximos itens mesmo se um falhar
        }
      }

      // Recarregar dados pendentes
      const updatedPending = await loadPendingData();
      setState(prev => ({
        ...prev,
        pendingSync: updatedPending,
        isLoading: false,
      }));

    } catch (error) {
      console.error('Erro na sincronização:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro na sincronização',
        isLoading: false,
      }));
    }
  }, [initDB, loadPendingData]);

  // Limpar dados sincronizados
  const clearSyncedData = useCallback(async (): Promise<void> => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      
      const request = index.openCursor(true); // Apenas sincronizados
      
      await new Promise<void>((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      console.error('Erro ao limpar dados sincronizados:', error);
    }
  }, [initDB]);

  // Obter contagem de itens pendentes
  const getPendingCount = useCallback((): number => {
    return state.pendingSync.length;
  }, [state.pendingSync.length]);

  // Inicializar ao montar o componente
  useEffect(() => {
    const initialize = async () => {
      try {
        // Verificar suporte ao IndexedDB
        const isSupported = 'indexedDB' in window;
        
        if (!isSupported) {
          setState(prev => ({
            ...prev,
            isSupported: false,
            isLoading: false,
            error: 'IndexedDB não suportado',
          }));
          return;
        }

        // Carregar dados pendentes
        const pendingData = await loadPendingData();
        
        setState(prev => ({
          ...prev,
          isSupported: true,
          pendingSync: pendingData,
          isLoading: false,
        }));

      } catch (error) {
        console.error('Erro na inicialização:', error);
        setState(prev => ({
          ...prev,
          error: 'Erro na inicialização do armazenamento offline',
          isLoading: false,
        }));
      }
    };

    initialize();
  }, [loadPendingData]);

  return {
    ...state,
    saveOfflineData,
    syncPendingData,
    clearSyncedData,
    getPendingCount,
  };
}

// Função auxiliar para sincronizar item com servidor
async function syncItemWithServer(item: OfflineData): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  let endpoint = '';
  let method = 'POST';
  
  switch (item.type) {
    case 'transaction':
      endpoint = `${baseUrl}/transactions`;
      break;
    case 'account':
      endpoint = `${baseUrl}/accounts`;
      break;
    case 'goal':
      endpoint = `${baseUrl}/goals`;
      break;
    default:
      throw new Error(`Tipo não suportado: ${item.type}`);
  }

  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item.data),
  });

  if (!response.ok) {
    throw new Error(`Erro na sincronização: ${response.statusText}`);
  }
}
