const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function moveToNovember() {
  try {
    console.log('📅 MOVENDO TRANSAÇÕES PARA NOVEMBRO 2025\n');
    
    // Buscar todas as transações de outubro
    const octoberTransactions = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: new Date('2025-10-01'),
          lt: new Date('2025-11-01')
        }
      },
      select: {
        id: true,
        description: true,
        date: true,
        amount: true
      }
    });
    
    console.log(`📊 Transações de outubro encontradas: ${octoberTransactions.length}\n`);
    
    if (octoberTransactions.length === 0) {
      console.log('⚠️  Nenhuma transação de outubro encontrada!');
      return;
    }
    
    // Mostrar transações
    octoberTransactions.forEach((t, i) => {
      const date = new Date(t.date);
      console.log(`  ${i + 1}. ${t.description} - R$ ${t.amount} (${date.toLocaleDateString('pt-BR')})`);
    });
    
    console.log('\n🔄 Movendo para novembro...\n');
    
    // Mover cada transação
    let moved = 0;
    for (const transaction of octoberTransactions) {
      const oldDate = new Date(transaction.date);
      const newDate = new Date(oldDate);
      newDate.setMonth(10); // Novembro (0-indexed)
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { date: newDate }
      });
      
      moved++;
      console.log(`  ✅ ${transaction.description}: ${oldDate.toLocaleDateString('pt-BR')} → ${newDate.toLocaleDateString('pt-BR')}`);
    }
    
    console.log(`\n🎉 ${moved} transações movidas para novembro!`);
    console.log('\n💡 Agora recarregue a página no navegador (Ctrl+R)');
    console.log('   Todas as transações devem aparecer no dashboard!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

moveToNovember();
