/**
 * Script para corrigir campo myShare em transações compartilhadas
 * 
 * Problema: Transações compartilhadas antigas não têm o campo myShare preenchido,
 * fazendo com que apareça o valor total ao invés da parte do usuário
 * 
 * Solução: Calcular e preencher myShare baseado em sharedWith e totalSharedAmount
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSharedTransactionsMyShare() {
  console.log('🔧 Iniciando correção de myShare em transações compartilhadas...\n');

  try {
    // 1. Buscar todas as transações compartilhadas sem myShare
    const sharedTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { isShared: true },
          { type: 'shared' }
        ],
        deletedAt: null
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    console.log(`📊 Encontradas ${sharedTransactions.length} transações compartilhadas\n`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const transaction of sharedTransactions) {
      try {
        // Verificar se já tem myShare preenchido
        if (transaction.myShare && Number(transaction.myShare) > 0) {
          console.log(`⏭️  Pulando ${transaction.description} - myShare já preenchido (R$ ${Number(transaction.myShare).toFixed(2)})`);
          skipped++;
          continue;
        }

        // Calcular myShare
        let myShare = 0;
        const totalAmount = Math.abs(Number(transaction.amount));

        // Tentar parsear sharedWith
        let sharedWith = [];
        if (transaction.sharedWith) {
          try {
            sharedWith = typeof transaction.sharedWith === 'string' 
              ? JSON.parse(transaction.sharedWith) 
              : transaction.sharedWith;
          } catch (e) {
            console.warn(`⚠️  Erro ao parsear sharedWith para ${transaction.description}`);
          }
        }

        // Se tiver sharedWith, dividir igualmente
        if (Array.isArray(sharedWith) && sharedWith.length > 0) {
          const totalParticipants = sharedWith.length + 1; // +1 para o usuário
          myShare = totalAmount / totalParticipants;
          
          console.log(`✅ ${transaction.description}:`);
          console.log(`   Total: R$ ${totalAmount.toFixed(2)}`);
          console.log(`   Participantes: ${totalParticipants} (você + ${sharedWith.length})`);
          console.log(`   Sua parte: R$ ${myShare.toFixed(2)}`);
        } else {
          // Se não tiver sharedWith, assumir divisão 50/50
          myShare = totalAmount / 2;
          
          console.log(`✅ ${transaction.description}:`);
          console.log(`   Total: R$ ${totalAmount.toFixed(2)}`);
          console.log(`   Divisão padrão 50/50`);
          console.log(`   Sua parte: R$ ${myShare.toFixed(2)}`);
        }

        // Atualizar transação
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            myShare: myShare,
            totalSharedAmount: totalAmount
          }
        });

        fixed++;
        console.log(`   ✓ Atualizado\n`);

      } catch (error) {
        console.error(`❌ Erro ao processar ${transaction.description}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`   ✅ Corrigidas: ${fixed}`);
    console.log(`   ⏭️  Puladas: ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`   📝 Total: ${sharedTransactions.length}`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
fixSharedTransactionsMyShare()
  .then(() => {
    console.log('\n✅ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });
