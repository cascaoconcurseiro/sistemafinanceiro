'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSSEClient, SSEMessage } from '../lib/real-time/sse-client';
import { logComponents } from '../lib/logger';
import { toast } from 'sonner';

export interface RealTimeSyncStatus {
  isConnected: boolean;
  lastUpdate: Date | null;
  messagesReceived: number;
  reconnectAttempts: number;
}

export function useRealTimeSync() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealTimeSyncStatus>({
    isConnected: false,
    lastUpdate: null,
    messagesReceived: 0,
    reconnectAttempts: 0,
  });

  const [isEnabled, setIsEnabled] = useState(true);

  // Função para processar mensagens SSE
  const handleSSEMessage = useCallback((message: SSEMessage) => {
    if (!isEnabled) return;

    logComponents.info('Processando mensagem de sincronização em tempo real:', message);

    // Atualizar status
    setStatus(prev => ({
      ...prev,
      lastUpdate: new Date(),
      messagesReceived: prev.messagesReceived + 1,
    }));

    // Processar diferentes tipos de mensagens
    switch (message.type) {
      case 'transaction':
        handleTransactionUpdate(message);
        break;
      case 'account':
        handleAccountUpdate(message);
        break;
      case 'investment':
        handleInvestmentUpdate(message);
        break;
      case 'goal':
        handleGoalUpdate(message);
        break;
      case 'system':
        handleSystemMessage(message);
        break;
      default:
        logComponents.warn('Tipo de mensagem SSE desconhecido:', message.type);
    }
  }, [isEnabled, queryClient]);

  // Handlers específicos para cada tipo de atualização
  const handleTransactionUpdate = useCallback((message: SSEMessage) => {
    // Invalidar queries relacionadas a transações
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts', 'summary'] });
    queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });

    if (message.action === 'create') {
      toast.success('Nova transação adicionada');
    } else if (message.action === 'update') {
      toast.info('Transação atualizada');
    } else if (message.action === 'delete') {
      toast.info('Transação removida');
    }
  }, [queryClient]);

  const handleAccountUpdate = useCallback((message: SSEMessage) => {
    // Invalidar queries relacionadas a contas
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });

    if (message.action === 'create') {
      toast.success('Nova conta criada');
    } else if (message.action === 'update') {
      toast.info('Conta atualizada');
    }
  }, [queryClient]);

  const handleInvestmentUpdate = useCallback((message: SSEMessage) => {
    // Invalidar queries relacionadas a investimentos
    queryClient.invalidateQueries({ queryKey: ['investments'] });
    queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });

    if (message.action === 'create') {
      toast.success('Novo investimento adicionado');
    } else if (message.action === 'update') {
      toast.info('Investimento atualizado');
    }
  }, [queryClient]);

  const handleGoalUpdate = useCallback((message: SSEMessage) => {
    // Invalidar queries relacionadas a metas
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });

    if (message.action === 'create') {
      toast.success('Nova meta criada');
    } else if (message.action === 'update') {
      toast.info('Meta atualizada');
    }
  }, [queryClient]);

  const handleSystemMessage = useCallback((message: SSEMessage) => {
    if (message.action === 'connect') {
      setStatus(prev => ({ ...prev, isConnected: true }));
      logComponents.info('Sincronização em tempo real ativada');
    } else if (message.action === 'heartbeat') {
      // Atualizar status de conexão
      setStatus(prev => ({ ...prev, isConnected: true }));
    }
  }, []);

  // Configurar cliente SSE
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    try {
      const sseClient = getSSEClient();
      
      // Adicionar listener
      const removeListener = sseClient.addListener(handleSSEMessage);

      // Atualizar status de conexão
      const updateConnectionStatus = () => {
        const connectionStatus = sseClient.getConnectionStatus();
        setStatus(prev => ({
          ...prev,
          isConnected: connectionStatus.isConnected,
          reconnectAttempts: connectionStatus.reconnectAttempts,
        }));
      };

      // Verificar status periodicamente
      const statusInterval = setInterval(updateConnectionStatus, 5000);

      return () => {
        removeListener();
        clearInterval(statusInterval);
      };
    } catch (error) {
      logComponents.error('Erro ao configurar sincronização em tempo real:', error);
    }
  }, [isEnabled, handleSSEMessage]);

  // Funções de controle
  const enableSync = useCallback(() => {
    setIsEnabled(true);
    logComponents.info('Sincronização em tempo real habilitada');
  }, []);

  const disableSync = useCallback(() => {
    setIsEnabled(false);
    setStatus(prev => ({ ...prev, isConnected: false }));
    logComponents.info('Sincronização em tempo real desabilitada');
  }, []);

  const forceSync = useCallback(async () => {
    try {
      // Invalidar todas as queries para forçar refetch
      await queryClient.invalidateQueries();
      toast.success('Dados sincronizados manualmente');
      logComponents.info('Sincronização manual executada');
    } catch (error) {
      toast.error('Erro ao sincronizar dados');
      logComponents.error('Erro na sincronização manual:', error);
    }
  }, [queryClient]);

  return {
    status,
    isEnabled,
    enableSync,
    disableSync,
    forceSync,
  };
}