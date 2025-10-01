const { PrismaClient } = require('@prisma/client');

async function debugTransactions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Investigando transações no banco de dados...\n');
    
    // 1. Contar total de transações
    const totalTransactions = await prisma.transaction.count();
    console.log(`📊 Total de transações no banco: ${totalTransactions}`);
    
    // 2. Buscar todas as transações (limitado a 20 para não sobrecarregar)
    const allTransactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      take: 20,
      include: {
        account: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`\n📋 Primeiras ${allTransactions.length} transações:`);
    allTransactions.forEach((t, index) => {
      const transactionDate = new Date(t.date);
      console.log(`${index + 1}. ${t.description} - ${t.account?.name || 'Conta não encontrada'} - R$ ${Number(t.amount).toFixed(2)} (${transactionDate.toLocaleDateString('pt-BR')} - ${t.date})`);
    });
    
    // Verificar período atual
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    
    console.log(`\n📅 Período atual (mês): ${currentMonthStart} até ${currentMonthEnd}`);
    
    // Verificar quantas transações estão no período atual
    const currentMonthTransactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.date).toISOString().slice(0, 10); // YYYY-MM-DD
      return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
    });
    
    console.log(`📊 Transações no mês atual: ${currentMonthTransactions.length}`);
    currentMonthTransactions.forEach((t, index) => {
      console.log(`  ${index + 1}. ${t.description} - ${new Date(t.date).toISOString().slice(0, 10)}`);
    });
    
    // 3. Verificar se há transações com transferId (transferências)
    const transferTransactions = await prisma.transaction.findMany({
      where: {
        transferId: { not: null }
      },
      take: 10,
      include: {
        account: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`\n🔄 Transações com transferId (transferências): ${transferTransactions.length}`);
    transferTransactions.forEach((t, index) => {
      console.log(`${index + 1}. ${t.description} - Conta: ${t.account?.name} - Tipo: ${t.transferType} - R$ ${Number(t.amount).toFixed(2)}`);
    });
    
    // 4. Verificar contas disponíveis
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        type: true
      }
    });
    
    console.log(`\n🏦 Contas disponíveis: ${accounts.length}`);
    accounts.forEach((acc, index) => {
      console.log(`${index + 1}. ${acc.name} (${acc.type}) - ID: ${acc.id}`);
    });
    
    // 5. Simular a chamada da API
    console.log('\n🌐 Simulando chamada da API...');
    const apiResult = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      include: {
        account: true
      }
    });
    
    console.log(`API retornaria: ${apiResult.length} transações`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTransactions();