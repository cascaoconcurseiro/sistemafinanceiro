const fetch = require('node-fetch');

async function debugCategoryData() {
  try {
    const response = await fetch('http://localhost:3000/api/dashboard');
    const data = await response.json();
    
    console.log('=== DEBUG CATEGORY DATA ===');
    console.log('Total Income:', data.totalIncome);
    console.log('Total Expenses:', data.totalExpenses);
    console.log('Category Breakdown:', data.categoryBreakdown);
    console.log('Recent Transactions:', data.recentTransactions?.length || 0);
    
    if (data.recentTransactions) {
      console.log('\n=== RECENT TRANSACTIONS ===');
      data.recentTransactions.forEach((t, i) => {
        console.log(`${i + 1}. ${t.description} - ${t.category} - ${t.amount} - ${t.type}`);
      });
    }
    
    // Verificar se há dados de categoria
    const categoryBreakdown = data.categoryBreakdown || {};
    const hasCategories = Object.keys(categoryBreakdown).length > 0;
    
    console.log('\n=== CATEGORY ANALYSIS ===');
    console.log('Has categories:', hasCategories);
    console.log('Number of categories:', Object.keys(categoryBreakdown).length);
    
    if (hasCategories) {
      Object.entries(categoryBreakdown).forEach(([category, total]) => {
        const percentage = data.totalExpenses > 0 ? ((total / data.totalExpenses) * 100) : 0;
        console.log(`${category}: R$ ${total} (${percentage.toFixed(1)}%)`);
      });
    }
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
}

debugCategoryData();