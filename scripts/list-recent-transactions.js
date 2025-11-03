const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  console.log('📊 Últimas 10 transações:\n');
  
  transactions.forEach((tx, index) => {
    console.log(`${index + 1}. ${tx.description}`);
    console.log(`   ID: ${tx.id}`);
    console.log(`   Valor: R$ ${Number(tx.amount).toFixed(2)}`);
    console.log(`   Data: ${tx.date.toISOString().split('T')[0]}`);
    console.log(`   Tipo: ${tx.type}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main();
