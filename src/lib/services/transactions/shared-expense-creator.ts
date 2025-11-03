/**
 * CRIADOR DE DESPESAS COMPARTILHADAS
 * Responsável por criar despesas compartilhadas com divisão entre participantes
 */

import { prisma } from '@/lib/prisma';
import { validateOrThrow, TransactionSchema } from '@/lib/validation/schemas';
import { TransactionValidator } from './transaction-validator';
import { BalanceCalculator } from '../calculations/balance-calculator';
import { CreateSharedExpenseOptions } from './types';

export class SharedExpenseCreator {
  /**
   * Cria uma despesa compartilhada com divisão entre participantes
   */
  static async create(options: CreateSharedExpenseOptions) {
    const { transaction, sharedWith, splitType, splits } = options;

    // Validar transação
    const validatedTransaction = validateOrThrow(TransactionSchema, {
      ...transaction,
      isShared: true,
      sharedWith,
    });

    // Validar regras de negócio
    await TransactionValidator.validateTransaction(validatedTransaction);

    // Validar participantes
    if (!sharedWith || sharedWith.length === 0) {
      throw new Error('Despesa compartilhada deve ter pelo menos um participante');
    }

    // Calcular divisão
    const division = this.calculateDivision(
      Math.abs(Number(validatedTransaction.amount)),
      sharedWith,
      splitType,
      splits
    );

    return await prisma.$transaction(async (tx) => {
      // 1. Criar transação principal
      const mainTransaction = await tx.transaction.create({
        data: {
          ...validatedTransaction,
          date: validatedTransaction.date,
          isShared: true,
          sharedWith: JSON.stringify(sharedWith),
        },
      });

      // 2. Criar dívidas para cada participante
      const debts = [];
      for (const participantId of sharedWith) {
        const amount = division[participantId];

        const debt = await tx.sharedDebt.create({
          data: {
            transactionId: mainTransaction.id,
            userId: validatedTransaction.userId, // Quem pagou
            debtorId: participantId, // Quem deve
            amount,
            status: 'pending',
            description: validatedTransaction.description,
          },
        });

        debts.push(debt);
      }

      // 3. Atualizar saldo da conta (quem pagou)
      if (mainTransaction.accountId) {
        await BalanceCalculator.updateAccountBalance(tx, mainTransaction.accountId);
      }

      // 4. Atualizar saldo do cartão (se aplicável)
      if (mainTransaction.creditCardId) {
        await BalanceCalculator.updateCreditCardBalance(tx, mainTransaction.creditCardId);
      }

      return {
        transaction: mainTransaction,
        debts,
        division,
      };
    });
  }

  /**
   * Calcula a divisão da despesa entre participantes
   */
  private static calculateDivision(
    totalAmount: number,
    participants: string[],
    splitType: 'equal' | 'percentage' | 'custom',
    customSplits?: Record<string, number>
  ): Record<string, number> {
    const division: Record<string, number> = {};

    switch (splitType) {
      case 'equal':
        // Divisão igual entre todos
        const amountPerPerson = totalAmount / participants.length;
        participants.forEach((id) => {
          division[id] = amountPerPerson;
        });
        break;

      case 'percentage':
        // Divisão por porcentagem
        if (!customSplits) {
          throw new Error('Splits customizados são necessários para divisão por porcentagem');
        }

        // Validar que soma das porcentagens = 100
        const totalPercentage = Object.values(customSplits).reduce((sum, p) => sum + p, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new Error('A soma das porcentagens deve ser 100%');
        }

        participants.forEach((id) => {
          const percentage = customSplits[id] || 0;
          division[id] = (totalAmount * percentage) / 100;
        });
        break;

      case 'custom':
        // Divisão customizada (valores fixos)
        if (!customSplits) {
          throw new Error('Splits customizados são necessários para divisão customizada');
        }

        // Validar que soma dos valores = total
        const totalCustom = Object.values(customSplits).reduce((sum, v) => sum + v, 0);
        if (Math.abs(totalCustom - totalAmount) > 0.01) {
          throw new Error('A soma dos valores customizados deve ser igual ao total');
        }

        participants.forEach((id) => {
          division[id] = customSplits[id] || 0;
        });
        break;
    }

    return division;
  }

  /**
   * Marca uma dívida como paga
   */
  static async settleDebt(debtId: string): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // Atualizar status da dívida
      const debt = await tx.sharedDebt.update({
        where: { id: debtId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
        include: {
          transaction: true,
        },
      });

      // Criar transação de pagamento (opcional)
      // Pode ser implementado se necessário

      return debt;
    });
  }

  /**
   * Cancela uma despesa compartilhada
   */
  static async cancel(transactionId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Marcar transação como cancelada
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'CANCELLED' },
      });

      // Marcar todas as dívidas como canceladas
      await tx.sharedDebt.updateMany({
        where: { transactionId },
        data: { status: 'cancelled' },
      });

      // Recalcular saldos
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
      });

      if (transaction?.accountId) {
        await BalanceCalculator.updateAccountBalance(tx, transaction.accountId);
      }

      if (transaction?.creditCardId) {
        await BalanceCalculator.updateCreditCardBalance(tx, transaction.creditCardId);
      }
    });
  }

  /**
   * Lista dívidas pendentes de um usuário
   */
  static async getPendingDebts(userId: string): Promise<any[]> {
    return await prisma.sharedDebt.findMany({
      where: {
        debtorId: userId,
        status: 'pending',
      },
      include: {
        transaction: true,
        user: true, // Quem pagou
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Lista créditos pendentes de um usuário (quem pagou e está esperando)
   */
  static async getPendingCredits(userId: string): Promise<any[]> {
    return await prisma.sharedDebt.findMany({
      where: {
        userId, // Quem pagou
        status: 'pending',
      },
      include: {
        transaction: true,
        debtor: true, // Quem deve
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
