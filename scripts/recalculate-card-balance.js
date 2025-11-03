/**
 * Script para recalcular saldo de cartões de crédito
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateCardBalances() {
  try {
    console.log('💳 Recalculando saldos de cartões de crédito...\n');

    // Buscar todos os cartões ativos
    const cards = await prisma.creditCard.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        limit: true,
        currentBalance: true
      }
    });

    console.log(`📊 Encontrados ${cards.length} cartões ativos\n`);

    for (const card of cards) {
      console.log(`\n💳 Processando: ${card.name}`);
      console.log(`   Limite: R$ ${Number(card.limit).toFixed(2)}`);
      console.log(`   Saldo atual (antes): R$ ${Number(card.currentBalance).toFixed(2)}`);

      // Buscar transações do cartão
      const transactions = await prisma.transaction.findMany({
        where: {
          creditCardId: card.id,
          deletedAt: null,
          status: { in: ['pending', 'cleared'] }
        },
        select: {
          id: true,
          description: true,
          amount: true,
          status: true,
          isInstallment: true,
          installmentNumber: true,
          totalInstallments: true
        }
      });

      console.log(`   Transações encontradas: ${transactions.length}`);

      // Calcular saldo correto
      const newBalance = transactions.reduce((sum, t) => {
        return sum + Math.abs(Number(t.amount));
      }, 0);

      console.log(`   Saldo calculado (novo): R$ ${newBalance.toFixed(2)}`);

      // Atualizar cartão
      await prisma.creditCard.update({
        where: { id: card.id },
        data: { currentBalance: newBalance }
      });

      const availableLimit = Number(card.limit) - newBalance;
      console.log(`   ✅ Limite disponível: R$ ${availableLimit.toFixed(2)}`);

      // Mostrar transações
      if (transactions.length > 0) {
        console.log(`\n   📋 Transações:`);
        transactions.forEach((t, index) => {
          const installmentInfo = t.isInstallment 
            ? ` (${t.installmentNumber}/${t.totalInstallments})`
            : '';
          console.log(`      ${index + 1}. ${t.description}${installmentInfo} - R$ ${Math.abs(Number(t.amount)).toFixed(2)}`);
        });
      }
    }

    console.log('\n\n✅ Recálculo concluído!');

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

recalculateCardBalances()
  .then(() => {
    console.log('\n🎉 Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
