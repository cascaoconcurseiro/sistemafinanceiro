const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Buscar transação de R$ 30
  const tx = await prisma.transaction.findFirst({
    where: {
      amount: -30,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
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

    console.log('✅ Transação excluída (soft delete)');
  } else {
    console.log('❌ Transação de R$ 30 não encontrada');
  }

  await prisma.$disconnect();
}

main();
