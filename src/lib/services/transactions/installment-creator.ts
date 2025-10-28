/**
 * CRIADOR DE PARCELAMENTOS
 * Responsável por criar transações parceladas com atomicidade
 */

import { prisma } from '@/lib/prisma';
import { validateOrThrow, TransactionSchema } from '@/lib/validation/schemas';
import { TransactionValidator } from './transaction-validator';
import { BalanceCalculator } from '../calculations/balance-calculator';
import { CreateInstallmentsOptions } from './types';

export class InstallmentCreator {
  /**
   * Cria um parcelamento completo
   */
  static async create(options: CreateInstallmentsOptions) {
    const { baseTransaction, totalInstallments, firstDueDate, frequency } = options;

    // Validar transação base
    const validatedTransaction = validateOrThrow(TransactionSchema, {
      ...baseTransaction,
      isInstallment: true,
      totalInstallments,
    });

    return await prisma.$transaction(async (tx) => {
      // 1. Criar transação pai
      const parentTransaction = await tx.transaction.create({
        data: {
          ...validatedTransaction,
          date: validatedTransaction.date,
          installmentNumber: 1,
          totalInstallments,
          installmentGroupId: `inst_${Date.now()}`,
          sharedWith: Array.isArray(validatedTransaction.sharedWith)
            ? JSON.stringify(validatedTransaction.sharedWith)
            : validatedTransaction.sharedWith,
        },
      });

      // 2. Criar parcelas na tabela Installment
      const installments = [];
      const amountPerInstallment = Number(validatedTransaction.amount) / totalInstallments;

      for (let i = 1; i <= totalInstallments; i++) {
        const dueDate = this.calculateDueDate(firstDueDate, i - 1, frequency);

        const installment = await tx.installment.create({
          data: {
            transactionId: parentTransaction.id,
            userId: validatedTransaction.userId,
            installmentNumber: i,
            totalInstallments,
            amount: amountPerInstallment,
            dueDate,
            status: i === 1 ? 'paid' : 'pending',
            paidAt: i === 1 ? new Date() : null,
            description: `${validatedTransaction.description} - Parcela ${i}/${totalInstallments}`,
          },
        });

        installments.push(installment);
      }

      // 3. Atualizar saldo (apenas primeira parcela)
      if (parentTransaction.accountId) {
        await BalanceCalculator.updateAccountBalance(tx, parentTransaction.accountId);
      }

      if (parentTransaction.creditCardId) {
        await BalanceCalculator.updateCreditCardBalance(tx, parentTransaction.creditCardId);
      }

      return {
        parentTransaction,
        installments,
      };
    });
  }

  /**
   * Calcula data de vencimento de uma parcela
   */
  private static calculateDueDate(
    baseDate: Date,
    installmentIndex: number,
    frequency: 'monthly' | 'weekly' | 'daily'
  ): Date {
    const date = new Date(baseDate);

    switch (frequency) {
      case 'monthly':
        date.setMonth(date.getMonth() + installmentIndex);
        break;
      case 'weekly':
        date.setDate(date.getDate() + installmentIndex * 7);
        break;
      case 'daily':
        date.setDate(date.getDate() + installmentIndex);
        break;
    }

    return date;
  }

  /**
   * Paga uma parcela específica
   */
  static async payInstallment(installmentId: string): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      const installment = await tx.installment.update({
        where: { id: installmentId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
        include: {
          transaction: true,
        },
      });

      // Atualizar saldos
      if (installment.transaction.accountId) {
        await BalanceCalculator.updateAccountBalance(
          tx,
          installment.transaction.accountId
        );
      }

      if (installment.transaction.creditCardId) {
        await BalanceCalculator.updateCreditCardBalance(
          tx,
          installment.transaction.creditCardId
        );
      }

      return installment;
    });
  }
}
