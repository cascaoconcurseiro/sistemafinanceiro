import { prisma } from '@/lib/prisma';

interface ValidationResult {
  name: string;
  passed: boolean;
  issues: number;
  details?: string;
}

async function validateSystem() {
  console.log('🔍 Iniciando validação do sistema...\n');
  console.log('='.repeat(60));
  
  const results: ValidationResult[] = [];
  
  // 1. Transações sem lançamentos
  console.log('\n1️⃣ Verificando transações sem lançamentos...');
  const transactionsWithoutEntries = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      journalEntries: { none: {} }
    }
  });
  
  results.push({
    name: 'Transações sem lançamentos',
    passed: transactionsWithoutEntries.length === 0,
    issues: transactionsWithoutEntries.length,
    details: transactionsWithoutEntries.length > 0
      ? `IDs: ${transactionsWithoutEntries.slice(0, 5).map(t => t.id).join(', ')}${transactionsWithoutEntries.length > 5 ? '...' : ''}`
      : undefined
  });
  
  // 2. Lançamentos desbalanceados
  console.log('2️⃣ Verificando balanceamento...');
  const unbalanced = await prisma.$queryRaw<any[]>`
    SELECT 
      transaction_id,
      SUM(CASE WHEN entry_type = 'DEBITO' THEN amount ELSE 0 END) as debits,
      SUM(CASE WHEN entry_type = 'CREDITO' THEN amount ELSE 0 END) as credits
    FROM journal_entries
    GROUP BY transaction_id
    HAVING ABS(debits - credits) > 0.01
  `;
  
  results.push({
    name: 'Lançamentos balanceados',
    passed: unbalanced.length === 0,
    issues: unbalanced.length,
    details: unbalanced.length > 0
      ? `IDs: ${unbalanced.slice(0, 5).map(u => u.transaction_id).join(', ')}${unbalanced.length > 5 ? '...' : ''}`
      : undefined
  });
  
  // 3. Saldos incorretos
  console.log('3️⃣ Verificando saldos...');
  const accounts = await prisma.account.findMany({
    where: { deletedAt: null },
    include: {
      transactions: {
        where: { deletedAt: null }
      }
    }
  });
  
  const wrongBalances = accounts.filter(account => {
    const calculated = account.transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    return Math.abs(Number(account.balance) - calculated) > 0.01;
  });
  
  results.push({
    name: 'Saldos corretos',
    passed: wrongBalances.length === 0,
    issues: wrongBalances.length,
    details: wrongBalances.length > 0
      ? `Contas: ${wrongBalances.slice(0, 3).map(a => a.name).join(', ')}${wrongBalances.length > 3 ? '...' : ''}`
      : undefined
  });
  
  // 4. Transações órfãs
  console.log('4️⃣ Verificando transações órfãs...');
  const orphans = await prisma.transaction.count({
    where: {
      deletedAt: null,
      accountId: null,
      creditCardId: null
    }
  });
  
  results.push({
    name: 'Sem transações órfãs',
    passed: orphans === 0,
    issues: orphans
  });
  
  // 5. Categorias inválidas
  console.log('5️⃣ Verificando categorias...');
  const invalidCategories = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      categoryId: { not: null },
      categoryRef: null
    }
  });
  
  results.push({
    name: 'Categorias válidas',
    passed: invalidCategories.length === 0,
    issues: invalidCategories.length
  });
  
  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE VALIDAÇÃO');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const status = result.passed ? 'OK' : `${result.issues} problemas`;
    console.log(`${icon} ${result.name}: ${status}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
  });
  
  console.log('='.repeat(60));
  console.log(`\n✅ Passou: ${passed}/${results.length}`);
  console.log(`❌ Falhou: ${failed}/${results.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 Sistema 100% íntegro!');
  } else {
    console.log('\n⚠️  Sistema precisa de correções!');
  }
  
  return {
    passed,
    failed,
    total: results.length,
    results
  };
}

// Executar
validateSystem()
  .then(result => {
    process.exit(result.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Erro ao validar:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
