'use client';

import { logComponents } from '../logger';
import { getSyncMiddleware, SyncEvent } from '../middleware/sync-middleware';
import { unifiedQueryClient } from '../react-query/unified-query-client';

export interface SSEMessage {
  type: 'transaction' | 'account' | 'investment' | 'goal' | 'system';
  action: 'create' | 'update' | 'delete' | 'sync';
  data?: any;
  timestamp: number;
  userId?: string;
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private listeners: ((message: SSEMessage) => void)[] = [];

  constructor(private baseUrl: string = '/api/sse') {
    this.connect();
  }

  private connect() {
    try {
      logComponents.info('Conectando ao servidor SSE...');
      
      this.eventSource = new EventSource(`${this.baseUrl}/dashboard`);
      
      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logComponents.info('Conexão SSE estabelecida com sucesso');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          logComponents.error('Erro ao processar mensagem SSE:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        this.isConnected = false;
        logComponents.error('Erro na conexão SSE:', error);
        this.handleReconnect();
      };

    } catch (error) {
      logComponents.error('Erro ao criar conexão SSE:', error);
      this.handleReconnect();
    }
  }

  private handleMessage(message: SSEMessage) {
    logComponents.info('Mensagem SSE recebida:', message);

    // Notificar listeners
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        logComponents.error('Erro em listener SSE:', error);
      }
    });

    // Converter para evento de sincronização
    const syncEvent: SyncEvent = {
      type: message.type as any,
      action: message.action,
      entityId: message.data?.id,
      metadata: {
        ...message.data,
        timestamp: message.timestamp,
        source: 'sse'
      }
    };

    // Enviar para middleware de sincronização
    try {
      const syncMiddleware = getSyncMiddleware(unifiedQueryClient);
      syncMiddleware.addSyncEvent(syncEvent);
    } catch (error) {
      logComponents.error('Erro ao processar evento de sincronização:', error);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logComponents.error('Máximo de tentativas de reconexão atingido');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logComponents.info(`Tentativa de reconexão ${this.reconnectAttempts} em ${delay}ms`);
    
    setTimeout(() => {
      this.disconnect();
      this.connect();
    }, delay);
  }

  public addListener(listener: (message: SSEMessage) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      logComponents.info('Conexão SSE desconectada');
    }
  }

  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Instância global do cliente SSE
let globalSSEClient: SSEClient | null = null;

export function getSSEClient(): SSEClient {
  if (!globalSSEClient && typeof window !== 'undefined') {
    globalSSEClient = new SSEClient();
  }
  return globalSSEClient!;
}

export function useSSEClient() {
  return getSSEClient();
}