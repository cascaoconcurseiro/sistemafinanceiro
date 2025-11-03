const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanPhantomPayments() {
  console.log('🧹 Limpando pagamentos fantasma...\n');

  try {
    // IDs das transações atuais (que devem ser mantidas)
    const validTransactionIds = [
      'cmhhn27jx000v3hkgffx3fovp',  // TESTE NORMAL
      'cmhhn2mxq00143hkg3bzk139g',  // TESTE NORMAL PARCELADO 1/5
      'cmhhn2mxx00173hkgi39upjkr',  // TESTE NORMAL PARCELADO 2/5
      'cmhhn2my1001a3hkglgaroix8',  // TESTE NORMAL PARCELADO 3/5
      'cmhhn2my5001d3hkg7681u10r',  // TESTE NORMAL PARCELADO 4/5
      'cmhhn2my9001g3hkgq4epej88',  // TESTE NORMAL PARCELADO 5/5
      'cmhhn2myd001j3hkg5j4mp0dn',  // TESTE NORMAL PARCELADO 6/5 (?)
      'cmhhn36ea001n3hkgpnb5hmsj',  // TESTE VIAGEM
    ];

    // Buscar todos os pagamentos de fatura
    const payments = await prisma.transaction.findMany({
      where: {
        OR: [
          { description: { contains: 'Recebimento -' } },
          { description: { contains: 'Pagamento -' } },
        ],
        metadata: { not: null }
      }
    });

    console.log(`📊 Total de pagamentos encontrados: ${payments.length}\n`);

    const toDelete = [];

    for (const payment of payments) {
      try {
        const metadata = JSON.parse(payment.metadata);
        
        if (metadata.type === 'shared_expense_payment' && metadata.billingItemId) {
          // Extrair o ID da transação original do billingItemId
          const originalTxId = metadata.originalTransactionId;
          
          // Verificar se a transação original ainda existe
          const originalExists = validTransactionIds.includes(originalTxId);
          
          if (!originalExists) {
            console.log(`❌ Pagamento fantasma encontrado:`);
            console.log(`   ID: ${payment.id}`);
            console.log(`   Descrição: ${payment.description}`);
            console.log(`   Valor: R$ ${payment.amount}`);
            console.log(`   Original TX: ${originalTxId} (NÃO EXISTE MAIS)`);
            console.log('');
            
            toDelete.push(payment.id);
          } else {
            console.log(`✅ Pagamento válido:`);
            console.log(`   ID: ${payment.id}`);
            console.log(`   Descrição: ${payment.description}`);
            console.log(`   Original TX: ${originalTxId} (EXISTE)`);
            console.log('');
          }
        }
      } catch (e) {
        console.log(`⚠️ Erro ao processar pagamento ${payment.id}`);
      }
    }

    if (toDelete.length > 0) {
      console.log(`\n🗑️ Deletando ${toDelete.length} pagamentos fantasma...\n`);
      
      const result = await prisma.transaction.deleteMany({
        where: {
          id: { in: toDelete }
        }
      });

      console.log(`✅ ${result.count} pagamentos deletados com sucesso!`);
    } else {
      console.log(`\n✅ Nenhum pagamento fantasma encontrado!`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanPhantomPayments();
