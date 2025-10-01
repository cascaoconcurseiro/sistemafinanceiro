const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPeriodSummary() {
  console.log('=== DEBUG: PERIOD SUMMARY ===\n');

  try {
    // Buscar todas as transações
    const allTransactions = await prisma.transaction.findMany({
      include: {
        account: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log(`📊 Total de transações no banco: ${allTransactions.length}\n`);

    // Mostrar todas as transações com detalhes
    console.log('📋 TODAS AS TRANSAÇÕES:');
    allTransactions.forEach((t, index) => {
      console.log(`${index + 1}. ${t.description} | ${t.type} | ${t.status} | R$ ${t.amount} | ${t.date.toISOString().split('T')[0]}`);
    });
    console.log('');

    // Definir período atual (setembro 2025) - corrigindo para setembro
    const startDate = new Date('2025-09-01');
    const endDate = new Date('2025-09-30');
    
    console.log(`🗓️ PERÍODO ANALISADO:`);
    console.log(`Data início: ${startDate.toISOString().split('T')[0]}`);
    console.log(`Data fim: ${endDate.toISOString().split('T')[0]}\n`);

    // Filtrar transações do período
    const periodTransactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const isInPeriod = transactionDate >= startDate && transactionDate <= endDate;
      
      console.log(`🔍 Verificando: ${t.description} | Data: ${t.date.toISOString().split('T')[0]} | No período: ${isInPeriod} | Status: ${t.status}`);
      
      return isInPeriod;
    });

    console.log(`\n📊 TRANSAÇÕES DO PERÍODO (${periodTransactions.length}):`);
    periodTransactions.forEach((t, index) => {
      console.log(`${index + 1}. ${t.description} | ${t.type} | ${t.status} | R$ ${t.amount} | ${t.date.toISOString().split('T')[0]}`);
    });

    // Filtrar apenas transações completadas
    const completedTransactions = periodTransactions.filter(t => t.status === 'completed' || t.status === 'cleared');
    
    console.log(`\n✅ TRANSAÇÕES COMPLETADAS/CLEARED (${completedTransactions.length}):`);
    completedTransactions.forEach((t, index) => {
      console.log(`${index + 1}. ${t.description} | ${t.type} | ${t.status} | R$ ${t.amount} | ${t.date.toISOString().split('T')[0]}`);
    });

    // Calcular receitas e despesas - CORRIGINDO OS TIPOS
    const income = completedTransactions
      .filter(t => t.type === 'credit') // Era 'income', mas no banco é 'credit'
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = completedTransactions
      .filter(t => t.type === 'debit') // Era 'expense', mas no banco é 'debit'
      .reduce((sum, t) => sum + t.amount, 0);

    console.log(`\n💰 RESUMO DO PERÍODO:`);
    console.log(`Receitas: R$ ${income}`);
    console.log(`Despesas: R$ ${expenses}`);
    console.log(`Saldo: R$ ${income - expenses}`);

    // Verificar se há problema com status
    console.log(`\n🔍 ANÁLISE DE STATUS:`);
    const statusCounts = {};
    allTransactions.forEach(t => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    // Verificar transações por tipo
    console.log(`\n📊 ANÁLISE POR TIPO:`);
    const typeCounts = {};
    allTransactions.forEach(t => {
      typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
    });
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Erro ao debugar period summary:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPeriodSummary();