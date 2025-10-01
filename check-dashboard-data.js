const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== VERIFICAÇÃO DE DADOS DO DASHBOARD ===');
    
    // Data atual
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    console.log('Período:', startDate.toISOString(), 'até', endDate.toISOString());
    
    // Buscar transações do mês atual
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        category: true
      },
      orderBy: { date: 'desc' }
    });
    
    console.log('\nTransações encontradas:', transactions.length);
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach((t, index) => {
      const amount = Math.abs(Number(t.amount));
      console.log(`${index + 1}. ${t.type} - R$ ${amount} - ${t.description} - ${t.date.toISOString().split('T')[0]}`);
      
      if (t.type === 'income') {
        totalIncome += amount;
      } else if (t.type === 'expense') {
        totalExpenses += amount;
      }
    });
    
    const netIncome = totalIncome - totalExpenses;
    
    console.log('\n=== RESUMO CALCULADO ===');
    console.log('Total Receitas:', totalIncome);
    console.log('Total Despesas:', totalExpenses);
    console.log('Resultado (Receitas - Despesas):', netIncome);
    
    // Verificar contas
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      select: { id: true, name: true, balance: true }
    });
    
    console.log('\n=== CONTAS ATIVAS ===');
    let totalBalance = 0;
    accounts.forEach(acc => {
      const balance = Number(acc.balance);
      totalBalance += balance;
      console.log(`${acc.name}: R$ ${balance}`);
    });
    
    console.log('\nPatrimônio Total:', totalBalance);
    console.log('Número de contas ativas:', accounts.length);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();