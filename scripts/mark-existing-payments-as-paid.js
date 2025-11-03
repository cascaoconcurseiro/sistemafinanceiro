const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function markExistingPaymentsAsPaid() {
  console.log('🔧 Marcando pagamentos existentes como pagos...\n');

  try {
    // 1. Buscar todas as transações de pagamento de fatura
    const paymentTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { description: { contains: 'Recebimento -' } },
          { description: { contains: 'Pagamento -' } },
        ],
        metadata: { not: null },
        deletedAt: null,
      },
    });

    console.log(`📊 Encontradas ${paymentTransactions.length} transações de pagamento\n`);

    if (paymentTransactions.length === 0) {
      console.log('✅ Nenhuma transação de pagamento encontrada!');
      return;
    }

    let debtsMarked = 0;
    let transactionsProcessed = 0;

    for (const transaction of paymentTransactions) {
      try {
        const metadata = JSON.parse(transaction.metadata);
        
        // Verificar se é pagamento de fatura compartilhada
        if (metadata.type === 'shared_expense_payment') {
          const billingItemId = metadata.billingItemId;
          
          console.log(`\n🔍 Processando: ${transaction.description.substring(0, 60)}...`);
          console.log(`   billingItemId: ${billingItemId}`);
          
          // Se é uma dívida
          if (billingItemId?.startsWith('debt-')) {
            const debtId = billingItemId.replace('debt-', '');
            
            // Verificar se a dívida existe
            const debt = await prisma.sharedDebt.findUnique({
              where: { id: debtId },
            });
            
            if (debt) {
              if (debt.status !== 'paid') {
                // Marcar como paga
                await prisma.sharedDebt.update({
                  where: { id: debtId },
                  data: {
                    status: 'paid',
                    paidAt: transaction.createdAt,
                  },
                });
                console.log(`   ✅ Dívida ${debtId} marcada como paga`);
                debtsMarked++;
              } else {
                console.log(`   ℹ️  Dívida ${debtId} já estava marcada como paga`);
              }
            } else {
              console.log(`   ⚠️  Dívida ${debtId} não encontrada`);
            }
          }
          // Se é uma transação compartilhada
          else if (metadata.originalTransactionId) {
            console.log(`   ℹ️  Transação compartilhada - pagamento registrado`);
          }
          
          transactionsProcessed++;
        }
      } catch (e) {
        console.log(`   ❌ Erro ao processar ${transaction.id}:`, e.message);
      }
    }

    console.log(`\n🎉 Resumo:`);
    console.log(`   ${transactionsProcessed} transações processadas`);
    console.log(`   ${debtsMarked} dívidas marcadas como pagas`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

markExistingPaymentsAsPaid();
