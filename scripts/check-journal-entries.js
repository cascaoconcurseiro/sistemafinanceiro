const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      accountId: { not: null },
      creditCardId: null,
    },
    include: {
      journalEntries: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log('Últimas 10 transações:\n');
  
  for (const tx of txs) {
    console.log(`${tx.description} (${tx.type})`);
    console.log(`  ID: ${tx.id}`);
    console.log(`  Lançamentos: ${tx.journalEntries.length}`);
    if (tx.journalEntries.length > 0) {
      tx.journalEntries.forEach(e => {
        console.log(`    - ${e.entryType}: R$ ${e.amount}`);
      });
    }
    console.log('');
  }
}

main().finally(() => prisma.$disconnect());
