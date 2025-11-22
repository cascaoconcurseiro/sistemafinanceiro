const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const oldTxs = await prisma.transaction.findMany({
    where: {
      id: { in: ['trans-1', 'trans-2', 'trans-3'] },
    },
    include: {
      journalEntries: true,
      account: true,
      categoryRef: true,
    },
  });

  console.log('Transações antigas:\n');
  
  for (const tx of oldTxs) {
    console.log(`${tx.description} (${tx.type})`);
    console.log(`  ID: ${tx.id}`);
    console.log(`  Account: ${tx.account?.name || 'NULL'}`);
    console.log(`  Category: ${tx.categoryRef?.name || 'NULL'}`);
    console.log(`  Amount: ${tx.amount}`);
    console.log(`  Lançamentos: ${tx.journalEntries.length}`);
    console.log('');
  }
}

main().finally(() => prisma.$disconnect());
