const { PrismaClient } = require('@prisma/client');

async function fixMyShareTripTransactions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Corrigindo myShare de transações de viagem...\n');

    // Buscar transações compartilhadas sem myShare
    const transactions = await prisma.transaction.findMany({
      where: {
        isShared: true,
        myShare: null,
        deletedAt: null
      }
    });

    console.log(`📊 Transações sem myShare: ${transactions.length}\n`);

    if (transactions.length === 0) {
      console.log('✅ Todas as transações já têm myShare definido!');
      return;
    }

    // Corrigir cada transação
    for (const tx of transactions) {
      console.log(`🔧 Corrigindo transação: ${tx.id}`);
      console.log(`   Descrição: ${tx.description}`);
      console.log(`   Valor Total: R$ ${tx.amount}`);

      let myShare = Math.abs(tx.amount);
      let totalSharedAmount = 0;

      if (tx.sharedWith) {
        try {
          const sharedWith = JSON.parse(tx.sharedWith);
          const totalParticipants = sharedWith.length + 1; // +1 para incluir você
          myShare = Math.abs(tx.amount) / totalParticipants;
          totalSharedAmount = Math.abs(tx.amount);

          console.log(`   Participantes: ${totalParticipants}`);
          console.log(`   MyShare Calculado: R$ ${myShare.toFixed(2)}`);
        } catch (e) {
          console.log(`   ⚠️ Erro ao parsear sharedWith, usando valor total`);
        }
      } else {
        console.log(`   ⚠️ Sem sharedWith, usando valor total`);
      }

      // Atualizar transação
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          myShare: myShare,
          totalSharedAmount: totalSharedAmount > 0 ? totalSharedAmount : null
        }
      });

      console.log(`   ✅ Atualizado: myShare = R$ ${myShare.toFixed(2)}\n`);
    }

    console.log('✅ Todas as transações foram corrigidas!');
    console.log('\n📋 Agora os gastos de viagem devem aparecer corretamente nos cards.');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMyShareTripTransactions();
