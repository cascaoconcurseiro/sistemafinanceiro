const { PrismaClient } = require('@prisma/client');

async function testDashboardAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testando API do Dashboard...');
    
    // Simular a lógica da API
    const period = '30d';
    const days = parseInt(period.replace('d', ''));
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const endDate = new Date();
    
    console.log('📅 Período:', startDate.toISOString(), 'até', endDate.toISOString());
    
    // Buscar contas ativas
    const activeAccounts = await prisma.account.findMany({
      where: { isActive: true }
    });
    console.log('📊 Contas ativas:', activeAccounts.length);
    
    // Buscar transações
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    console.log('💰 Transações encontradas:', transactions.length);
    
    // Calcular totais
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    console.log('💵 Total receitas:', totalIncome);
    console.log('💸 Total despesas:', totalExpenses);
    
    const netIncome = totalIncome - totalExpenses;
    console.log('💰 Receita líquida:', netIncome);
    
    // Calcular saldo total
    const totalBalance = activeAccounts.reduce((sum, account) => sum + Number(account.balance), 0);
    console.log('💰 Saldo total:', totalBalance);
    
    // Breakdown por categoria
    const categoryBreakdown = {};
    transactions.forEach(t => {
      const categoryName = t.category || 'Outros';
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = { amount: 0, count: 0 };
      }
      if (t.type === 'debit') {
        categoryBreakdown[categoryName].amount += Number(t.amount);
        categoryBreakdown[categoryName].count += 1;
      }
    });
    
    console.log('🏷️ Breakdown por categoria:', categoryBreakdown);
    
    // Transações recentes
    const recentTransactions = transactions.slice(0, 10);
    console.log('📋 Transações recentes:', recentTransactions.length);
    
    // Dados mensais
    const monthlyData = {};
    transactions.forEach(t => {
      const monthKey = t.date.toISOString().substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      if (t.type === 'credit') {
        monthlyData[monthKey].income += Number(t.amount);
      } else if (t.type === 'debit') {
        monthlyData[monthKey].expenses += Number(t.amount);
      }
    });
    
    console.log('📈 Dados mensais:', monthlyData);
    
    console.log('✅ Teste da API do Dashboard concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardAPI();