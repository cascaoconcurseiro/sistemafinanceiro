/**
 * SCRIPT: Popular Lançamentos Contábeis Retroativamente
 * 
 * Este script cria lançamentos contábeis (partidas dobradas) para todas as
 * transações existentes que ainda não possuem lançamentos.
 * 
 * USO:
 * node scripts/populate-journal-entries.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando população de lançamentos contábeis...\n');

  try {
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    });

    console.log(`📊 Encontrados ${users.length} usuários ativos\n`);

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    for (const user of users) {
      console.log(`\n👤 Processando usuário: ${user.name} (${user.email})`);
      console.log('─'.repeat(60));

      // Buscar transações sem lançamentos contábeis
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
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

      console.log(`📝 Transações sem lançamentos: ${transactions.length}`);

      if (transactions.length === 0) {
        console.log('✅ Nenhuma transação pendente');
        continue;
      }

      for (const transaction of transactions) {
        totalProcessed++;

        try {
          await createJournalEntriesForTransaction(transaction);
          totalSuccess++;
          
          process.stdout.write(`✓ ${totalSuccess}/${transactions.length} `);
          
          // Quebra de linha a cada 10 transações
          if (totalSuccess % 10 === 0) {
            console.log('');
          }
        } catch (error) {
          totalErrors++;
          console.error(
            `\n❌ Erro na transação ${transaction.id}: ${error.message}`
          );
        }
      }

      console.log(`\n✅ Usuário processado: ${totalSuccess} sucesso, ${totalErrors} erros`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO FINAL');
    console.log('='.repeat(60));
    console.log(`Total processado: ${totalProcessed}`);
    console.log(`Sucesso: ${totalSuccess}`);
    console.log(`Erros: ${totalErrors}`);
    console.log(`Taxa de sucesso: ${((totalSuccess / totalProcessed) * 100).toFixed(2)}%`);

    // Validar balanceamento geral
    console.log('\n🔍 Validando balanceamento geral...');
    const validation = await validateSystemBalance();
    
    if (validation.isBalanced) {
      console.log('✅ Sistema balanceado!');
      console.log(`   Débitos: R$ ${validation.totalDebits.toFixed(2)}`);
      console.log(`   Créditos: R$ ${validation.totalCredits.toFixed(2)}`);
      console.log(`   Diferença: R$ ${validation.difference.toFixed(2)}`);
    } else {
      console.log('⚠️  Sistema desbalanceado!');
      console.log(`   Débitos: R$ ${validation.totalDebits.toFixed(2)}`);
      console.log(`   Créditos: R$ ${validation.totalCredits.toFixed(2)}`);
      console.log(`   Diferença: R$ ${validation.difference.toFixed(2)}`);
    }

  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Criar lançamentos contábeis para uma transação
 */
async function createJournalEntriesForTransaction(transaction) {
  return await prisma.$transaction(async (tx) => {
    const amount = Math.abs(Number(transaction.amount));
    let entries = [];

    switch (transaction.type) {
      case 'RECEITA':
        // Débito: Conta bancária
        entries.push({
          accountId: transaction.accountId,
          entryType: 'DEBITO',
          amount,
          description: `Recebimento: ${transaction.description}`,
        });

        // Crédito: Conta de receita
        const receitaAccount = await getOrCreateRevenueAccount(
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
        const despesaAccount = await getOrCreateExpenseAccount(
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

        // Crédito: Conta bancária
        entries.push({
          accountId: transaction.accountId,
          entryType: 'CREDITO',
          amount,
          description: `Pagamento: ${transaction.description}`,
        });
        break;

      case 'TRANSFERENCIA':
        // Buscar conta destino
        const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};
        const toAccountId = metadata.toAccountId || metadata.transferToAccountId;

        if (!toAccountId) {
          throw new Error('Conta destino não encontrada');
        }

        // Débito: Conta destino
        entries.push({
          accountId: toAccountId,
          entryType: 'DEBITO',
          amount,
          description: `Transferência recebida: ${transaction.description}`,
        });

        // Crédito: Conta origem
        entries.push({
          accountId: transaction.accountId,
          entryType: 'CREDITO',
          amount,
          description: `Transferência enviada: ${transaction.description}`,
        });
        break;
    }

    // Criar lançamentos
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
 * Buscar ou criar conta de receita
 */
async function getOrCreateRevenueAccount(tx, userId, categoryId) {
  const accountName = categoryId ? `Receita - ${categoryId}` : 'Receitas Diversas';

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
 * Buscar ou criar conta de despesa
 */
async function getOrCreateExpenseAccount(tx, userId, categoryId) {
  const accountName = categoryId ? `Despesa - ${categoryId}` : 'Despesas Diversas';

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
 * Validar balanceamento geral do sistema
 */
async function validateSystemBalance() {
  const entries = await prisma.journalEntry.findMany();

  const totalDebits = entries
    .filter((e) => e.entryType === 'DEBITO')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const totalCredits = entries
    .filter((e) => e.entryType === 'CREDITO')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference <= 0.01;

  return {
    isBalanced,
    totalDebits,
    totalCredits,
    difference,
  };
}

// Executar
main()
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
