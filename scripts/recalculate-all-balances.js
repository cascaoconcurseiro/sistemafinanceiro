/**
 * SCRIPT: Recalcular Todos os Saldos
 * 
 * Este script recalcula o saldo de TODAS as contas baseado nas transações ativas.
 * Útil após correções no sistema de deleção.
 * 
 * USO: node scripts/recalculate-all-balances.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateAllBalances() {
  console.log('🔄 Iniciando recálculo de todos os saldos...\n');

  try {
    // 1. Buscar todas as contas ativas
    const accounts = await prisma.account.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });

    console.log(`📊 Encontradas ${accounts.length} contas ativas\n`);

    let updatedCount = 0;
    let errors = 0;

    // 2. Recalcular saldo de cada conta
    for (const account of accounts) {
      try {
        console.log(`💰 Processando: ${account.name} (${account.id})`);

        // Buscar transações ativas da conta
        const transactions = await prisma.transaction.findMany({
          where: {
            accountId: account.id,
            deletedAt: null, // ✅ Ignora deletadas
            status: { in: ['cleared', 'completed'] },
          },
        });

        console.log(`   📋 ${transactions.length} transações ativas`);

        // Calcular saldo
        let balance = 0;
        for (const tx of transactions) {
          const amount = Number(tx.amount);
          
          if (tx.type === 'RECEITA' || tx.type === 'income') {
            balance += Math.abs(amount);
          } else if (tx.type === 'DESPESA' || tx.type === 'expense') {
            balance -= Math.abs(amount);
          }
        }

        // Atualizar conta
        await prisma.account.update({
          where: { id: account.id },
          data: { balance },
        });

        console.log(`   ✅ Saldo atualizado: R$ ${balance.toFixed(2)}`);
        console.log(`   (Anterior: R$ ${Number(account.balance).toFixed(2)})\n`);

        updatedCount++;
      } catch (error) {
        console.error(`   ❌ Erro ao processar conta ${account.name}:`, error.message);
        errors++;
      }
    }

    // 3. Resumo
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DO RECÁLCULO');
    console.log('='.repeat(50));
    console.log(`✅ Contas atualizadas: ${updatedCount}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📋 Total processado: ${accounts.length}`);
    console.log('='.repeat(50) + '\n');

    if (errors === 0) {
      console.log('🎉 Todos os saldos foram recalculados com sucesso!');
    } else {
      console.log('⚠️ Alguns erros ocorreram. Verifique os logs acima.');
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
recalculateAllBalances()
  .then(() => {
    console.log('\n✅ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });
