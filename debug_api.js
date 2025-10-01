const { PrismaClient } = require('@prisma/client');

async function debugAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testando conexão com o banco...');
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');
    
    // Verificar contas ativas
    const activeAccounts = await prisma.account.findMany({
      where: { isActive: true }
    });
    console.log('📊 Contas ativas encontradas:', activeAccounts.length);
    if (activeAccounts.length > 0) {
      console.log('Primeira conta:', activeAccounts[0]);
    }
    
    // Verificar transações
    const transactions = await prisma.transaction.findMany({
      take: 5
    });
    console.log('💰 Transações encontradas:', transactions.length);
    if (transactions.length > 0) {
      console.log('Primeira transação:', transactions[0]);
      console.log('Tipos de transação únicos:', [...new Set(transactions.map(t => t.type))]);
    }
    
    // Testar cálculos como na API
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const periodTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate
        }
      }
    });
    
    console.log('📈 Transações dos últimos 30 dias:', periodTransactions.length);
    
    // Testar cálculos de totais
    const totalIncome = periodTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = periodTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    console.log('💵 Total de receitas:', totalIncome);
    console.log('💸 Total de despesas:', totalExpenses);
    
    // Testar cálculo de saldo total
    const totalBalance = activeAccounts.reduce((sum, account) => sum + Number(account.balance), 0);
    console.log('💰 Saldo total:', totalBalance);
    
    console.log('✅ Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAPI();