/**
 * Script para corrigir transações "pagas por outros"
 * 
 * Problema: Transações compartilhadas onde outra pessoa pagou estão aparecendo
 * na lista normal e afetando o saldo incorretamente.
 * 
 * Solução: Identificar essas transações e marcar o campo paidBy corretamente.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPaidByOthersTransactions() {
  console.log('🔧 Iniciando correção de transações pagas por outros...\n');

  try {
    // Buscar transações compartilhadas que têm metadata indicando pagamento por outro
    const transactions = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        isShared: true,
      },
      include: {
        account: true,
      },
    });

    console.log(`📊 Encontradas ${transactions.length} transações compartilhadas\n`);

    let fixed = 0;

    for (const tx of transactions) {
      // Verificar se tem metadata indicando que foi pago por outro
      let metadata = null;
      try {
        metadata = tx.metadata ? JSON.parse(tx.metadata) : null;
      } catch (e) {
        // Ignorar erros de parse
      }

      // Se tem paidByName ou paidById no metadata, marcar o campo paidBy
      if (metadata && (metadata.paidByName || metadata.paidById)) {
        const paidBy = metadata.paidById || metadata.paidByName;
        
        console.log(`🔄 Corrigindo transação: ${tx.description}`);
        console.log(`   ID: ${tx.id}`);
        console.log(`   Valor: R$ ${tx.amount}`);
        console.log(`   Pago por: ${paidBy}`);
        
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { paidBy: paidBy },
        });
        
        fixed++;
        console.log(`   ✅ Corrigida!\n`);
      }
    }

    console.log(`\n✅ Correção concluída!`);
    console.log(`📊 Total de transações corrigidas: ${fixed}`);
    
    if (fixed > 0) {
      console.log(`\n💡 Dica: Recarregue a página para ver as mudanças`);
    } else {
      console.log(`\n💡 Nenhuma transação precisou ser corrigida`);
    }

  } catch (error) {
    console.error('❌ Erro ao corrigir transações:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
fixPaidByOthersTransactions()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
