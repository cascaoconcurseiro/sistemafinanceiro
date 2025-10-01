// =====================================================
// MIDDLEWARE DE SEGURANÇA PARA OPERAÇÕES DE BANCO
// =====================================================

import { Request, Response, NextFunction } from 'express';
import { databaseAuditService } from '../services/database-audit-service';
import { eventSystem } from '../events/event-system';
import { UUID } from '../types/database';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface SecurityContext {
  user_id?: UUID;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_id: string;
  source: 'api' | 'direct' | 'system';
}

interface OperationAttempt {
  context: SecurityContext;
  table_name?: string;
  operation_type?: string;
  timestamp: string;
  blocked: boolean;
  reason?: string;
}

// =====================================================
// CLASSE PRINCIPAL DO MIDDLEWARE
// =====================================================

export class DatabaseSecurityMiddleware {
  private static instance: DatabaseSecurityMiddleware;
  private blockedOperations = new Set<string>();
  private suspiciousIPs = new Map<string, number>();
  private operationCounts = new Map<string, number>();
  private readonly MAX_OPERATIONS_PER_MINUTE = 100;
  private readonly SUSPICIOUS_THRESHOLD = 10;

  public static getInstance(): DatabaseSecurityMiddleware {
    if (!DatabaseSecurityMiddleware.instance) {
      DatabaseSecurityMiddleware.instance = new DatabaseSecurityMiddleware();
    }
    return DatabaseSecurityMiddleware.instance;
  }

  // =====================================================
  // MIDDLEWARE EXPRESS
  // =====================================================

  public createExpressMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const context: SecurityContext = {
        user_id: req.user?.id,
        session_id: req.sessionID,
        ip_address: this.getClientIP(req),
        user_agent: req.get('User-Agent'),
        request_id: this.generateRequestId(),
        source: 'api'
      };

