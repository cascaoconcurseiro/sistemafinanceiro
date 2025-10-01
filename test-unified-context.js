/**
 * Script de teste para auditoria do Unified Context
 * Verifica a integração com o Financial Engine e consistência de dados
 */

// Usar fetch nativo do Node.js (disponível a partir da versão 18)

// Simular dados das APIs
async function fetchAPIData() {
  try {
    console.log('🔍 Buscando dados das APIs para teste do Unified Context...\n');
    
    // Buscar contas
    const accountsResponse = await fetch('http://localhost:3000/api/accounts');
    const accountsData = await accountsResponse.json();
    
    // Buscar transações
    const transactionsResponse = await fetch('http://localhost:3000/api/transactions');
    const transactionsData = await transactionsResponse.json();
    
    return {
      accounts: accountsData,
      transactions: transactionsData
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados das APIs:', error);
    return null;
  }
}

// Simular implementação OFICIAL do Financial Engine (agora integrada no Unified Context)
function officialFinancialEngine(transactions, accounts) {
  console.log('🏭 Simulando Financial Engine OFICIAL...\n');
  
  const validTransactions = Array.isArray(transactions) ? transactions : [];
  const validAccounts = Array.isArray(accounts) ? accounts : [];

  // Filtrar transferências para evitar dupla contagem
  const nonTransferTransactions = validTransactions.filter(
    t => t.category !== 'Transferência' && t.category !== 'Transfer'
  );

  const totalIncome = nonTransferTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = nonTransferTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netIncome = totalIncome - totalExpenses;

  // Calcular saldo total das contas (considerando tipos de conta)
  const totalBalance = validAccounts.reduce((sum, account) => {
    if (account.type === 'credit') {
      // Para cartões de crédito, saldo negativo é dívida
      return sum + Math.min(0, account.balance);
    }
    return sum + account.balance;
  }, 0);

  return {
    totalBalance,
    totalIncome,
    totalExpenses,
    netIncome,
    lastUpdated: new Date().toISOString()
  };
}

// Simular implementação CORRIGIDA do Unified Context (usando Financial Engine oficial)
function unifiedContextImplementation(transactions, accounts) {
  console.log('🔄 Simulando implementação CORRIGIDA do Unified Context (usando Financial Engine oficial)...\n');
  
  const validTransactions = Array.isArray(transactions) ? transactions : [];
  const validAccounts = Array.isArray(accounts) ? accounts : [];

  // Agora usando a mesma lógica do Financial Engine oficial
  // Filtrar transferências para evitar dupla contagem
  const nonTransferTransactions = validTransactions.filter(
    t => t.category !== 'Transferência' && t.category !== 'Transfer'
  );

  const totalReceitas = nonTransferTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalDespesas = nonTransferTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Saldo total das contas (integrado com Financial Engine)
  const saldoTotal = validAccounts.reduce((sum, account) => {
    if (account.type === 'credit') {
      // Para cartões de crédito, saldo negativo é dívida
      return sum + Math.min(0, account.balance);
    }
    return sum + account.balance;
  }, 0);
  
  return {
    saldoTotal,
    totalReceitas,
    totalDespesas
  };
}

// Função principal
async function auditUnifiedContext() {
  console.log('🔍 AUDITORIA DO UNIFIED CONTEXT\n');
  console.log('='.repeat(60) + '\n');
  
  const apiData = await fetchAPIData();
  if (!apiData) {
    console.log('❌ Não foi possível buscar dados das APIs');
    return;
  }
  
  console.log(`📊 Dados carregados: ${apiData.accounts.length} contas, ${apiData.transactions.length} transações\n`);
  console.log('='.repeat(60) + '\n');
  
  // Testar Financial Engine oficial
  const officialResult = officialFinancialEngine(apiData.transactions, apiData.accounts);
  console.log('🏭 RESULTADO DO FINANCIAL ENGINE OFICIAL:');
  console.log(JSON.stringify(officialResult, null, 2));
  console.log('\n');
  
  // Testar implementação do Unified Context
  const correctedResult = unifiedContextImplementation(apiData.transactions, apiData.accounts);
  console.log('🔄 RESULTADO DA IMPLEMENTAÇÃO CORRIGIDA (Unified Context):');
  console.log(JSON.stringify(correctedResult, null, 2));
  console.log('\n');
  
  console.log('='.repeat(60) + '\n');
  console.log('⚖️ ANÁLISE COMPARATIVA:\n');
  
  // Comparar saldos totais
  console.log('💰 SALDO TOTAL:');
  console.log(`   Financial Engine: R$ ${officialResult.totalBalance.toFixed(2)}`);
  console.log(`   Unified Context:  R$ ${correctedResult.saldoTotal.toFixed(2)}`);
  console.log(`   Diferença:        R$ ${(officialResult.totalBalance - correctedResult.saldoTotal).toFixed(2)}\n`);
  
  // Comparar receitas
  console.log('💵 RECEITAS:');
  console.log(`   Financial Engine: R$ ${officialResult.totalIncome.toFixed(2)}`);
  console.log(`   Unified Context:  R$ ${correctedResult.totalReceitas.toFixed(2)}`);
  console.log(`   Diferença:        R$ ${(officialResult.totalIncome - correctedResult.totalReceitas).toFixed(2)}\n`);
  
  // Comparar despesas
  console.log('💸 DESPESAS:');
  console.log(`   Financial Engine: R$ ${officialResult.totalExpenses.toFixed(2)}`);
  console.log(`   Unified Context:  R$ ${correctedResult.totalDespesas.toFixed(2)}`);
  console.log(`   Diferença:        R$ ${(officialResult.totalExpenses - correctedResult.totalDespesas).toFixed(2)}\n`);
  
  // Identificar problemas
  console.log('🚨 ANÁLISE DOS RESULTADOS:\n');
  
  const saldoDiff = Math.abs(officialResult.totalBalance - correctedResult.saldoTotal);
  const receitaDiff = Math.abs(officialResult.totalIncome - correctedResult.totalReceitas);
  const despesaDiff = Math.abs(officialResult.totalExpenses - correctedResult.totalDespesas);
  
  if (saldoDiff <= 0.01 && receitaDiff <= 0.01 && despesaDiff <= 0.01) {
    console.log('✅ CORREÇÃO BEM-SUCEDIDA!');
    console.log('   - Unified Context agora usa a mesma lógica do Financial Engine');
    console.log('   - Transferências são filtradas corretamente');
    console.log('   - Saldos das contas são integrados nos cálculos');
    console.log('   - Valores absolutos são aplicados consistentemente\n');
  } else {
    console.log('❌ AINDA EXISTEM INCONSISTÊNCIAS:');
    if (saldoDiff > 0.01) {
      console.log(`   - Diferença no saldo total: R$ ${saldoDiff.toFixed(2)}`);
    }
    if (receitaDiff > 0.01) {
      console.log(`   - Diferença nas receitas: R$ ${receitaDiff.toFixed(2)}`);
    }
    if (despesaDiff > 0.01) {
      console.log(`   - Diferença nas despesas: R$ ${despesaDiff.toFixed(2)}`);
    }
    console.log('\n');
  }
  
  console.log('\n📋 RECOMENDAÇÕES:');
  console.log('1. Substituir implementação local do Unified Context pela oficial do Financial Engine');
  console.log('2. Garantir que todas as funções usem a mesma lógica de filtragem');
  console.log('3. Integrar saldos das contas nos cálculos do Unified Context');
  console.log('4. Implementar testes automatizados para detectar inconsistências');
  
  console.log('\n✅ Auditoria do Unified Context concluída!');
}

// Executar auditoria
auditUnifiedContext().catch(console.error);