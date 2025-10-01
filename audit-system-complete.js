/**
 * AUDITORIA COMPLETA DO SISTEMA SUAGRANA
 * 
 * Este script executa uma auditoria completa de todas as camadas do sistema
 * para identificar inconsistências entre dados visíveis e cálculos.
 */

const BASE_URL = 'http://localhost:3000';

// Função para fazer requisições HTTP
async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`❌ Erro ao acessar ${endpoint}:`, error.message);
    return null;
  }
}

// 1. AUDITORIA DAS APIs
async function auditarAPIs() {
  console.log('\n🔍 === AUDITORIA DAS APIs ===');
  
  const endpoints = [
    '/api/accounts',
    '/api/transactions',
    '/api/transactions?limit=10000',
    '/api/family',
    '/api/goals'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Testando ${endpoint}...`);
    const data = await fetchAPI(endpoint);
    
    if (data) {
      results[endpoint] = data;
      console.log(`✅ ${endpoint}: ${Array.isArray(data) ? data.length : 'OK'} registros`);
      
      // Verificar estrutura dos dados
      if (Array.isArray(data) && data.length > 0) {
        const sample = data[0];
        console.log(`📋 Estrutura do primeiro registro:`, Object.keys(sample));
        
        // Verificar tipos de dados críticos
        if (endpoint.includes('accounts')) {
          console.log(`💰 Balance type: ${typeof sample.balance} (${sample.balance})`);
          console.log(`🔄 IsActive type: ${typeof sample.isActive} (${sample.isActive})`);
        }
        
        if (endpoint.includes('transactions')) {
          console.log(`💵 Amount type: ${typeof sample.amount} (${sample.amount})`);
          console.log(`📝 Type: ${typeof sample.type} (${sample.type})`);
          console.log(`📅 Date type: ${typeof sample.date} (${sample.date})`);
        }
      }
    } else {
      console.log(`❌ ${endpoint}: FALHOU`);
    }
  }
  
  return results;
}

// 2. AUDITORIA DE CONSISTÊNCIA CONTA POR CONTA
async function auditarConsistencia() {
  console.log('\n💰 === AUDITORIA DE CONSISTÊNCIA ===');
  
  const accounts = await fetchAPI('/api/accounts');
  const allTransactions = await fetchAPI('/api/transactions?limit=10000');
  
  if (!accounts || !allTransactions) {
    console.log('❌ Não foi possível carregar dados para auditoria');
    return;
  }
  
  console.log(`📊 Total contas: ${accounts.length}`);
  console.log(`📊 Total transações: ${allTransactions.length}`);
  
  let totalInconsistencias = 0;
  const inconsistencias = [];
  
  for (const account of accounts) {
    const accountTransactions = allTransactions.filter(t => 
      t.accountId === account.id || t.toAccountId === account.id
    );
    
    // Calcular saldo baseado apenas nas transações (sem saldo inicial)
     const saldoInicial = typeof account.balance === 'number' ? account.balance : parseFloat(account.balance) || 0;
     let saldoTransacoes = 0;
     
     accountTransactions.forEach(transaction => {
       if (transaction.accountId === account.id) {
         // Transação saindo da conta
         if (transaction.type === 'INCOME') {
           saldoTransacoes += Math.abs(typeof transaction.amount === 'number' ? transaction.amount : parseFloat(transaction.amount) || 0);
         } else if (transaction.type === 'EXPENSE') {
           saldoTransacoes -= Math.abs(typeof transaction.amount === 'number' ? transaction.amount : parseFloat(transaction.amount) || 0);
         } else if (transaction.type === 'TRANSFER') {
           saldoTransacoes -= Math.abs(typeof transaction.amount === 'number' ? transaction.amount : parseFloat(transaction.amount) || 0);
         }
       }
       
       if (transaction.toAccountId === account.id && transaction.type === 'TRANSFER') {
         // Transação entrando na conta (transferência)
         saldoTransacoes += Math.abs(typeof transaction.amount === 'number' ? transaction.amount : parseFloat(transaction.amount) || 0);
       }
     });
     
     // Saldo calculado = saldo inicial + transações
     const saldoCalculado = saldoInicial + saldoTransacoes;
     
     const saldoAtual = typeof account.balance === 'number' ? account.balance : parseFloat(account.balance) || 0;
     const diferenca = saldoAtual - saldoCalculado;
    
    console.log(`\n--- ${account.name} ---`);
    console.log(`🔢 Transações: ${accountTransactions.length}`);
    console.log(`💰 Saldo inicial: R$ ${saldoInicial.toFixed(2)}`);
    console.log(`📊 Saldo das transações: R$ ${saldoTransacoes.toFixed(2)}`);
    console.log(`🧮 Saldo calculado (inicial + transações): R$ ${saldoCalculado.toFixed(2)}`);
    console.log(`💳 Saldo atual (API): R$ ${saldoAtual.toFixed(2)}`);
    console.log(`⚖️ Diferença: R$ ${diferenca.toFixed(2)}`);
    
    const isConsistent = Math.abs(diferenca) < 0.01;
    console.log(`📊 Status: ${isConsistent ? '✅ OK' : '❌ INCONSISTENTE'}`);
    
    if (!isConsistent) {
      totalInconsistencias++;
      inconsistencias.push({
        conta: account.name,
        saldoAtual,
        saldoCalculado,
        diferenca,
        transacoes: accountTransactions.length
      });
      
      console.log('🚨 INCONSISTÊNCIA DETECTADA!');
      console.log('🔍 Possíveis causas:');
      console.log('   - Saldo inicial não contabilizado');
      console.log('   - Transações faltando ou duplicadas');
      console.log('   - Erro de tipo de dados (string vs number)');
      console.log('   - Transferências entre contas malformadas');
      
      // Analisar tipos de dados das transações
      if (accountTransactions.length > 0) {
        const tiposAmount = [...new Set(accountTransactions.map(t => typeof t.amount))];
        const tiposType = [...new Set(accountTransactions.map(t => typeof t.type))];
        console.log(`   - Tipos de amount encontrados: ${tiposAmount.join(', ')}`);
        console.log(`   - Tipos de type encontrados: ${tiposType.join(', ')}`);
      }
    }
  }
  
  // Verificar total geral
  console.log('\n📊 === RESUMO GERAL ===');
  const totalSaldosContas = accounts.reduce((sum, acc) => {
    const balance = typeof acc.balance === 'number' ? acc.balance : parseFloat(acc.balance) || 0;
    return sum + balance;
  }, 0);
  
  const totalReceitasGeral = allTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);
    
  const totalDespesasGeral = allTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);
  
  console.log(`💰 Soma saldos das contas: R$ ${totalSaldosContas.toFixed(2)}`);
  console.log(`📈 Total receitas: R$ ${totalReceitasGeral.toFixed(2)}`);
  console.log(`📉 Total despesas: R$ ${totalDespesasGeral.toFixed(2)}`);
  console.log(`🧮 Saldo líquido esperado: R$ ${(totalReceitasGeral - totalDespesasGeral).toFixed(2)}`);
  console.log(`⚖️ Diferença geral: R$ ${(totalSaldosContas - (totalReceitasGeral - totalDespesasGeral)).toFixed(2)}`);
  
  console.log(`\n📋 RESULTADO DA AUDITORIA:`);
  console.log(`✅ Contas consistentes: ${accounts.length - totalInconsistencias}`);
  console.log(`❌ Contas inconsistentes: ${totalInconsistencias}`);
  
  if (inconsistencias.length > 0) {
    console.log(`\n🚨 DETALHES DAS INCONSISTÊNCIAS:`);
    inconsistencias.forEach((inc, index) => {
      console.log(`${index + 1}. ${inc.conta}: Diferença de R$ ${inc.diferenca.toFixed(2)}`);
    });
  }
  
  return {
    totalContas: accounts.length,
    contasInconsistentes: totalInconsistencias,
    inconsistencias,
    totalSaldosContas,
    totalReceitasGeral,
    totalDespesasGeral
  };
}

// 3. AUDITORIA DE TIPOS DE DADOS
async function auditarTiposDados() {
  console.log('\n🔍 === AUDITORIA DE TIPOS DE DADOS ===');
  
  const accounts = await fetchAPI('/api/accounts');
  const transactions = await fetchAPI('/api/transactions?limit=100');
  
  if (accounts && accounts.length > 0) {
    console.log('\n📊 ACCOUNTS - Tipos de dados:');
    const sample = accounts[0];
    Object.keys(sample).forEach(key => {
      console.log(`  ${key}: ${typeof sample[key]} (${sample[key]})`);
    });
    
    // Verificar se todos os balances são numbers
    const balanceTypes = accounts.map(acc => typeof acc.balance);
    const uniqueBalanceTypes = [...new Set(balanceTypes)];
    console.log(`💰 Balance types encontrados: ${uniqueBalanceTypes.join(', ')}`);
    
    if (uniqueBalanceTypes.length > 1) {
      console.log('❌ PROBLEMA: Tipos inconsistentes para balance!');
    }
  }
  
  if (transactions && transactions.length > 0) {
    console.log('\n💸 TRANSACTIONS - Tipos de dados:');
    const sample = transactions[0];
    Object.keys(sample).forEach(key => {
      console.log(`  ${key}: ${typeof sample[key]} (${sample[key]})`);
    });
    
    // Verificar se todos os amounts são numbers
    const amountTypes = transactions.map(t => typeof t.amount);
    const uniqueAmountTypes = [...new Set(amountTypes)];
    console.log(`💵 Amount types encontrados: ${uniqueAmountTypes.join(', ')}`);
    
    if (uniqueAmountTypes.length > 1) {
      console.log('❌ PROBLEMA: Tipos inconsistentes para amount!');
    }
    
    // Verificar tipos de transação
    const transactionTypes = [...new Set(transactions.map(t => t.type))];
    console.log(`📝 Transaction types: ${transactionTypes.join(', ')}`);
  }
}

// 4. AUDITORIA DE RELACIONAMENTOS
async function auditarRelacionamentos() {
  console.log('\n🔗 === AUDITORIA DE RELACIONAMENTOS ===');
  
  const accounts = await fetchAPI('/api/accounts');
  const transactions = await fetchAPI('/api/transactions?limit=10000');
  
  if (!accounts || !transactions) {
    console.log('❌ Não foi possível carregar dados');
    return;
  }
  
  const accountIds = new Set(accounts.map(acc => acc.id));
  const transactionAccountIds = transactions.map(t => t.accountId);
  
  // Verificar transações órfãs
  const orphanTransactions = transactions.filter(t => !accountIds.has(t.accountId));
  
  console.log(`📊 Total accounts: ${accounts.length}`);
  console.log(`📊 Total transactions: ${transactions.length}`);
  console.log(`🔗 Transações órfãs (sem conta): ${orphanTransactions.length}`);
  
  if (orphanTransactions.length > 0) {
    console.log('❌ PROBLEMA: Transações órfãs encontradas!');
    orphanTransactions.slice(0, 5).forEach(t => {
      console.log(`  - ID: ${t.id}, AccountId: ${t.accountId}, Amount: ${t.amount}`);
    });
  }
  
  // Verificar contas sem transações
  const contasSemTransacoes = accounts.filter(acc => 
    !transactionAccountIds.includes(acc.id)
  );
  
  console.log(`📊 Contas sem transações: ${contasSemTransacoes.length}`);
  if (contasSemTransacoes.length > 0) {
    contasSemTransacoes.forEach(acc => {
      console.log(`  - ${acc.name}: Balance ${acc.balance}`);
    });
  }
}

// FUNÇÃO PRINCIPAL
async function executarAuditoriaCompleta() {
  console.log('🚀 === INICIANDO AUDITORIA COMPLETA DO SISTEMA SUAGRANA ===');
  console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
  
  try {
    // 1. Testar APIs
    const apiResults = await auditarAPIs();
    
    // 2. Verificar tipos de dados
    await auditarTiposDados();
    
    // 3. Verificar relacionamentos
    await auditarRelacionamentos();
    
    // 4. Auditoria de consistência
    const consistencyResults = await auditarConsistencia();
    
    console.log('\n🎯 === RESUMO FINAL DA AUDITORIA ===');
    
    if (consistencyResults) {
      if (consistencyResults.contasInconsistentes === 0) {
        console.log('✅ SISTEMA CONSISTENTE: Todos os saldos batem!');
      } else {
        console.log(`❌ SISTEMA INCONSISTENTE: ${consistencyResults.contasInconsistentes} contas com problemas`);
        console.log('\n🔧 PRÓXIMOS PASSOS:');
        console.log('1. Verificar se há saldo inicial não contabilizado');
        console.log('2. Revisar lógica de cálculo no Financial Engine');
        console.log('3. Verificar se transferências estão balanceadas');
        console.log('4. Analisar conversão de tipos de dados');
      }
    }
    
    console.log('\n✅ AUDITORIA COMPLETA FINALIZADA');
    
  } catch (error) {
    console.error('❌ Erro durante a auditoria:', error);
  }
}

// Executar se chamado diretamente
if (typeof window !== 'undefined') {
  // Executar no browser
  window.executarAuditoriaCompleta = executarAuditoriaCompleta;
  console.log('🌐 Script carregado no browser. Execute: executarAuditoriaCompleta()');
} else {
  // Executar no Node.js
  executarAuditoriaCompleta();
}

module.exports = {
  executarAuditoriaCompleta,
  auditarAPIs,
  auditarConsistencia,
  auditarTiposDados,
  auditarRelacionamentos
};