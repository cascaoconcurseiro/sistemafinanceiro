/**
 * Rate Limiting Middleware
 * Protege APIs contra abuso e ataques DDoS
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Janela de tempo em ms
  maxRequests: number // Máximo de requisições na janela
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    
    // Limpar store periodicamente
    setInterval(() => this.cleanup(), 60000) // A cada minuto
  }

  /**
   * Verifica se requisição está dentro do limite
   */
  check(identifier: string): {
    allowed: boolean
    remaining: number
    resetTime: number
  } {
    const now = Date.now()
    const record = this.store[identifier]

    // Se não existe ou expirou, criar novo
    if (!record || now > record.resetTime) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.config.windowMs,
      }
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: this.store[identifier].resetTime,
      }
    }

    // Incrementar contador
    record.count++

    return {
      allowed: record.count <= this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - record.count),
      resetTime: record.resetTime,
    }
  }

  /**
   * Limpa registros expirados
   */
  private cleanup() {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key]
      }
    })
  }

  /**
   * Reseta limite para um identificador
   */
  reset(identifier: string) {
    delete this.store[identifier]
  }
}

// Configurações padrão por tipo de endpoint
const rateLimiters = {
  // APIs públicas - mais restritivo
  public: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
  }),
  
  // APIs autenticadas - menos restritivo
  authenticated: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 1000,
  }),
  
  // Endpoints de escrita - mais restritivo
  write: new RateLimiter({
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10,
  }),
  
  // Login/Auth - muito restritivo
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5,
  }),
}

/**
 * Extrai identificador da requisição (IP ou user ID)
 */
function getIdentifier(req: NextRequest): string {
  // Tentar pegar user ID do token/session
  const userId = req.headers.get('x-user-id')
  if (userId) return `user:${userId}`
  
  // Fallback para IP
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
  return `ip:${ip}`
}

/**
 * Middleware de rate limiting
 */
export function rateLimit(
  type: keyof typeof rateLimiters = 'public'
) {
  return (req: NextRequest): NextResponse | null => {
    const limiter = rateLimiters[type]
    const identifier = getIdentifier(req)
    
    const result = limiter.check(identifier)
    
    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Você excedeu o limite de requisições. Tente novamente mais tarde.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimiters[type]['config'].maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }
    
    return null // Permitir requisição
  }
}

/**
 * Helper para usar em API routes
 */
export async function checkRateLimit(
  req: NextRequest,
  type: keyof typeof rateLimiters = 'public'
): Promise<NextResponse | null> {
  return rateLimit(type)(req)
}

/**
 * Decorator para proteger API routes
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  type: keyof typeof rateLimiters = 'public'
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await checkRateLimit(req, type)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    return handler(req)
  }
}

// Exportar limiters para uso direto
export { rateLimiters }
