const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreToOctober() {
  try {
    console.log('📅 RESTAURANDO TRANSAÇÕES PARA OUTUBRO 2025\n');
    
    // Buscar todas as transações de novembro
    const novemberTransactions = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: new Date('2025-11-01'),
          lt: new Date('2025-12-01')
        }
      },
      select: {
        id: true,
        description: true,
        date: true,
        amount: true
      }
    });
    
    console.log(`📊 Transações de novembro encontradas: ${novemberTransactions.length}\n`);
    
    if (novemberTransactions.length === 0) {
      console.log('⚠️  Nenhuma transação de novembro encontrada!');
      return;
    }
    
    // Mostrar transações
    novemberTransactions.forEach((t, i) => {
      const date = new Date(t.date);
      console.log(`  ${i + 1}. ${t.description} - R$ ${t.amount} (${date.toLocaleDateString('pt-BR')})`);
    });
    
    console.log('\n🔄 Restaurando para outubro...\n');
    
    // Restaurar cada transação
    let restored = 0;
    for (const transaction of novemberTransactions) {
      const oldDate = new Date(transaction.date);
      const newDate = new Date(oldDate);
      newDate.setMonth(9); // Outubro (0-indexed)
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { date: newDate }
      });
      
      restored++;
      console.log(`  ✅ ${transaction.description}: ${oldDate.toLocaleDateString('pt-BR')} → ${newDate.toLocaleDateString('pt-BR')}`);
    }
    
    console.log(`\n🎉 ${restored} transações restauradas para outubro!`);
    console.log('\n💡 Agora vou corrigir o Dashboard para mostrar OUTUBRO por padrão\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

restoreToOctober();
