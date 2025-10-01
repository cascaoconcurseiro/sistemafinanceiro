import { NextRequest, NextResponse } from 'next/server';

// Armazenar conexões ativas de SSE
const connections = new Set<ReadableStreamDefaultController>();

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

// Endpoint para Server-Sent Events
export async function GET(request: NextRequest) {
  // Configurar headers para SSE
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Criar stream para SSE
  const stream = new ReadableStream({
    start(controller) {
      // Adicionar conexão ao conjunto de conexões ativas
      connections.add(controller);

      // Enviar evento inicial de conexão
      const initialEvent = `data: ${JSON.stringify({ 
        type: 'connection', 
        data: { message: 'Conectado ao sistema de eventos em tempo real' },
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(initialEvent));

      // Configurar heartbeat para manter conexão viva
      const heartbeat = setInterval(() => {
        try {
          const heartbeatEvent = `data: ${JSON.stringify({ 
            type: 'heartbeat', 
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          controller.enqueue(new TextEncoder().encode(heartbeatEvent));
        } catch (error) {
          clearInterval(heartbeat);
          connections.delete(controller);
        }
      }, 30000); // Heartbeat a cada 30 segundos

      // Cleanup quando conexão é fechada
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        connections.delete(controller);
        try {
          controller.close();
        } catch (error) {
          // Conexão já fechada
        }
      });
    },
    
    cancel() {
      // Cleanup quando stream é cancelado
      connections.delete(this as any);
    }
  });

  return new NextResponse(stream, { headers });
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
