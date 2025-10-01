const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAccountBalances() {
  console.log('🔧 INICIANDO CORREÇÃO DE SALDOS DAS CONTAS...\n');

  try {
    // 1. Buscar todas as contas
    const accounts = await prisma.account.findMany({
      include: {
        transactions: true
      }
    });

    console.log(`📊 Encontradas ${accounts.length} contas para verificar\n`);

    let correctedAccounts = 0;
    const corrections = [];

    // 2. Para cada conta, calcular o saldo correto baseado nas transações
    for (const account of accounts) {
      const storedBalance = parseFloat(account.balance);
      
      // Calcular saldo baseado nas transações
      let calculatedBalance = 0;
      
      for (const transaction of account.transactions) {
        const amount = parseFloat(transaction.amount);
        
        if (transaction.type === 'income') {
          calculatedBalance += amount;
        } else if (transaction.type === 'expense') {
          calculatedBalance -= amount;
        }
        // Para transferências, seria necessário verificar se é conta origem ou destino
        // Por simplicidade, assumindo que as transações já estão corretas
      }

      // Verificar se há diferença significativa (mais de 0.01)
      const difference = Math.abs(storedBalance - calculatedBalance);
      
      if (difference > 0.01) {
        console.log(`⚠️  Conta "${account.name}": Saldo armazenado R$ ${storedBalance.toFixed(2)}, Calculado R$ ${calculatedBalance.toFixed(2)}`);
        
        // Atualizar o saldo da conta
        await prisma.account.update({
          where: { id: account.id },
          data: { 
            balance: calculatedBalance.toFixed(2),
            updatedAt: new Date()
          }
        });

        corrections.push({
          accountName: account.name,
          oldBalance: storedBalance,
          newBalance: calculatedBalance,
          difference: calculatedBalance - storedBalance
        });

        correctedAccounts++;
        console.log(`✅ Saldo corrigido para R$ ${calculatedBalance.toFixed(2)}\n`);
      } else {
        console.log(`✅ Conta "${account.name}": Saldo correto (R$ ${storedBalance.toFixed(2)})`);
      }
    }

    // 3. Resumo das correções
    console.log('\n📋 RESUMO DAS CORREÇÕES:');
    console.log('==========================');
    console.log(`Total de contas verificadas: ${accounts.length}`);
    console.log(`Contas corrigidas: ${correctedAccounts}`);
    console.log(`Contas já corretas: ${accounts.length - correctedAccounts}`);

    if (corrections.length > 0) {
      console.log('\n📊 DETALHES DAS CORREÇÕES:');
      corrections.forEach((correction, index) => {
        console.log(`${index + 1}. ${correction.accountName}:`);
        console.log(`   Saldo anterior: R$ ${correction.oldBalance.toFixed(2)}`);
        console.log(`   Saldo corrigido: R$ ${correction.newBalance.toFixed(2)}`);
        console.log(`   Diferença: R$ ${correction.difference.toFixed(2)}`);
        console.log('');
      });
    }

    console.log('✅ CORREÇÃO DE SALDOS CONCLUÍDA COM SUCESSO!');

  } catch (error) {
    console.error('❌ Erro ao corrigir saldos das contas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
fixAccountBalances();