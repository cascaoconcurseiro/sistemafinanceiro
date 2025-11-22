const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSharedTransactionsBalance() {
  console.log('🔧 Corrigindo saldos de transações compartilhadas...\n');

  try {
    // 1. Buscar transações compartilhadas
    const sharedTransactions = await prisma.transaction.findMany({
      where: {
        isShared: true,
        deletedAt: null,
        accountId: { not: null },
      },
    });

    console.log(`📊 Encontradas ${sharedTransactions.length} transações compartilhadas\n`);

    if (sharedTransactions.length === 0) {
      console.log('✅ Nenhuma transação precisa ser corrigida!');
      return;
    }

    let fixed = 0;
    let errors = 0;

    for (const transaction of sharedTransactions) {
      try {
        console.log(`\n🔍 Processando: ${transaction.description}`);
        console.log(`   Valor total: R$ ${transaction.amount}`);
        
        // Calcular myShare se não existir
        let myShare = transaction.myShare;
        
        if (!myShare && transaction.sharedWith) {
          const sharedWith = JSON.parse(transaction.sharedWith);
          const totalParticipants = sharedWith.length + 1; // +1 para você
          myShare = Number(transaction.amount) / totalParticipants;
          
          console.log(`   Participantes: ${totalParticipants}`);
          console.log(`   Minha parte calculada: R$ ${myShare.toFixed(2)}`);
          
          // Atualizar transação com myShare
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { myShare },
          });
        } else {
          console.log(`   Minha parte: R$ ${myShare}`);
        }

        // Deletar lançamentos contábeis antigos
        await prisma.journalEntry.deleteMany({
          where: { transactionId: transaction.id },
        });
        
        console.log(`   ✅ Lançamentos antigos deletados`);

        // Criar novos lançamentos com valor correto (myShare)
        const amount = Math.abs(Number(myShare || transaction.amount));
        
        if (transaction.type === 'RECEITA') {
          // Débito na conta (aumenta)
          await prisma.journalEntry.create({
            data: {
              transactionId: transaction.id,
              accountId: transaction.accountId,
              entryType: 'DEBITO',
              amount,
              description: `${transaction.description} (Entrada - Compartilhada)`,
            },
          });
          
          // Crédito em receita
          const revenueAccount = await prisma.account.findFirst({
            where: {
              userId: transaction.userId,
              type: 'RECEITA',
            },
          });
          
          if (revenueAccount) {
            await prisma.journalEntry.create({
              data: {
                transactionId: transaction.id,
                accountId: revenueAccount.id,
                entryType: 'CREDITO',
                amount,
                description: `${transaction.description} (Receita - Compartilhada)`,
              },
            });
          }
        } else if (transaction.type === 'DESPESA') {
          // Débito em despesa
          const expenseAccount = await prisma.account.findFirst({
            where: {
              userId: transaction.userId,
              type: 'DESPESA',
            },
          });
          
          if (expenseAccount) {
            await prisma.journalEntry.create({
              data: {
                transactionId: transaction.id,
                accountId: expenseAccount.id,
                entryType: 'DEBITO',
                amount,
                description: `${transaction.description} (Despesa - Compartilhada)`,
              },
            });
          }
          
          // Crédito na conta (diminui)
          await prisma.journalEntry.create({
            data: {
              transactionId: transaction.id,
              accountId: transaction.accountId,
              entryType: 'CREDITO',
              amount,
              description: `${transaction.description} (Saída - Compartilhada)`,
            },
          });
        }
        
        console.log(`   ✅ Novos lançamentos criados com R$ ${amount.toFixed(2)}`);
        
        // Recalcular saldo da conta
        const entries = await prisma.journalEntry.findMany({
          where: {
            accountId: transaction.accountId,
            transaction: {
              deletedAt: null,
            },
          },
        });

        const balance = entries.reduce((sum, entry) => {
          if (entry.entryType === 'DEBITO') {
            return sum + Number(entry.amount);
          } else {
            return sum - Number(entry.amount);
          }
        }, 0);

        await prisma.account.update({
          where: { id: transaction.accountId },
          data: { balance },
        });
        
        console.log(`   ✅ Saldo da conta atualizado: R$ ${balance.toFixed(2)}`);
        
        fixed++;
      } catch (e) {
        console.log(`   ❌ Erro:`, e.message);
        errors++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ ${fixed} transações corrigidas`);
    console.log(`   ❌ ${errors} erros`);
    console.log(`\n🎉 Correção concluída!`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSharedTransactionsBalance();
