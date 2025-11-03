/**
 * SERVIÇO DE REEMBOLSOS E ESTORNOS
 * Gerencia reembolsos vinculados à transação original
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ============================================
// TIPOS
// ============================================

export interface CreateRefundOptions {
  originalTransactionId: string;
  userId: string;
  amount: number; // Valor a ser reembolsado (pode ser parcial)
  accountId: string; // Conta que receberá o reembolso
  date: Date;
  description?: string;
  reason?: string;
}

export interface RefundInfo {
  transactionId: string;
  originalAmount: number;
  refundedAmount: number;
  remainingAmount: number;
  refundPercentage: number;
  status: 'not_refunded' | 'partially_refunded' | 'fully_refunded';
  refunds: Array<{
    id: string;
    amount: number;
    date: Date;
    description: string;
  }>;
}

// ============================================
// SERVIÇO
// ============================================

export class RefundService {
  /**
   * CRIAR REEMBOLSO VINCULADO
   * Cria uma transação de reembolso vinculada à original
   */
  static async createRefund(options: CreateRefundOptions) {
    const {
      originalTransactionId,
      userId,
      amount,
      accountId,
      date,
      description,
      reason,
    } = options;

    // 1. Buscar transação original
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id: originalTransactionId },
      include: {
        categoryRef: true,
        account: true,
      },
    });

    if (!originalTransaction) {
      throw new Error('Transação original não encontrada');
    }

    // 2. Validar que é uma despesa
    if (originalTransaction.type !== 'DESPESA') {
      throw new Error('Apenas despesas podem ser reembolsadas');
    }

    // 3. Validar valor do reembolso
    const originalAmount = Math.abs(Number(originalTransaction.amount));
    const alreadyRefunded = await this.getTotalRefunded(originalTransactionId);
    const remainingAmount = originalAmount - alreadyRefunded;

    if (amount > remainingAmount) {
      throw new Error(
        `Valor do reembolso (${amount}) excede o valor restante (${remainingAmount})`
      );
    }

    // 4. Criar transação de reembolso
    return await prisma.$transaction(async (tx) => {
      // Criar transação de receita (reembolso)
      const refundTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId,
          categoryId: originalTransaction.categoryId, // Mesma categoria
          amount: amount, // Positivo (receita)
          description:
            description ||
            `Reembolso: ${originalTransaction.description}`,
          type: 'RECEITA',
          date,
          status: 'cleared',
          
          // Vincular à transação original
          metadata: JSON.stringify({
            refundedTransactionId: originalTransactionId,
            refundType: amount >= originalAmount ? 'full' : 'partial',
            refundReason: reason,
            originalAmount,
            refundedAmount: amount,
          }),
        },
      });

      // Atualizar metadata da transação original
      const currentMetadata = originalTransaction.metadata
        ? JSON.parse(originalTransaction.metadata)
        : {};

      const refunds = currentMetadata.refunds || [];
      refunds.push({
        id: refundTransaction.id,
        amount,
        date,
        description: refundTransaction.description,
      });

      const totalRefunded = alreadyRefunded + amount;
      const refundStatus =
        totalRefunded >= originalAmount
          ? 'fully_refunded'
          : 'partially_refunded';

      await tx.transaction.update({
        where: { id: originalTransactionId },
        data: {
          metadata: JSON.stringify({
            ...currentMetadata,
            refunds,
            totalRefunded,
            refundStatus,
          }),
        },
      });

      // Atualizar saldo da conta
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // Criar lançamento de auditoria
      await tx.transactionAudit.create({
        data: {
          transactionId: originalTransactionId,
          action: 'REFUND_CREATED',
          oldValue: JSON.stringify({ refundStatus: 'not_refunded' }),
          newValue: JSON.stringify({ refundStatus, totalRefunded }),
          userId,
          timestamp: new Date(),
        },
      });

      return refundTransaction;
    });
  }

  /**
   * OBTER TOTAL JÁ REEMBOLSADO
   */
  private static async getTotalRefunded(
    transactionId: string
  ): Promise<number> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { metadata: true },
    });

    if (!transaction?.metadata) {
      return 0;
    }

    const metadata = JSON.parse(transaction.metadata);
    return metadata.totalRefunded || 0;
  }

  /**
   * OBTER INFORMAÇÕES DE REEMBOLSO
   */
  static async getRefundInfo(
    transactionId: string
  ): Promise<RefundInfo | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        amount: true,
        metadata: true,
      },
    });

    if (!transaction) {
      return null;
    }

    const originalAmount = Math.abs(Number(transaction.amount));
    const metadata = transaction.metadata
      ? JSON.parse(transaction.metadata)
      : {};

    const refundedAmount = metadata.totalRefunded || 0;
    const remainingAmount = originalAmount - refundedAmount;
    const refundPercentage = (refundedAmount / originalAmount) * 100;

    let status: 'not_refunded' | 'partially_refunded' | 'fully_refunded' =
      'not_refunded';

    if (refundedAmount > 0) {
      status =
        refundedAmount >= originalAmount
          ? 'fully_refunded'
          : 'partially_refunded';
    }

    return {
      transactionId: transaction.id,
      originalAmount,
      refundedAmount,
      remainingAmount,
      refundPercentage,
      status,
      refunds: metadata.refunds || [],
    };
  }

  /**
   * CANCELAR REEMBOLSO
   * Remove o reembolso e restaura o estado da transação original
   */
  static async cancelRefund(refundTransactionId: string, userId: string) {
    const refundTransaction = await prisma.transaction.findUnique({
      where: { id: refundTransactionId },
      select: {
        id: true,
        amount: true,
        accountId: true,
        metadata: true,
      },
    });

    if (!refundTransaction) {
      throw new Error('Reembolso não encontrado');
    }

    const metadata = refundTransaction.metadata
      ? JSON.parse(refundTransaction.metadata)
      : {};

    const originalTransactionId = metadata.refundedTransactionId;

    if (!originalTransactionId) {
      throw new Error('Esta transação não é um reembolso');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Deletar transação de reembolso (soft delete)
      await tx.transaction.update({
        where: { id: refundTransactionId },
        data: {
          deletedAt: new Date(),
        },
      });

      // 2. Atualizar transação original
      const originalTransaction = await tx.transaction.findUnique({
        where: { id: originalTransactionId },
        select: { metadata: true },
      });

      if (originalTransaction?.metadata) {
        const originalMetadata = JSON.parse(originalTransaction.metadata);
        const refunds = (originalMetadata.refunds || []).filter(
          (r: any) => r.id !== refundTransactionId
        );

        const totalRefunded = refunds.reduce(
          (sum: number, r: any) => sum + r.amount,
          0
        );

        const refundStatus =
          totalRefunded === 0
            ? 'not_refunded'
            : totalRefunded >= Math.abs(Number(originalTransaction.metadata))
            ? 'fully_refunded'
            : 'partially_refunded';

        await tx.transaction.update({
          where: { id: originalTransactionId },
          data: {
            metadata: JSON.stringify({
              ...originalMetadata,
              refunds,
              totalRefunded,
              refundStatus,
            }),
          },
        });
      }

      // 3. Reverter saldo da conta
      if (refundTransaction.accountId) {
        await tx.account.update({
          where: { id: refundTransaction.accountId },
          data: {
            balance: {
              decrement: Number(refundTransaction.amount),
            },
          },
        });
      }

      // 4. Auditoria
      await tx.transactionAudit.create({
        data: {
          transactionId: originalTransactionId,
          action: 'REFUND_CANCELLED',
          oldValue: JSON.stringify({ refundId: refundTransactionId }),
          newValue: JSON.stringify({ cancelled: true }),
          userId,
          timestamp: new Date(),
        },
      });
    });
  }

  /**
   * LISTAR TODAS AS TRANSAÇÕES COM REEMBOLSO
   */
  static async listRefundedTransactions(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'DESPESA',
        deletedAt: null,
        metadata: {
          contains: 'refundStatus',
        },
      },
      include: {
        categoryRef: true,
        account: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return transactions.map((transaction) => {
      const metadata = transaction.metadata
        ? JSON.parse(transaction.metadata)
        : {};

      return {
        ...transaction,
        refundInfo: {
          status: metadata.refundStatus || 'not_refunded',
          totalRefunded: metadata.totalRefunded || 0,
          refunds: metadata.refunds || [],
        },
      };
    });
  }

  /**
   * VERIFICAR SE TRANSAÇÃO PODE SER REEMBOLSADA
   */
  static async canBeRefunded(transactionId: string): Promise<{
    canRefund: boolean;
    reason?: string;
    maxRefundAmount?: number;
  }> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        type: true,
        amount: true,
        metadata: true,
        deletedAt: true,
      },
    });

    if (!transaction) {
      return { canRefund: false, reason: 'Transação não encontrada' };
    }

    if (transaction.deletedAt) {
      return { canRefund: false, reason: 'Transação foi deletada' };
    }

    if (transaction.type !== 'DESPESA') {
      return { canRefund: false, reason: 'Apenas despesas podem ser reembolsadas' };
    }

    const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};
    const totalRefunded = metadata.totalRefunded || 0;
    const originalAmount = Math.abs(Number(transaction.amount));
    const maxRefundAmount = originalAmount - totalRefunded;

    if (maxRefundAmount <= 0) {
      return { canRefund: false, reason: 'Transação já foi totalmente reembolsada' };
    }

    return {
      canRefund: true,
      maxRefundAmount,
    };
  }
}
