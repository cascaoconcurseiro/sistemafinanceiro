// Armazenar conexões ativas de SSE
export const connections = new Set<ReadableStreamDefaultController>();

// Função para enviar eventos para todas as conexões ativas
export function broadcastEvent(eventType: string, data: any) {
  const eventData = `data: ${JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() })}\n\n`;

  connections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(eventData));
    } catch (error) {
      // Remove conexões inválidas
      connections.delete(controller);
    }
  });
}

// Função utilitária para enviar eventos específicos
export const EventTypes = {
  TRANSACTION_CREATED: 'transaction_created',
  TRANSACTION_UPDATED: 'transaction_updated',
  TRANSACTION_DELETED: 'transaction_deleted',
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_UPDATED: 'account_updated',
  ACCOUNT_DELETED: 'account_deleted',
  GOAL_CREATED: 'goal_created',
  GOAL_UPDATED: 'goal_updated',
  GOAL_DELETED: 'goal_deleted',
  TRIP_CREATED: 'trip_created',
  TRIP_UPDATED: 'trip_updated',
  TRIP_DELETED: 'trip_deleted',
  BALANCE_UPDATED: 'balance_updated',
  DASHBOARD_REFRESH: 'dashboard_refresh',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];
