const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteReceipt() {
  console.log('🗑️  Deletando receita sem tripId...\n');
  
  const deleted = await prisma.transaction.deleteMany({
    where: {
      type: 'RECEITA',
      description: {
        contains: 'Recebimento - iiihhhh'
      },
      tripId: null
    }
  });
  
  console.log(`✅ Deletadas ${deleted.count} receitas\n`);
  
  await prisma.$disconnect();
}

deleteReceipt().catch(console.error);
