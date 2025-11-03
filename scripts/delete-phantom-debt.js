const { PrismaClient } = require('@prisma/client');

async function deletePhantomDebt() {
  const prisma = new PrismaClient();
  
  try {
    const phantomDebtId = 'cmhe4j8hy000gze10pwuhp1jc'; // Dívida fantasma de R$ 50,00

    console.log('🗑️ Deletando dívida fantasma...\n');
    console.log(`ID: ${phantomDebtId}`);
    console.log(`Descrição: Carro (cmhe46m4t003pxv7a1u88vf3e)`);
    console.log(`Valor: R$ 50,00\n`);

    // Buscar a dívida antes de deletar
    const debt = await prisma.sharedDebt.findUnique({
      where: { id: phantomDebtId }
    });

    if (!debt) {
      console.log('❌ Dívida não encontrada!');
      return;
    }

    console.log('📋 Detalhes da dívida:');
    console.log(`   Devedor: ${debt.debtorId}`);
    console.log(`   Credor: ${debt.creditorId}`);
    console.log(`   Valor: R$ ${debt.currentAmount}`);
    console.log(`   Status: ${debt.status}`);
    console.log(`   Criado em: ${debt.createdAt}\n`);

    // Deletar
    await prisma.sharedDebt.delete({
      where: { id: phantomDebtId }
    });

    console.log('✅ Dívida fantasma deletada com sucesso!');

    // Verificar se foi deletada
    const remaining = await prisma.sharedDebt.findMany({
      where: { status: 'active' }
    });

    console.log(`\n📊 Dívidas ativas restantes: ${remaining.length}`);
    remaining.forEach((d, i) => {
      console.log(`\n   Dívida #${i + 1}:`);
      console.log(`   ID: ${d.id}`);
      console.log(`   Descrição: ${d.description}`);
      console.log(`   Valor: R$ ${d.currentAmount}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deletePhantomDebt();
