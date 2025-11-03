const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Buscar transação "oi"
  const tx = await prisma.transaction.findFirst({
    where: {
      description: 'oi',
      amount: -30,
      deletedAt: null,
    },
  });

  if (tx) {
    console.log('🔍 Transação encontrada:', {
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
    });

    // Soft delete
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { deletedAt: new Date() },
    });

    // Deletar lançamentos contábeis também
    await prisma.journalEntry.deleteMany({
      where: { transactionId: tx.id },
    });

    console.log('✅ Transação "oi" excluída');
    console.log('✅ Lançamentos contábeis removidos');
  } else {
    console.log('❌ Transação "oi" não encontrada');
  }

  await prisma.$disconnect();
}

main();
