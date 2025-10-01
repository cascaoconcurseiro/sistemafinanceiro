const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFinalCheck() {
  try {
    console.log('=== DEBUG FINAL CHECK ===');
    
    // 1. Buscar todas as transações (sem include de category pois não é relação)
    const allTransactions = await prisma.transaction.findMany({
      include: {
        account: true
      },
      orderBy: { date: 'desc' }
    });
    
    console.log('\n📊 Total de transações no banco:', allTransactions.length);
    
    // 2. Simular o período atual (setembro 2025)
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 1);
    
    console.log('\n📅 Período atual:');
    console.log('Início:', startOfMonth.toISOString().slice(0, 10));
    console.log('Fim:', endOfMonth.toISOString().slice(0, 10));
    
    // 3. Filtrar por período
    const periodFiltered = allTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfMonth && transactionDate < endOfMonth;
    });
    
    console.log('\n🔍 Transações no período atual:', periodFiltered.length);
    periodFiltered.forEach(t => {
      console.log(`  - ${t.description} (${new Date(t.date).toISOString().slice(0, 10)}) - Status: ${t.status} - Tipo: ${t.type} - Categoria: ${t.category}`);
    });
    
    // 4. Verificar status das transações
    const statusCounts = {};
    periodFiltered.forEach(t => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });
    
    console.log('\n📈 Status das transações no período:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // 5. Verificar se há problemas com contas
    console.log('\n🏦 Verificação de contas:');
    periodFiltered.forEach(t => {
      console.log(`  Transação: ${t.description}`);
      console.log(`    Conta: ${t.account?.name || 'CONTA NÃO ENCONTRADA'} (ID: ${t.accountId})`);
      console.log(`    Categoria: ${t.category} (campo direto)`);
      console.log('');
    });
    
    // 6. Buscar contas disponíveis
    const accounts = await prisma.account.findMany();
    
    console.log('\n🏦 Contas disponíveis:', accounts.length);
    accounts.forEach(a => console.log(`  - ${a.name} (ID: ${a.id})`));
    
    // 7. Verificar categorias únicas nas transações
    const uniqueCategories = [...new Set(allTransactions.map(t => t.category))];
    console.log('\n📂 Categorias únicas nas transações:', uniqueCategories.length);
    uniqueCategories.forEach(c => console.log(`  - ${c}`));
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFinalCheck();