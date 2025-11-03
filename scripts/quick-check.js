const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickCheck() {
  try {
    console.log('🔍 VERIFICAÇÃO RÁPIDA\n');
    
    // 1. Verificar se há usuário logado (simular)
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    
    console.log('👤 Usuários disponíveis:');
    users.forEach(u => console.log(`   - ${u.email} (${u.name || 'Sem nome'})`));
    
    // 2. Pegar o primeiro usuário para teste
    const userId = users[0]?.id;
    
    if (!userId) {
      console.log('\n❌ Nenhum usuário encontrado!');
      return;
    }
    
    console.log(`\n🔍 Verificando dados do usuário: ${users[0].email}\n`);
    
    // 3. Contar transações do usuário
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null
      },
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        type: true
      },
      orderBy: { date: 'desc' },
      take: 10
    });
    
    console.log(`📊 Transações encontradas: ${transactions.length}`);
    
    if (transactions.length > 0) {
      console.log('\n📋 Últimas transações:');
      transactions.forEach((t, i) => {
        const date = new Date(t.date);
        const dateStr = date.toLocaleDateString('pt-BR');
        console.log(`   ${i + 1}. ${t.description} - R$ ${t.amount} (${dateStr})`);
      });
    } else {
      console.log('\n⚠️  Nenhuma transação encontrada para este usuário!');
    }
    
    // 4. Contar contas do usuário
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true, name: true, balance: true, type: true }
    });
    
    console.log(`\n🏦 Contas encontradas: ${accounts.length}`);
    if (accounts.length > 0) {
      accounts.forEach(a => {
        console.log(`   - ${a.name} (${a.type}): R$ ${a.balance}`);
      });
    }
    
    // 5. Verificar categorias
    const categories = await prisma.category.count({
      where: { userId }
    });
    
    console.log(`\n📁 Categorias: ${categories}`);
    
    console.log('\n✅ Verificação concluída!');
    console.log('\n💡 DICA: Se você não vê transações na interface:');
    console.log('   1. Verifique se está logado com o usuário correto');
    console.log('   2. Abra o console do navegador (F12)');
    console.log('   3. Procure por erros ou logs de filtro');
    console.log('   4. Clique no botão "Todas" para desativar o filtro de período');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck();
