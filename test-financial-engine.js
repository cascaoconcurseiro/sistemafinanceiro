/**
 * Script de teste para auditoria do Financial Engine
 * Compara cálculos do Financial Engine com dados diretos das APIs
 */

// Usar fetch nativo do Node.js (disponível a partir da versão 18)

// Simular dados das APIs
async function fetchAPIData() {
  try {
    console.log('🔍 Buscando dados das APIs...\n');
    
    // Buscar contas
    const accountsResponse = await fetch('http://localhost:3000/api/accounts');
    const accountsData = await accountsResponse.json();
    console.log('📊 Dados das Contas:');
    console.log(JSON.stringify(accountsData, null, 2));
    console.log('\n');
    
    // Buscar transações
    const transactionsResponse = await fetch('http://localhost:3000/api/transactions');
    const transactionsData = await transactionsResponse.json();
    console.log('💰 Dados das Transações:');
    console.log(JSON.stringify(transactionsData, null, 2));
    console.log('\n');
    
    // Buscar summary das transações
    const summaryResponse = await fetch('http://localhost:3000/api/transactions/summary');
    const summaryData = await summaryResponse.json();
    console.log('📈 Summary das Transações:');
    console.log(JSON.stringify(summaryData, null, 2));
    console.log('\n');
    
    return {
      accounts: accountsData,
      transactions: transactionsData,
      summary: summaryData
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados das APIs:', error);
    return null;
  }
}

// Simular cálculos do Financial Engine
function simulateFinancialEngine(transactions, accounts) {
  console.log('🧮 Simulando cálculos do Financial Engine...\n');
  
  // Garantir que são arrays
  const validTransactions = Array.isArray(transactions) ? transactions : [];
  const validAccounts = Array.isArray(accounts) ? accounts : [];
  
  console.log(`📝 Transações válidas: ${validTransactions.length}`);
  console.log(`🏦 Contas válidas: ${validAccounts.length}\n`);
  
  // Filtrar transferências
  const nonTransferTransactions = validTransactions.filter(
    t => t.category !== 'Transferência' && t.category !== 'Transfer'
  );
  
  console.log(`🔄 Transações não-transferência: ${nonTransferTransactions.length}\n`);
  
  // Calcular receitas
  const incomeTransactions = nonTransferTransactions.filter(t => t.type === 'income');
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  console.log('💵 Receitas:');
  console.log(`   Quantidade: ${incomeTransactions.length}`);
  console.log(`   Total: R$ ${totalIncome.toFixed(2)}\n`);
  
  // Calcular despesas
  const expenseTransactions = nonTransferTransactions.filter(t => t.type === 'expense');
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  console.log('💸 Despesas:');
  console.log(`   Quantidade: ${expenseTransactions.length}`);
  console.log(`   Total: R$ ${totalExpenses.toFixed(2)}\n`);
  
  // Calcular saldo líquido
  const netIncome = totalIncome - totalExpenses;
  console.log(`📊 Saldo Líquido: R$ ${netIncome.toFixed(2)}\n`);
  
  // Calcular saldo total das contas
  let totalBalance = 0;
  console.log('🏦 Análise das Contas:');
  validAccounts.forEach(account => {
    let accountBalance = account.balance;
    if (account.type === 'credit') {
      // Para cartões de crédito, saldo negativo é dívida
      accountBalance = Math.min(0, account.balance);
    }
    totalBalance += accountBalance;
    
    console.log(`   ${account.name} (${account.type}): R$ ${account.balance.toFixed(2)} -> R$ ${accountBalance.toFixed(2)}`);
  });
  
  console.log(`\n💰 Saldo Total das Contas: R$ ${totalBalance.toFixed(2)}\n`);
  
  return {
    totalBalance,
    totalIncome,
    totalExpenses,
    netIncome,
    lastUpdated: new Date().toISOString()
  };
}

// Função principal
async function auditFinancialEngine() {
  console.log('🔍 AUDITORIA DO FINANCIAL ENGINE\n');
  console.log('='.repeat(50) + '\n');
  
  const apiData = await fetchAPIData();
  if (!apiData) {
    console.log('❌ Não foi possível buscar dados das APIs');
    return;
  }
  
  console.log('='.repeat(50) + '\n');
  
  const engineResult = simulateFinancialEngine(apiData.transactions, apiData.accounts);
  
  console.log('='.repeat(50) + '\n');
  console.log('📋 RESULTADO FINAL DO FINANCIAL ENGINE:');
  console.log(JSON.stringify(engineResult, null, 2));
  console.log('\n');
  
  console.log('🔍 COMPARAÇÃO COM SUMMARY DA API:');
  console.log('API Summary:', JSON.stringify(apiData.summary, null, 2));
  console.log('\n');
  
  // Comparar resultados
  console.log('⚖️ ANÁLISE COMPARATIVA:');
  console.log(`Financial Engine - Total Balance: R$ ${engineResult.totalBalance.toFixed(2)}`);
  console.log(`API Summary - Balance: R$ ${apiData.summary.balance?.toFixed(2) || '0.00'}`);
  console.log(`Diferença: R$ ${(engineResult.totalBalance - (apiData.summary.balance || 0)).toFixed(2)}\n`);
  
  console.log(`Financial Engine - Total Income: R$ ${engineResult.totalIncome.toFixed(2)}`);
  console.log(`API Summary - Income: R$ ${apiData.summary.income?.toFixed(2) || '0.00'}`);
  console.log(`Diferença: R$ ${(engineResult.totalIncome - (apiData.summary.income || 0)).toFixed(2)}\n`);
  
  console.log(`Financial Engine - Total Expenses: R$ ${engineResult.totalExpenses.toFixed(2)}`);
  console.log(`API Summary - Expense: R$ ${apiData.summary.expense?.toFixed(2) || '0.00'}`);
  console.log(`Diferença: R$ ${(engineResult.totalExpenses - (apiData.summary.expense || 0)).toFixed(2)}\n`);
  
  console.log('✅ Auditoria do Financial Engine concluída!');
}

// Executar auditoria
auditFinancialEngine().catch(console.error);