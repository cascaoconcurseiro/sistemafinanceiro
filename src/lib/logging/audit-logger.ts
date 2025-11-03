/**
 * 📋 SISTEMA DE AUDITORIA
 *
 * Registra todas as operações críticas do sistema para rastreabilidade
 */

import { prisma } from '@/lib/prisma';

export interface AuditEventData {
  userId?: string;
  tableName: string;
  recordId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditLogger {

  /**
   * Registra um evento de auditoria
   */
  async logEvent(data: AuditEventData): Promise<void> {
    try {
      await prisma.auditEvent.create({
        data: {
          userId: data.userId,
          tableName: data.tableName,
          recordId: data.recordId,
          operation: data.operation,
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Erro ao registrar evento de auditoria:', error);
      // Não falhar a operação principal por causa da auditoria
    }
  }

  /**
   * Registra criação de transação
   */
  async logTransactionCreated(
    userId: string,
    transactionId: string,
    transactionData: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      tableName: 'Transaction',
      recordId: transactionId,
      operation: 'CREATE',
      newValues: transactionData,
      ipAddress,
      userAgent,
      metadata: {
        type: 'financial_transaction',
        amount: transactionData.amount,
        accountId: transactionData.accountId
      }
    });
  }

  /**
   * Registra atualização de transação
   */
  async logTransactionUpdated(
    userId: string,
    transactionId: string,
    oldData: any,
    newData: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      tableName: 'Transaction',
      recordId: transactionId,
      operation: 'UPDATE',
      oldValues: oldData,
      newValues: newData,
      ipAddress,
      userAgent,
      metadata: {
        type: 'financial_transaction_update',
        amountChanged: oldData.amount !== newData.amount
      }
    });
  }

  /**
   * Registra exclusão de transação
   */
  async logTransactionDeleted(
    userId: string,
    transactionId: string,
    transactionData: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      tableName: 'Transaction',
      recordId: transactionId,
      operation: 'DELETE',
      oldValues: transactionData,
      ipAddress,
      userAgent,
      metadata: {
        type: 'financial_transaction_deletion',
        amount: transactionData.amount,
        accountId: transactionData.accountId
      }
    });
  }

  /**
   * Registra login de usuário
   */
  async logUserLogin(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      tableName: 'User',
      recordId: userId,
      operation: 'READ',
      ipAddress,
      userAgent,
      metadata: {
        type: 'user_login',
        email
      }
    });
  }

  /**
   * Registra tentativa de login falhada
   */
  async logFailedLogin(
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      tableName: 'User',
      recordId: 'unknown',
      operation: 'READ',
      ipAddress,
      userAgent,
      metadata: {
        type: 'failed_login',
        email,
        reason
      }
    });
  }

  /**
   * Registra criação de conta
   */
  async logAccountCreated(
    userId: string,
    accountId: string,
    accountData: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      tableName: 'Account',
      recordId: accountId,
      operation: 'CREATE',
      newValues: accountData,
      ipAddress,
      userAgent,
      metadata: {
        type: 'account_creation',
        accountType: accountData.type
      }
    });
  }

  /**
   * Busca eventos de auditoria por usuário
   */
  async getUserAuditEvents(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      return await prisma.auditEvent.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          tableName: true,
          recordId: true,
          operation: true,
          timestamp: true,
          metadata: true,
          ipAddress: true
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar eventos de auditoria:', error);
      return [];
    }
  }

  /**
   * Busca eventos de auditoria por tabela
   */
  async getTableAuditEvents(
    tableName: string,
    recordId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      return await prisma.auditEvent.findMany({
        where: {
          tableName,
          ...(recordId && { recordId })
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar eventos de auditoria da tabela:', error);
      return [];
    }
  }

  /**
   * Gera relatório de auditoria
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<{
    totalEvents: number;
    eventsByOperation: Record<string, number>;
    eventsByTable: Record<string, number>;
    suspiciousActivities: any[];
  }> {
    try {
      const whereClause: any = {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      };

      if (userId) {
        whereClause.userId = userId;
      }

      const events = await prisma.auditEvent.findMany({
        where: whereClause,
        select: {
          operation: true,
          tableName: true,
          timestamp: true,
          ipAddress: true,
          userId: true,
          metadata: true
        }
      });

      const eventsByOperation: Record<string, number> = {};
      const eventsByTable: Record<string, number> = {};
      const suspiciousActivities: any[] = [];

      events.forEach(event => {
        // Contar por operação
        eventsByOperation[event.operation] = (eventsByOperation[event.operation] || 0) + 1;

        // Contar por tabela
        eventsByTable[event.tableName] = (eventsByTable[event.tableName] || 0) + 1;

        // Detectar atividades suspeitas
        const metadata = event.metadata ? JSON.parse(event.metadata) : {};

        // Múltiplas transações em pouco tempo
        if (event.tableName === 'Transaction' && event.operation === 'CREATE') {
          // Lógica para detectar atividades suspeitas pode ser expandida aqui
        }
      });

      return {
        totalEvents: events.length,
        eventsByOperation,
        eventsByTable,
        suspiciousActivities
      };

    } catch (error) {
      console.error('❌ Erro ao gerar relatório de auditoria:', error);
      return {
        totalEvents: 0,
        eventsByOperation: {},
        eventsByTable: {},
        suspiciousActivities: []
      };
    }
  }
}

export const auditLogger = new AuditLogger();
