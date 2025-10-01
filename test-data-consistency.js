/**
 * Script de auditoria de consistência de dados
 * Verifica saldos calculados vs atuais conta por conta
 */

// Usar fetch nativo do Node.js (disponível a partir da versão 18)

async function fetchAccountsData() {
  try {
    const response = await fetch('http://localhost:3000/api/accounts');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    return [];
  }
}

async function fetchTransactionsData() {
  try {
    const response = await fetch('http://localhost:3000/api/transactions');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
}

// Calcular saldo de uma conta baseado nas transações
function calculateAccountBalance(accountId, transactions) {
  const accountTransactions = transactions.filter(t => 
    t.accountId === accountId || t.toAccountId === accountId
  );

  let calculatedBalance = 0;

  accountTransactions.forEach(transaction => {
    if (transaction.accountId === accountId) {
      // Transação saindo da conta
      if (transaction.type === 'income') {
        calculatedBalance += Math.abs(transaction.amount);
      } else if (transaction.type === 'expense') {
        calculatedBalance -= Math.abs(transaction.amount);
      }
    }
    
    if (transaction.toAccountId === accountId) {
      // Transação entrando na conta (transferência)
      calculatedBalance += Math.abs(transaction.amount);
    }
  });

  return calculatedBalance;
}

// Verificar consistência de uma conta específica
function auditAccount(account, transactions) {
  const calculatedBalance = calculateAccountBalance(account.id, transactions);
  const storedBalance = account.balance || 0;
  const difference = Math.abs(calculatedBalance - storedBalance);
  
  const accountTransactions = transactions.filter(t => 
    t.accountId === account.id || t.toAccountId === account.id
  );

  return {
    accountId: account.id,
    accountName: account.name,
    accountType: account.type,
    storedBalance,
    calculatedBalance,
    difference,
    isConsistent: difference < 0.01,
    transactionCount: accountTransactions.length,
    lastTransaction: accountTransactions.length > 0 ? 
      accountTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null
  };
}

// Função principal de auditoria
async function auditDataConsistency() {
  console.log('🔍 AUDITORIA DE CONSISTÊNCIA DE DADOS');
  console.log('='.repeat(50));
  console.log('📊 Verificando saldos calculados vs armazenados...\n');

  // Buscar dados das APIs
  const accounts = await fetchAccountsData();
  const transactions = await fetchTransactionsData();

  console.log(`📋 Dados carregados: ${accounts.length} contas, ${transactions.length} transações\n`);

  if (accounts.length === 0) {
    console.log('❌ Nenhuma conta encontrada!');
    return;
  }

  const auditResults = [];
  let totalInconsistencies = 0;
  let totalDifference = 0;

  console.log('🔍 AUDITORIA POR CONTA:\n');

  accounts.forEach((account, index) => {
    const result = auditAccount(account, transactions);
    auditResults.push(result);

    console.log(`${index + 1}. ${result.accountName} (${result.accountType})`);
    console.log(`   ID: ${result.accountId}`);
    console.log(`   Saldo Armazenado: R$ ${result.storedBalance.toFixed(2)}`);
    console.log(`   Saldo Calculado:  R$ ${result.calculatedBalance.toFixed(2)}`);
    console.log(`   Diferença:        R$ ${result.difference.toFixed(2)}`);
    console.log(`   Transações:       ${result.transactionCount}`);
    console.log(`   Última Transação: ${result.lastTransaction || 'Nenhuma'}`);
    
    if (result.isConsistent) {
      console.log(`   Status: ✅ CONSISTENTE\n`);
    } else {
      console.log(`   Status: ❌ INCONSISTENTE\n`);
      totalInconsistencies++;
      totalDifference += result.difference;
    }
  });

  console.log('='.repeat(50));
  console.log('📊 RESUMO DA AUDITORIA:\n');

  console.log(`📈 Total de Contas: ${accounts.length}`);
  console.log(`✅ Contas Consistentes: ${accounts.length - totalInconsistencies}`);
  console.log(`❌ Contas Inconsistentes: ${totalInconsistencies}`);
  console.log(`💰 Diferença Total: R$ ${totalDifference.toFixed(2)}\n`);

  if (totalInconsistencies === 0) {
    console.log('🎉 PARABÉNS! Todos os saldos estão consistentes!');
    console.log('   - Saldos armazenados coincidem com os calculados');
    console.log('   - Sistema de transações está funcionando corretamente');
    console.log('   - Integridade dos dados está preservada\n');
  } else {
    console.log('⚠️ INCONSISTÊNCIAS DETECTADAS:');
    console.log(`   - ${totalInconsistencies} conta(s) com saldos incorretos`);
    console.log(`   - Diferença acumulada de R$ ${totalDifference.toFixed(2)}`);
    console.log('   - Recomenda-se investigar e corrigir os saldos\n');

    console.log('🔧 CONTAS QUE PRECISAM DE CORREÇÃO:');
    auditResults
      .filter(r => !r.isConsistent)
      .forEach(r => {
        console.log(`   - ${r.accountName}: diferença de R$ ${r.difference.toFixed(2)}`);
      });
    console.log('');
  }

  console.log('📋 RECOMENDAÇÕES:');
  console.log('1. Verificar se todas as transações estão sendo registradas corretamente');
  console.log('2. Implementar validação de saldo após cada transação');
  console.log('3. Criar rotina de reconciliação automática');
  console.log('4. Adicionar logs de auditoria para mudanças de saldo\n');

  console.log('✅ Auditoria de consistência de dados concluída!');
}

// Executar auditoria
auditDataConsistency().catch(console.error);