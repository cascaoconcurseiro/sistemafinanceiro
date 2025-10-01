const fetch = require('node-fetch');

async function testCategoryDisplay() {
  try {
    console.log('=== TESTE DE EXIBIÇÃO DE CATEGORIAS ===');
    
    // Testar a API do dashboard
    const response = await fetch('http://localhost:3000/api/dashboard');
    const data = await response.json();
    
    console.log('Status da API:', response.status);
    console.log('Dados da API:');
    console.log('- Total Expenses:', data.totalExpenses);
    console.log('- Category Breakdown:', JSON.stringify(data.categoryBreakdown, null, 2));
    
    // Verificar se há dados de categoria
    const hasCategories = data.categoryBreakdown && Object.keys(data.categoryBreakdown).length > 0;
    console.log('\n=== ANÁLISE ===');
    console.log('Tem categorias:', hasCategories);
    
    if (hasCategories) {
      console.log('Categorias encontradas:');
      Object.entries(data.categoryBreakdown).forEach(([category, amount]) => {
        const percentage = data.totalExpenses > 0 ? ((amount / data.totalExpenses) * 100).toFixed(1) : 0;
        console.log(`- ${category}: R$ ${amount} (${percentage}%)`);
      });
    } else {
      console.log('❌ Nenhuma categoria encontrada na API');
    }
    
  } catch (error) {
    console.error('Erro ao testar:', error.message);
  }
}

testCategoryDisplay();