/**
 * SERVIÇO DE TRANSFERÊNCIAS
 * Gerencia transferências entre contas com atomicidade total
 */

import { prisma } from '@/lib/prisma';
import { ValidationService } from './validation-service';
import { DoubleEntryService } from './double-entry-service';
import { IdempotencyService } from './idempotency-service';
import { TemporalValidationService } from './temporal-validation-service';
import { randomUUID } from 'crypto';

interface CreateTransferOptions {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: Date;
  userId: string;
  operationUuid?: string;
  createdBy?: string;
}

export class TransferService {
  /**
   * Cria transferência entre contas com atomicidade total
   */
  static async createTransfer(options: CreateTransferOptions) {
    const {
      fromAccountId,
      toAccountId,
      amount,
      description,
      date,
      userId,
      operationUuid,
      createdBy
    } = options;

    // Validações iniciais
    if (fromAccountId === toAccountId) {
      throw new Error('Conta de origem e destino não podem ser iguais');
    }

    if (amount <= 0) {
      throw new Error('Valor da transferência deve ser positivo');
    }

    // ✅ IDEMPOTÊNCIA
    const finalOperationUuid = IdempotencyService.validateOrGenerate(operationUuid);
    
    if (await IdempotencyService.checkDuplicate(finalOperationUuid)) {
      const existing = await IdempotencyService.getByOperationUuid(finalOperationUuid);
      console.log(`⚠️ Transferência duplicada detectada: ${finalOperationUuid}`);
      return existing;
    }

    // ✅ VALIDAÇÃO TEMPORAL
    await TemporalValidationService.validateTransactionDate(
      userId,
      date,
      fromAccountId
    );

    // ✅ VALIDAÇÃO DE SALDO
    await ValidationService.validateAccountBalance(fromAccountId, amount);

    // ✅ CRIAR TRANSFERÊNCIA ATÔMICA
    return await prisma.$transaction(async (tx) => {
      // Gerar ID único para o grupo de transações
      const transactionGroupId = randomUUID();

      // 1. Criar débito (saída da conta origem)
      const debit = await tx.transaction.create({
        data: {
          userId,
          accountId: fromAccountId,
          amount: -amount,
          type: 'TRANSFERENCIA',
          description: `Transferência para conta destino: ${description}`,
          date,
          status: 'cleared',
          isTransfer: true,
          transactionGroupId,
          operationUuid: finalOperationUuid,
          createdBy
        }
      });

      console.log(`✅ Débito criado: ${debit.id} (-R$ ${amount})`);

      // 2. Criar crédito (entrada na conta destino)
      const credit = await tx.transaction.create({
        data: {
          userId,
          accountId: toAccountId,
          amount: amount,
          type: 'TRANSFERENCIA',
          description: `Transferência da conta origem: ${description}`,
          date,
          status: 'cleared',
          isTransfer: true,
          transferId: debit.id, // Link reverso
          transactionGroupId, // ✅ MESMO GRUPO
          operationUuid: IdempotencyService.generateUuid(), // UUID diferente
          createdBy
        }
      });

      console.log(`✅ Crédito criado: ${credit.id} (+R$ ${amount})`);

      // 3. Atualizar link no débito
      await tx.transaction.update({
        where: { id: debit.id },
        data: { transferId: credit.id }
      });

      // 4. Criar lançamentos contábeis
      await DoubleEntryService.createJournalEntries(tx, debit);
      await DoubleEntryService.createJournalEntries(tx, credit);

      console.log(`✅ Lançamentos contábeis criados`);

      // 5. Atualizar saldos
      await this.updateAccountBalance(tx, fromAccountId);
      await this.updateAccountBalance(tx, toAccountId);

      console.log(`✅ Saldos atualizados`);

      return {
        debit,
        credit,
        transactionGroupId,
        amount,
        fromAccountId,
        toAccountId
      };
    });
  }

  /**
   * Cancela transferência (soft delete de ambas transações)
   */
  static async cancelTransfer(
    transactionId: string,
    userId: string,
    canceledBy?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar transação
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId, deletedAt: null }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      if (!transaction.isTransfer) {
        throw new Error('Transação não é uma transferência');
      }

      // 2. Buscar transação vinculada
      const linkedId = transaction.transferId;
      if (!linkedId) {
        throw new Error('Transferência não possui transação vinculada');
      }

      const linked = await tx.transaction.findUnique({
        where: { id: linkedId }
      });

      if (!linked) {
        throw new Error('Transação vinculada não encontrada');
      }

      // 3. Validar período fechado
      await TemporalValidationService.validatePeriodOpen(userId, transaction.date);

      // 4. Soft delete de ambas
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          deletedAt: new Date(),
          status: 'cancelled',
          updatedBy: canceledBy
        }
      });

      await tx.transaction.update({
        where: { id: linked.id },
        data: {
          deletedAt: new Date(),
          status: 'cancelled',
          updatedBy: canceledBy
        }
      });

      // 5. Deletar lançamentos contábeis
      await tx.journalEntry.deleteMany({
        where: { transactionId: { in: [transaction.id, linked.id] } }
      });

      // 6. Atualizar saldos
      if (transaction.accountId) {
        await this.updateAccountBalance(tx, transaction.accountId);
      }
      if (linked.accountId) {
        await this.updateAccountBalance(tx, linked.accountId);
      }

      console.log(`✅ Transferência cancelada: ${transaction.id} e ${linked.id}`);

      return {
        canceled: [transaction.id, linked.id],
        transactionGroupId: transaction.transactionGroupId
      };
    });
  }

  /**
   * Lista transferências por grupo
   */
  static async getTransfersByGroup(transactionGroupId: string, userId: string) {
    return await prisma.transaction.findMany({
      where: {
        transactionGroupId,
        userId,
        deletedAt: null
      },
      include: {
        account: {
          select: { id: true, name: true, type: true }
        }
      },
      orderBy: { amount: 'asc' } // Débito primeiro (negativo)
    });
  }

  /**
   * Atualiza saldo da conta
   */
  private static async updateAccountBalance(tx: any, accountId: string) {
    const transactions = await tx.transaction.findMany({
      where: {
        accountId,
        deletedAt: null
      }
    });

    const balance = transactions.reduce((sum: number, t: any) => {
      return sum + Number(t.amount);
    }, 0);

    await tx.account.update({
      where: { id: accountId },
      data: { balance }
    });
  }
}
