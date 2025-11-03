const { PrismaClient } = require('@prisma/client');

async function findPhantomDebt() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Buscando todas as dívidas...\n');

    // Buscar todas as dívidas
    const debts = await prisma.sharedDebt.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total de dívidas encontradas: ${debts.length}\n`);

    // Filtrar dívidas ativas (não canceladas)
    const activeDebts = debts.filter(d => d.status !== 'cancelled');
    console.log(`✅ Dívidas ativas: ${activeDebts.length}\n`);

    // Mostrar detalhes de cada dívida
    activeDebts.forEach((debt, index) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Dívida #${index + 1}:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`ID: ${debt.id}`);
      console.log(`Descrição: ${debt.description}`);
      console.log(`Valor Original: R$ ${debt.originalAmount}`);
      console.log(`Valor Atual: R$ ${debt.currentAmount}`);
      console.log(`Status: ${debt.status}`);
      console.log(`Devedor ID: ${debt.debtorId}`);
      console.log(`Credor ID: ${debt.creditorId}`);
      console.log(`Criado em: ${debt.createdAt}`);
      console.log(`TransactionId: ${debt.transactionId || 'NENHUM'}`);
      console.log(`TripId: ${debt.tripId || 'NENHUM'}`);
      console.log(`Metadata: ${debt.metadata || 'NENHUM'}`);
    });

    // Buscar dívidas de R$ 50,00 especificamente
    console.log('\n\n🔍 Buscando dívidas de R$ 50,00...\n');
    const fiftyDebts = activeDebts.filter(d => 
      d.currentAmount === 50 || d.originalAmount === 50
    );

    if (fiftyDebts.length > 0) {
      console.log(`⚠️ ENCONTRADAS ${fiftyDebts.length} DÍVIDAS DE R$ 50,00:\n`);
      fiftyDebts.forEach((debt, index) => {
        console.log(`\n🔴 Dívida Suspeita #${index + 1}:`);
        console.log(`   ID: ${debt.id}`);
        console.log(`   Descrição: ${debt.description}`);
        console.log(`   Valor: R$ ${debt.currentAmount}`);
        console.log(`   Status: ${debt.status}`);
        console.log(`   Devedor ID: ${debt.debtorId}`);
        console.log(`   Credor ID: ${debt.creditorId}`);
        console.log(`   TransactionId: ${debt.transactionId || 'NENHUM'}`);
      });
    } else {
      console.log('✅ Nenhuma dívida de R$ 50,00 encontrada');
    }

    // Buscar transações relacionadas
    console.log('\n\n🔍 Buscando transações compartilhadas...\n');
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { sharedWith: { not: null } },
          { paidBy: { not: null } }
        ]
      },
      orderBy: {
        date: 'desc'
      },
      take: 20
    });

    console.log(`📊 Transações compartilhadas encontradas: ${transactions.length}\n`);

    transactions.forEach((tx, index) => {
      console.log(`\nTransação #${index + 1}:`);
      console.log(`   ID: ${tx.id}`);
      console.log(`   Descrição: ${tx.description}`);
      console.log(`   Valor: R$ ${tx.amount}`);
      console.log(`   Data: ${tx.date}`);
      console.log(`   SharedWith: ${tx.sharedWith || 'NENHUM'}`);
      console.log(`   PaidBy: ${tx.paidBy || 'NENHUM'}`);
      console.log(`   Metadata: ${tx.metadata || 'NENHUM'}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findPhantomDebt();
