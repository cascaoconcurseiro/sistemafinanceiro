/**
 * VALIDADOR DE TRANSAÇÕES
 * Validações específicas de regras de negócio
 */

import { prisma } from '@/lib/prisma';
import { ValidationService } from '../validation-service';
import { TransactionInput } from '@/lib/validation/schemas';

export class TransactionValidator {
  /**
   * Valida limite de cartão de crédito
   */
  static async validateCreditCardLimit(creditCardId: string, amount: number): Promise<void> {
    const card = await prisma.creditCard.findUnique({
      where: { id: creditCardId },
      select: { limit: true, usedAmount: true },
    });

    if (!card) {
      throw new Error('Cartão de crédito não encontrado');
    }

    const availableLimit = Number(card.limit) - Number(card.usedAmount);
    if (amount > availableLimit) {
      throw new Error(
        `Limite insuficiente. Disponível: R$ ${availableLimit.toFixed(2)}, Necessário: R$ ${amount.toFixed(2)}`
      );
    }
  }

  /**
   * Valida saldo de conta
   */
  static async validateAccountBalance(accountId: string, amount: number): Promise<void> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { balance: true, type: true },
    });

    if (!account) {
      throw new Error('Conta não encontrada');
    }

    // Apenas contas correntes e poupança precisam ter saldo
    if (['CHECKING', 'SAVINGS'].includes(account.type)) {
      if (Number(account.balance) < amount) {
        throw new Error(
          `Saldo insuficiente. Disponível: R$ ${Number(account.balance).toFixed(2)}, Necessário: R$ ${amount.toFixed(2)}`
        );
      }
    }
  }

  /**
   * Valida transação completa
   */
  static async validateTransaction(transaction: TransactionInput): Promise<void> {
    // Validação do ValidationService
    await ValidationService.validateTransaction(transaction);

    // Validações específicas
    if (transaction.type === 'DESPESA' && transaction.creditCardId) {
      await this.validateCreditCardLimit(
        transaction.creditCardId,
        Math.abs(Number(transaction.amount))
      );
    }

    if (transaction.type === 'DESPESA' && transaction.accountId) {
      await this.validateAccountBalance(
        transaction.accountId,
        Math.abs(Number(transaction.amount))
      );
    }
  }
}
