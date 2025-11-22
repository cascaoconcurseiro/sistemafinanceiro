const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAllDates() {
  try {
    console.log('🔧 CORRIGINDO TODAS AS DATAS PARA OUTUBRO 2025\n');
    
    // Buscar TODAS as transações de 2025 (exceto janeiro)
    const transactions2025 = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: new Date('2025-01-01'),
          lt: new Date('2026-01-01')
        }
      },
      select: {
        id: true,
        description: true,
        date: true,
        amount: true
      },
      orderBy: { date: 'asc' }
    });
    
    console.log(`📊 Transações de 2025 encontradas: ${transactions2025.length}\n`);
    
    if (transactions2025.length === 0) {
      console.log('⚠️  Nenhuma transação de 2025 encontrada!');
      return;
    }
    
    // Mostrar transações
    console.log('📋 Transações atuais:');
    transactions2025.forEach((t, i) => {
      const date = new Date(t.date);
      console.log(`  ${i + 1}. ${t.description} - R$ ${t.amount} (${date.toLocaleDateString('pt-BR')})`);
    });
    
    console.log('\n🔄 Movendo TODAS para 30/10/2025...\n');
    
    // Mover TODAS para 30 de outubro
    let moved = 0;
    const targetDate = new Date('2025-10-30T00:00:00.000Z');
    
    for (const transaction of transactions2025) {
      const oldDate = new Date(transaction.date);
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { date: targetDate }
      });
      
      moved++;
      console.log(`  ✅ ${transaction.description}: ${oldDate.toLocaleDateString('pt-BR')} → 30/10/2025`);
    }
    
    console.log(`\n🎉 ${moved} transações movidas para 30/10/2025!`);
    console.log('\n💡 Agora TODAS as transações estão em OUTUBRO 2025');
    console.log('   Recarregue a página no navegador (Ctrl+R)\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllDates();
