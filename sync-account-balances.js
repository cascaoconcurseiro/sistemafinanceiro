const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function calculateAccountBalance(accountId) {
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: accountId
    },
    select: {
      type: true,
      amount: true
    }
  });

  let balance = 0;
  
  for (const transaction of transactions) {
    const amount = parseFloat(transaction.amount);
    
    if (transaction.type === 'income') {
      balance += amount;
    } else if (transaction.type === 'expense') {
      balance -= amount;
    }
    // Para transferências, assumimos que são tratadas como despesas na conta de origem
    else if (transaction.type === 'transfer') {
      balance -= amount;
    }
  }
  
  return balance;
}

async function syncAccountBalances() {
  console.log('🔄 Sincronizando saldos das contas com base nas transações...\n');

  try {
    // Buscar todas as contas ativas
    const accounts = await prisma.account.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        balance: true
      }
    });

    console.log(`📊 Encontradas ${accounts.length} contas ativas para sincronizar:\n`);

    const updates = [];
    
    for (const account of accounts) {
      const currentBalance = parseFloat(account.balance || 0);
      const calculatedBalance = await calculateAccountBalance(account.id);
      
      console.log(`🔍 ${account.name}:`);
      console.log(`   Saldo atual no banco: R$ ${currentBalance.toFixed(2)}`);
      console.log(`   Saldo calculado: R$ ${calculatedBalance.toFixed(2)}`);
      
      if (Math.abs(currentBalance - calculatedBalance) > 0.01) { // Diferença maior que 1 centavo
        console.log(`   ⚠️  INCONSISTÊNCIA DETECTADA - Será atualizado`);
        updates.push({
          id: account.id,
          name: account.name,
          oldBalance: currentBalance,
          newBalance: calculatedBalance
        });
      } else {
        console.log(`   ✅ Saldo consistente`);
      }
      console.log('');
    }

    if (updates.length === 0) {
      console.log('🎉 Todos os saldos estão consistentes! Nenhuma atualização necessária.');
      return;
    }

    console.log(`🔧 Atualizando ${updates.length} contas com inconsistências:\n`);

    // Realizar as atualizações
    for (const update of updates) {
      await prisma.account.update({
        where: { id: update.id },
        data: { balance: update.newBalance }
      });
      
      console.log(`✅ ${update.name}: R$ ${update.oldBalance.toFixed(2)} → R$ ${update.newBalance.toFixed(2)}`);
    }

    console.log(`\n🎉 Sincronização concluída! ${updates.length} contas atualizadas.`);

    // Verificação final
    console.log('\n🔍 Verificação final dos saldos...');
    
    for (const update of updates) {
      const updatedAccount = await prisma.account.findUnique({
        where: { id: update.id },
        select: { name: true, balance: true }
      });
      
      console.log(`   ${updatedAccount.name}: R$ ${parseFloat(updatedAccount.balance).toFixed(2)}`);
    }

  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a sincronização
syncAccountBalances();