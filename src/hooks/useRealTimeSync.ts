'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync: Date | null;
  error?: string;
}

export const useRealTimeSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSync: null
  });
  const [isEnabled, setIsEnabled] = useState(true);

  // Simular sincronização
  const forceSync = useCallback(async () => {
    if (!isEnabled) return;

    setSyncStatus(prev => ({ ...prev, status: 'syncing' }));

    try {
      // Simular delay de sincronização
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSyncStatus({
        status: 'success',
        lastSync: new Date(),
        error: undefined
      });
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Erro na sincronização'
      }));
    }
  }, [isEnabled]);

  const enableSync = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disableSync = useCallback(() => {
    setIsEnabled(false);
    setSyncStatus(prev => ({ ...prev, status: 'idle' }));
  }, []);

  // Sincronização automática a cada 30 segundos
  useEffect(() => {
    if (!isEnabled) return;

    const syncFunction = async () => {
      setSyncStatus(prev => ({ ...prev, status: 'syncing' }));

      try {
        // Simular delay de sincronização
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSyncStatus({
          status: 'success',
          lastSync: new Date(),
          error: undefined
        });
      } catch (error) {
        setSyncStatus(prev => ({
          ...prev,
          status: 'error',
          error: 'Erro na sincronização'
        }));
      }
    };

    const interval = setInterval(() => {
      syncFunction();
    }, 30000);

    // Sincronização inicial
    syncFunction();

    return () => clearInterval(interval);
  }, [isEnabled]);

  return {
    status: syncStatus.status,
    lastSync: syncStatus.lastSync,
    error: syncStatus.error,
    isEnabled,
    enableSync,
    disableSync,
    forceSync
  };
};
