/**
 * CRIADOR DE TRANSAÇÕES
 * Responsável por criar transações simples com atomicidade
 */

import { prisma } from '@/lib/prisma';
import { validateOrThrow, TransactionSchema } from '@/lib/validation/schemas';
import { TransactionValidator } from './transaction-validator';
import { BalanceCalculator } from '../calculations/balance-calculator';
import { CreateTransactionOptions, TransactionResult } from './types';

export class TransactionCreator {
  /**
   * Cria uma transação simples com todas as operações relacionadas
   */
  static async create(options: CreateTransactionOptions): Promise<TransactionResult> {
    const { transaction, createJournalEntries = true, linkToInvoice = true } = options;

    // Validar dados
    const validatedTransaction = validateOrThrow(TransactionSchema, transaction);

    // Validar regras de negócio
    await TransactionValidator.validateTransaction(validatedTransaction);

    return await prisma.$transaction(async (tx) => {
      // 1. Criar transação
      const createdTransaction = await tx.transaction.create({
        data: {
          ...validatedTransaction,
          date: validatedTransaction.date,
          sharedWith: Array.isArray(validatedTransaction.sharedWith)
            ? JSON.stringify(validatedTransaction.sharedWith)
            : validatedTransaction.sharedWith,
        },
      });

      const relatedRecords: any[] = [];

      // 2. Criar lançamentos contábeis (se necessário)
      if (createJournalEntries) {
        const journalEntries = await this.createJournalEntries(tx, createdTransaction);
        relatedRecords.push(...journalEntries);
      }

      // 3. Vincular a fatura de cartão (se aplicável)
      if (linkToInvoice && createdTransaction.creditCardId) {
        const invoice = await this.linkToInvoice(tx, createdTransaction);
        if (invoice) relatedRecords.push(invoice);
      }

      // 4. Atualizar saldo da conta
      if (createdTransaction.accountId) {
        await BalanceCalculator.updateAccountBalance(tx, createdTransaction.accountId);
      }

      // 5. Atualizar saldo do cartão
      if (createdTransaction.creditCardId) {
        await BalanceCalculator.updateCreditCardBalance(tx, createdTransaction.creditCardId);
      }

      return {
        transaction: createdTransaction,
        relatedRecords,
      };
    });
  }

  /**
   * Cria lançamentos contábeis (partidas dobradas)
   */
  private static async createJournalEntries(tx: any, transaction: any): Promise<any[]> {
    // Implementação simplificada - pode ser expandida
    const entries = [];

    if (transaction.type === 'DESPESA') {
      // Débito: Despesa
      entries.push(
        await tx.journalEntry.create({
          data: {
            transactionId: transaction.id,
            accountType: 'EXPENSE',
            debit: Math.abs(Number(transaction.amount)),
            credit: 0,
            date: transaction.date,
          },
        })
      );

      // Crédito: Caixa/Banco
      entries.push(
        await tx.journalEntry.create({
          data: {
            transactionId: transaction.id,
            accountType: 'ASSET',
            debit: 0,
            credit: Math.abs(Number(transaction.amount)),
            date: transaction.date,
          },
        })
      );
    } else if (transaction.type === 'RECEITA') {
      // Débito: Caixa/Banco
      entries.push(
        await tx.journalEntry.create({
          data: {
            transactionId: transaction.id,
            accountType: 'ASSET',
            debit: Math.abs(Number(transaction.amount)),
            credit: 0,
            date: transaction.date,
          },
        })
      );

      // Crédito: Receita
      entries.push(
        await tx.journalEntry.create({
          data: {
            transactionId: transaction.id,
            accountType: 'REVENUE',
            debit: 0,
            credit: Math.abs(Number(transaction.amount)),
            date: transaction.date,
          },
        })
      );
    }

    return entries;
  }

  /**
   * Vincula transação a uma fatura de cartão
   */
  private static async linkToInvoice(tx: any, transaction: any): Promise<any | null> {
    const card = await tx.creditCard.findUnique({
      where: { id: transaction.creditCardId },
      select: { closingDate: true },
    });

    if (!card) return null;

    const transactionDate = new Date(transaction.date);
    const closingDay = card.closingDate;

    // Calcular mês/ano da fatura
    let invoiceMonth = transactionDate.getMonth();
    let invoiceYear = transactionDate.getFullYear();

    if (transactionDate.getDate() > closingDay) {
      invoiceMonth++;
      if (invoiceMonth > 11) {
        invoiceMonth = 0;
        invoiceYear++;
      }
    }

    // Buscar ou criar fatura
    const invoice = await tx.invoice.upsert({
      where: {
        creditCardId_month_year: {
          creditCardId: transaction.creditCardId,
          month: invoiceMonth,
          year: invoiceYear,
        },
      },
      create: {
        creditCardId: transaction.creditCardId,
        month: invoiceMonth,
        year: invoiceYear,
        totalAmount: Math.abs(Number(transaction.amount)),
        status: 'PENDING',
      },
      update: {
        totalAmount: {
          increment: Math.abs(Number(transaction.amount)),
        },
      },
    });

    // Vincular transação à fatura
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { invoiceId: invoice.id },
    });

    return invoice;
  }
}
