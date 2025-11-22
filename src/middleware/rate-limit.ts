/**
 * RATE LIMITING - Nível Produção
 * 
 * Protege contra:
 * - Ataques de força bruta
 * - DDoS
 * - Abuso de API
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições na janela
}

// Armazenamento em memória (em produção, usar Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Configurações por rota
const rateLimits: Record<string, RateLimitConfig> = {
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 10, // 10 tentativas (aumentado para desenvolvimento)
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3, // 3 registros
  },
  '/api/transactions': {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30, // 30 requisições
  },
  default: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 60, // 60 requisições
  },
};

/**
 * Obtém identificador único do cliente
 */
function getClientId(request: NextRequest): string {
  // Prioridade: IP real > IP do header > fallback
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  // Incluir user agent para melhor identificação
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return `${ip}-${userAgent.substring(0, 50)}`;
}

/**
 * Obtém configuração de rate limit para a rota
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Buscar configuração específica da rota
  for (const [route, config] of Object.entries(rateLimits)) {
    if (pathname.startsWith(route)) {
      return config;
    }
  }

  return rateLimits.default;
}

/**
 * Middleware de rate limiting
 */
export function rateLimit(request: NextRequest): NextResponse | null {
  const clientId = getClientId(request);
  const pathname = request.nextUrl.pathname;
  const config = getRateLimitConfig(pathname);

  const now = Date.now();
  const clientData = requestCounts.get(clientId);

  // Primeira requisição ou janela expirou
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return null; // Permitir
  }

  // Incrementar contador
  clientData.count++;

  // Verificar se excedeu o limite
  if (clientData.count > config.maxRequests) {
    const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);

    if (process.env.NODE_ENV !== 'production') {
    console.warn(`⚠️ [RateLimit] Cliente bloqueado: ${clientId} (${pathname})`);
    }

    return NextResponse.json(
      {
        error: 'Muitas requisições',
        message: `Você excedeu o limite de ${config.maxRequests} requisições. Tente novamente em ${retryAfter} segundos.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString(),
        },
      }
    );
  }

  // Atualizar contador
  requestCounts.set(clientId, clientData);

  return null; // Permitir
}

/**
 * Limpar contadores expirados (executar periodicamente)
 */
export function cleanupExpiredRateLimits() {
  const now = Date.now();
  let cleaned = 0;

  for (const [clientId, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(clientId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    if (process.env.NODE_ENV !== 'production') {
    console.log(`🧹 [RateLimit] Limpou ${cleaned} entradas expiradas`);
    }
  }
}

// Limpar a cada 5 minutos
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);
}

/**
 * Adicionar headers de rate limit na resposta
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const clientId = getClientId(request);
  const pathname = request.nextUrl.pathname;
  const config = getRateLimitConfig(pathname);
  const clientData = requestCounts.get(clientId);

  if (clientData) {
    const remaining = Math.max(0, config.maxRequests - clientData.count);
    
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
  }

  return response;
}
