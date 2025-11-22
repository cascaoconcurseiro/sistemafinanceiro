const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { categoryId: null }
  });
  
  console.log(`Transações sem categoria: ${txs.length}\n`);
  
  txs.forEach(t => {
    console.log(`- ${t.id}`);
    console.log(`  Descrição: ${t.description}`);
    console.log(`  Tipo: ${t.type}`);
    console.log(`  Deletada: ${t.deletedAt ? 'SIM' : 'NÃO'}`);
    console.log('');
  });
}

main().finally(() => prisma.$disconnect());
