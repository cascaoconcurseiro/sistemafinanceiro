const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateRemainingInconsistencies() {
  console.log('🔍 INVESTIGANDO INCONSISTÊNCIAS RESTANTES...\n');

  try {
    // Buscar contas com transações detalhadas
    const accounts = await prisma.account.findMany({
      include: {
        transactions: {
          select: {
            id: true,
            amount: true,
            type: true,
            description: true,
            date: true,
            createdAt: true
          },
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    console.log(`📊 Analisando ${accounts.length} contas...\n`);

    for (const account of accounts) {
      const storedBalance = parseFloat(account.balance);
      
      // Calcular saldo baseado nas transações
      let calculatedBalance = 0;
      
      console.log(`🏦 CONTA: ${account.name} (ID: ${account.id})`);
      console.log(`💰 Saldo armazenado: R$ ${storedBalance.toFixed(2)}`);
      console.log(`📝 Transações (${account.transactions.length}):`);
      
      if (account.transactions.length === 0) {
        console.log('   - Nenhuma transação encontrada');
      } else {
        account.transactions.forEach((transaction, index) => {
          const amount = parseFloat(transaction.amount);
          
          if (transaction.type === 'income') {
            calculatedBalance += amount;
            console.log(`   ${index + 1}. [${transaction.type.toUpperCase()}] +R$ ${amount.toFixed(2)} - ${transaction.description} (${transaction.date})`);
          } else if (transaction.type === 'expense') {
            calculatedBalance -= amount;
            console.log(`   ${index + 1}. [${transaction.type.toUpperCase()}] -R$ ${amount.toFixed(2)} - ${transaction.description} (${transaction.date})`);
          } else {
            console.log(`   ${index + 1}. [${transaction.type.toUpperCase()}] R$ ${amount.toFixed(2)} - ${transaction.description} (${transaction.date})`);
          }
        });
      }
      
      console.log(`🧮 Saldo calculado: R$ ${calculatedBalance.toFixed(2)}`);
      
      const difference = Math.abs(calculatedBalance - storedBalance);
      
      if (difference > 0.01) {
        console.log(`❌ INCONSISTÊNCIA: Diferença de R$ ${(calculatedBalance - storedBalance).toFixed(2)}`);
        
        // Verificar se há transações de transferência que podem estar afetando o cálculo
        const transferTransactions = account.transactions.filter(t => t.type === 'transfer');
        if (transferTransactions.length > 0) {
          console.log(`⚠️  Encontradas ${transferTransactions.length} transações de transferência que podem afetar o cálculo`);
        }
        
        // Verificar se há valores negativos em expenses
        const negativeExpenses = account.transactions.filter(t => t.type === 'expense' && parseFloat(t.amount) < 0);
        if (negativeExpenses.length > 0) {
          console.log(`⚠️  Encontradas ${negativeExpenses.length} despesas com valores negativos`);
        }
        
      } else {
        console.log(`✅ Saldo consistente`);
      }
      
      console.log('─'.repeat(80));
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro ao investigar inconsistências:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
investigateRemainingInconsistencies();