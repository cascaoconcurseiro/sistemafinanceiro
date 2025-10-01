const fetch = require('node-fetch');

async function debugCategoryComponent() {
  try {
    console.log('=== DEBUG DO CATEGORY BUDGET CARD ===');
    
    // 1. Testar a API do dashboard
    console.log('\n1. TESTANDO API DO DASHBOARD:');
    const response = await fetch('http://localhost:3000/api/dashboard');
    const dashboardData = await response.json();
    
    console.log('Status da API:', response.status);
    console.log('dashboardData.categoryBreakdown:', JSON.stringify(dashboardData.categoryBreakdown, null, 2));
    console.log('dashboardData.totalExpenses:', dashboardData.totalExpenses);
    
    // 2. Testar a API de transações
    console.log('\n2. TESTANDO API DE TRANSAÇÕES:');
    const transactionsResponse = await fetch('http://localhost:3000/api/transactions');
    const transactions = await transactionsResponse.json();
    
    console.log('Status da API de transações:', transactionsResponse.status);
    console.log('Total de transações:', transactions.length);
    
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    console.log('Transações de despesa:', expenseTransactions.length);
    
    expenseTransactions.forEach((t, index) => {
      console.log(`  ${index + 1}. ${t.description} - ${t.category || 'Outros'} - R$ ${Math.abs(t.amount)}`);
    });
    
    // 3. Simular o processamento do CategoryBudgetCard
    console.log('\n3. SIMULANDO PROCESSAMENTO DO COMPONENT:');
    
    const categoryBreakdown = dashboardData?.categoryBreakdown || {};
    console.log('categoryBreakdown usado:', JSON.stringify(categoryBreakdown, null, 2));
    
    // Converter o objeto categoryBreakdown em array para exibição
    const categoryData = Object.entries(categoryBreakdown).map(([category, total]) => ({
      category,
      total: total,
      count: expenseTransactions.filter(t => (t.category || 'Outros') === category).length,
      percentage: dashboardData?.totalExpenses > 0 ? ((total) / dashboardData.totalExpenses) * 100 : 0
    }));
    
    console.log('categoryData processado:');
    categoryData.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.category}: R$ ${item.total} (${item.count} transações, ${item.percentage.toFixed(1)}%)`);
    });
    
    console.log('\n4. ANÁLISE:');
    console.log('- Tem dados na API?', Object.keys(categoryBreakdown).length > 0);
    console.log('- categoryData.length:', categoryData.length);
    console.log('- Deveria mostrar dados?', categoryData.length > 0 ? 'SIM' : 'NÃO');
    
    if (categoryData.length === 0) {
      console.log('❌ PROBLEMA: categoryData está vazio!');
      console.log('Possíveis causas:');
      console.log('- dashboardData é null/undefined');
      console.log('- categoryBreakdown está vazio');
      console.log('- Erro no processamento dos dados');
    } else {
      console.log('✅ categoryData tem dados, deveria aparecer no componente');
    }
    
  } catch (error) {
    console.error('Erro no debug:', error.message);
  }
}

debugCategoryComponent();