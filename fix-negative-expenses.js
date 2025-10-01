const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNegativeExpenses() {
  console.log('🔧 CORRIGINDO TRANSAÇÕES DE DESPESA COM VALORES NEGATIVOS...\n');

  try {
    // 1. Buscar todas as transações de despesa com valores negativos
    const negativeExpenses = await prisma.transaction.findMany({
      where: {
        type: 'expense',
        amount: {
          lt: 0
        }
      },
      include: {
        account: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`📊 Encontradas ${negativeExpenses.length} transações de despesa com valores negativos\n`);

    if (negativeExpenses.length === 0) {
      console.log('✅ Nenhuma transação de despesa com valor negativo encontrada');
      return;
    }

    let correctedTransactions = 0;

    // 2. Corrigir cada transação
    for (const transaction of negativeExpenses) {
      const oldAmount = parseFloat(transaction.amount);
      const newAmount = Math.abs(oldAmount); // Converter para positivo

      console.log(`⚠️  Transação "${transaction.description}" na conta "${transaction.account.name}"`);
      console.log(`   Valor anterior: R$ ${oldAmount.toFixed(2)}`);
      console.log(`   Valor corrigido: R$ ${newAmount.toFixed(2)}`);

      // Atualizar a transação
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          amount: newAmount,
          updatedAt: new Date()
        }
      });

      correctedTransactions++;
      console.log(`✅ Transação corrigida\n`);
    }

    console.log('📋 RESUMO DAS CORREÇÕES:');
    console.log('==========================');
    console.log(`Total de transações corrigidas: ${correctedTransactions}`);

    // 3. Recalcular saldos das contas afetadas
    console.log('\n🔄 RECALCULANDO SALDOS DAS CONTAS AFETADAS...');
    
    const affectedAccountIds = [...new Set(negativeExpenses.map(t => t.accountId))];
    
    for (const accountId of affectedAccountIds) {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          transactions: {
            select: {
              amount: true,
              type: true
            }
          }
        }
      });

      if (account) {
        // Calcular novo saldo baseado nas transações corrigidas
        let newBalance = 0;
        
        for (const transaction of account.transactions) {
          const amount = parseFloat(transaction.amount);
          
          if (transaction.type === 'income') {
            newBalance += amount;
          } else if (transaction.type === 'expense') {
            newBalance -= Math.abs(amount); // Garantir que despesas sejam subtraídas
          }
        }

        // Atualizar saldo da conta
        await prisma.account.update({
          where: { id: accountId },
          data: { 
            balance: newBalance.toFixed(2),
            updatedAt: new Date()
          }
        });

        console.log(`✅ Saldo da conta "${account.name}" recalculado: R$ ${newBalance.toFixed(2)}`);
      }
    }

    console.log('\n✅ CORREÇÃO DE TRANSAÇÕES NEGATIVAS CONCLUÍDA COM SUCESSO!');

  } catch (error) {
    console.error('❌ Erro ao corrigir transações negativas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
fixNegativeExpenses();