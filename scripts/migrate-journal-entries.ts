import { prisma } from '@/lib/prisma';
import { DoubleEntryService } from '@/lib/services/double-entry-service';

async function migrateJournalEntries() {
  console.log('🔄 Migrando lançamentos contábeis...\n');
  console.log('='.repeat(60));
  
  // Buscar transações sem lançamentos
  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      journalEntries: { none: {} }
    },
    orderBy: { date: 'asc' }
  });
  
  console.log(`\n📊 Encontradas ${transactions.length} transações sem lançamentos\n`);
  
  if (transactions.length === 0) {
    console.log('✅ Todas as transações já têm lançamentos!');
    return { migrated: 0, errors: 0 };
  }
  
  let migrated = 0;
  let errors = 0;
  const errorDetails: any[] = [];
  
  for (const transaction of transactions) {
    try {
      await prisma.$transaction(async (tx) => {
        await DoubleEntryService.createJournalEntries(tx, transaction);
      });
      
      migrated++;
      
      if (migrated % 100 === 0) {
        const progress = ((migrated / transactions.length) * 100).toFixed(1);
        console.log(`✅ Progresso: ${migrated}/${transactions.length} (${progress}%)`);
      }
    } catch (error) {
      errors++;
      errorDetails.push({
        transactionId: transaction.id,
        description: transaction.description,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      
      console.error(`❌ Erro na transação ${transaction.id}: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO DA MIGRAÇÃO');
  console.log('='.repeat(60));
  console.log(`✅ Migradas com sucesso: ${migrated}`);
  console.log(`❌ Erros: ${errors}`);
  console.log(`📈 Taxa de sucesso: ${((migrated / (migrated + errors)) * 100).toFixed(1)}%`);
  
  if (errors > 0) {
    console.log('\n❌ DETALHES DOS ERROS:\n');
    errorDetails.forEach((detail, index) => {
      console.log(`${index + 1}. Transação ${detail.transactionId}`);
      console.log(`   Descrição: ${detail.description}`);
      console.log(`   Erro: ${detail.error}\n`);
    });
  }
  
  return { migrated, errors, errorDetails };
}

// Executar
migrateJournalEntries()
  .then(result => {
    if (result.errors === 0) {
      console.log('\n🎉 Migração concluída com sucesso!');
    } else {
      console.log('\n⚠️  Migração concluída com erros!');
    }
  })
  .catch(error => {
    console.error('❌ Erro fatal na migração:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
