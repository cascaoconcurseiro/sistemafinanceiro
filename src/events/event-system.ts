// =====================================================
// SISTEMA DE EVENTOS E OBSERVERS - TEMPO REAL
// =====================================================

import { SystemEvent, UUID } from '../types/database';

// =====================================================
// TIPOS DE EVENTOS
// =====================================================

export enum EventType {
  // Eventos de usuários
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  
  // Eventos de contas
  ACCOUNT_CREATED = 'account.created',
  ACCOUNT_UPDATED = 'account.updated',
  ACCOUNT_DELETED = 'account.deleted',
  ACCOUNT_BALANCE_CHANGED = 'account.balance_changed',
  
  // Eventos de cartões
  CREDIT_CARD_CREATED = 'credit_card.created',
  CREDIT_CARD_UPDATED = 'credit_card.updated',
  CREDIT_CARD_DELETED = 'credit_card.deleted',
  CREDIT_CARD_BALANCE_CHANGED = 'credit_card.balance_changed',
  
  // Eventos de transações
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_UPDATED = 'transaction.updated',
  TRANSACTION_DELETED = 'transaction.deleted',
  TRANSACTION_CONFIRMED = 'transaction.confirmed',
  
  // Eventos de categorias
  CATEGORY_CREATED = 'category.created',
  CATEGORY_UPDATED = 'category.updated',
  CATEGORY_DELETED = 'category.deleted',
  
  // Eventos de orçamentos
  BUDGET_CREATED = 'budget.created',
  BUDGET_UPDATED = 'budget.updated',
  BUDGET_DELETED = 'budget.deleted',
  BUDGET_EXCEEDED = 'budget.exceeded',
  
  // Eventos de metas
  GOAL_CREATED = 'goal.created',
  GOAL_UPDATED = 'goal.updated',
  GOAL_DELETED = 'goal.deleted',
  GOAL_COMPLETED = 'goal.completed',
  GOAL_DEADLINE_APPROACHING = 'goal.deadline_approaching',
  
  // Eventos de alertas
  ALERT_CREATED = 'alert.created',
  ALERT_TRIGGERED = 'alert.triggered',
  ALERT_READ = 'alert.read',
  ALERT_DISMISSED = 'alert.dismissed',
  
  // Eventos do sistema
  SYSTEM_BACKUP_CREATED = 'system.backup_created',
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_ERROR = 'system.error'
}

// =====================================================
// INTERFACES PARA EVENTOS
// =====================================================

export interface EventPayload {
  [key: string]: any;
}

export interface EventMetadata {
  timestamp: string;
  user_id?: UUID;
  ip_address?: string;
  user_agent?: string;
  source: string;
}

export interface FinancialEvent extends SystemEvent {
  type: EventType;
  payload: EventPayload;
  metadata: EventMetadata;
}

export interface EventSubscription {
  id: string;
  event_type: EventType | EventType[];
  user_id?: UUID; // Para filtrar eventos por usuário
  callback: (event: FinancialEvent) => void | Promise<void>;
  once?: boolean; // Se true, remove após primeira execução
  priority?: number; // Ordem de execução (maior = primeiro)
}

export interface EventFilter {
  user_id?: UUID;
  entity_id?: UUID;
  event_types?: EventType[];
  start_date?: string;
  end_date?: string;
}

// =====================================================
// CLASSE PRINCIPAL DO SISTEMA DE EVENTOS
// =====================================================

export class EventSystem {
  private static instance: EventSystem;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: FinancialEvent[] = [];
  private maxHistorySize: number = 1000;
  private isEnabled: boolean = true;

  private constructor() {
    
  }

  /**
   * Singleton pattern
   */
  public static getInstance(): EventSystem {
    if (!EventSystem.instance) {
      EventSystem.instance = new EventSystem();
    }
    return EventSystem.instance;
  }

  /**
   * Emite um evento para todos os subscribers
   */
  public async emit(
    type: EventType,
    entity: string,
    entity_id: UUID,
    payload: EventPayload = {},
    metadata: Partial<EventMetadata> = {}
  ): Promise<void> {
    if (!this.isEnabled) return;

    const event: FinancialEvent = {
      type,
      entity,
      entity_id,
      user_id: metadata.user_id || payload.user_id,
      data: payload,
      timestamp: new Date().toISOString(),
      payload,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'financial-system',
        ...metadata
      }
    };

    // Adicionar ao histórico
    this.addToHistory(event);

