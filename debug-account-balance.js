const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAccountBalance() {
  try {
    console.log('=== DEBUG: Saldos das Contas ===\n');

    // Buscar todas as contas
    const accounts = await prisma.account.findMany();
    console.log(`Total de contas: ${accounts.length}\n`);

    // Buscar todas as transações
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'asc' }
    });
    console.log(`Total de transações: ${transactions.length}\n`);

    // Analisar cada conta
    for (const account of accounts) {
      console.log(`--- Conta: ${account.name} (ID: ${account.id}) ---`);
      console.log(`Saldo atual (banco): R$ ${account.balance}`);

      // Buscar transações desta conta
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      console.log(`Transações da conta: ${accountTransactions.length}`);

      // Calcular saldo manualmente baseado nas transações
      let creditTotal = 0;
      let debitTotal = 0;

      for (const transaction of accountTransactions) {
        if (transaction.status === 'completed' || transaction.status === 'cleared') {
          if (transaction.type === 'credit') {
            creditTotal += parseFloat(transaction.amount);
          } else if (transaction.type === 'debit') {
            debitTotal += parseFloat(transaction.amount);
          }
        }
      }

      const calculatedBalance = creditTotal - debitTotal;

      console.log(`Créditos totais: R$ ${creditTotal}`);
      console.log(`Débitos totais: R$ ${debitTotal}`);
      console.log(`Saldo calculado: R$ ${calculatedBalance}`);
      console.log(`Diferença: R$ ${parseFloat(account.balance) - calculatedBalance}`);
      
      if (Math.abs(parseFloat(account.balance) - calculatedBalance) > 0.01) {
        console.log('⚠️  DISCREPÂNCIA ENCONTRADA!');
        
        // Mostrar detalhes das transações para debug
        console.log('Transações da conta:');
        accountTransactions.forEach(t => {
          console.log(`  - ${t.date.toISOString().split('T')[0]} | ${t.type} | R$ ${t.amount} | ${t.status} | ${t.description}`);
        });
      } else {
        console.log('✅ Saldo correto');
      }
      console.log('');
    }

    // Calcular saldo total
    const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);
    console.log(`=== RESUMO GERAL ===`);
    console.log(`Saldo total das contas: R$ ${totalBalance}`);

    // Verificar se há valores extremos
    const extremeAccounts = accounts.filter(account => Math.abs(parseFloat(account.balance)) > 1000000);
    if (extremeAccounts.length > 0) {
      console.log('\n⚠️  CONTAS COM VALORES EXTREMOS:');
      extremeAccounts.forEach(account => {
        console.log(`- ${account.name}: R$ ${account.balance}`);
      });
    }

  } catch (error) {
    console.error('Erro ao analisar saldos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAccountBalance();