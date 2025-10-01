/**
 * SISTEMA DE EVENTOS E OBSERVABLES
 * 
 * Garante sincronização em tempo real de todos os dados financeiros
 * sem depender de localStorage ou qualquer armazenamento local.
 */

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

// Tipos de eventos do sistema
export type EventType = 
  | 'data:accounts:fetched'
  | 'data:account:created'
  | 'data:account:updated'
  | 'data:account:deleted'
  | 'data:account:balance:updated'
  | 'data:transactions:fetched'
  | 'data:transaction:created'
  | 'data:transaction:updated'
  | 'data:transaction:deleted'
  | 'data:creditCards:fetched'
  | 'data:creditCard:created'
  | 'data:creditCard:updated'
  | 'data:creditCard:deleted'
  | 'data:budgets:fetched'
  | 'data:budget:created'
  | 'data:budget:updated'
  | 'data:budget:deleted'
  | 'data:all:cleared'
  | 'system:initialized'
  | 'system:error'
  | 'security:storage:blocked'
  | 'ui:refresh:required';

export interface SystemEvent {
  type: EventType;
  data: any;
  timestamp: string;
  source: string;
}

export interface DataState {
  accounts: any[];
  transactions: any[];
  creditCards: any[];
  budgets: any[];
  lastUpdated: string;
  isLoading: boolean;
  errors: string[];
}

class EventBus {
  private static instance: EventBus;
  private eventSubject = new Subject<SystemEvent>();
  private dataStateSubject = new BehaviorSubject<DataState>({
    accounts: [],
    transactions: [],
    creditCards: [],
    budgets: [],
    lastUpdated: new Date().toISOString(),
    isLoading: false,
    errors: []
  });

