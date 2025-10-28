import { useEffect, useRef, useState, useCallback } from 'react';
import { EventType, EventTypes } from '@/app/api/events/route';
import { eventEmitter } from '@/lib/events/event-emitter';

interface RealTimeEvent {
  type: EventType;
  data: any;
  timestamp: string;
}

interface UseRealTimeEventsOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enableInDevelopment?: boolean; // Nova opção para controlar em desenvolvimento
}

export function useRealTimeEvents(options: UseRealTimeEventsOptions = {}) {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 3, // Reduzido para evitar spam
    enableInDevelopment = false // Desabilitado por padrão em desenvolvimento
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<RealTimeEvent | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar se deve conectar (não conectar em desenvolvimento por padrão)
  const shouldConnect = useCallback(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    return !isDevelopment || enableInDevelopment;
  }, [enableInDevelopment]);

  // Função para conectar ao SSE
  const connect = useCallback(() => {
    // Não conectar se não deve conectar
    if (!shouldConnect()) {
      console.log('🔇 SSE desabilitado em desenvolvimento. Use enableInDevelopment: true para habilitar.');
      return;
    }

    if (eventSourceRef.current) {
      return; // Já conectado
    }

    try {
      const eventSource = new EventSource('/api/events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('🔗 Conectado ao sistema de eventos em tempo real');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const eventData: RealTimeEvent = JSON.parse(event.data);
          setLastEvent(eventData);

          // Propagar evento através do event emitter local
          eventEmitter.emit(eventData.type, eventData.data, 'server');
          
          console.log('📡 Evento recebido:', eventData.type, eventData.data);
        } catch (error) {
          console.warn('Erro ao processar evento SSE:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.warn('Conexão SSE interrompida (normal em desenvolvimento)');
        setIsConnected(false);
        
        // Fechar conexão atual
        eventSource.close();
        eventSourceRef.current = null;

        // Tentar reconectar apenas se habilitado e não excedeu o limite
        if (shouldConnect() && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Tentativa de reconexão ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('SSE não disponível (normal em desenvolvimento)');
        }
      };

    } catch (error) {
      console.warn('SSE não disponível:', error);
      setConnectionError('SSE não disponível');
    }
  }, [maxReconnectAttempts, reconnectInterval, shouldConnect]);

  // Função para desconectar
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
  };

  // Função para reconectar manualmente
  const reconnect = () => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  };

  // Conectar automaticamente se habilitado
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup na desmontagem
    return () => {
      disconnect();
    };
  }, [autoConnect, connect]);

  // Cleanup de timeouts
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionError,
    lastEvent,
    connect,
    disconnect,
    reconnect,
  };
}

// Hook específico para escutar tipos específicos de eventos
export function useEventListener(
  eventType: EventType,
  callback: (data: any) => void,
  deps: any[] = []
) {
  useEffect(() => {
    const unsubscribe = eventEmitter.on(eventType, (event) => {
      callback(event.data);
    });

    return unsubscribe;
  }, [eventType, callback]);
}

// Hook para escutar múltiplos tipos de eventos
export function useMultipleEventListeners(
  eventHandlers: Record<EventType, (data: any) => void>,
  deps: any[] = []
) {
  useEffect(() => {
    const unsubscribers = Object.entries(eventHandlers).map(([eventType, handler]) => {
      return eventEmitter.on(eventType as EventType, (event) => {
        handler(event.data);
      });
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [eventHandlers]);
}

// Hook para componentes que precisam de atualizações automáticas
export function useAutoRefresh(eventTypes: EventType[], refreshCallback: () => void, deps: any[] = []) {
  useEffect(() => {
    const unsubscribers = eventTypes.map(eventType => {
      return eventEmitter.on(eventType, () => {
        refreshCallback();
      });
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [eventTypes, refreshCallback]);
}
