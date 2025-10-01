const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseIntegrity() {
  console.log('🔍 Verificando integridade do banco de dados...\n');

  try {
    // 1. Verificar todas as transações
    const allTransactions = await prisma.transaction.findMany({
      include: {
        account: true
      }
    });

    console.log(`📊 Total de transações no banco: ${allTransactions.length}`);

    // 2. Verificar transações órfãs (sem conta)
    const orphanTransactions = allTransactions.filter(t => !t.account);
    console.log(`🚨 Transações órfãs (sem conta): ${orphanTransactions.length}`);
    
    if (orphanTransactions.length > 0) {
      console.log('Transações órfãs encontradas:');
      orphanTransactions.forEach(t => {
        console.log(`  - ID: ${t.id}, Descrição: ${t.description}, Valor: ${t.amount}, AccountID: ${t.accountId}`);
      });
    }

    // 3. Verificar contas
    const allAccounts = await prisma.account.findMany();
    console.log(`\n🏦 Total de contas no banco: ${allAccounts.length}`);
    
    allAccounts.forEach(account => {
      console.log(`  - ${account.name} (${account.id}): Saldo ${account.balance}`);
    });

    // 4. Verificar transações por conta
    console.log('\n📋 Transações por conta:');
    for (const account of allAccounts) {
      const accountTransactions = allTransactions.filter(t => t.accountId === account.id);
      console.log(`  - ${account.name}: ${accountTransactions.length} transações`);
      
      if (accountTransactions.length > 0) {
        console.log('    Últimas 3 transações:');
        accountTransactions.slice(0, 3).forEach(t => {
          console.log(`      * ${t.description}: ${t.amount} (${t.type}) - ${t.date}`);
        });
      }
    }

    // 5. Verificar duplicatas por descrição e valor
    console.log('\n🔍 Verificando possíveis duplicatas...');
    const transactionGroups = {};
    
    allTransactions.forEach(t => {
      const key = `${t.description}_${t.amount}_${t.date}`;
      if (!transactionGroups[key]) {
        transactionGroups[key] = [];
      }
      transactionGroups[key].push(t);
    });

    const duplicates = Object.entries(transactionGroups).filter(([key, transactions]) => transactions.length > 1);
    
    if (duplicates.length > 0) {
      console.log(`🚨 Possíveis duplicatas encontradas: ${duplicates.length} grupos`);
      duplicates.forEach(([key, transactions]) => {
        console.log(`  Grupo: ${key}`);
        transactions.forEach(t => {
          console.log(`    - ID: ${t.id}, Conta: ${t.accountId}, Status: ${t.status}`);
        });
      });
    } else {
      console.log('✅ Nenhuma duplicata óbvia encontrada');
    }

    // 6. Verificar status das transações
    console.log('\n📊 Status das transações:');
    const statusCount = {};
    allTransactions.forEach(t => {
      const status = t.status || 'undefined';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} transações`);
    });

    // 7. Verificar categorias
    console.log('\n📊 Categorias das transações:');
    const categoryCount = {};
    allTransactions.forEach(t => {
      const category = t.category || 'undefined';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} transações`);
    });

    // 8. Verificar saldos das contas vs transações
    console.log('\n💰 Verificando consistência de saldos:');
    for (const account of allAccounts) {
      const accountTransactions = allTransactions.filter(t => t.accountId === account.id);
      
      let calculatedBalance = 0;
      accountTransactions.forEach(t => {
        if (t.type === 'income' || t.type === 'credit') {
          calculatedBalance += parseFloat(t.amount);
        } else if (t.type === 'expense' || t.type === 'debit') {
          calculatedBalance -= parseFloat(t.amount);
        }
      });
      
      const storedBalance = parseFloat(account.balance);
      const difference = Math.abs(calculatedBalance - storedBalance);
      
      console.log(`  - ${account.name}:`);
      console.log(`    Saldo armazenado: R$ ${storedBalance.toFixed(2)}`);
      console.log(`    Saldo calculado: R$ ${calculatedBalance.toFixed(2)}`);
      console.log(`    Diferença: R$ ${difference.toFixed(2)} ${difference > 0.01 ? '🚨' : '✅'}`);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar integridade:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseIntegrity();