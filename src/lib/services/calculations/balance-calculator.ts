/**
 * CALCULADORA DE SALDOS
 * Recalcula saldos de contas e cartões
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class BalanceCalculator {
  /**
   * Atualiza saldo de uma conta baseado em suas transações
   */
  static async updateAccountBalance(
    tx: Prisma.TransactionClient,
    accountId: string
  ): Promise<void> {
    const transactions = await tx.transaction.findMany({
      where: { accountId, status: { not: 'CANCELLED' } },
      select: { amount: true, type: true },
    });

    const balance = transactions.reduce((acc, t) => {
      const amount = Number(t.amount);
      return t.type === 'RECEITA' ? acc + amount : acc - amount;
    }, 0);

    await tx.account.update({
      where: { id: accountId },
      data: { balance },
    });
  }

  /**
   * Atualiza saldo usado de um cartão de crédito
   */
  static async updateCreditCardBalance(
    tx: Prisma.TransactionClient,
    creditCardId: string
  ): Promise<void> {
    const transactions = await tx.transaction.findMany({
      where: {
        creditCardId,
        status: { not: 'CANCELLED' },
        type: 'DESPESA',
      },
      select: { amount: true },
    });

    const usedAmount = transactions.reduce(
      (acc, t) => acc + Math.abs(Number(t.amount)),
      0
    );

    await tx.creditCard.update({
      where: { id: creditCardId },
      data: { usedAmount },
    });
  }

  /**
   * Recalcula todos os saldos de um usuário
   */
  static async recalculateAllBalances(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Recalcular contas
      const accounts = await tx.account.findMany({
        where: { userId },
        select: { id: true },
      });

      for (const account of accounts) {
        await this.updateAccountBalance(tx, account.id);
      }

      // Recalcular cartões
      const cards = await tx.creditCard.findMany({
        where: { userId },
        select: { id: true },
      });

      for (const card of cards) {
        await this.updateCreditCardBalance(tx, card.id);
      }
    });
  }
}
