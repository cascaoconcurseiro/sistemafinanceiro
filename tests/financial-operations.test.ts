/**
 * TESTES DO SERVIÇO DE OPERAÇÕES FINANCEIRAS
 * Garante que todas as operações funcionam corretamente
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { FinancialOperationsService } from '../src/lib/services/financial-operations-service';

const prisma = new PrismaClient();

describe('FinancialOperationsService', () => {
  let testUserId: string;
  let testAccountId: string;

  beforeEach(async () => {
    // Criar usuário de teste
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'hashed_password'
      }
    });
    testUserId = user.id;

    // Criar conta de teste
    const account = await prisma.account.create({
      data: {
        userId: testUserId,
        name: 'Conta Teste',
        type: 'ATIVO',
        balance: 1000,
        currency: 'BRL',
        isActive: true
      }
    });
    testAccountId = account.id;
  });

  afterEach(async () => {
    // Limpar dados de teste
    await prisma.journalEntry.deleteMany({ where: { transaction: { userId: testUserId } } });
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.account.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('createTransaction', () => {
    it('deve criar transação com partidas dobradas', async () => {
      const transaction = await FinancialOperationsService.createTransaction({
        transaction: {
          userId: testUserId,
          accountId: testAccountId,
          amount: 100,
          description: 'Teste Receita',
          type: 'RECEITA',
          date: new Date(),
          status: 'cleared'
        },
        createJournalEntries: true
      });

      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();

      // Verificar partidas dobradas
      const entries = await prisma.journalEntry.findMany({
        where: { transactionId: transaction.id }
      });

      expect(entries).toHaveLength(2);

      const debits = entries.filter(e => e.entryType === 'DEBITO');
      const credits = entries.filter(e => e.entryType === 'CREDITO');

      expect(debits).toHaveLength(1);
      expect(credits).toHaveLength(1);
      expect(Number(debits[0].amount)).toBe(Number(credits[0].amount));
    });

    it('deve validar saldo antes de criar despesa', async () => {
      // Criar conta com saldo zero
      const poorAccount = await prisma.account.create({
        data: {
          userId: testUserId,
          name: 'Conta Vazia',
          type: 'ATIVO',
          balance: 0,
          currency: 'BRL',
          isActive: true
        }
      });

      await expect(
        FinancialOperationsService.createTransaction({
          transaction: {
            userId: testUserId,
            accountId: poorAccount.id,
            amount: 100,
            description: 'Despesa sem saldo',
            type: 'DESPESA',
            date: new Date(),
            status: 'cleared'
          },
          createJournalEntries: true
        })
      ).rejects.toThrow('Saldo insuficiente');
    });
  });

  describe('createInstallments', () => {
    it('deve criar parcelas atomicamente', async () => {
      const result = await FinancialOperationsService.createInstallments({
        baseTransaction: {
          userId: testUserId,
          accountId: testAccountId,
          amount: 300,
          description: 'Compra Parcelada',
          type: 'DESPESA',
          date: new Date(),
          status: 'cleared'
        },
        totalInstallments: 3,
        firstDueDate: new Date(),
        frequency: 'monthly'
      });

      expect(result.installments).toHaveLength(3);
      expect(result.parentTransaction).toBeDefined();

      // Verificar que todas as parcelas foram criadas
      const installments = await prisma.installment.findMany({
        where: { transactionId: result.parentTransaction.id }
      });

      expect(installments).toHaveLength(3);
    });
  });

  describe('createTransfer', () => {
    it('deve criar transferência atômica', async () => {
      // Criar segunda conta
      const toAccount = await prisma.account.create({
        data: {
          userId: testUserId,
          name: 'Conta Destino',
          type: 'ATIVO',
          balance: 0,
          currency: 'BRL',
          isActive: true
        }
      });

      const transfer = await FinancialOperationsService.createTransfer({
        fromAccountId: testAccountId,
        toAccountId: toAccount.id,
        amount: 100,
        description: 'Transferência Teste',
        date: new Date(),
        userId: testUserId
      });

      expect(transfer.debitTransaction).toBeDefined();
      expect(transfer.creditTransaction).toBeDefined();
      expect(transfer.transferId).toBeDefined();

      // Verificar que ambas as transações têm o mesmo transferId
      expect(transfer.debitTransaction.transferId).toBe(transfer.creditTransaction.transferId);
    });

    it('deve rejeitar transferência para mesma conta', async () => {
      await expect(
        FinancialOperationsService.createTransfer({
          fromAccountId: testAccountId,
          toAccountId: testAccountId,
          amount: 100,
          description: 'Transferência Inválida',
          date: new Date(),
          userId: testUserId
        })
      ).rejects.toThrow('mesma conta');
    });
  });

  describe('deleteTransaction', () => {
    it('deve fazer soft delete com cascata', async () => {
      // Criar transação
      const transaction = await FinancialOperationsService.createTransaction({
        transaction: {
          userId: testUserId,
          accountId: testAccountId,
          amount: 100,
          description: 'Teste Delete',
          type: 'RECEITA',
          date: new Date(),
          status: 'cleared'
        },
        createJournalEntries: true
      });

      // Deletar
      await FinancialOperationsService.deleteTransaction(transaction.id, testUserId);

      // Verificar soft delete
      const deleted = await prisma.transaction.findUnique({
        where: { id: transaction.id }
      });

      expect(deleted?.deletedAt).not.toBeNull();

      // Verificar que lançamentos foram deletados
      const entries = await prisma.journalEntry.findMany({
        where: { transactionId: transaction.id }
      });

      expect(entries).toHaveLength(0);
    });
  });

  describe('verifyDoubleEntryIntegrity', () => {
    it('deve detectar partidas desbalanceadas', async () => {
      // Criar transação com partidas dobradas
      const transaction = await FinancialOperationsService.createTransaction({
        transaction: {
          userId: testUserId,
          accountId: testAccountId,
          amount: 100,
          description: 'Teste Integridade',
          type: 'RECEITA',
          date: new Date(),
          status: 'cleared'
        },
        createJournalEntries: true
      });

      // Verificar integridade (deve estar OK)
      let result = await FinancialOperationsService.verifyDoubleEntryIntegrity(testUserId);
      expect(result.unbalanced).toBe(0);

      // Corromper dados (deletar um lançamento)
      const entries = await prisma.journalEntry.findMany({
        where: { transactionId: transaction.id }
      });
      await prisma.journalEntry.delete({
        where: { id: entries[0].id }
      });

      // Verificar integridade (deve detectar problema)
      result = await FinancialOperationsService.verifyDoubleEntryIntegrity(testUserId);
      expect(result.unbalanced).toBe(1);
      expect(result.issues).toHaveLength(1);
    });
  });
});
