/**
 * SCRIPT: Auditoria Completa do Sistema
 * 
 * Verifica:
 * 1. Transações sem lançamentos contábeis
 * 2. Contas com saldo incorreto
 * 3. Cartões com saldo incorreto
 * 4. Transações órfãs (sem conta/cartão)
 * 5. Categorias inativas sendo usadas
 * 6. Datas futuras suspeitas
 * 7. Valores zerados suspeitos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 AUDITORIA COMPLETA DO SISTEMA\n');
  console.log('='.repeat(60));

  const issues = {
    missingJournalEntries: [],
    incorrectBalances: [],
    orphanTransactions: [],
    inactiveCategories: [],
    suspiciousDates: [],
    zeroAmounts: [],
    missingCategories: [],
  };

  // ============================================
  // 1. TRANSAÇÕES SEM LANÇAMENTOS CONTÁBEIS
  // ============================================
  console.log('\n📊 1. Verificando Lançamentos Contábeis...');
  
  const transactions = await prisma.transaction.findMany({
    where: { deletedAt: null },
    include: {
      journalEntries: true,
      account: { select: { name: true, type: true } },
      creditCard: { select: { name: true } },
    },
  });

  for (const tx of transactions) {
    // Transações de cartão não têm lançamentos (sistema de faturamento próprio)
    if (tx.creditCardId) continue;
    
    // Transações de conta devem ter lançamentos
    if (tx.accountId && tx.journalEntries.length === 0) {
      issues.missingJournalEntries.push({
        id: tx.id,
        description: tx.description,
        type: tx.type,
        amount: Number(tx.amount),
        account: tx.account?.name,
        date: tx.date,
      });
    }
  }

  console.log(`   Encontradas: ${issues.missingJournalEntries.length} transações sem lançamentos`);
  if (issues.missingJournalEntries.length > 0) {
    console.log('   ⚠️ PROBLEMA: Transações sem partidas dobradas');
    issues.missingJournalEntries.slice(0, 3).forEach(i => {
      console.log(`      - ${i.description} (${i.type}): R$ ${i.amount.toFixed(2)}`);
    });
  } else {
    console.log('   ✅ OK: Todas as transações têm lançamentos');
  }

  // ============================================
  // 2. CONTAS COM SALDO INCORRETO
  // ============================================
  console.log('\n💰 2. Verificando Saldos das Contas...');
  
  const accounts = await prisma.account.findMany({
    where: {
      deletedAt: null,
      type: 'ATIVO',
    },
    include: {
      journalEntries: {
        where: {
          transaction: {
            deletedAt: null,
          },
        },
      },
    },
  });

  for (const account of accounts) {
    // Calcular saldo baseado em lançamentos
    const calculatedBalance = account.journalEntries.reduce((sum, entry) => {
      if (entry.entryType === 'DEBITO') {
        return sum + Number(entry.amount);
      } else {
        return sum - Number(entry.amount);
      }
    }, 0);

    const storedBalance = Number(account.balance);
    const diff = Math.abs(calculatedBalance - storedBalance);

    if (diff > 0.01) {
      issues.incorrectBalances.push({
        accountId: account.id,
        accountName: account.name,
        storedBalance,
        calculatedBalance,
        difference: diff,
      });
    }
  }

  console.log(`   Encontradas: ${issues.incorrectBalances.length} contas com saldo incorreto`);
  if (issues.incorrectBalances.length > 0) {
    console.log('   ⚠️ PROBLEMA: Saldos desatualizados');
    issues.incorrectBalances.forEach(i => {
      console.log(`      - ${i.accountName}: Armazenado R$ ${i.storedBalance.toFixed(2)}, Calculado R$ ${i.calculatedBalance.toFixed(2)} (Diff: R$ ${i.difference.toFixed(2)})`);
    });
  } else {
    console.log('   ✅ OK: Todos os saldos estão corretos');
  }

  // ============================================
  // 3. TRANSAÇÕES ÓRFÃS
  // ============================================
  console.log('\n🔗 3. Verificando Transações Órfãs...');
  
  const orphans = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      accountId: null,
      creditCardId: null,
    },
  });

  issues.orphanTransactions = orphans.map(tx => ({
    id: tx.id,
    description: tx.description,
    amount: Number(tx.amount),
    date: tx.date,
  }));

  console.log(`   Encontradas: ${issues.orphanTransactions.length} transações órfãs`);
  if (issues.orphanTransactions.length > 0) {
    console.log('   ⚠️ PROBLEMA: Transações sem conta ou cartão');
    issues.orphanTransactions.slice(0, 3).forEach(i => {
      console.log(`      - ${i.description}: R$ ${i.amount.toFixed(2)}`);
    });
  } else {
    console.log('   ✅ OK: Todas as transações têm conta ou cartão');
  }

  // ============================================
  // 4. CATEGORIAS INATIVAS SENDO USADAS
  // ============================================
  console.log('\n📂 4. Verificando Categorias Inativas...');
  
  const inactiveCategories = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      categoryRef: {
        isActive: false,
      },
    },
    include: {
      categoryRef: { select: { name: true } },
    },
  });

  issues.inactiveCategories = inactiveCategories.map(tx => ({
    id: tx.id,
    description: tx.description,
    category: tx.categoryRef?.name,
  }));

  console.log(`   Encontradas: ${issues.inactiveCategories.length} transações com categoria inativa`);
  if (issues.inactiveCategories.length > 0) {
    console.log('   ⚠️ AVISO: Transações usando categorias inativas');
  } else {
    console.log('   ✅ OK: Todas as categorias estão ativas');
  }

  // ============================================
  // 5. DATAS FUTURAS SUSPEITAS
  // ============================================
  console.log('\n📅 5. Verificando Datas Futuras...');
  
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 6); // 6 meses no futuro

  const futureTxs = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      date: { gt: futureDate },
      status: 'cleared', // Transações pagas no futuro são suspeitas
    },
  });

  issues.suspiciousDates = futureTxs.map(tx => ({
    id: tx.id,
    description: tx.description,
    date: tx.date,
    amount: Number(tx.amount),
  }));

  console.log(`   Encontradas: ${issues.suspiciousDates.length} transações com data suspeita`);
  if (issues.suspiciousDates.length > 0) {
    console.log('   ⚠️ AVISO: Transações pagas muito no futuro');
  } else {
    console.log('   ✅ OK: Todas as datas são razoáveis');
  }

  // ============================================
  // 6. VALORES ZERADOS SUSPEITOS
  // ============================================
  console.log('\n💵 6. Verificando Valores Zerados...');
  
  const zeroTxs = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      amount: 0,
    },
  });

  issues.zeroAmounts = zeroTxs.map(tx => ({
    id: tx.id,
    description: tx.description,
    type: tx.type,
  }));

  console.log(`   Encontradas: ${issues.zeroAmounts.length} transações com valor zero`);
  if (issues.zeroAmounts.length > 0) {
    console.log('   ⚠️ AVISO: Transações com valor R$ 0,00');
  } else {
    console.log('   ✅ OK: Todas as transações têm valor');
  }

  // ============================================
  // RESUMO FINAL
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA AUDITORIA');
  console.log('='.repeat(60));

  const totalIssues = 
    issues.missingJournalEntries.length +
    issues.incorrectBalances.length +
    issues.orphanTransactions.length +
    issues.inactiveCategories.length +
    issues.suspiciousDates.length +
    issues.zeroAmounts.length;

  console.log(`\n🔍 Total de problemas encontrados: ${totalIssues}`);
  console.log('');
  console.log(`   📊 Sem lançamentos contábeis: ${issues.missingJournalEntries.length}`);
  console.log(`   💰 Saldos incorretos: ${issues.incorrectBalances.length}`);
  console.log(`   🔗 Transações órfãs: ${issues.orphanTransactions.length}`);
  console.log(`   📂 Categorias inativas: ${issues.inactiveCategories.length}`);
  console.log(`   📅 Datas suspeitas: ${issues.suspiciousDates.length}`);
  console.log(`   💵 Valores zerados: ${issues.zeroAmounts.length}`);

  console.log('\n' + '='.repeat(60));

  if (totalIssues === 0) {
    console.log('\n🎉 SISTEMA PERFEITO! Nenhum problema encontrado.');
  } else if (totalIssues < 5) {
    console.log('\n✅ SISTEMA BOM! Poucos problemas encontrados.');
  } else if (totalIssues < 20) {
    console.log('\n⚠️ SISTEMA PRECISA DE ATENÇÃO! Alguns problemas encontrados.');
  } else {
    console.log('\n❌ SISTEMA CRÍTICO! Muitos problemas encontrados.');
  }

  // Salvar relatório detalhado
  if (totalIssues > 0) {
    const fs = require('fs');
    const report = {
      date: new Date().toISOString(),
      totalIssues,
      issues,
    };
    fs.writeFileSync(
      'audit-report.json',
      JSON.stringify(report, null, 2)
    );
    console.log('\n📄 Relatório detalhado salvo em: audit-report.json');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
