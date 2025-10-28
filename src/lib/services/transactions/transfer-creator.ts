/**
 * CRIADOR DE TRANSFERÊNCIAS
 * Responsável por criar transferências entre contas com atomicidade
 */

import { prisma } from '@/lib/prisma';
import { BalanceCalculator } from '../calculations/balance-calculator';
import { CreateTransferOptions } from './types';

export class TransferCreator {
  /**
   * Cria uma transferência entre contas
   */
  static async create(options: CreateTransferOptions) {
    const { fromAccountId, toAccountId, amount, description, date, userId } = options;

    if (fromAccountId === toAccountId) {
      throw new Error('Conta de origem e destino não podem ser iguais');
    }

    const transferId = `transfer_${Date.now()}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Criar transação de débito (saída)
      const debitTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId: fromAccountId,
          amount: -Math.abs(amount),
          description: `${description} (Transferência para)`,
          type: 'DESPESA',
          date,
          status: 'cleared',
          isTransfer: true,
          transferId,
          transferType: 'debit',
        },
      });

      // 2. Criar transação de crédito (entrada)
      const creditTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId: toAccountId,
          amount: Math.abs(amount),
          description: `${description} (Transferência de)`,
          type: 'RECEITA',
          date,
          status: 'cleared',
          isTransfer: true,
          transferId,
          transferType: 'credit',
        },
      });

      // 3. Atualizar saldos
      await BalanceCalculator.updateAccountBalance(tx, fromAccountId);
      await BalanceCalculator.updateAccountBalance(tx, toAccountId);

      return {
        debitTransaction,
        creditTransaction,
        transferId,
      };
    });
  }

  /**
   * Cancela uma transferência
   */
  static async cancel(transferId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const transactions = await tx.transaction.findMany({
        where: { transferId },
      });

      if (transactions.length !== 2) {
        throw new Error('Transferência inválida ou já cancelada');
      }

      // Marcar como canceladas
      await tx.transaction.updateMany({
        where: { transferId },
        data: { status: 'CANCELLED' },
      });

      // Recalcular saldos
      for (const transaction of transactions) {
        if (transaction.accountId) {
          await BalanceCalculator.updateAccountBalance(tx, transaction.accountId);
        }
      }
    });
  }
}
