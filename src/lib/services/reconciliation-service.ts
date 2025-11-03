/**
 * SERVIÇO DE CONCILIAÇÃO BANCÁRIA
 * Compara saldo do sistema com saldo real do banco
 */

import { prisma } from '@/lib/prisma';

export class ReconciliationService {
  /**
   * Inicia conciliação bancária
   */
  static async startReconciliation(
    accountId: string,
    userId: string,
    bankBalance: number,
    date: Date = new Date()
  ) {
    // Buscar saldo do sistema
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new Error('Conta não encontrada');
    }

    if (account.userId !== userId) {
      throw new Error('Conta não pertence ao usuário');
    }

    const systemBalance = Number(account.balance);
    const difference = bankBalance - systemBalance;

    // Criar registro de conciliação
    const reconciliation = await prisma.bankReconciliation.create({
      data: {
        accountId,
        userId,
        date,
        bankBalance,
        systemBalance,
        difference,
        status: Math.abs(difference) < 0.01 ? 'reconciled' : 'pending'
      }
    });

    console.log(`🏦 Conciliação iniciada:`);
    console.log(`   Saldo Banco: R$ ${bankBalance.toFixed(2)}`);
    console.log(`   Saldo Sistema: R$ ${systemBalance.toFixed(2)}`);
    console.log(`   Diferença: R$ ${difference.toFixed(2)}`);

    return reconciliation;
  }

  /**
   * Ajusta saldo com transação de ajuste
   */
  static async adjustBalance(
    reconciliationId: string,
    userId: string,
    adjustedBy: string,
    notes?: string
  ) {
    const reconciliation = await prisma.bankReconciliation.findUnique({
      where: { id: reconciliationId }
    });

    if (!reconciliation) {
      throw new Error('Conciliação não encontrada');
    }

    if (reconciliation.status === 'reconciled') {
      throw new Error('Conciliação já foi reconciliada');
    }

    const difference = Number(reconciliation.difference);

    if (Math.abs(difference) < 0.01) {
      // Sem diferença, apenas marcar como reconciliado
      return await prisma.bankReconciliation.update({
        where: { id: reconciliationId },
        data: {
          status: 'reconciled',
          reconciledAt: new Date(),
          reconciledBy: adjustedBy,
          notes
        }
      });
    }

    // Criar transação de ajuste
    return await prisma.$transaction(async (tx) => {
      const adjustment = await tx.transaction.create({
        data: {
          userId,
          accountId: reconciliation.accountId,
          amount: difference,
          type: difference > 0 ? 'RECEITA' : 'DESPESA',
          description: `Ajuste de Conciliação Bancária${notes ? `: ${notes}` : ''}`,
          date: reconciliation.date,
          status: 'cleared',
          createdBy: adjustedBy
        }
      });

      // Atualizar saldo da conta
      const account = await tx.account.findUnique({
        where: { id: reconciliation.accountId }
      });

      const newBalance = Number(account!.balance) + difference;

      await tx.account.update({
        where: { id: reconciliation.accountId },
        data: { balance: newBalance }
      });

      // Marcar conciliação como ajustada
      await tx.bankReconciliation.update({
        where: { id: reconciliationId },
        data: {
          status: 'adjusted',
          reconciledAt: new Date(),
          reconciledBy: adjustedBy,
          adjustmentId: adjustment.id,
          notes
        }
      });

      console.log(`✅ Ajuste criado: R$ ${difference.toFixed(2)}`);
      console.log(`   Novo saldo: R$ ${newBalance.toFixed(2)}`);

      return { reconciliation, adjustment };
    });
  }

  /**
   * Marca transações como reconciliadas
   */
  static async markTransactionsReconciled(
    accountId: string,
    userId: string,
    untilDate: Date
  ) {
    const result = await prisma.transaction.updateMany({
      where: {
        accountId,
        userId,
        date: { lte: untilDate },
        isReconciled: false,
        deletedAt: null
      },
      data: {
        isReconciled: true,
        reconciledAt: new Date()
      }
    });

    console.log(`✅ ${result.count} transações marcadas como reconciliadas`);

    return result.count;
  }

  /**
   * Busca transações não reconciliadas
   */
  static async getUnreconciledTransactions(accountId: string, userId: string) {
    return await prisma.transaction.findMany({
      where: {
        accountId,
        userId,
        isReconciled: false,
        deletedAt: null
      },
      orderBy: { date: 'asc' }
    });
  }

  /**
   * Histórico de conciliações
   */
  static async getReconciliationHistory(
    accountId: string,
    userId: string,
    limit: number = 10
  ) {
    return await prisma.bankReconciliation.findMany({
      where: {
        accountId,
        userId
      },
      orderBy: { date: 'desc' },
      take: limit
    });
  }

  /**
   * Estatísticas de conciliação
   */
  static async getReconciliationStats(accountId: string, userId: string) {
    const total = await prisma.bankReconciliation.count({
      where: { accountId, userId }
    });

    const reconciled = await prisma.bankReconciliation.count({
      where: { accountId, userId, status: 'reconciled' }
    });

    const adjusted = await prisma.bankReconciliation.count({
      where: { accountId, userId, status: 'adjusted' }
    });

    const pending = await prisma.bankReconciliation.count({
      where: { accountId, userId, status: 'pending' }
    });

    const totalDifference = await prisma.bankReconciliation.aggregate({
      where: { accountId, userId },
      _sum: { difference: true }
    });

    return {
      total,
      reconciled,
      adjusted,
      pending,
      totalDifference: Number(totalDifference._sum.difference || 0)
    };
  }
}
