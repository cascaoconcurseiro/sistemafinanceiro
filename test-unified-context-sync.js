const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUnifiedContextSync() {
  console.log('🔄 Iniciando teste de sincronização Unified Context...\n');

  try {
    // 1. Buscar dados do banco
    console.log('📊 Buscando dados do banco de dados...');
    const accounts = await prisma.account.findMany();
    const transactions = await prisma.transaction.findMany();
    
    console.log(`✅ Encontradas ${accounts.length} contas e ${transactions.length} transações\n`);

    // 2. Simular cálculo do Unified Context (calculateDerivedData)
    console.log('🧮 Simulando cálculos do Unified Context...');
    
    // Calcular saldos das contas baseado nas transações
    const accountBalances = {};
    accounts.forEach(account => {
      let balance = 0; // Começar do zero, sem saldo inicial
      
      // Processar transações da conta
      transactions.forEach(t => {
        if (t.accountId === account.id) {
          if (t.type === 'income') {
            balance += parseFloat(t.amount);
          } else if (t.type === 'expense') {
            balance -= parseFloat(t.amount);
          }
        } else if (t.toAccountId === account.id && t.category === 'Transferência') {
          // Transferências de entrada
          balance += parseFloat(t.amount);
        }
      });
      
      accountBalances[account.id] = balance;
    });

    // 3. Comparar com saldos armazenados no banco
    console.log('🔍 Verificando consistência de saldos...\n');
    
    let inconsistencies = 0;
    for (const account of accounts) {
      const storedBalance = parseFloat(account.balance) || 0;
      const calculatedBalance = accountBalances[account.id] || 0;
      const difference = Math.abs(storedBalance - calculatedBalance);
      
      if (difference > 0.01) {
        console.log(`❌ INCONSISTÊNCIA - ${account.name}:`);
        console.log(`   Saldo armazenado: R$ ${storedBalance.toFixed(2)}`);
        console.log(`   Saldo calculado: R$ ${calculatedBalance.toFixed(2)}`);
        console.log(`   Diferença: R$ ${difference.toFixed(2)}\n`);
        inconsistencies++;
      } else {
        console.log(`✅ ${account.name}: R$ ${calculatedBalance.toFixed(2)} (consistente)`);
      }
    }

    // 4. Testar métricas do dashboard
    console.log('\n📈 Testando métricas do dashboard...');
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date).toISOString().slice(0, 7);
      return transactionDate === currentMonth && t.category !== 'Transferência';
    });
    
    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const netIncome = totalIncome - totalExpenses;
    const totalBalance = Object.values(accountBalances).reduce((sum, balance) => sum + balance, 0);
    
    console.log(`💰 Receitas do mês: R$ ${totalIncome.toFixed(2)}`);
    console.log(`💸 Despesas do mês: R$ ${totalExpenses.toFixed(2)}`);
    console.log(`📊 Saldo líquido: R$ ${netIncome.toFixed(2)}`);
    console.log(`🏦 Saldo total das contas: R$ ${totalBalance.toFixed(2)}`);

    // 5. Testar análise por categoria
    console.log('\n📋 Análise por categoria (mês atual):');
    const categoryBreakdown = {};
    currentMonthTransactions.forEach(t => {
      if (!categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] = { income: 0, expense: 0, count: 0 };
      }
      
      if (t.type === 'income') {
        categoryBreakdown[t.category].income += parseFloat(t.amount);
      } else if (t.type === 'expense') {
        categoryBreakdown[t.category].expense += parseFloat(t.amount);
      }
      
      categoryBreakdown[t.category].count++;
    });
    
    Object.entries(categoryBreakdown).forEach(([category, data]) => {
      const net = data.income - data.expense;
      console.log(`   ${category}: R$ ${net.toFixed(2)} (${data.count} transações)`);
    });

    // 6. Verificar transferências
    console.log('\n🔄 Verificando transferências...');
    const transfers = transactions.filter(t => t.category === 'Transferência');
    const transferGroups = {};
    
    transfers.forEach(t => {
      const key = `${t.date}-${t.amount}`;
      if (!transferGroups[key]) {
        transferGroups[key] = [];
      }
      transferGroups[key].push(t);
    });
    
    let validTransfers = 0;
    let invalidTransfers = 0;
    
    Object.entries(transferGroups).forEach(([key, group]) => {
      if (group.length === 2) {
        const expense = group.find(t => t.type === 'expense');
        const income = group.find(t => t.type === 'income');
        
        if (expense && income) {
          console.log(`✅ Transferência válida: R$ ${expense.amount} de ${expense.accountId} para ${income.accountId}`);
          validTransfers++;
        } else {
          console.log(`❌ Transferência inválida: ${key}`);
          invalidTransfers++;
        }
      } else {
        console.log(`❌ Transferência incompleta: ${key} (${group.length} transações)`);
        invalidTransfers++;
      }
    });

    // 7. Resumo final
    console.log('\n📋 RESUMO DA VERIFICAÇÃO:');
    console.log(`✅ Contas consistentes: ${accounts.length - inconsistencies}`);
    console.log(`❌ Contas inconsistentes: ${inconsistencies}`);
    console.log(`✅ Transferências válidas: ${validTransfers}`);
    console.log(`❌ Transferências inválidas: ${invalidTransfers}`);
    console.log(`📊 Total de transações: ${transactions.length}`);
    console.log(`🏦 Total de contas: ${accounts.length}`);
    
    if (inconsistencies === 0 && invalidTransfers === 0) {
      console.log('\n🎉 UNIFIED CONTEXT SINCRONIZADO COM SUCESSO!');
      console.log('✅ Todos os dados estão consistentes entre o banco e os cálculos do contexto.');
    } else {
      console.log('\n⚠️  PROBLEMAS ENCONTRADOS NA SINCRONIZAÇÃO:');
      if (inconsistencies > 0) {
        console.log(`   - ${inconsistencies} contas com saldos inconsistentes`);
      }
      if (invalidTransfers > 0) {
        console.log(`   - ${invalidTransfers} transferências inválidas`);
      }
      console.log('   Recomenda-se investigação adicional.');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testUnifiedContextSync();