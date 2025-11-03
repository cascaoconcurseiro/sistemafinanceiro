const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnose() {
  try {
    console.log('🔍 DIAGNÓSTICO DO BANCO DE DADOS\n');
    
    // 1. Contar transações
    const transactionCount = await prisma.transaction.count();
    console.log(`📊 Total de transações: ${transactionCount}`);
    
    // 2. Contar transações não deletadas
    const activeTransactions = await prisma.transaction.count({
      where: { deletedAt: null }
    });
    console.log(`✅ Transações ativas: ${activeTransactions}`);
    
    // 3. Contar transações deletadas
    const deletedTransactions = await prisma.transaction.count({
      where: { deletedAt: { not: null } }
    });
    console.log(`🗑️  Transações deletadas: ${deletedTransactions}`);
    
    // 4. Listar últimas 10 transações
    console.log('\n📋 Últimas 10 transações:');
    const recent = await prisma.transaction.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        type: true,
        accountId: true,
        categoryId: true,
        createdAt: true
      }
    });
    
    recent.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.description} - R$ ${t.amount} (${t.date})`);
    });
    
    // 5. Contar contas
    const accountCount = await prisma.account.count();
    console.log(`\n🏦 Total de contas: ${accountCount}`);
    
    // 6. Contar categorias
    const categoryCount = await prisma.category.count();
    console.log(`📁 Total de categorias: ${categoryCount}`);
    
    // 7. Verificar usuários
    const userCount = await prisma.user.count();
    console.log(`👤 Total de usuários: ${userCount}`);
    
    // 8. Verificar transações órfãs (sem conta)
    const orphanTransactions = await prisma.transaction.count({
      where: {
        deletedAt: null,
        accountId: null,
        creditCardId: null
      }
    });
    console.log(`\n⚠️  Transações órfãs (sem conta): ${orphanTransactions}`);
    
    // 9. Verificar transações sem categoria
    const noCategoryTransactions = await prisma.transaction.count({
      where: {
        deletedAt: null,
        categoryId: null
      }
    });
    console.log(`⚠️  Transações sem categoria: ${noCategoryTransactions}`);
    
    console.log('\n✅ Diagnóstico concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao diagnosticar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
