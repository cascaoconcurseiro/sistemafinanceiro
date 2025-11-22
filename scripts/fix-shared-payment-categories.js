const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSharedPaymentCategories() {
  console.log('🔧 Corrigindo categorias de pagamentos de fatura compartilhada...\n');

  try {
    // 1. Buscar transações de pagamento de fatura sem categoria
    const paymentsWithoutCategory = await prisma.transaction.findMany({
      where: {
        categoryId: null,
        OR: [
          { description: { contains: 'Recebimento -' } },
          { description: { contains: 'Pagamento -' } },
        ],
        metadata: { not: null },
      },
    });

    console.log(`📊 Encontradas ${paymentsWithoutCategory.length} transações sem categoria\n`);

    if (paymentsWithoutCategory.length === 0) {
      console.log('✅ Nenhuma transação precisa ser corrigida!');
      return;
    }

    // 2. Buscar ou criar categorias padrão
    const userId = paymentsWithoutCategory[0]?.userId;
    
    if (!userId) {
      console.log('❌ Nenhum userId encontrado');
      return;
    }

    // Categoria para recebimentos
    let receitaCategory = await prisma.category.findFirst({
      where: {
        userId,
        name: 'Recebimento de Dívida',
        type: 'RECEITA',
      },
    });

    if (!receitaCategory) {
      receitaCategory = await prisma.category.create({
        data: {
          userId,
          name: 'Recebimento de Dívida',
          type: 'RECEITA',
          description: 'Recebimentos de despesas compartilhadas',
          isActive: true,
        },
      });
      console.log('✅ Categoria "Recebimento de Dívida" criada');
    }

    // Categoria para pagamentos
    let despesaCategory = await prisma.category.findFirst({
      where: {
        userId,
        name: 'Pagamento de Dívida',
        type: 'DESPESA',
      },
    });

    if (!despesaCategory) {
      despesaCategory = await prisma.category.create({
        data: {
          userId,
          name: 'Pagamento de Dívida',
          type: 'DESPESA',
          description: 'Pagamentos de despesas compartilhadas',
          isActive: true,
        },
      });
      console.log('✅ Categoria "Pagamento de Dívida" criada');
    }

    console.log('');

    // 3. Atualizar transações
    let updated = 0;
    for (const transaction of paymentsWithoutCategory) {
      try {
        const metadata = JSON.parse(transaction.metadata);
        
        // Verificar se é pagamento de fatura compartilhada
        if (metadata.type === 'shared_expense_payment') {
          const isRecebimento = transaction.description.includes('Recebimento');
          const categoryId = isRecebimento ? receitaCategory.id : despesaCategory.id;
          const categoryName = isRecebimento ? 'Recebimento de Dívida' : 'Pagamento de Dívida';

          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { categoryId },
          });

          console.log(`✅ ${transaction.description.substring(0, 50)}... → ${categoryName}`);
          updated++;
        }
      } catch (e) {
        console.log(`⚠️  Erro ao processar ${transaction.id}:`, e.message);
      }
    }

    console.log(`\n🎉 ${updated} transações atualizadas com sucesso!`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSharedPaymentCategories();