  private listeners = new Map<EventType, Set<(data: any) => void>>();
  private isInitialized = false;

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Inicializa o sistema de eventos
   */
  public initialize(): void {
    if (this.isInitialized) return;

    // Configura listeners internos para atualizar estado
    this.setupInternalListeners();
    
    this.isInitialized = true;
    console.log('📡 Sistema de eventos inicializado');
    
    this.emit('system:initialized', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emite um evento
   */
  public emit(type: EventType, data: any, source = 'system'): void {
    const event: SystemEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
      source
    };

    // Emite para observables
    this.eventSubject.next(event);

    // Emite para listeners tradicionais
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Erro em listener para ${type}:`, error);
        }
      });
    }

    // Log para auditoria
    console.log(`📡 Evento emitido: ${type}`, data);
  }

  /**
   * Adiciona listener para um tipo de evento
   */
  public on(type: EventType, listener: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(listener);

    // Retorna função para remover listener
    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  /**
   * Remove listener
   */
  public off(type: EventType, listener: (data: any) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  /**
   * Observable para todos os eventos
   */
  public events$(): Observable<SystemEvent> {
    return this.eventSubject.asObservable();
  }

  /**
   * Observable para eventos específicos
   */
  public eventsOfType$(type: EventType): Observable<any> {
    return this.eventSubject.pipe(
      filter(event => event.type === type),
      map(event => event.data)
    );
  }

  /**
   * Observable para estado dos dados
   */
  public dataState$(): Observable<DataState> {
    return this.dataStateSubject.asObservable();
  }

  /**
   * Obtém estado atual dos dados
   */
  public getCurrentDataState(): DataState {
    return this.dataStateSubject.value;
  }

  /**
   * Atualiza estado dos dados
   */
  public updateDataState(updates: Partial<DataState>): void {
    const currentState = this.dataStateSubject.value;
    const newState = {
      ...currentState,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    this.dataStateSubject.next(newState);
    this.emit('ui:refresh:required', newState);
  }

  /**
   * Marca dados como carregando
   */
  public setLoading(isLoading: boolean): void {
    this.updateDataState({ isLoading });
  }

  /**
   * Adiciona erro ao estado
   */
  public addError(error: string): void {
    const currentState = this.dataStateSubject.value;
    const errors = [...currentState.errors, error];
    this.updateDataState({ errors });
  }

  /**
   * Limpa erros
   */
  public clearErrors(): void {
    this.updateDataState({ errors: [] });
  }

  /**
   * Configura listeners internos para atualizar estado
   */
  private setupInternalListeners(): void {
    // Atualiza contas no estado
    this.on('data:accounts:fetched', (data) => {
      this.updateDataState({ accounts: data.accounts || [] });
    });

    this.on('data:account:created', (account) => {
      const currentState = this.getCurrentDataState();
      const accounts = [...currentState.accounts, account];
      this.updateDataState({ accounts });
    });

    this.on('data:account:updated', (updatedAccount) => {
      const currentState = this.getCurrentDataState();
      const accounts = currentState.accounts.map(account => 
        account.id === updatedAccount.id ? updatedAccount : account
      );
      this.updateDataState({ accounts });
    });

    this.on('data:account:deleted', (data) => {
      const currentState = this.getCurrentDataState();
      const accounts = currentState.accounts.filter(account => account.id !== data.id);
      this.updateDataState({ accounts });
    });

    // Atualiza transações no estado
    this.on('data:transactions:fetched', (data) => {
      this.updateDataState({ transactions: data.transactions || [] });
    });

    this.on('data:transaction:created', (transaction) => {
      const currentState = this.getCurrentDataState();
      const transactions = [...currentState.transactions, transaction];
      this.updateDataState({ transactions });
    });

    this.on('data:transaction:updated', (updatedTransaction) => {
      const currentState = this.getCurrentDataState();
      const transactions = currentState.transactions.map(transaction => 
        transaction.id === updatedTransaction.id ? updatedTransaction : transaction
      );
      this.updateDataState({ transactions });
    });

    this.on('data:transaction:deleted', (data) => {
      const currentState = this.getCurrentDataState();
      const transactions = currentState.transactions.filter(transaction => transaction.id !== data.id);
      this.updateDataState({ transactions });
    });

    // Atualiza cartões de crédito no estado
    this.on('data:creditCards:fetched', (data) => {
      this.updateDataState({ creditCards: data.creditCards || [] });
    });

    this.on('data:creditCard:created', (creditCard) => {
      const currentState = this.getCurrentDataState();
      const creditCards = [...currentState.creditCards, creditCard];
      this.updateDataState({ creditCards });
    });

    // Atualiza orçamentos no estado
    this.on('data:budgets:fetched', (data) => {
      this.updateDataState({ budgets: data.budgets || [] });
    });

    this.on('data:budget:created', (budget) => {
      const currentState = this.getCurrentDataState();
      const budgets = [...currentState.budgets, budget];
      this.updateDataState({ budgets });
    });

    // Limpa todos os dados
    this.on('data:all:cleared', () => {
      this.updateDataState({
        accounts: [],
        transactions: [],
        creditCards: [],
        budgets: []
      });
    });

    // Trata erros do sistema
    this.on('system:error', (error) => {
      this.addError(error.message || 'Erro desconhecido');
    });
  }

  /**
   * Força atualização de todos os dados
   */
  public async refreshAllData(): Promise<void> {
    try {
      this.setLoading(true);
      this.clearErrors();
      
      // Emite eventos para forçar recarregamento
      this.emit('ui:refresh:required', { force: true });
      
      console.log('🔄 Forçando atualização de todos os dados...');
    } catch (error) {
      this.emit('system:error', { message: 'Erro ao atualizar dados' });
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Gera relatório de eventos
   */
  public getEventStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    lastEvents: SystemEvent[];
  } {
    // Esta implementação seria expandida para rastrear estatísticas reais
    return {
      totalEvents: 0,
      eventsByType: {},
      lastEvents: []
    };
  }

  /**
   * Limpa todos os listeners e estado
   */
  public reset(): void {
    this.listeners.clear();
    this.dataStateSubject.next({
      accounts: [],
      transactions: [],
      creditCards: [],
      budgets: [],
      lastUpdated: new Date().toISOString(),
      isLoading: false,
      errors: []
    });
    this.isInitialized = false;
  }
}

// Singleton instance
export const eventBus = EventBus.getInstance();
