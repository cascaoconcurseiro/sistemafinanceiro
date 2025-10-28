/**
 * Script de Migração: Adicionar goalId em transações antigas de metas
 * 
 * Este script identifica transações que foram criadas para metas mas não têm goalId
 * e atualiza elas com o goalId correto baseado na descrição.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateGoalTransactions() {
  console.log('🔄 Iniciando migração de transações de metas...\n');

  try {
    // 1. Buscar todas as metas
    const goals = await prisma.goal.findMany();

    console.log(`📊 Encontradas ${goals.length} metas ativas\n`);

    let totalUpdated = 0;

    // 2. Para cada meta, buscar transações que podem ser dela
    for (const goal of goals) {
      console.log(`\n🎯 Processando meta: ${goal.name} (${goal.id})`);
      console.log(`   Valor atual: R$ ${Number(goal.currentAmount).toFixed(2)}`);

      // Buscar transações que mencionam a meta na descrição mas não têm goalId
      const transactions = await prisma.transaction.findMany({
        where: {
          goalId: null,
          deletedAt: null,
          OR: [
            { description: { contains: goal.name } },
            { description: { contains: `Meta: ${goal.name}` } },
            { description: { contains: `meta ${goal.name}` } },
          ]
        },
        include: {
          account: { select: { name: true } }
        }
      });

      if (transactions.length === 0) {
        console.log(`   ✅ Nenhuma transação para migrar`);
        continue;
      }

      console.log(`   📝 Encontradas ${transactions.length} transações para migrar:`);

      // 3. Atualizar cada transação com o goalId
      for (const transaction of transactions) {
        console.log(`      - ${transaction.description}`);
        console.log(`        Valor: R$ ${Number(transaction.amount).toFixed(2)}`);
        console.log(`        Conta: ${transaction.account?.name || 'N/A'}`);
        console.log(`        Data: ${new Date(transaction.date).toLocaleDateString('pt-BR')}`);

        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { goalId: goal.id }
        });

        totalUpdated++;
        console.log(`        ✅ Atualizada com goalId`);
      }
    }

    console.log(`\n\n✅ Migração concluída!`);
    console.log(`📊 Total de transações atualizadas: ${totalUpdated}`);

    // 4. Verificar se há transações órfãs (sem goalId mas com descrição de meta)
    const orphanTransactions = await prisma.transaction.findMany({
      where: {
        goalId: null,
        deletedAt: null,
        OR: [
          { description: { contains: 'Meta:' } },
          { description: { contains: 'meta' } },
        ]
      },
      take: 10
    });

    if (orphanTransactions.length > 0) {
      console.log(`\n⚠️  Atenção: Encontradas ${orphanTransactions.length} transações que podem ser de metas mas não foram migradas:`);
      orphanTransactions.forEach(t => {
        console.log(`   - ${t.description} (${t.id})`);
      });
      console.log(`\n   Verifique manualmente se essas transações precisam de goalId.`);
    }

  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateGoalTransactions()
  .then(() => {
    console.log('\n🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script falhou:', error);
    process.exit(1);
  });
