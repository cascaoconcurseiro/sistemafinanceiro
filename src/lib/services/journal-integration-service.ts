/**
 * SERVIÇO DE INTEGRAÇÃO DE PARTIDAS DOBRADAS
 * Garante que todas as transações criem lançamentos contábeis automaticamente
 */

import { prisma } from '@/lib/prisma';
import { doubleEntryService } from './double-entry-service';

// ============================================
// SERVIÇO DE INTEGRAÇÃO
// ============================================

export class JournalIntegrationService {
  /**
   * POPULAR LANÇAMENTOS CONTÁBEIS RETROATIVAMENTE
   * Para transações que foram criadas antes da implementação de partidas dobradas
   */
  static async populateHistoricalJournalEntries(userId: string) {
    console.log('🔄 Populando lançamentos contábeis históricos...');

    // Buscar todas as transações sem lançamentos contábeis
    const transactionsWithoutEntries = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        journalEntries: {
          none: {},
        },
      },
      include: {
        account: true,
        categoryRef: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    console.log(
      `📊 Encontradas ${transactionsWithoutEntries.length} transações sem lançamentos contábeis`
    );

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ transactionId: string; error: string }> = [];

    for (const transaction of transactionsWithoutEntries) {
      try {
        // Criar lançamentos contábeis usando o serviço de partidas dobradas
        await this.createJournalEntriesForTransaction(transaction);
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          transactionId: transaction.id,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
        console.error(
          `❌ Erro ao criar lançamentos para transação ${transaction.id}:`,
          error
        );
      }
    }

    console.log('✅ Processo concluído:', {
      total: transactionsWithoutEntries.length,
      sucesso: successCount,
      erros: errorCount,
    });