      try {
        // Verificar se o IP está bloqueado
        if (await this.isIPBlocked(context.ip_address)) {
          await this.logSecurityViolation(context, 'blocked_ip', 'IP bloqueado por atividade suspeita');
          return res.status(403).json({ error: 'Acesso negado' });
        }

        // Verificar rate limiting
        if (await this.isRateLimited(context)) {
          await this.logSecurityViolation(context, 'rate_limit', 'Limite de operações excedido');
          return res.status(429).json({ error: 'Muitas requisições' });
        }

        // Verificar autorização para operações de banco
        if (this.isDatabaseOperation(req)) {
          const authorized = await this.checkDatabaseOperationAuth(req, context);
          if (!authorized) {
            await this.logSecurityViolation(context, 'unauthorized_db_operation', 'Operação de banco não autorizada');
            return res.status(403).json({ error: 'Operação não autorizada' });
          }
        }

        // Adicionar contexto de segurança à requisição
        req.securityContext = context;
        
        // Registrar operação
        await this.logOperation(context, req);

        next();
      } catch (error) {
        console.error('Erro no middleware de segurança:', error);
        await this.logSecurityViolation(context, 'middleware_error', `Erro interno: ${error instanceof Error ? error.message : 'Desconhecido'}`);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    };
  }

  // =====================================================
  // INTERCEPTADOR DE OPERAÇÕES DIRETAS
  // =====================================================

  public interceptDirectDatabaseAccess(): void {
    // Interceptar tentativas de acesso direto ao banco
    const originalQuery = require('pg').Client.prototype.query;
    const originalPoolQuery = require('pg').Pool.prototype.query;

    const self = this;

    // Interceptar queries do Client
    require('pg').Client.prototype.query = function(text: string, params?: any[], callback?: Function) {
      const context: SecurityContext = {
        request_id: self.generateRequestId(),
        source: 'direct',
        ip_address: 'localhost',
        user_agent: 'direct_access'
      };

      // Verificar se a operação é autorizada
      if (!self.isAuthorizedDirectAccess(text, context)) {
        const error = new Error('Acesso direto ao banco não autorizado');
        self.logSecurityViolation(context, 'unauthorized_direct_access', `Query bloqueada: ${text}`);
        
        if (callback) {
          callback(error);
          return;
        }
        throw error;
      }

      // Registrar operação autorizada
      self.logOperation(context, { query: text, params });

      return originalQuery.call(this, text, params, callback);
    };

    // Interceptar queries do Pool
    require('pg').Pool.prototype.query = function(text: string, params?: any[], callback?: Function) {
      const context: SecurityContext = {
        request_id: self.generateRequestId(),
        source: 'direct',
        ip_address: 'localhost',
        user_agent: 'pool_access'
      };

      // Verificar se a operação é autorizada
      if (!self.isAuthorizedDirectAccess(text, context)) {
        const error = new Error('Acesso direto ao banco via pool não autorizado');
        self.logSecurityViolation(context, 'unauthorized_pool_access', `Query bloqueada: ${text}`);
        
        if (callback) {
          callback(error);
          return;
        }
        throw error;
      }

      // Registrar operação autorizada
      self.logOperation(context, { query: text, params });

      return originalPoolQuery.call(this, text, params, callback);
    };
  }

  // =====================================================
  // VALIDAÇÕES DE SEGURANÇA
  // =====================================================

  private async isIPBlocked(ip?: string): Promise<boolean> {
    if (!ip) return false;
    
    const suspiciousCount = this.suspiciousIPs.get(ip) || 0;
    return suspiciousCount >= this.SUSPICIOUS_THRESHOLD;
  }

  private async isRateLimited(context: SecurityContext): Promise<boolean> {
    const key = context.ip_address || context.user_id || 'anonymous';
    const currentCount = this.operationCounts.get(key) || 0;
    
    if (currentCount >= this.MAX_OPERATIONS_PER_MINUTE) {
      return true;
    }

    this.operationCounts.set(key, currentCount + 1);
    
    // Resetar contador após 1 minuto
    setTimeout(() => {
      this.operationCounts.delete(key);
    }, 60000);

    return false;
  }

  private isDatabaseOperation(req: Request): boolean {
    // Verificar se a requisição é uma operação de banco
    const databasePaths = [
      '/api/transactions',
      '/api/accounts',
      '/api/users',
      '/api/categories',
      '/api/credit-cards'
    ];

    return databasePaths.some(path => req.path.startsWith(path)) && 
           ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  }

  private async checkDatabaseOperationAuth(req: Request, context: SecurityContext): Promise<boolean> {
    // Verificar se o usuário está autenticado para operações de modificação
    if (!context.user_id && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return false;
    }

    // Verificar se a operação vem de uma fonte autorizada
    const authHeader = req.get('Authorization');
    const apiKey = req.get('X-API-Key');
    
    if (!authHeader && !apiKey) {
      return false;
    }

    // Verificar se há tentativas de bypass
    const bypassAttempts = [
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'direct_query',
      'raw_sql'
    ];

    const requestBody = JSON.stringify(req.body || {});
    const hasBypassAttempt = bypassAttempts.some(attempt => 
      requestBody.toLowerCase().includes(attempt.toLowerCase())
    );

    if (hasBypassAttempt) {
      await this.logSecurityViolation(context, 'bypass_attempt', `Tentativa de bypass detectada: ${requestBody}`);
      return false;
    }

    return true;
  }

  private isAuthorizedDirectAccess(query: string, context: SecurityContext): boolean {
    // Lista de queries autorizadas para acesso direto
    const authorizedPatterns = [
      /^SELECT.*FROM audit_logs/i,
      /^SELECT.*FROM consistency_checks/i,
      /^INSERT INTO audit_logs/i,
      /^INSERT INTO data_integrity_violations/i,
      /^CREATE TABLE IF NOT EXISTS/i,
      /^CREATE INDEX IF NOT EXISTS/i,
      /^CREATE OR REPLACE FUNCTION/i,
      /^DROP TRIGGER IF EXISTS/i,
      /^CREATE TRIGGER/i
    ];

    // Verificar se a query corresponde a um padrão autorizado
    const isAuthorized = authorizedPatterns.some(pattern => pattern.test(query));

    if (!isAuthorized) {
      // Queries não autorizadas são bloqueadas
      console.warn(`🚫 Query direta bloqueada: ${query.substring(0, 100)}...`);
      return false;
    }

    return true;
  }

  // =====================================================
  // LOGGING E AUDITORIA
  // =====================================================

  private async logOperation(context: SecurityContext, operation: any): Promise<void> {
    try {
      await databaseAuditService.executeOperation(
        async () => {
          // Operação de log - não precisa retornar nada
          return Promise.resolve();
        },
        {
          table_name: 'security_operations',
          operation_type: 'SELECT',
          user_id: context.user_id,
          source: context.source,
          metadata: {
            request_id: context.request_id,
            ip_address: context.ip_address,
            user_agent: context.user_agent,
            operation: operation
          }
        }
      );
    } catch (error) {
      console.error('Erro ao registrar operação de segurança:', error);
    }
  }

  private async logSecurityViolation(
    context: SecurityContext, 
    violationType: string, 
    description: string
  ): Promise<void> {
    try {
      // Incrementar contador de atividade suspeita para o IP
      if (context.ip_address) {
        const currentCount = this.suspiciousIPs.get(context.ip_address) || 0;
        this.suspiciousIPs.set(context.ip_address, currentCount + 1);
      }

      // Registrar violação
      const violation = {
        violation_type: violationType,
        severity: 'high' as const,
        description,
        detected_at: new Date().toISOString(),
        resolved: false,
        metadata: {
          context,
          request_id: context.request_id
        }
      };

      // Emitir evento de segurança
      eventSystem.emit('security_violation', violation);

      console.error('🚨 VIOLAÇÃO DE SEGURANÇA:', violation);
    } catch (error) {
      console.error('Erro ao registrar violação de segurança:', error);
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // =====================================================
  // API PÚBLICA
  // =====================================================

  public blockIP(ip: string, reason: string): void {
    this.suspiciousIPs.set(ip, this.SUSPICIOUS_THRESHOLD);
    console.warn(`🚫 IP bloqueado: ${ip} - Razão: ${reason}`);
  }

  public unblockIP(ip: string): void {
    this.suspiciousIPs.delete(ip);
    console.info(`✅ IP desbloqueado: ${ip}`);
  }

  public getBlockedIPs(): string[] {
    return Array.from(this.suspiciousIPs.entries())
      .filter(([, count]) => count >= this.SUSPICIOUS_THRESHOLD)
      .map(([ip]) => ip);
  }

  public getSecurityStats(): {
    blocked_ips: number;
    total_violations: number;
    operations_per_minute: number;
  } {
    return {
      blocked_ips: this.getBlockedIPs().length,
      total_violations: Array.from(this.suspiciousIPs.values()).reduce((sum, count) => sum + count, 0),
      operations_per_minute: Array.from(this.operationCounts.values()).reduce((sum, count) => sum + count, 0)
    };
  }

  public async initialize(): Promise<void> {
    // Interceptar acessos diretos ao banco
    this.interceptDirectDatabaseAccess();
    
    // Configurar limpeza periódica de contadores
    setInterval(() => {
      this.operationCounts.clear();
    }, 60000); // Limpar a cada minuto

    console.log('✅ DatabaseSecurityMiddleware inicializado');
  }
}

// =====================================================
// INSTÂNCIA SINGLETON
// =====================================================

export const databaseSecurityMiddleware = DatabaseSecurityMiddleware.getInstance();

// =====================================================
// EXTENSÃO DO TIPO REQUEST
// =====================================================

declare global {
  namespace Express {
    interface Request {
      securityContext?: SecurityContext;
    }
  }
}
