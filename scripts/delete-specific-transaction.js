const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txId = 'cmhdsiz6f0002q5dmn5p7z2j2';
  
  // Excluir transação
  await prisma.transaction.update({
    where: { id: txId },
    data: { deletedAt: new Date() },
  });
  
  console.log('✅ Transação "oi" excluída');
  
  // Excluir lançamentos
  await prisma.journalEntry.deleteMany({
    where: { transactionId: txId },
  });
  
  console.log('✅ Lançamentos contábeis removidos');
  
  await prisma.$disconnect();
}

main();
