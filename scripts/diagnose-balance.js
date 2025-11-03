/**
 * SCRIPT: Diagnosticar Desbalanceamento
 * Identifica transações que causam desbalanceamento
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Diagnosticando desbalanceamento...\n');

  // 1. Verificar total de débitos e créditos
  const entries = await prisma.journalEntry.findMany({
    include: {
      transaction: true,
      account: true,
    },
  });

  const totalDebits = entries
    .filter((e) => e.entryType === 'DEBITO')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalCredits = entries
    .filter((e) => e.entryType === 'CREDITO')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  console.log('📊 Totais Gerais:');
  console.log(`   Débitos:  R$ ${totalDebits.toFixed(2)}`);
  console.log(`   Créditos: R$ ${totalCredits.toFixed(2)}`);
  console.log(`   Diferença: R$ ${Math.abs(totalDebits - totalCredits).toFixed(2)}\n`);

  // 2. Agrupar por transação
  const transactionGroups = {};
  
  entries.forEach((entry) => {
    const txId = entry.transactionId;
    if (!transactionGroups[txId]) {
      transactionGroups[txId] = {
        transaction: entry.transaction,
        debits: 0,
        credits: 0,
        entries: [],
      };
    }
    
    if (entry.entryType === 'DEBITO') {
      transactionGroups[txId].debits += Number(entry.amount);
    } else {
      transactionGroups[txId].credits += Number(entry.amount);
    }
    
    transactionGroups[txId].entries.push(entry);
  });

  // 3. Encontrar transações desbalanceadas
  console.log('🔍 Transações Desbalanceadas:\n');
  
  let foundIssues = false;
  
  Object.entries(transactionGroups).forEach(([txId, group]) => {
    const diff = Math.abs(group.debits - group.credits);
    
    if (diff > 0.01) {
      foundIssues = true;
      console.log(`❌ Transação: ${group.transaction.description}`);
      console.log(`   ID: ${txId}`);
      console.log(`   Tipo: ${group.transaction.type}`);
      console.log(`   Data: ${group.transaction.date.toISOString().split('T')[0]}`);
      console.log(`   Valor: R$ ${Number(group.transaction.amount).toFixed(2)}`);
      console.log(`   Débitos:  R$ ${group.debits.toFixed(2)}`);
      console.log(`   Créditos: R$ ${group.credits.toFixed(2)}`);
      console.log(`   Diferença: R$ ${diff.toFixed(2)}`);
      console.log(`   Lançamentos:`);
      
      group.entries.forEach((entry) => {
        console.log(`      ${entry.entryType}: ${entry.account.name} - R$ ${Number(entry.amount).toFixed(2)}`);
      });
      
      console.log('');
    }
  });

  if (!foundIssues) {
    console.log('✅ Todas as transações estão balanceadas individualmente\n');
    console.log('⚠️  O desbalanceamento pode ser causado por:');
    console.log('   1. Transações sem lançamentos contábeis');
    console.log('   2. Lançamentos órfãos (sem transação)');
    console.log('   3. Contas de sistema desbalanceadas\n');
  }

  // 4. Verificar transações sem lançamentos
  const transactionsWithoutEntries = await prisma.transaction.count({
    where: {
      deletedAt: null,
      journalEntries: {
        none: {},
      },
    },
  });

  console.log(`📝 Transações sem lançamentos: ${transactionsWithoutEntries}`);

  // 5. Verificar lançamentos órfãos
  const orphanEntries = await prisma.journalEntry.findMany({
    where: {
      transaction: null,
    },
  });

  console.log(`🔗 Lançamentos órfãos: ${orphanEntries.length}`);

  // 6. Verificar saldos das contas
  console.log('\n💰 Saldos das Contas:\n');
  
  const accounts = await prisma.account.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      journalEntries: {
        include: {
          transaction: true,
        },
      },
    },
  });

  accounts.forEach((account) => {
    const validEntries = account.journalEntries.filter(
      (e) => e.transaction && e.transaction.deletedAt === null
    );

    const debits = validEntries
      .filter((e) => e.entryType === 'DEBITO')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const credits = validEntries
      .filter((e) => e.entryType === 'CREDITO')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    let calculatedBalance = 0;
    
    switch (account.type) {
      case 'ATIVO':
        calculatedBalance = debits - credits;
        break;
      case 'PASSIVO':
        calculatedBalance = credits - debits;
        break;
      case 'RECEITA':
        calculatedBalance = credits - debits;
        break;
      case 'DESPESA':
        calculatedBalance = debits - credits;
        break;
    }

    const storedBalance = Number(account.balance);
    const diff = Math.abs(calculatedBalance - storedBalance);

    if (diff > 0.01 || validEntries.length > 0) {
      console.log(`${account.name} (${account.type})`);
      console.log(`   Saldo armazenado: R$ ${storedBalance.toFixed(2)}`);
      console.log(`   Saldo calculado:  R$ ${calculatedBalance.toFixed(2)}`);
      
      if (diff > 0.01) {
        console.log(`   ⚠️  Diferença: R$ ${diff.toFixed(2)}`);
      }
      
      console.log(`   Lançamentos: ${validEntries.length} (D: ${debits.toFixed(2)}, C: ${credits.toFixed(2)})`);
      console.log('');
    }
  });

  await prisma.$disconnect();
}

main()
  .then(() => {
    console.log('✅ Diagnóstico concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