    return {
      total: transactionsWithoutEntries.length,
      success: successCount,
      errors: errorCount,
      errorDetails: errors,
    };
  }

  /**
   * CRIAR LANÇAMENTOS CONTÁBEIS PARA UMA TRANSAÇÃO
   */
  private static async createJournalEntriesForTransaction(transaction: any) {
    return await prisma.$transaction(async (tx) => {
      const amount = Math.abs(Number(transaction.amount));

      let entries: Array<{
        accountId: string;
        entryType: 'DEBITO' | 'CREDITO';
        amount: number;
        description: string;
      }> = [];

      switch (transaction.type) {
        case 'RECEITA':
          // Débito: Conta bancária (ATIVO aumenta)
          entries.push({
            accountId: transaction.accountId,
            entryType: 'DEBITO',
            amount,
            description: `Recebimento: ${transaction.description}`,
          });

          // Crédito: Conta de receita
          const receitaAccount = await this.getOrCreateRevenueAccount(
            tx,
            transaction.userId,
            transaction.categoryId
          );
          entries.push({
            accountId: receitaAccount.id,
            entryType: 'CREDITO',
            amount,
            description: `Receita: ${transaction.description}`,
          });
          break;

        case 'DESPESA':
          // Débito: Conta de despesa
          const despesaAccount = await this.getOrCreateExpenseAccount(
            tx,
            transaction.userId,
            transaction.categoryId
          );
          entries.push({
            accountId: despesaAccount.id,
            entryType: 'DEBITO',
            amount,
            description: `Despesa: ${transaction.description}`,
          });

          // Crédito: Conta bancária (ATIVO diminui)
          entries.push({
            accountId: transaction.accountId,
            entryType: 'CREDITO',
            amount,
            description: `Pagamento: ${transaction.description}`,
          });
          break;

        case 'TRANSFERENCIA':
          // Buscar conta destino no metadata
          const metadata = transaction.metadata
            ? JSON.parse(transaction.metadata)
            : {};
          const toAccountId = metadata.toAccountId || metadata.transferToAccountId;

          if (!toAccountId) {
            throw new Error(
              'Conta destino não encontrada para transferência'
            );
          }

          // Débito: Conta destino (ATIVO aumenta)
          entries.push({
            accountId: toAccountId,
            entryType: 'DEBITO',
            amount,
            description: `Transferência recebida: ${transaction.description}`,
          });

          // Crédito: Conta origem (ATIVO diminui)
          entries.push({
            accountId: transaction.accountId,
            entryType: 'CREDITO',
            amount,
            description: `Transferência enviada: ${transaction.description}`,
          });
          break;
      }

      // Criar todos os lançamentos
      for (const entry of entries) {
        await tx.journalEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: entry.accountId,
            entryType: entry.entryType,
            amount: entry.amount,
            description: entry.description,
          },
        });
      }

      // Validar balanceamento
      const totalDebits = entries
        .filter((e) => e.entryType === 'DEBITO')
        .reduce((sum, e) => sum + e.amount, 0);

      const totalCredits = entries
        .filter((e) => e.entryType === 'CREDITO')
        .reduce((sum, e) => sum + e.amount, 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(
          `Balanceamento violado: Débitos=${totalDebits}, Créditos=${totalCredits}`
        );
      }
    });
  }

  /**
   * BUSCAR OU CRIAR CONTA DE RECEITA
   */
  private static async getOrCreateRevenueAccount(
    tx: any,
    userId: string,
    categoryId?: string
  ) {
    const accountName = categoryId
      ? `Receita - ${categoryId}`
      : 'Receitas Diversas';

    let account = await tx.account.findFirst({
      where: {
        userId,
        name: accountName,
        type: 'RECEITA',
      },
    });

    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          name: accountName,
          type: 'RECEITA',
          balance: 0,
          currency: 'BRL',
          isActive: true,
        },
      });
    }

    return account;
  }

  /**
   * BUSCAR OU CRIAR CONTA DE DESPESA
   */
  private static async getOrCreateExpenseAccount(
    tx: any,
    userId: string,
    categoryId?: string
  ) {
    const accountName = categoryId
      ? `Despesa - ${categoryId}`
      : 'Despesas Diversas';

    let account = await tx.account.findFirst({
      where: {
        userId,
        name: accountName,
        type: 'DESPESA',
      },
    });

    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          name: accountName,
          type: 'DESPESA',
          balance: 0,
          currency: 'BRL',
          isActive: true,
        },
      });
    }

    return account;
  }

  /**
   * VALIDAR INTEGRIDADE DO SISTEMA
   * Verifica se todas as transações têm lançamentos contábeis
   */
  static async validateSystemIntegrity(userId: string) {
    const [totalTransactions, transactionsWithEntries, totalEntries] =
      await Promise.all([
        prisma.transaction.count({
          where: {
            userId,
            deletedAt: null,
          },
        }),
        prisma.transaction.count({
          where: {
            userId,
            deletedAt: null,
            journalEntries: {
              some: {},
            },
          },
        }),
        prisma.journalEntry.count({
          where: {
            transaction: {
              userId,
              deletedAt: null,
            },
          },
        }),
      ]);

    const transactionsWithoutEntries =
      totalTransactions - transactionsWithEntries;
    const coverage = (transactionsWithEntries / totalTransactions) * 100;

    // Validar balanceamento geral
    const balanceValidation = await doubleEntryService.validateSystemBalance();

    return {
      totalTransactions,
      transactionsWithEntries,
      transactionsWithoutEntries,
      coverage: coverage.toFixed(2) + '%',
      totalEntries,
      averageEntriesPerTransaction: (
        totalEntries / transactionsWithEntries
      ).toFixed(2),
      balanceValidation,
      isHealthy:
        transactionsWithoutEntries === 0 && balanceValidation.isBalanced,
    };
  }

  /**
   * RECALCULAR TODOS OS SALDOS
   * Útil após popular lançamentos históricos
   */
  static async recalculateAllBalances(userId: string) {
    console.log('🔄 Recalculando todos os saldos...');

    const accounts = await prisma.account.findMany({
      where: {
        userId,
        deletedAt: null,
      },
    });

    for (const account of accounts) {
      await this.recalculateAccountBalance(account.id);
    }

    console.log(`✅ ${accounts.length} contas recalculadas`);

    return {
      accountsRecalculated: accounts.length,
    };
  }

  /**
   * RECALCULAR SALDO DE UMA CONTA
   */
  private static async recalculateAccountBalance(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        journalEntries: {
          include: {
            transaction: true,
          },
        },
      },
    });

    if (!account) return;

    // Filtrar apenas transações válidas (não deletadas e cleared)
    const validEntries = account.journalEntries.filter(
      (e) =>
        e.transaction &&
        e.transaction.status === 'cleared' &&
        e.transaction.deletedAt === null
    );

    let newBalance = 0;

    // Calcular saldo baseado na natureza da conta
    switch (account.type) {
      case 'ATIVO':
        const ativoDebitos = validEntries
          .filter((e) => e.entryType === 'DEBITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const ativoCreditos = validEntries
          .filter((e) => e.entryType === 'CREDITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        newBalance = ativoDebitos - ativoCreditos;
        break;

      case 'PASSIVO':
        const passivoCreditos = validEntries
          .filter((e) => e.entryType === 'CREDITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const passivoDebitos = validEntries
          .filter((e) => e.entryType === 'DEBITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        newBalance = passivoCreditos - passivoDebitos;
        break;

      case 'RECEITA':
        const receitaCreditos = validEntries
          .filter((e) => e.entryType === 'CREDITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const receitaDebitos = validEntries
          .filter((e) => e.entryType === 'DEBITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        newBalance = receitaCreditos - receitaDebitos;
        break;

      case 'DESPESA':
        const despesaDebitos = validEntries
          .filter((e) => e.entryType === 'DEBITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const despesaCreditos = validEntries
          .filter((e) => e.entryType === 'CREDITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        newBalance = despesaDebitos - despesaCreditos;
        break;
    }

    // Atualizar saldo
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });
  }
}
