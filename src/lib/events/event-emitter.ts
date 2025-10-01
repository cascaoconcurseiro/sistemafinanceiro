import { EventType, EventTypes } from '@/app/api/events/route';

// Interface para eventos do sistema
interface SystemEvent {
  type: EventType;
  data: any;
  timestamp: string;
  source: 'client' | 'server';
}

// Classe para gerenciar eventos do sistema
class EventEmitter {
  private listeners: Map<EventType, Set<(event: SystemEvent) => void>> = new Map();
  private eventHistory: SystemEvent[] = [];
  private maxHistorySize = 100;

  // Registrar listener para um tipo de evento
  on(eventType: EventType, callback: (event: SystemEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
    
    // Retorna função para remover o listener
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  // Emitir evento
  emit(eventType: EventType, data: any, source: 'client' | 'server' = 'client'): void {
    const event: SystemEvent = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      source
    };

    // Adicionar ao histórico
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notificar listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Erro ao processar evento ${eventType}:`, error);
        }
      });
    }

    // Log do evento para debug
    console.log(`🔄 Evento emitido: ${eventType}`, { data, source, timestamp: event.timestamp });
  }

  // Remover todos os listeners de um tipo de evento
  off(eventType: EventType): void {
    this.listeners.delete(eventType);
  }

  // Remover todos os listeners
  removeAllListeners(): void {
    this.listeners.clear();
  }

  // Obter histórico de eventos
  getEventHistory(eventType?: EventType): SystemEvent[] {
    if (eventType) {
      return this.eventHistory.filter(event => event.type === eventType);
    }
    return [...this.eventHistory];
  }

  // Limpar histórico
  clearHistory(): void {
    this.eventHistory = [];
  }
}

// Instância singleton do event emitter
export const eventEmitter = new EventEmitter();

// Hook para usar eventos em componentes React
export function useEventListener(
  eventType: EventType, 
  callback: (event: SystemEvent) => void,
  deps: any[] = []
) {
  const { useEffect } = require('react');
  
  useEffect(() => {
    const unsubscribe = eventEmitter.on(eventType, callback);
    return unsubscribe;
  }, [eventType, callback]); // Removendo spread element
}

// Funções utilitárias para eventos específicos
export const EventEmitters = {
  // Eventos de transações
  transactionCreated: (transaction: any) => 
    eventEmitter.emit(EventTypes.TRANSACTION_CREATED, transaction),
  
  transactionUpdated: (transaction: any) => 
    eventEmitter.emit(EventTypes.TRANSACTION_UPDATED, transaction),
  
  transactionDeleted: (transactionId: string) => 
    eventEmitter.emit(EventTypes.TRANSACTION_DELETED, { id: transactionId }),

  // Eventos de contas
  accountCreated: (account: any) => 
    eventEmitter.emit(EventTypes.ACCOUNT_CREATED, account),
  
  accountUpdated: (account: any) => 
    eventEmitter.emit(EventTypes.ACCOUNT_UPDATED, account),
  
  accountDeleted: (accountId: string) => 
    eventEmitter.emit(EventTypes.ACCOUNT_DELETED, { id: accountId }),

  // Eventos de metas
  goalCreated: (goal: any) => 
    eventEmitter.emit(EventTypes.GOAL_CREATED, goal),
  
  goalUpdated: (goal: any) => 
    eventEmitter.emit(EventTypes.GOAL_UPDATED, goal),
  
  goalDeleted: (goalId: string) => 
    eventEmitter.emit(EventTypes.GOAL_DELETED, { id: goalId }),

  // Eventos de viagens
  tripCreated: (trip: any) => 
    eventEmitter.emit(EventTypes.TRIP_CREATED, trip),
  
  tripUpdated: (trip: any) => 
    eventEmitter.emit(EventTypes.TRIP_UPDATED, trip),
  
  tripDeleted: (tripId: string) => 
    eventEmitter.emit(EventTypes.TRIP_DELETED, { id: tripId }),

  // Eventos de sistema
  balanceUpdated: (balanceData: any) => 
    eventEmitter.emit(EventTypes.BALANCE_UPDATED, balanceData),
  
  dashboardRefresh: () => 
    eventEmitter.emit(EventTypes.DASHBOARD_REFRESH, { timestamp: new Date().toISOString() }),
};

export { EventTypes } from '@/app/api/events/route';
