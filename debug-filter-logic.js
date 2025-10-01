// Script para testar a lógica de filtragem de datas
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFilterLogic() {
  try {
    console.log('🔍 TESTANDO LÓGICA DE FILTRAGEM...\n');
    
    // Buscar todas as transações
    const transactions = await prisma.transaction.findMany({
      include: {
        account: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    console.log('📊 Total de transações no banco:', transactions.length);
    console.log('\n📋 Todas as transações:');
    transactions.forEach((t, index) => {
      console.log(`${index + 1}. ${t.description} - ${t.date} (${typeof t.date})`);
    });
    
    // Simular a lógica de getPeriodDates para setembro 2025
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    const startDate = startOfMonth.toISOString();
    const endDate = endOfMonth.toISOString();
    
    console.log('\n🗓️ PERÍODO ATUAL:');
    console.log('Data início:', startDate);
    console.log('Data fim:', endDate);
    console.log('Data início slice:', startDate.slice(0, 10));
    console.log('Data fim slice:', endDate.slice(0, 10));
    
    // Testar filtro de período
    console.log('\n🔍 TESTANDO FILTRO DE PERÍODO:');
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date).toISOString().slice(0, 10);
      const startDateSlice = startDate.slice(0, 10);
      const endDateSlice = endDate.slice(0, 10);
      
      const isInPeriod = transactionDate >= startDateSlice && transactionDate <= endDateSlice;
      
      console.log(`Transação: ${transaction.description}`);
      console.log(`  Data original: ${transaction.date} (${typeof transaction.date})`);
      console.log(`  Data formatada: ${transactionDate}`);
      console.log(`  Comparação: ${transactionDate} >= ${startDateSlice} && ${transactionDate} <= ${endDateSlice}`);
      console.log(`  Resultado: ${isInPeriod ? '✅ INCLUÍDA' : '❌ EXCLUÍDA'}`);
      console.log('');
      
      return isInPeriod;
    });
    
    console.log('📊 Transações após filtro de período:', filteredTransactions.length);
    
    if (filteredTransactions.length > 0) {
      console.log('\n✅ Transações que passaram no filtro:');
      filteredTransactions.forEach((t, index) => {
        console.log(`${index + 1}. ${t.description} - ${new Date(t.date).toISOString().slice(0, 10)}`);
      });
    } else {
      console.log('\n❌ NENHUMA transação passou no filtro de período!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFilterLogic();