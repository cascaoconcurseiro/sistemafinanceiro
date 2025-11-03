/**
 * 🔧 JOB DE MANUTENÇÃO AUTOMÁTICA
 * Executa tarefas de limpeza e reconciliação periodicamente
 */

import { prisma } from '@/lib/prisma';
import { BasicAuditService } from '@/lib/services/audit-service-basic';

export class MaintenanceJob {

  /**
   * Reconcilia saldos das contas
   */
  static async reconcileAccountBalances(): Promise<{
    updated: number;
    total: number;
  }> {
    
    const accounts = await prisma.account.findMany({
      where: { deletedAt: null },
      include: {
        transactions: {
          where: { deletedAt: null }
        }
      }
    });

    let updatedCount = 0;

    for (const account of accounts) {
      const calculatedBalance = account.transactions.reduce((sum, transaction) => {
        const amount = Number(transaction.amount);
        if (transaction.type === 'income') {
          return sum + amount;
        } else if (transaction.type === 'expense') {
          return sum - Math.abs(amount);
        }
        return sum;
      }, 0);

      const currentStoredBalance = Number(account.reconciledBalance || 0);
      const difference = Math.abs(calculatedBalance - currentStoredBalance);

      if (difference > 0.01) {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            reconciledBalance: calculatedBalance,
            updatedAt: new Date()
          }
        });

        await BasicAuditService.logAccount('UPDATE', 'system', account.id, {
          action: 'balance_reconciliation',
          oldBalance: currentStoredBalance,
          newBalance: calculatedBalance,
          difference
        });

        updatedCount++;
      }
    }

    console.log(`✅ [Maintenance] Reconciliação concluída: ${updatedCount}/${accounts.length} contas atualizadas`);

    return {
      updated: updatedCount,
      total: accounts.length
    };
  }

  /**
   * Remove transações duplicadas
   */
  static async cleanDuplicateTransactions(): Promise<{
    removed: number;
    groups: number;
  }> {
    console.log('🧹 [Maintenance] Limpando transações duplicadas...');

    const allTransactions = await prisma.transaction.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' }
    });

    const transactionGroups: Record<string, any[]> = {};

    allTransactions.forEach(transaction => {
      const dateKey = new Date(transaction.date).toISOString().split('T')[0];
      const key = `${transaction.description}-${transaction.amount}-${dateKey}-${transaction.accountId}`;

      if (!transactionGroups[key]) {
        transactionGroups[key] = [];
      }
      transactionGroups[key].push(transaction);
    });

    const duplicateGroups = Object.values(transactionGroups).filter(group => group.length > 1);
    let totalRemoved = 0;

    for (const group of duplicateGroups) {
      const [keep, ...remove] = group;

      for (const transaction of remove) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });

        await BasicAuditService.logTransaction('DELETE', 'system', transaction.id, {
          action: 'duplicate_cleanup',
          reason: 'Duplicate transaction removed by maintenance job',
          keptTransactionId: keep.id
        });

        totalRemoved++;
      }
    }

    console.log(`✅ [Maintenance] Duplicatas removidas: ${totalRemoved} em ${duplicateGroups.length} grupos`);

    return {
      removed: totalRemoved,
      groups: duplicateGroups.length
    };
  }

  /**
   * Desativa categorias órfãs não essenciais
   */
  static async cleanOrphanCategories(): Promise<{
    deactivated: number;
    kept: number;
  }> {
    console.log('🧹 [Maintenance] Limpando categorias órfãs...');

    const allCategories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            transactions: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    const orphanCategories = allCategories.filter(category =>
      category._count.transactions === 0
    );

    const essentialCategories = [
      'alimentação', 'transporte', 'moradia', 'saúde', 'educação',
      'lazer', 'outros', 'salário', 'freelance', 'investimentos'
    ];

    let deactivatedCount = 0;
    let keptCount = 0;

    for (const category of orphanCategories) {
      const isEssential = essentialCategories.some(essential =>
        category.name.toLowerCase().includes(essential.toLowerCase())
      );

      if (isEssential) {
        keptCount++;
      } else {
        await prisma.category.update({
          where: { id: category.id },
          data: {
            isActive: false,
            updatedAt: new Date()
          }
        });

        await BasicAuditService.log({
          action: 'CATEGORY_DEACTIVATE',
          userId: 'system',
          entityType: 'category',
          entityId: category.id,
          details: {
            action: 'orphan_cleanup',
            reason: 'Category has no transactions',
            categoryName: category.name
          }
        });

        deactivatedCount++;
      }
    }

    console.log(`✅ [Maintenance] Categorias órfãs: ${deactivatedCount} desativadas, ${keptCount} mantidas`);

    return {
      deactivated: deactivatedCount,
      kept: keptCount
    };
  }

  /**
   * Executa todas as tarefas de manutenção
   */
  static async runFullMaintenance(): Promise<{
    balances: { updated: number; total: number };
    duplicates: { removed: number; groups: number };
    categories: { deactivated: number; kept: number };
    executedAt: Date;
  }> {
    
    const startTime = new Date();

    try {
      const balances = await this.reconcileAccountBalances();
      const duplicates = await this.cleanDuplicateTransactions();
      const categories = await this.cleanOrphanCategories();

      const result = {
        balances,
        duplicates,
        categories,
        executedAt: startTime
      };

      await BasicAuditService.log({
        action: 'MAINTENANCE_COMPLETED',
        userId: 'system',
        entityType: 'system',
        details: result
      });

      
      return result;
    } catch (error) {
      console.error('❌ [Maintenance] Erro durante manutenção:', error);

      await BasicAuditService.log({
        action: 'MAINTENANCE_FAILED',
        userId: 'system',
        entityType: 'system',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          executedAt: startTime
        }
      });

      throw error;
    }
  }
}
