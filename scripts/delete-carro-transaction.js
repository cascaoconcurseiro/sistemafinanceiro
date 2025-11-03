const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txId = 'cmhe2vlmr0004q3id7zxgflzp';
  
  await prisma.transaction.update({
    where: { id: txId },
    data: { deletedAt: new Date() },
  });
  
  console.log('✅ Transação "Carro" excluída');
  
  await prisma.journalEntry.deleteMany({
    where: { transactionId: txId },
  });
  
  console.log('✅ Lançamentos contábeis removidos');
  
  await prisma.$disconnect();
}

main();
