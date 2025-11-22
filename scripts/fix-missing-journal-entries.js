/**
 * SCRIPT: Corrigir Transações Sem Lançamentos Contábeis
 * 
 * Cria lançamentos contábeis (partidas dobradas) para transações antigas
 * que não têm lançamentos.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 CORRIGINDO LANÇAMENTOS CONTÁBEIS FALTANTES\n');

  // Buscar transações sem lançamentos
  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      accountId: { not: null }, // Apenas transações de conta
      creditCardId: null, // Excluir cartões
    },
    include: {
      journalEntries: true,
      account: { select: { name: true, type: true, userId: true } },
      categoryRef: { select: { name: true, type: true } },
    },
  });

  const missingEntries = transactions.filter(tx => tx.journalEntries.length === 0);

  console.log(`📊 Encontradas ${missingEntries.length} transações sem lançamentos\n`);

  if (missingEntries.length === 0) {
    console.log('✅ Todas as transações já têm lançamentos!');
    return;
  }

  let fixed = 0;
  let errors = 0;

  for (const tx of missingEntries) {
    try {
      console.log(`🔄 Processando: ${tx.description} (${tx.type})`);

      const amount = Math.abs(Number(tx.amount));
      const accountId = tx.accountId;

      // Normalizar tipo (pode estar em inglês ou português)
      const typeMap = {
        'income': 'RECEITA',
        'expense': 'DESPESA',
        'transfer': 'TRANSFERENCIA',
        'RECEITA': 'RECEITA',
        'DESPESA': 'DESPESA',
        'TRANSFERENCIA': 'TRANSFERENCIA',
      };
      const normalizedType = typeMap[tx.type] || tx.type;

      // Buscar ou criar conta contábil para a categoria
      let categoryAccountId;

      if (normalizedType === 'RECEITA') {
        // Buscar ou criar conta de receita
        let revenueAccount = await prisma.account.findFirst({
          where: {
            userId: tx.account.userId,
            type: 'RECEITA',
            name: tx.categoryRef ? `Receita - ${tx.categoryRef.name}` : 'Receitas Gerais',
          },
        });

        if (!revenueAccount) {
          revenueAccount = await prisma.account.create({
            data: {
              userId: tx.account.userId,
              name: tx.categoryRef ? `Receita - ${tx.categoryRef.name}` : 'Receitas Gerais',
              type: 'RECEITA',
              balance: 0,
              currency: 'BRL',
              isActive: true,
            },
          });
        }

        categoryAccountId = revenueAccount.id;

        // RECEITA: Débito na conta (aumenta ativo), Crédito em receita
        await prisma.journalEntry.create({
          data: {
            transactionId: tx.id,
            accountId: accountId,
            entryType: 'DEBITO',
            amount,
            description: `${tx.description} (Entrada)`,
          },
        });

        await prisma.journalEntry.create({
          data: {
            transactionId: tx.id,
            accountId: categoryAccountId,
            entryType: 'CREDITO',
            amount,
            description: `${tx.description} (Receita)`,
          },
        });

        console.log(`   ✅ Lançamentos criados: DÉBITO ${tx.account.name} +${amount}, CRÉDITO Receita +${amount}`);
      } else if (normalizedType === 'DESPESA') {
        // Buscar ou criar conta de despesa
        let expenseAccount = await prisma.account.findFirst({
          where: {
            userId: tx.account.userId,
            type: 'DESPESA',
            name: tx.categoryRef ? `Despesa - ${tx.categoryRef.name}` : 'Despesas Gerais',
          },
        });

        if (!expenseAccount) {
          expenseAccount = await prisma.account.create({
            data: {
              userId: tx.account.userId,
              name: tx.categoryRef ? `Despesa - ${tx.categoryRef.name}` : 'Despesas Gerais',
              type: 'DESPESA',
              balance: 0,
              currency: 'BRL',
              isActive: true,
            },
          });
        }

        categoryAccountId = expenseAccount.id;

        // DESPESA: Débito em despesa, Crédito na conta (diminui ativo)
        await prisma.journalEntry.create({
          data: {
            transactionId: tx.id,
            accountId: categoryAccountId,
            entryType: 'DEBITO',
            amount,
            description: `${tx.description} (Despesa)`,
          },
        });

        await prisma.journalEntry.create({
          data: {
            transactionId: tx.id,
            accountId: accountId,
            entryType: 'CREDITO',
            amount,
            description: `${tx.description} (Saída)`,
          },
        });

        console.log(`   ✅ Lançamentos criados: DÉBITO Despesa +${amount}, CRÉDITO ${tx.account.name} -${amount}`);
      }

      fixed++;
    } catch (error) {
      console.error(`   ❌ Erro ao processar ${tx.description}:`, error.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`✅ Corrigidas: ${fixed}`);
  console.log(`❌ Erros: ${errors}`);
  console.log('='.repeat(60));

  if (fixed > 0) {
    console.log('\n🎉 Lançamentos contábeis criados com sucesso!');
    console.log('   Execute: node scripts/audit-system.js para verificar');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
