const { PrismaClient } = require('@prisma/client');

async function fixPaidDebtAmount() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Corrigindo valor de dívidas pagas...\n');

    // Buscar dívidas pagas com currentAmount = 0
    const paidDebts = await prisma.sharedDebt.findMany({
      where: {
        status: 'paid',
        currentAmount: 0
      }
    });

    console.log(`📊 Dívidas pagas com valor zerado: ${paidDebts.length}\n`);

    if (paidDebts.length === 0) {
      console.log('✅ Nenhuma dívida precisa ser corrigida!');
      return;
    }

    // Corrigir cada dívida
    for (const debt of paidDebts) {
      console.log(`🔧 Corrigindo dívida: ${debt.id}`);
      console.log(`   Descrição: ${debt.description}`);
      console.log(`   Valor Original: R$ ${debt.originalAmount}`);
      console.log(`   Valor Atual (ERRADO): R$ ${debt.currentAmount}`);

      // Restaurar o valor original
      await prisma.sharedDebt.update({
        where: { id: debt.id },
        data: {
          currentAmount: debt.originalAmount
        }
      });

      console.log(`   ✅ Corrigido para: R$ ${debt.originalAmount}\n`);
    }

    console.log('✅ Todas as dívidas foram corrigidas!');
    console.log('\n📋 Agora as dívidas pagas devem aparecer na fatura com o valor correto.');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPaidDebtAmount();
