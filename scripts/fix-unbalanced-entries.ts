/**
 * Script para corrigir lançamentos desbalanceados
 * Identifica e recria lançamentos contábeis incorretos
 */

import { prisma } from '../src/lib/prisma';
import { DoubleEntryService } from '../src/lib/services/double-entry-service';

async function fixUnbalancedEntries() {
  console.log('🔧 Iniciando correção de lançamentos desbalanceados...\n');

  try {
    // IDs das transações com problemas
    const problematicIds = [
      'cmhf1roqd00095varpif907p5',
      'cmhf1rpg800e5varlno29vi3'
    ];

    let fixed = 0;
    let errors = 0;

    for (const transactionId of problematicIds) {
      try {
        console.log(`\n📝 Processando transação: ${transactionId}`);

        // Buscar transação
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId }
        });

        if (!transaction) {
          console.log(`⚠️  Transação não encontrada: ${transactionId}`);
          continue;
        }

        // Buscar lançamentos atuais
        const currentEntries = await prisma.journalEntry.findMany({
          where: { transactionId }
        });

        console.log(`   Lançamentos atuais: ${currentEntries.length}`);

        // Calcular débitos e créditos
        const debits = currentEntries
          .filter(e => e.entryType === 'DEBITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const credits = currentEntries
          .filter(e => e.entryType === 'CREDITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);

        console.log(`   Débitos: R$ ${debits.toFixed(2)}`);
        console.log(`   Créditos: R$ ${credits.toFixed(2)}`);
        console.log(`   Diferença: R$ ${(debits - credits).toFixed(2)}`);

        if (Math.abs(debits - credits) < 0.01) {
          console.log(`   ✅ Lançamentos já estão balanceados!`);
          continue;
        }

        // Deletar lançamentos antigos
        await prisma.journalEntry.deleteMany({
          where: { transactionId }
        });

        console.log(`   🗑️  Lançamentos antigos deletados`);

        // Recriar lançamentos corretos
        await prisma.$transaction(async (tx) => {
          await DoubleEntryService.createJournalEntries(tx, transaction);
        });

        console.log(`   ✅ Lançamentos recriados corretamente!`);
        fixed++;

      } catch (error) {
        console.error(`   ❌ Erro ao processar ${transactionId}:`, error);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA CORREÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Corrigidos: ${fixed}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📝 Total processado: ${problematicIds.length}`);

    if (fixed > 0) {
      console.log('\n🎉 Lançamentos corrigidos com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
fixUnbalancedEntries();
