/**
 * SCRIPT DE MIGRAÇÃO DE DADOS FINANCEIROS
 * Corrige dados existentes para usar o novo sistema
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * 1. Criar partidas dobradas faltantes
 */
async function createMissingJournalEntries(): Promise<MigrationResult> {
  console.log('📊 [Migração] Criando partidas dobradas faltantes...');
  
  try {
    // Buscar transações sem lançamentos contábeis
    const transactionsWithoutEntries = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        journalEntries: {
          none: {}
        }
      },
      include: {
        account: true,
        categoryRef: true,
      }
    });

    console.log(`📊 [Migração] Encontradas ${transactionsWithoutEntries.length} transações sem partidas dobradas`);

    let created = 0;
    for (const transaction of transactionsWithoutEntries) {
      if (!transaction.accountId) continue;

      const amount = Math.abs(Number(transaction.amount));

      if (transaction.type === 'RECEITA') {
        // Débito na conta (aumenta ativo)
        await prisma.journalEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: transaction.accountId,
            entryType: 'DEBITO',
            amount,
            description: `${transaction.description} (Entrada)`,
          }
        });

        // Crédito em conta de receita
        const revenueAccount = await getOrCreateRevenueAccount(
          transaction.userId,
          transaction.categoryId
        );
        await prisma.journalEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: revenueAccount.id,
            entryType: 'CREDITO',
            amount,
            description: `${transaction.description} (Receita)`,
          }
        });

        created += 2;
      } else if (transaction.type === 'DESPESA') {
        // Débito em conta de despesa
        const expenseAccount = await getOrCreateExpenseAccount(
          transaction.userId,
          transaction.categoryId
        );
        await prisma.journalEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: expenseAccount.id,
            entryType: 'DEBITO',
            amount,
            description: `${transaction.description} (Despesa)`,
          }
        });

        // Crédito na conta (diminui ativo)
        await prisma.journalEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: transaction.accountId,
            entryType: 'CREDITO',
            amount,
            description: `${transaction.description} (Saída)`,
          }
        });

        created += 2;
      }
    }

    return {
      success: true,
      message: `Criadas ${created} partidas dobradas para ${transactionsWithoutEntries.length} transações`,
      details: { transactionsFixed: transactionsWithoutEntries.length, entriesCreated: created }
    };
  } catch (error) {
    console.error('❌ [Migração] Erro ao criar partidas dobradas:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * 2. Recalcular todos os saldos
 */
async function recalculateAllBalances(): Promise<MigrationResult> {
  console.log('💰 [Migração] Recalculando todos os saldos...');
  
  try {
    const users = await prisma.user.findMany();
    let accountsUpdated = 0;
    let cardsUpdated = 0;

    for (const user of users) {
      // Recalcular contas
      const accounts = await prisma.account.findMany({
        where: { userId: user.id, deletedAt: null }
      });

      for (const account of accounts) {
        const entries = await prisma.journalEntry.findMany({
          where: {
            accountId: account.id,
            transaction: { deletedAt: null }
          }
        });

        const balance = entries.reduce((sum, entry) => {
          if (entry.entryType === 'DEBITO') {
            return sum + Number(entry.amount);
          } else {
            return sum - Number(entry.amount);
          }
        }, 0);

        await prisma.account.update({
          where: { id: account.id },
          data: { balance }
        });

        accountsUpdated++;
      }

      // Recalcular cartões
      const cards = await prisma.creditCard.findMany({
        where: { userId: user.id }
      });

      for (const card of cards) {
        const transactions = await prisma.transaction.findMany({
          where: {
            creditCardId: card.id,
            deletedAt: null
          }
        });

        const balance = transactions.reduce((sum, t) => {
          return sum + Math.abs(Number(t.amount));
        }, 0);

        await prisma.creditCard.update({
          where: { id: card.id },
          data: { currentBalance: balance }
        });

        cardsUpdated++;
      }
    }

    return {
      success: true,
      message: `Recalculados ${accountsUpdated} contas e ${cardsUpdated} cartões`,
      details: { accountsUpdated, cardsUpdated }
    };
  } catch (error) {
    console.error('❌ [Migração] Erro ao recalcular saldos:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * 3. Vincular transações de cartão a faturas
 */
async function linkCardTransactionsToInvoices(): Promise<MigrationResult> {
  console.log('💳 [Migração] Vinculando transações de cartão a faturas...');
  
  try {
    const cardTransactions = await prisma.transaction.findMany({
      where: {
        creditCardId: { not: null },
        invoiceId: null,
        deletedAt: null
      },
      include: {
        creditCard: true
      }
    });

    console.log(`💳 [Migração] Encontradas ${cardTransactions.length} transações sem fatura`);

    let linked = 0;
    for (const transaction of cardTransactions) {
      if (!transaction.creditCard) continue;

      const transactionDate = new Date(transaction.date);
      const { month, year } = calculateInvoiceMonthYear(
        transactionDate,
        transaction.creditCard.closingDay
      );

      // Buscar ou criar fatura
      let invoice = await prisma.invoice.findFirst({
        where: {
          creditCardId: transaction.creditCardId!,
          month,
          year
        }
      });

      if (!invoice) {
        const dueDate = new Date(year, month, transaction.creditCard.dueDay);
        invoice = await prisma.invoice.create({
          data: {
            creditCardId: transaction.creditCardId!,
            userId: transaction.userId,
            month,
            year,
            totalAmount: 0,
            paidAmount: 0,
            dueDate,
            isPaid: false,
            status: 'open'
          }
        });
      }

      // Vincular transação
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { invoiceId: invoice.id }
      });

      // Atualizar total da fatura
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          totalAmount: {
            increment: Math.abs(Number(transaction.amount))
          }
        }
      });

      linked++;
    }

    return {
      success: true,
      message: `Vinculadas ${linked} transações a faturas`,
      details: { transactionsLinked: linked }
    };
  } catch (error) {
    console.error('❌ [Migração] Erro ao vincular faturas:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * 4. Corrigir transações órfãs
 */
async function fixOrphanTransactions(): Promise<MigrationResult> {
  console.log('🔧 [Migração] Corrigindo transações órfãs...');
  
  try {
    // Transações sem conta e sem cartão
    const orphanTransactions = await prisma.transaction.findMany({
      where: {
        accountId: null,
        creditCardId: null,
        deletedAt: null
      }
    });

    console.log(`🔧 [Migração] Encontradas ${orphanTransactions.length} transações órfãs`);

    let fixed = 0;
    for (const transaction of orphanTransactions) {
      // Criar conta "Transações Antigas" se não existir
      let defaultAccount = await prisma.account.findFirst({
        where: {
          userId: transaction.userId,
          name: 'Transações Antigas (Migração)'
        }
      });

      if (!defaultAccount) {
        defaultAccount = await prisma.account.create({
          data: {
            userId: transaction.userId,
            name: 'Transações Antigas (Migração)',
            type: 'ATIVO',
            balance: 0,
            currency: 'BRL',
            isActive: true
          }
        });
      }

      // Vincular transação
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { accountId: defaultAccount.id }
      });

      fixed++;
    }

    return {
      success: true,
      message: `Corrigidas ${fixed} transações órfãs`,
      details: { transactionsFixed: fixed }
    };
  } catch (error) {
    console.error('❌ [Migração] Erro ao corrigir órfãs:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * 5. Verificar integridade final
 */
async function verifyIntegrity(): Promise<MigrationResult> {
  console.log('✅ [Migração] Verificando integridade...');
  
  try {
    const issues: string[] = [];

    // Verificar partidas dobradas desbalanceadas
    const transactions = await prisma.transaction.findMany({
      where: { deletedAt: null },
      include: { journalEntries: true }
    });

    for (const transaction of transactions) {
      const debits = transaction.journalEntries
        .filter(e => e.entryType === 'DEBITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const credits = transaction.journalEntries
        .filter(e => e.entryType === 'CREDITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      if (Math.abs(debits - credits) > 0.01) {
        issues.push(`Transação ${transaction.id} desbalanceada: D=${debits}, C=${credits}`);
      }
    }

    // Verificar transações órfãs
    const orphans = await prisma.transaction.count({
      where: {
        accountId: null,
        creditCardId: null,
        deletedAt: null
      }
    });

    if (orphans > 0) {
      issues.push(`${orphans} transações órfãs encontradas`);
    }

    return {
      success: issues.length === 0,
      message: issues.length === 0 
        ? 'Integridade verificada: Nenhum problema encontrado' 
        : `${issues.length} problemas encontrados`,
      details: { issues }
    };
  } catch (error) {
    console.error('❌ [Migração] Erro ao verificar integridade:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Executar migração completa
 */
async function runMigration() {
  console.log('🚀 [Migração] Iniciando migração de dados financeiros...\n');

  const results: MigrationResult[] = [];

  // 1. Corrigir transações órfãs primeiro
  console.log('=== ETAPA 1: Corrigir Transações Órfãs ===');
  results.push(await fixOrphanTransactions());
  console.log('');

  // 2. Criar partidas dobradas
  console.log('=== ETAPA 2: Criar Partidas Dobradas ===');
  results.push(await createMissingJournalEntries());
  console.log('');

  // 3. Vincular faturas
  console.log('=== ETAPA 3: Vincular Faturas ===');
  results.push(await linkCardTransactionsToInvoices());
  console.log('');

  // 4. Recalcular saldos
  console.log('=== ETAPA 4: Recalcular Saldos ===');
  results.push(await recalculateAllBalances());
  console.log('');

  // 5. Verificar integridade
  console.log('=== ETAPA 5: Verificar Integridade ===');
  results.push(await verifyIntegrity());
  console.log('');

  // Resumo
  console.log('=== RESUMO DA MIGRAÇÃO ===');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Etapa ${index + 1}: ${result.message}`);
    if (result.details) {
      console.log(`   Detalhes:`, result.details);
    }
  });

  const allSuccess = results.every(r => r.success);
  console.log('\n' + (allSuccess ? '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!' : '⚠️ MIGRAÇÃO CONCLUÍDA COM AVISOS'));

  await prisma.$disconnect();
}

// Funções auxiliares
async function getOrCreateRevenueAccount(userId: string, categoryId?: string | null) {
  let account = await prisma.account.findFirst({
    where: {
      userId,
      type: 'RECEITA',
      name: categoryId ? `Receita - ${categoryId}` : 'Receitas Gerais'
    }
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId,
        name: categoryId ? `Receita - ${categoryId}` : 'Receitas Gerais',
        type: 'RECEITA',
        balance: 0,
        currency: 'BRL',
        isActive: true
      }
    });
  }

  return account;
}

async function getOrCreateExpenseAccount(userId: string, categoryId?: string | null) {
  let account = await prisma.account.findFirst({
    where: {
      userId,
      type: 'DESPESA',
      name: categoryId ? `Despesa - ${categoryId}` : 'Despesas Gerais'
    }
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId,
        name: categoryId ? `Despesa - ${categoryId}` : 'Despesas Gerais',
        type: 'DESPESA',
        balance: 0,
        currency: 'BRL',
        isActive: true
      }
    });
  }

  return account;
}

function calculateInvoiceMonthYear(transactionDate: Date, closingDay: number) {
  const day = transactionDate.getDate();
  let month = transactionDate.getMonth();
  let year = transactionDate.getFullYear();

  if (day > closingDay) {
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return { month, year };
}

// Executar se chamado diretamente
if (require.main === module) {
  runMigration().catch(console.error);
}

export { runMigration };
