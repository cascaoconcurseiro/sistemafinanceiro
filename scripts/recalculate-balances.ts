/**
 * Script para recalcular saldos de todas as contas
 * Garante que os saldos estejam corretos baseado nas transações
 */

import { prisma } from '../src/lib/prisma';

async function recalculateAllBalances() {
  console.log('🔧 Iniciando recálculo de saldos...\n');

  try {
    // Buscar todas as contas ativas
    const accounts = await prisma.account.findMany({
      where: { deletedAt: null }
    });

    console.log(`📊 Encontradas ${accounts.length} contas para recalcular\n`);

    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    for (const account of accounts) {
      try {
        console.log(`\n💰 Processando: ${account.name} (${account.id})`);
        console.log(`   Saldo atual: R$ ${Number(account.balance).toFixed(2)}`);

        // Buscar todas as transações da conta
        const transactions = await prisma.transaction.findMany({
          where: {
            accountId: account.id,
            deletedAt: null
          },
          orderBy: { date: 'asc' }
        });

        console.log(`   Transações encontradas: ${transactions.length}`);

        // Calcular saldo correto
        const calculatedBalance = transactions.reduce((sum, t) => {
          return sum + Number(t.amount);
        }, 0);

        console.log(`   Saldo calculado: R$ ${calculatedBalance.toFixed(2)}`);

        // Verificar se precisa atualizar
        const currentBalance = Number(account.balance);
        const difference = Math.abs(currentBalance - calculatedBalance);

        if (difference < 0.01) {
          console.log(`   ✅ Saldo correto! Nenhuma atualização necessária.`);
          unchanged++;
          continue;
        }

        console.log(`   ⚠️  Diferença encontrada: R$ ${difference.toFixed(2)}`);

        // Atualizar saldo
        await prisma.account.update({
          where: { id: account.id },
          data: { balance: calculatedBalance }
        });

        console.log(`   ✅ Saldo atualizado com sucesso!`);
        updated++;

      } catch (error) {
        console.error(`   ❌ Erro ao processar ${account.name}:`, error);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DO RECÁLCULO');
    console.log('='.repeat(60));
    console.log(`✅ Atualizados: ${updated}`);
    console.log(`➖ Sem alteração: ${unchanged}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📝 Total processado: ${accounts.length}`);

    if (updated > 0) {
      console.log('\n🎉 Saldos recalculados com sucesso!');
    } else {
      console.log('\n✅ Todos os saldos já estavam corretos!');
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
recalculateAllBalances();