    // Log do evento em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('📡 Evento emitido:', {
        type: event.type,
        entity: event.entity,
        entity_id: event.entity_id,
        user_id: event.user_id
      });
    }

    // Executar callbacks dos subscribers
    await this.executeSubscriptions(event);
  }

  /**
   * Adiciona um subscriber para um ou mais tipos de eventos
   */
  public subscribe(
    eventTypes: EventType | EventType[],
    callback: (event: FinancialEvent) => void | Promise<void>,
    options: {
      user_id?: UUID;
      once?: boolean;
      priority?: number;
    } = {}
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      event_type: eventTypes,
      callback,
      user_id: options.user_id,
      once: options.once || false,
      priority: options.priority || 0
    };

    this.subscriptions.set(subscriptionId, subscription);

    console.log('📝 Nova subscription criada:', {
      id: subscriptionId,
      eventTypes: Array.isArray(eventTypes) ? eventTypes : [eventTypes],
      user_id: options.user_id
    });

    return subscriptionId;
  }

  /**
   * Remove um subscriber
   */
  public unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    if (removed) {
      console.log('🗑️ Subscription removida:', subscriptionId);
    }
    return removed;
  }

  /**
   * Remove todos os subscribers de um usuário
   */
  public unsubscribeUser(userId: UUID): number {
    let removedCount = 0;
    
    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.user_id === userId) {
        this.subscriptions.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🗑️ ${removedCount} subscriptions removidas para usuário ${userId}`);
    }

    return removedCount;
  }

  /**
   * Executa os callbacks dos subscribers para um evento
   */
  private async executeSubscriptions(event: FinancialEvent): Promise<void> {
    const matchingSubscriptions = this.getMatchingSubscriptions(event);
    
    // Ordenar por prioridade (maior primeiro)
    matchingSubscriptions.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const promises = matchingSubscriptions.map(async (subscription) => {
      try {
        await subscription.callback(event);
        
        // Remover subscription se for 'once'
        if (subscription.once) {
          this.subscriptions.delete(subscription.id);
        }
      } catch (error) {
        console.error('❌ Erro ao executar callback de evento:', {
          subscriptionId: subscription.id,
          eventType: event.type,
          error: error instanceof Error ? error.message : error
        });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Encontra subscriptions que correspondem ao evento
   */
  private getMatchingSubscriptions(event: FinancialEvent): EventSubscription[] {
    const matching: EventSubscription[] = [];

    for (const subscription of this.subscriptions.values()) {
      // Verificar tipo de evento
      const eventTypes = Array.isArray(subscription.event_type) 
        ? subscription.event_type 
        : [subscription.event_type];
      
      if (!eventTypes.includes(event.type)) {
        continue;
      }

      // Verificar filtro de usuário
      if (subscription.user_id && subscription.user_id !== event.user_id) {
        continue;
      }

      matching.push(subscription);
    }

    return matching;
  }

  /**
   * Adiciona evento ao histórico
   */
  private addToHistory(event: FinancialEvent): void {
    this.eventHistory.push(event);
    
    // Manter apenas os últimos N eventos
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Busca eventos no histórico
   */
  public getEventHistory(filter: EventFilter = {}): FinancialEvent[] {
    let events = [...this.eventHistory];

    // Filtrar por usuário
    if (filter.user_id) {
      events = events.filter(e => e.user_id === filter.user_id);
    }

    // Filtrar por entidade
    if (filter.entity_id) {
      events = events.filter(e => e.entity_id === filter.entity_id);
    }

    // Filtrar por tipos de evento
    if (filter.event_types && filter.event_types.length > 0) {
      events = events.filter(e => filter.event_types!.includes(e.type));
    }

    // Filtrar por data
    if (filter.start_date) {
      events = events.filter(e => e.timestamp >= filter.start_date!);
    }

    if (filter.end_date) {
      events = events.filter(e => e.timestamp <= filter.end_date!);
    }

    return events.reverse(); // Mais recentes primeiro
  }

  /**
   * Limpa o histórico de eventos
   */
  public clearHistory(): void {
    this.eventHistory = [];
    console.log('🧹 Histórico de eventos limpo');
  }

  /**
   * Habilita/desabilita o sistema de eventos
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🎯 Sistema de eventos ${enabled ? 'habilitado' : 'desabilitado'}`);
  }

  /**
   * Retorna estatísticas do sistema
   */
  public getStats(): {
    subscriptions: number;
    historySize: number;
    isEnabled: boolean;
    eventTypeStats: Record<string, number>;
  } {
    const eventTypeStats: Record<string, number> = {};
    
    for (const event of this.eventHistory) {
      eventTypeStats[event.type] = (eventTypeStats[event.type] || 0) + 1;
    }

    return {
      subscriptions: this.subscriptions.size,
      historySize: this.eventHistory.length,
      isEnabled: this.isEnabled,
      eventTypeStats
    };
  }

  /**
   * Gera ID único para subscription
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =====================================================
// OBSERVERS ESPECÍFICOS PARA ENTIDADES
// =====================================================

/**
 * Observer para mudanças de saldo em contas
 */
export class BalanceObserver {
  private eventSystem: EventSystem;

  constructor() {
    this.eventSystem = EventSystem.getInstance();
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    // Observar transações que afetam saldo
    this.eventSystem.subscribe([
      EventType.TRANSACTION_CREATED,
      EventType.TRANSACTION_UPDATED,
      EventType.TRANSACTION_DELETED
    ], this.handleTransactionChange.bind(this));
  }

  private async handleTransactionChange(event: FinancialEvent): Promise<void> {
    const { payload } = event;
    
    // Emitir evento de mudança de saldo se necessário
    if (payload.account_id) {
      await this.eventSystem.emit(
        EventType.ACCOUNT_BALANCE_CHANGED,
        'account',
        payload.account_id,
        {
          transaction_id: event.entity_id,
          old_balance: payload.old_balance,
          new_balance: payload.new_balance,
          amount: payload.amount
        },
        event.metadata
      );
    }

    if (payload.credit_card_id) {
      await this.eventSystem.emit(
        EventType.CREDIT_CARD_BALANCE_CHANGED,
        'credit_card',
        payload.credit_card_id,
        {
          transaction_id: event.entity_id,
          old_balance: payload.old_balance,
          new_balance: payload.new_balance,
          amount: payload.amount
        },
        event.metadata
      );
    }
  }
}

/**
 * Observer para alertas automáticos
 */
export class AlertObserver {
  private eventSystem: EventSystem;

  constructor() {
    this.eventSystem = EventSystem.getInstance();
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    // Observar mudanças de saldo para alertas
    this.eventSystem.subscribe([
      EventType.ACCOUNT_BALANCE_CHANGED,
      EventType.CREDIT_CARD_BALANCE_CHANGED
    ], this.checkBalanceAlerts.bind(this));

    // Observar orçamentos excedidos
    this.eventSystem.subscribe(
      EventType.TRANSACTION_CREATED,
      this.checkBudgetAlerts.bind(this)
    );
  }

  private async checkBalanceAlerts(event: FinancialEvent): Promise<void> {
    // Implementar lógica de verificação de alertas de saldo
    // Por exemplo: saldo baixo, limite de cartão próximo, etc.
    
    if (event.type === EventType.ACCOUNT_BALANCE_CHANGED) {
      const { new_balance } = event.payload;
      
      if (new_balance < 0) {
        await this.eventSystem.emit(
          EventType.ALERT_TRIGGERED,
          'alert',
          'low_balance_' + event.entity_id,
          {
            alert_type: 'low_balance',
            account_id: event.entity_id,
            current_balance: new_balance,
            message: 'Saldo da conta está negativo'
          },
          event.metadata
        );
      }
    }
  }

  private async checkBudgetAlerts(event: FinancialEvent): Promise<void> {
    // Implementar verificação de orçamento excedido
    // Seria necessário consultar o banco para verificar orçamentos
  }
}

// =====================================================
// INSTÂNCIA GLOBAL E INICIALIZAÇÃO
// =====================================================

// Instância global do sistema de eventos
export const eventSystem = EventSystem.getInstance();

// Observers globais
let balanceObserver: BalanceObserver;
let alertObserver: AlertObserver;

/**
 * Inicializa o sistema de eventos com observers padrão
 */
export function initializeEventSystem(): void {
  
  
  // Inicializar observers
  balanceObserver = new BalanceObserver();
  alertObserver = new AlertObserver();
  
  
}

/**
 * Finaliza o sistema de eventos
 */
export function shutdownEventSystem(): void {
  console.log('🔌 Finalizando sistema de eventos...');
  
  // Limpar subscriptions e histórico
  eventSystem.setEnabled(false);
  eventSystem.clearHistory();
  
  
}

// =====================================================
// UTILITÁRIOS PARA EVENTOS
// =====================================================

/**
 * Cria um evento de auditoria
 */
export async function emitAuditEvent(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  entityId: UUID,
  userId: UUID,
  oldData?: any,
  newData?: any
): Promise<void> {
  await eventSystem.emit(
    `${entity.toLowerCase()}.${action.toLowerCase()}` as EventType,
    entity,
    entityId,
    {
      action,
      old_data: oldData,
      new_data: newData
    },
    {
      user_id: userId,
      source: 'audit-system'
    }
  );
}

/**
 * Cria um wrapper para funções que emitem eventos automaticamente
 */
export function withEvents<T extends (...args: any[]) => any>(
  fn: T,
  eventType: EventType,
  getEventData: (...args: Parameters<T>) => {
    entity: string;
    entity_id: UUID;
    payload?: EventPayload;
    metadata?: Partial<EventMetadata>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const result = await fn(...args);
    
    const { entity, entity_id, payload, metadata } = getEventData(...args);
    await eventSystem.emit(eventType, entity, entity_id, payload, metadata);
    
    return result;
  }) as T;
}
