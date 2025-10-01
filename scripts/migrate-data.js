const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Iniciando migração de dados para transactions como SSOT...');
  
  try {
    // 1. Migrar CreditCardExpense para Transaction
    console.log('📊 Migrando CreditCardExpense para Transaction...');
    
    const creditCardExpenses = await prisma.$queryRaw`
      SELECT * FROM CreditCardExpense
    `;
    
    console.log(`Encontradas ${creditCardExpenses.length} despesas de cartão de crédito`);
    
    for (const expense of creditCardExpenses) {
      await prisma.transaction.create({
        data: {
          id: `cc_${expense.id}`, // Prefixo para evitar conflitos
          amount: expense.amount,
          description: expense.description || 'Despesa de cartão migrada',
          date: expense.date,
          type: 'expense',
          category: expense.category || 'outros',
          creditCardId: expense.creditCardId,
          accountId: expense.accountId || null,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt
        }
      });
    }
    
    console.log('✅ CreditCardExpense migradas com sucesso!');
    
    // 2. Migrar TripExpense para Transaction
    console.log('📊 Migrando TripExpense para Transaction...');
    
    const tripExpenses = await prisma.$queryRaw`
      SELECT * FROM TripExpense
    `;
    
    console.log(`Encontradas ${tripExpenses.length} despesas de viagem`);
    
    for (const expense of tripExpenses) {
      await prisma.transaction.create({
        data: {
          id: `trip_${expense.id}`, // Prefixo para evitar conflitos
          amount: expense.amount,
          description: expense.description || 'Despesa de viagem migrada',
          date: expense.date,
          type: 'expense',
          category: expense.category || 'viagem',
          tripId: expense.tripId,
          accountId: expense.accountId || null,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt
        }
      });
    }
    
    console.log('✅ TripExpense migradas com sucesso!');
    
    // 3. Verificar integridade dos dados
    console.log('🔍 Verificando integridade dos dados...');
    
    const totalTransactions = await prisma.transaction.count();
    const migratedCCTransactions = await prisma.transaction.count({
      where: { creditCardId: { not: null } }
    });
    const migratedTripTransactions = await prisma.transaction.count({
      where: { tripId: { not: null } }
    });
    
    console.log(`📈 Resumo da migração:`);
    console.log(`   Total de transactions: ${totalTransactions}`);
    console.log(`   Transactions de cartão: ${migratedCCTransactions}`);
    console.log(`   Transactions de viagem: ${migratedTripTransactions}`);
    
    console.log('🎉 Migração concluída com sucesso!');
    console.log('⚠️  IMPORTANTE: Teste todas as funcionalidades antes de remover as tabelas antigas');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Função para reverter a migração (caso necessário)
async function rollbackMigration() {
  console.log('🔄 Iniciando rollback da migração...');
  
  try {
    // Remove transactions migradas (identificadas pelos prefixos)
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'cc_' } },
          { id: { startsWith: 'trip_' } }
        ]
      }
    });
    
    console.log('✅ Rollback concluído!');
  } catch (error) {
    console.error('❌ Erro durante o rollback:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'rollback') {
    rollbackMigration().catch(console.error);
  } else {
    migrateData().catch(console.error);
  }
}

module.exports = { migrateData, rollbackMigration };