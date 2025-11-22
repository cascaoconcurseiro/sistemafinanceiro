const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixExistingSharedPayments() {
  console.log('🔧 Corrigindo pagamentos de fatura compartilhada existentes...\n');

  try {
    // 1. Buscar transações de pagamento de fatura
    const paymentTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { description: { contains: 'Recebimento -' } },
          { description: { contains: 'Pagamento -' } },
        ],
        metadata: { not: null },
      },
    });

    console.log(`📊 Encontradas ${paymentTransactions.length} transações de pagamento\n`);

    if (paymentTransactions.length === 0) {
      console.log('✅ Nenhuma transação precisa ser corrigida!');
      return;
    }

    let fixed = 0;
    let errors = 0;

    for (const transaction of paymentTransactions) {
      try {
        const metadata = JSON.parse(transaction.metadata);
        
        // Verificar se é pagamento de fatura compartilhada
        if (metadata.type === 'shared_expense_payment') {
          const billingItemId = metadata.billingItemId;
          
          console.log(`\n🔍 Processando: ${transaction.description.substring(0, 50)}...`);
          console.log(`   billingItemId: ${billingItemId}`);
          
          // Se é uma dívida (ID começa com 'debt-')
          if (billingItemId?.startsWith('debt-')) {
            const debtId = billingItemId.replace('debt-', '');
            
            // Verificar se a dívida existe
            const debt = await prisma.sharedDebt.findUnique({
              where: { id: debtId },
            });
            
            if (debt) {
              // Marcar como paga
              await prisma.sharedDebt.update({
                where: { id: debtId },
                data: {
                  status: 'paid',
                  paidAt: transaction.createdAt,
                },
              });
              
              console.log(`   ✅ Dívida ${debtId} marcada como paga`);
              fixed++;
            } else {
              console.log(`   ⚠️  Dívida ${debtId} não encontrada`);
              errors++;
            }
          } else {
            console.log(`   ℹ️  Transação compartilhada (não é dívida)`);
          }
        }
      } catch (e) {
        console.log(`   ❌ Erro ao processar ${transaction.id}:`, e.message);
        errors++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ ${fixed} dívidas marcadas como pagas`);
    console.log(`   ❌ ${errors} erros`);
    console.log(`\n🎉 Correção concluída!`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingSharedPayments();
