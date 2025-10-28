const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreSharedTransactions() {
  console.log('🔧 Restaurando transações compartilhadas...\n');

  try {
    // Buscar transações que deveriam ser compartilhadas
    // (aquelas que têm sharedWith preenchido)
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { sharedWith: { not: null } },
          { sharedWith: { not: '[]' } },
          { sharedWith: { not: '' } }
        ]
      }
    });

    console.log(`📊 Encontradas ${transactions.length} transações com sharedWith\n`);

    for (const t of transactions) {
      console.log(`🔍 Transação: ${t.description}`);
      console.log(`   Amount: ${t.amount}`);
      console.log(`   IsShared: ${t.isShared}`);
      console.log(`   SharedWith: ${t.sharedWith}`);
      console.log(`   MyShare: ${t.myShare}`);
      
      // Se tem sharedWith mas isShared é false, corrigir
      if (!t.isShared) {
        console.log(`   ✅ Corrigindo para isShared=true`);
        
        // Se não tem myShare, calcular (50% do valor)
        let myShare = t.myShare;
        if (!myShare && t.sharedWith) {
          try {
            const sharedWithArray = JSON.parse(t.sharedWith);
            const totalPeople = sharedWithArray.length + 1; // +1 para incluir o dono
            myShare = Math.abs(Number(t.amount)) / totalPeople;
            console.log(`   💰 Calculando myShare: ${myShare} (${totalPeople} pessoas)`);
          } catch (e) {
            // Se não conseguir parsear, assumir 50%
            myShare = Math.abs(Number(t.amount)) / 2;
            console.log(`   💰 Calculando myShare (50%): ${myShare}`);
          }
        }
        
        await prisma.transaction.update({
          where: { id: t.id },
          data: { 
            isShared: true,
            myShare: myShare
          }
        });
        console.log('');
      } else {
        console.log(`   ✓ Já está correta\n`);
      }
    }

    console.log(`✅ Processadas ${transactions.length} transações`);

  } catch (error) {
    console.error('\n❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreSharedTransactions()
  .then(() => {
    console.log('\n🎉 Concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
