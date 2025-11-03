/**
 * 🔍 SERVIÇO DE AUDITORIA BÁSICO
 * Sistema simples de logs de auditoria para rastrear ações críticas
 */

import { prisma } from '@/lib/prisma';

export interface AuditLogEntry {
  action: string;
  userId: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class BasicAuditService {
  /**
   * Registra uma ação de auditoria
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Verificar se a tabela de auditoria existe
      const auditLogExists = await prisma.$queryRaw`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='audit_logs'
      `;

      if (!auditLogExists || (Array.isArray(auditLogExists) && auditLogExists.length === 0)) {
        console.warn('⚠️ Tabela audit_logs não existe. Criando log em arquivo...');
        await this.logToFile(entry);
        return;
      }

      // Tentar inserir no banco
      await prisma.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId,
          entity_type: entry.entityType,
          entity_id: entry.entityId,
          details: entry.details ? JSON.stringify(entry.details) : null,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          createdAt: new Date()
        }
      });

      console.log(`✅ [AUDIT] ${entry.action} - ${entry.entityType}:${entry.entityId}`);
    } catch (error) {
      console.error('❌ [AUDIT] Erro ao registrar log:', error);
      // Fallback para arquivo
      await this.logToFile(entry);
    }
  }

  /**
   * Fallback: Log em arquivo quando banco não está disponível
   */
  private static async logToFile(entry: AuditLogEntry): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');

      const logDir = './logs';
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, 'audit.log');
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...entry
      };

      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
      console.log(`📝 [AUDIT FILE] ${entry.action} logged to file`);
    } catch (error) {
      console.error('❌ [AUDIT FILE] Erro ao escrever arquivo:', error);
    }
  }

  /**
   * Logs específicos para transações
   */
  static async logTransaction(action: 'CREATE' | 'UPDATE' | 'DELETE', userId: string, transactionId: string, details?: any): Promise<void> {
    await this.log({
      action: `TRANSACTION_${action}`,
      userId,
      entityType: 'transaction',
      entityId: transactionId,
      details
    });
  }

  /**
   * Logs específicos para contas
   */
  static async logAccount(action: 'CREATE' | 'UPDATE' | 'DELETE', userId: string, accountId: string, details?: any): Promise<void> {
    await this.log({
      action: `ACCOUNT_${action}`,
      userId,
      entityType: 'account',
      entityId: accountId,
      details
    });
  }

  /**
   * Logs de autenticação
   */
  static async logAuth(action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN', userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      action: `AUTH_${action}`,
      userId,
      entityType: 'user',
      entityId: userId,
      ipAddress,
      userAgent
    });
  }

  /**
   * Logs de segurança
   */
  static async logSecurity(action: string, userId: string, details?: any, ipAddress?: string): Promise<void> {
    await this.log({
      action: `SECURITY_${action}`,
      userId,
      entityType: 'security',
      details,
      ipAddress
    });
  }

  /**
   * Buscar logs de auditoria
   */
  static async getLogs(filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    try {
      const where: any = {};

      if (filters?.userId) where.user_id = filters.userId;
      if (filters?.action) where.action = { contains: filters.action };
      if (filters?.entityType) where.entity_type = filters.entityType;
      if (filters?.startDate || filters?.endDate) {
        where.created_at = {};
        if (filters.startDate) where.created_at.gte = filters.startDate;
        if (filters.endDate) where.created_at.lte = filters.endDate;
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: filters?.limit || 100
      });

      return logs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null
      }));
    } catch (error) {
      console.error('❌ [AUDIT] Erro ao buscar logs:', error);
      return [];
    }
  }

  /**
   * Estatísticas de auditoria
   */
  static async getStats(userId?: string): Promise<{
    totalLogs: number;
    logsByAction: Record<string, number>;
    logsByDay: Record<string, number>;
  }> {
    try {
      const where = userId ? { user_id: userId } : {};

      const totalLogs = await prisma.auditLog.count({ where });

      // Logs por ação (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentLogs = await prisma.auditLog.findMany({
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          action: true,
          createdAt: true
        }
      });

      const logsByAction: Record<string, number> = {};
      const logsByDay: Record<string, number> = {};

      recentLogs.forEach(log => {
        // Contar por ação
        logsByAction[log.action] = (logsByAction[log.action] || 0) + 1;

        // Contar por dia
        const day = log.created_at.toISOString().split('T')[0];
        logsByDay[day] = (logsByDay[day] || 0) + 1;
      });

      return {
        totalLogs,
        logsByAction,
        logsByDay
      };
    } catch (error) {
      console.error('❌ [AUDIT] Erro ao buscar estatísticas:', error);
      return {
        totalLogs: 0,
        logsByAction: {},
        logsByDay: {}
      };
    }
  }
}

// Middleware para auditoria automática
export function withAudit<T extends (...args: any[]) => any>(
  fn: T,
  action: string,
  entityType: string
): T {
  return (async (...args: any[]) => {
    const result = await fn(...args);

    // Tentar extrair userId do contexto ou argumentos
    const userId = args.find(arg => arg?.userId) || 'system';
    const entityId = result?.id || args.find(arg => arg?.id);

    await BasicAuditService.log({
      action,
      userId,
      entityType,
      entityId,
      details: { args: args.slice(0, 2) } // Primeiros 2 argumentos apenas
    });

    return result;
  }) as T;
}
