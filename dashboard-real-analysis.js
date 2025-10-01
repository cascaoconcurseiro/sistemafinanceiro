const fetch = require('node-fetch');

async function analyzeRealData() {
  try {
    console.log('=== ANÁLISE DOS DADOS REAIS DA API ===\n');
    
    // Buscar todas as transações
    const response = await fetch('http://localhost:3000/api/transactions?limit=100');
    const transactions = await response.json();
    
    console.log(`Total de transações encontradas: ${transactions.length}\n`);
    
    if (transactions.length === 0) {
      console.log('❌ Nenhuma transação encontrada na API');
      return;
    }
    
    // Listar todas as transações para debug
    console.log('=== TODAS AS TRANSAÇÕES ===');
    transactions.forEach((t, index) => {
      console.log(`${index + 1}. ${t.description} - ${t.type} - R$ ${t.amount} - ${t.date} - ${t.category}`);
    });
    
    // Agrupar por mês/ano
    const transactionsByMonth = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!transactionsByMonth[monthKey]) {
        transactionsByMonth[monthKey] = [];
      }
      transactionsByMonth[monthKey].push(transaction);
    });
    
    console.log('\n=== TRANSAÇÕES POR MÊS ===');
    Object.keys(transactionsByMonth).sort().forEach(month => {
      const monthTransactions = transactionsByMonth[month];
      console.log(`\n📅 ${month}: ${monthTransactions.length} transações`);
      
      let income = 0;
      let expenses = 0;
      const categories = {};
      
      monthTransactions.forEach(t => {
        if (t.type === 'income') {
          income += t.amount;
        } else {
          expenses += t.amount;
        }
        
        if (!categories[t.category]) {
          categories[t.category] = 0;
        }
        categories[t.category] += t.amount;
      });
      
      console.log(`   💰 Receitas: R$ ${income.toFixed(2)}`);
      console.log(`   💸 Despesas: R$ ${expenses.toFixed(2)}`);
      console.log(`   📊 Resultado: R$ ${(income - expenses).toFixed(2)}`);
      
      console.log('   📋 Por categoria:');
      Object.entries(categories).forEach(([cat, value]) => {
        console.log(`      - ${cat}: R$ ${value.toFixed(2)}`);
      });
    });
    
    // Análise do mês atual
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`\n=== ANÁLISE DO MÊS ATUAL (${currentMonth}) ===`);
    
    const currentMonthTransactions = transactionsByMonth[currentMonth] || [];
    
    if (currentMonthTransactions.length === 0) {
      console.log('❌ Nenhuma transação encontrada para o mês atual');
      console.log('💡 O dashboard pode estar mostrando valores zerados por isso');
    } else {
      let currentIncome = 0;
      let currentExpenses = 0;
      
      currentMonthTransactions.forEach(t => {
        if (t.type === 'income') {
          currentIncome += t.amount;
        } else {
          currentExpenses += t.amount;
        }
      });
      
      console.log(`✅ ${currentMonthTransactions.length} transações no mês atual`);
      console.log(`💰 Receitas: R$ ${currentIncome.toFixed(2)}`);
      console.log(`💸 Despesas: R$ ${currentExpenses.toFixed(2)}`);
      console.log(`📊 Resultado: R$ ${(currentIncome - currentExpenses).toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao analisar dados:', error.message);
  }
}

analyzeRealData();