/**
 * 🔍 Financial Audit Service
 * Sistema de auditoria completo para operações financeiras
 */

import { prisma } from '@/lib/prisma';

export interface AuditLogData {
  userId: string;
  entityType: 'transaction' | 'account' | 'invoice' | 'transfer' | 'debt';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REVERT';
  oldValue?: any;
  newValue?: any;
  metadata?: any;
}

export class FinancialAuditService {
  /**
   * Registrar operação financeira
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      // Por enquanto, apenas log no console
      // TODO: Criar tabela FinancialAudit no banco
      console.log('📝 [Audit]', {
        timestamp: new Date().toISOString(),
        ...data
      });

      // Salvar em arquivo de log (opcional)
      if (process.env.NODE_ENV === 'production') {
        // TODO: Implementar salvamento em arquivo ou serviço externo
      }
    } catch (error) {
      console.error('❌ [Audit] Erro ao registrar log:', error);
      // Não falhar a operação por causa de erro de auditoria
    }
  }

  /**
   * Registrar criação de transação
   */
  static async logTransactionCreate(
    userId: string,
    transactionId: string,
    data: any
  ): Promise<void> {
    await this.log({
      userId,
      entityType: 'transaction',
      entityId: transactionId,
      action: 'CREATE',
      newValue: data
    });
  }

  /**
   * Registrar atualização de transação
   */
  static async logTransactionUpdate(
    userId: string,
    transactionId: string,
    oldData: any,
    newData: any
  ): Promise<void> {
    await this.log({
      userId,
      entityType: 'transaction',
      entityId: transactionId,
      action: 'UPDATE',
      oldValue: oldData,
      newValue: newData
    });
  }

  /**
   * Registrar deleção de transação
   */
  static async logTransactionDelete(
    userId: string,
    transactionId: string,
    data: any
  ): Promise<void> {
    await this.log({
      userId,
      entityType: 'transaction',
      entityId: transactionId,
      action: 'DELETE',
      oldValue: data
    });
  }

  /**
   * Registrar reversão de operação
   */
  static async logRevert(
    userId: string,
    entityType: AuditLogData['entityType'],
    entityId: string,
    reason: string
  ): Promise<void> {
    await this.log({
      userId,
      entityType,
      entityId,
      action: 'REVERT',
      metadata: { reason }
    });
  }

  /**
   * Buscar histórico de auditoria
   */
  static async getHistory(
    userId: string,
    entityType?: AuditLogData['entityType'],
    entityId?: string
  ): Promise<any[]> {
    // TODO: Implementar busca no banco quando tabela for criada
    console.log('📊 [Audit] Buscando histórico:', { userId, entityType, entityId });
    return [];
  }

  /**
   * Verificar integridade financeira
   */
  static async checkIntegrity(userId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // 1. Verificar transações órfãs
      const orphanTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          accountId: { not: null },
          deletedAt: null
        },
        include: {
          account: true
        }
      });

      const orphans = orphanTransactions.filter(t => !t.account);
      if (orphans.length > 0) {
        issues.push(`${orphans.length} transações órfãs (sem conta válida)`);
      }

      // 2. Verificar parcelas inconsistentes
      const installmentGroups = await prisma.transaction.groupBy({
        by: ['installmentGroupId'],
        where: {
          userId,
          installmentGroupId: { not: null },
          deletedAt: null
        },
        _count: true
      });

      for (const group of installmentGroups) {
        if (!group.installmentGroupId) continue;

        const installments = await prisma.transaction.findMany({
          where: {
            userId,
            installmentGroupId: group.installmentGroupId,
            deletedAt: null
          }
        });

        // Verificar se todas têm o mesmo valor
        const amounts = installments.map(i => Number(i.amount));
        const uniqueAmounts = [...new Set(amounts)];
        
        if (uniqueAmounts.length > 1) {
          issues.push(`Parcelas inconsistentes no grupo ${group.installmentGroupId}`);
        }
      }

      // 3. Verificar transferências sem par
      const transfers = await prisma.transaction.findMany({
        where: {
          userId,
          isTransfer: true,
          deletedAt: null
        }
      });

      for (const transfer of transfers) {
        if (transfer.transferId) {
          const pair = await prisma.transaction.findUnique({
            where: { id: transfer.transferId }
          });

          if (!pair) {
            issues.push(`Transferência ${transfer.id} sem par`);
          }
        }
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('❌ [Audit] Erro ao verificar integridade:', error);
      return {
        isValid: false,
        issues: ['Erro ao verificar integridade']
      };
    }
  }
}
