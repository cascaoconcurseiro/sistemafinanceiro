import { NextRequest } from 'next/server';

// Manter conexões ativas
const connections = new Set<ReadableStreamDefaultController>();

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
      // Adicionar conexão ao conjunto
      connections.add(controller);

      // Enviar mensagem inicial
      const initialMessage = {
        type: 'system',
        action: 'connect',
        data: { message: 'Conexão SSE estabelecida' },
        timestamp: Date.now(),
      };

      controller.enqueue(`data: ${JSON.stringify(initialMessage)}\n\n`);

      // Configurar heartbeat para manter conexão viva
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({
            type: 'system',
            action: 'heartbeat',
            timestamp: Date.now(),
          })}\n\n`);
        } catch (error) {
          clearInterval(heartbeat);
          connections.delete(controller);
        }
      }, 30000); // Heartbeat a cada 30 segundos

      // Cleanup quando conexão for fechada
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        connections.delete(controller);
        try {
          controller.close();
        } catch (error) {
          // Conexão já foi fechada
        }
      });
    },
  });

  return new Response(stream, { headers });
}

// Função para broadcast de mensagens para todas as conexões
export function broadcastSSEMessage(message: any) {
  const messageString = `data: ${JSON.stringify(message)}\n\n`;
  
  connections.forEach((controller) => {
    try {
      controller.enqueue(messageString);
    } catch (error) {
      // Remover conexões mortas
      connections.delete(controller);
    }
  });
}

// Função para enviar atualizações de dados específicos
export function notifyDataUpdate(type: string, action: string, data?: any) {
  const message = {
    type,
    action,
    data,
    timestamp: Date.now(),
  };

  broadcastSSEMessage(message);
}