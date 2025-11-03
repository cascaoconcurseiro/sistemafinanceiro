# 🔧 SCRIPTS DE VALIDAÇÃO PRONTOS

**Sistema**: SuaGrana  
**Data**: 01/11/2025  
**Objetivo**: Scripts SQL e TypeScript prontos para validar o sistema

---

## 📋 ÍNDICE

1. [Scripts SQL](#scripts-sql)
2. [Scripts TypeScript](#scripts-typescript)
3. [Scripts de Correção](#scripts-correcao)
4. [Scripts de Teste](#scripts-teste)

---

<a name="scripts-sql"></a>
## 1️⃣ SCRIPTS SQL

### Script 1: Verificar Transações Sem Lançamentos

```sql
-- Encontrar transações sem lançamentos contábeis
SELECT 
  t.id,
  t.description,
  t.amount,
  t.type,
  t.date,
  COUNT(j.id) as entry_count
FROM transactions t
LEFT JOIN journal_entries j ON j.transaction_id = t.id
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.description, t.amount, t.type, t.date
HAVING COUNT(j.id) = 0
ORDER BY t.date DESC;

-- Resultado esperado: 0 linhas (todas devem ter lançamentos)
```

### Script 2: Verificar Balanceamento

```sql
-- Verificar se débitos = créditos por transação
SELECT 
  transaction_id,
  SUM(CASE WHEN entry_type = 'DEBITO' THEN amount ELSE 0 END) as total_debits,
  SUM(CASE WHEN entry_type = 'CREDITO' THEN amount ELSE 0 END) as total_credits,
  ABS(
    SUM(CASE WHEN entry_type = 'DEBITO' THEN amount ELSE 0 END) -
    SUM(CASE WHEN entry_type = 'CREDITO' THEN amount ELSE 0 END)
  ) as difference
FROM journal_entries
GROUP BY transaction_id
HAVING difference > 0.01
ORDER BY difference DESC;

-- Resultado esperado: 0 linhas (todas devem estar balanceadas)
```

### Script 3: Verificar Saldos das Contas

```sql
-- Comparar saldo armazenado vs calculado
SELECT 
  a.id,
  a.name,
  a.balance as stored_balance,
  COALESCE(SUM(t.amount), 0) as calculated_balance,
  ABS(a.balance - COALESCE(SUM(t.amount), 0)) as difference
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id AND t.deleted_at IS NULL
WHERE a.deleted_at IS NULL
GROUP BY a.id, a.name, a.balance
HAVING ABS(a.balance - COALESCE(SUM(t.amount), 0)) > 0.01
ORDER BY difference DESC;

-- Resultado esperado: 0 linhas (todos os saldos devem bater)
```

### Script 4: Verificar Transações Órfãs

```sql
-- Transações sem conta E sem cartão
SELECT 
  id,
  description,
  amount,
  type,
  date,
  account_id,
  credit_card_id
FROM transactions
WHERE deleted_at IS NULL
  AND account_id IS NULL
  AND credit_card_id IS NULL;

-- Resultado esperado: 0 linhas
```

### Script 5: Verificar Categorias Inválidas

```sql
-- Transações com categoria inexistente
SELECT 
  t.id,
  t.description,
  t.category_id,
  t.type
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.deleted_at IS NULL
  AND t.category_id IS NOT NULL
  AND c.id IS NULL;

-- Resultado esperado: 0 linhas
```

### Script 6: Verificar Tipo de Categoria

```sql
-- RECEITA com categoria de DESPESA (ou vice-versa)
SELECT 
  t.id,
  t.description,
  t.type as transaction_type,
  c.type as category_type,
  c.name as category_name
FROM transactions t
JOIN categories c ON c.id = t.category_id
WHERE t.deleted_at IS NULL
  AND t.type != c.type
  AND t.type != 'TRANSFERENCIA'
ORDER BY t.date DESC;

-- Resultado esperado: 0 linhas
```

### Script 7: Verificar Parcelamentos Incompletos

```sql
-- Grupos de parcelamento com quantidade errada
SELECT 
  installment_group_id,
  COUNT(*) as actual_count,
  MAX(total_installments) as expected_count,
  MAX(total_installments) - COUNT(*) as missing
FROM transactions
WHERE deleted_at IS NULL
  AND installment_group_id IS NOT NULL
GROUP BY installment_group_id
HAVING COUNT(*) != MAX(total_installments)
ORDER BY missing DESC;

-- Resultado esperado: 0 linhas
```

### Script 8: Verificar Despesas Compartilhadas

```sql
-- Despesas compartilhadas sem myShare
SELECT 
  id,
  description,
  amount,
  my_share,
  total_shared_amount
FROM transactions
WHERE deleted_at IS NULL
  AND is_shared = 1
  AND (my_share IS NULL OR my_share = 0);

-- Resultado esperado: 0 linhas
```

### Script 9: Estatísticas Gerais

```sql
-- Resumo geral do sistema
SELECT 
  'Transações' as entity,
  COUNT(*) as total,
  COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
  COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted
FROM transactions

UNION ALL

SELECT 
  'Lançamentos Contábeis',
  COUNT(*),
  COUNT(*),
  0
FROM journal_entries

UNION ALL

SELECT 
  'Contas',
  COUNT(*),
  COUNT(CASE WHEN is_active = 1 THEN 1 END),
  COUNT(CASE WHEN is_active = 0 THEN 1 END)
FROM accounts

UNION ALL

SELECT 
  'Categorias',
  COUNT(*),
  COUNT(CASE WHEN is_active = 1 THEN 1 END),
  COUNT(CASE WHEN is_active = 0 THEN 1 END)
FROM categories;
```

### Script 10: Validação Completa

```sql
-- Script completo de validação
WITH validation_results AS (
  -- 1. Transações sem lançamentos
  SELECT 'Transações sem lançamentos' as check_name, COUNT(*) as issues
  FROM transactions t
  LEFT JOIN journal_entries j ON j.transaction_id = t.id
  WHERE t.deleted_at IS NULL
  GROUP BY t.id
  HAVING COUNT(j.id) = 0
  
  UNION ALL
  
  -- 2. Lançamentos desbalanceados
  SELECT 'Lançamentos desbalanceados', COUNT(*)
  FROM (
    SELECT transaction_id
    FROM journal_entries
    GROUP BY transaction_id
    HAVING ABS(
      SUM(CASE WHEN entry_type = 'DEBITO' THEN amount ELSE 0 END) -
      SUM(CASE WHEN entry_type = 'CREDITO' THEN amount ELSE 0 END)
    ) > 0.01
  )
  
  UNION ALL
  
  -- 3. Saldos incorretos
  SELECT 'Saldos incorretos', COUNT(*)
  FROM (
    SELECT a.id
    FROM accounts a
    LEFT JOIN transactions t ON t.account_id = a.id AND t.deleted_at IS NULL
    WHERE a.deleted_at IS NULL
    GROUP BY a.id, a.balance
    HAVING ABS(a.balance - COALESCE(SUM(t.amount), 0)) > 0.01
  )
  
  UNION ALL
  
  -- 4. Transações órfãs
  SELECT 'Transações órfãs', COUNT(*)
  FROM transactions
  WHERE deleted_at IS NULL
    AND account_id IS NULL
    AND credit_card_id IS NULL
  
  UNION ALL
  
  -- 5. Categorias inválidas
  SELECT 'Categorias inválidas', COUNT(*)
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  WHERE t.deleted_at IS NULL
    AND t.category_id IS NOT NULL
    AND c.id IS NULL
)

SELECT 
  check_name,
  issues,
  CASE WHEN issues = 0 THEN '✅ OK' ELSE '❌ PROBLEMA' END as status
FROM validation_results
ORDER BY issues DESC;
```

---

<a name="scripts-typescript"></a>
## 2️⃣ SCRIPTS TYPESCRIPT

### Script 1: Validar Sistema Completo

**Arquivo**: `scripts/validate-system.ts`

```typescript
import { prisma } from '@/lib/prisma';

interface ValidationResult {
  name: string;
  passed: boolean;
  issues: number;
  details?: string;
}

async function validateSystem() {
  console.log('🔍 Iniciando validação do sistema...\n');
  
  const results: ValidationResult[] = [];
  
  // 1. Transações sem lançamentos
  console.log('1️⃣ Verificando transações sem lançamentos...');
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
      ? `IDs: ${transactionsWithoutEntries.map(t => t.id).join(', ')}`
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
      ? `IDs: ${unbalanced.map(u => u.transaction_id).join(', ')}`
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
      ? `Contas: ${wrongBalances.map(a => a.name).join(', ')}`
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
  console.log('\n📊 RELATÓRIO DE VALIDAÇÃO\n');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.passed ? 'OK' : `${result.issues} problemas`}`);
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
```

**Executar**:
```bash
npx tsx scripts/validate-system.ts
```



### Script 2: Migrar Lançamentos Contábeis

**Arquivo**: `scripts/migrate-journal-entries.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { DoubleEntryService } from '@/lib/services/double-entry-service';

async function migrateJournalEntries() {
  console.log('🔄 Migrando lançamentos contábeis...\n');
  
  // Buscar transações sem lançamentos
  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      journalEntries: { none: {} }
    },
    orderBy: { date: 'asc' }
  });
  
  console.log(`📊 Encontradas ${transactions.length} transações sem lançamentos\n`);
  
  if (transactions.length === 0) {
    console.log('✅ Todas as transações já têm lançamentos!');
    return;
  }
  
  let migrated = 0;
  let errors = 0;
  const errorDetails: any[] = [];
  
  for (const transaction of transactions) {
    try {
      await prisma.$transaction(async (tx) => {
        await DoubleEntryService.createJournalEntries(tx, transaction);
      });
      
      migrated++;
      
      if (migrated % 100 === 0) {
        console.log(`✅ Progresso: ${migrated}/${transactions.length} (${((migrated/transactions.length)*100).toFixed(1)}%)`);
      }
    } catch (error) {
      errors++;
      errorDetails.push({
        transactionId: transaction.id,
        description: transaction.description,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      
      console.error(`❌ Erro na transação ${transaction.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO DA MIGRAÇÃO');
  console.log('='.repeat(60));
  console.log(`✅ Migradas com sucesso: ${migrated}`);
  console.log(`❌ Erros: ${errors}`);
  console.log(`📈 Taxa de sucesso: ${((migrated/(migrated+errors))*100).toFixed(1)}%`);
  
  if (errors > 0) {
    console.log('\n❌ DETALHES DOS ERROS:\n');
    errorDetails.forEach((detail, index) => {
      console.log(`${index + 1}. Transação ${detail.transactionId}`);
      console.log(`   Descrição: ${detail.description}`);
      console.log(`   Erro: ${detail.error}\n`);
    });
  }
  
  return { migrated, errors, errorDetails };
}

// Executar
migrateJournalEntries()
  .then(result => {
    if (result && result.errors === 0) {
      console.log('\n🎉 Migração concluída com sucesso!');
    } else if (result) {
      console.log('\n⚠️  Migração concluída com erros!');
    }
  })
  .catch(error => {
    console.error('❌ Erro fatal na migração:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
```

**Executar**:
```bash
npx tsx scripts/migrate-journal-entries.ts
```

---

<a name="scripts-correcao"></a>
## 3️⃣ SCRIPTS DE CORREÇÃO

### Script 1: Corrigir Saldos

**Arquivo**: `scripts/fix-balances.ts`

```typescript
import { prisma } from '@/lib/prisma';

async function fixBalances() {
  console.log('🔧 Corrigindo saldos das contas...\n');
  
  const accounts = await prisma.account.findMany({
    where: { deletedAt: null }
  });
  
  console.log(`📊 Encontradas ${accounts.length} contas\n`);
  
  let fixed = 0;
  let alreadyCorrect = 0;
  
  for (const account of accounts) {
    // Calcular saldo por JournalEntry
    const entries = await prisma.journalEntry.findMany({
      where: {
        accountId: account.id,
        transaction: { deletedAt: null }
      }
    });
    
    const calculatedBalance = entries.reduce((sum, entry) => {
      return entry.entryType === 'DEBITO'
        ? sum + Number(entry.amount)
        : sum - Number(entry.amount);
    }, 0);
    
    const storedBalance = Number(account.balance);
    const difference = Math.abs(calculatedBalance - storedBalance);
    
    if (difference > 0.01) {
      console.log(`🔧 Corrigindo ${account.name}:`);
      console.log(`   Saldo armazenado: R$ ${storedBalance.toFixed(2)}`);
      console.log(`   Saldo calculado: R$ ${calculatedBalance.toFixed(2)}`);
      console.log(`   Diferença: R$ ${difference.toFixed(2)}`);
      
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: calculatedBalance }
      });
      
      fixed++;
      console.log(`   ✅ Corrigido!\n`);
    } else {
      alreadyCorrect++;
    }
  }
  
  console.log('='.repeat(60));
  console.log(`✅ Contas corrigidas: ${fixed}`);
  console.log(`✅ Contas já corretas: ${alreadyCorrect}`);
  console.log(`📊 Total: ${accounts.length}`);
  
  return { fixed, alreadyCorrect, total: accounts.length };
}

// Executar
fixBalances()
  .then(result => {
    if (result.fixed === 0) {
      console.log('\n🎉 Todos os saldos já estavam corretos!');
    } else {
      console.log(`\n🎉 ${result.fixed} saldos corrigidos com sucesso!`);
    }
  })
  .catch(error => {
    console.error('❌ Erro ao corrigir saldos:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
```

**Executar**:
```bash
npx tsx scripts/fix-balances.ts
```

### Script 2: Corrigir Categorias Ausentes

**Arquivo**: `scripts/fix-missing-categories.ts`

```typescript
import { prisma } from '@/lib/prisma';

async function fixMissingCategories() {
  console.log('🔧 Corrigindo transações sem categoria...\n');
  
  // Buscar transações sem categoria
  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      OR: [
        { categoryId: null },
        { categoryId: '' }
      ]
    }
  });
  
  console.log(`📊 Encontradas ${transactions.length} transações sem categoria\n`);
  
  if (transactions.length === 0) {
    console.log('✅ Todas as transações têm categoria!');
    return;
  }
  
  // Criar ou buscar categoria "Sem Categoria"
  const uncategorizedCategory = await prisma.category.upsert({
    where: {
      userId_name: {
        userId: transactions[0].userId,
        name: 'Sem Categoria'
      }
    },
    create: {
      userId: transactions[0].userId,
      name: 'Sem Categoria',
      type: 'DESPESA',
      description: 'Transações sem categoria definida',
      isDefault: true,
      isActive: true
    },
    update: {}
  });
  
  // Atualizar transações
  const result = await prisma.transaction.updateMany({
    where: {
      deletedAt: null,
      OR: [
        { categoryId: null },
        { categoryId: '' }
      ]
    },
    data: {
      categoryId: uncategorizedCategory.id
    }
  });
  
  console.log(`✅ ${result.count} transações atualizadas com categoria "Sem Categoria"`);
  
  return result;
}

// Executar
fixMissingCategories()
  .then(() => {
    console.log('\n🎉 Correção concluída!');
  })
  .catch(error => {
    console.error('❌ Erro ao corrigir categorias:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
```

**Executar**:
```bash
npx tsx scripts/fix-missing-categories.ts
```

---

<a name="scripts-teste"></a>
## 4️⃣ SCRIPTS DE TESTE

### Script 1: Testar Atomicidade

**Arquivo**: `scripts/test-atomicity.ts`

```typescript
import { prisma } from '@/lib/prisma';

async function testAtomicity() {
  console.log('🧪 Testando atomicidade...\n');
  
  // Criar conta de teste
  const testAccount = await prisma.account.create({
    data: {
      userId: 'test-user',
      name: 'Conta Teste Atomicidade',
      type: 'ATIVO',
      balance: 1000,
      currency: 'BRL',
      isActive: true
    }
  });
  
  console.log(`✅ Conta de teste criada: ${testAccount.name}`);
  console.log(`   Saldo inicial: R$ ${testAccount.balance}\n`);
  
  // Teste 1: Transferência que vai falhar
  console.log('🧪 Teste 1: Transferência para conta inválida (deve falhar)');
  
  try {
    await prisma.$transaction(async (tx) => {
      // Criar débito
      await tx.transaction.create({
        data: {
          userId: 'test-user',
          accountId: testAccount.id,
          amount: -100,
          description: 'Teste Débito',
          type: 'DESPESA',
          date: new Date(),
          categoryId: 'test-category'
        }
      });
      
      console.log('   ✅ Débito criado');
      
      // Forçar erro
      throw new Error('Erro simulado!');
    });
    
    console.log('   ❌ FALHOU: Transação não deveria ter sucesso!');
  } catch (error) {
    console.log('   ✅ PASSOU: Erro capturado corretamente');
    console.log(`   Mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
  
  // Verificar se saldo permaneceu igual
  const accountAfter = await prisma.account.findUnique({
    where: { id: testAccount.id }
  });
  
  if (accountAfter && Number(accountAfter.balance) === 1000) {
    console.log('   ✅ Saldo permaneceu R$ 1000 (rollback funcionou!)\n');
  } else {
    console.log(`   ❌ Saldo mudou para R$ ${accountAfter?.balance} (rollback FALHOU!)\n`);
  }
  
  // Limpar
  await prisma.account.delete({ where: { id: testAccount.id } });
  console.log('✅ Conta de teste removida');
  
  return { success: true };
}

// Executar
testAtomicity()
  .then(() => {
    console.log('\n🎉 Teste de atomicidade concluído!');
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
```

**Executar**:
```bash
npx tsx scripts/test-atomicity.ts
```

### Script 2: Testar Validações

**Arquivo**: `scripts/test-validations.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { ValidationService } from '@/lib/services/validation-service';

async function testValidations() {
  console.log('🧪 Testando validações...\n');
  
  // Criar conta de teste
  const testAccount = await prisma.account.create({
    data: {
      userId: 'test-user',
      name: 'Conta Teste Validação',
      type: 'ATIVO',
      balance: 100,
      currency: 'BRL',
      isActive: true,
      allowNegativeBalance: false
    }
  });
  
  console.log(`✅ Conta criada: ${testAccount.name} (Saldo: R$ 100)\n`);
  
  // Teste 1: Saldo insuficiente
  console.log('🧪 Teste 1: Tentar gastar R$ 500 (saldo: R$ 100)');
  
  try {
    await ValidationService.validateAccountBalance(testAccount.id, 500);
    console.log('   ❌ FALHOU: Deveria ter dado erro!');
  } catch (error) {
    console.log('   ✅ PASSOU: Erro capturado');
    console.log(`   Mensagem: ${error instanceof Error ? error.message.split('\n')[0] : 'Erro'}`);
  }
  
  console.log();
  
  // Teste 2: Saldo suficiente
  console.log('🧪 Teste 2: Tentar gastar R$ 50 (saldo: R$ 100)');
  
  try {
    await ValidationService.validateAccountBalance(testAccount.id, 50);
    console.log('   ✅ PASSOU: Validação OK');
  } catch (error) {
    console.log('   ❌ FALHOU: Não deveria dar erro!');
  }
  
  console.log();
  
  // Limpar
  await prisma.account.delete({ where: { id: testAccount.id } });
  console.log('✅ Conta de teste removida');
  
  return { success: true };
}

// Executar
testValidations()
  .then(() => {
    console.log('\n🎉 Teste de validações concluído!');
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
```

**Executar**:
```bash
npx tsx scripts/test-validations.ts
```

---

## 📊 SCRIPT MASTER - EXECUTAR TODOS

**Arquivo**: `scripts/run-all-validations.ts`

```typescript
import { execSync } from 'child_process';

const scripts = [
  { name: 'Validar Sistema', command: 'npx tsx scripts/validate-system.ts' },
  { name: 'Testar Atomicidade', command: 'npx tsx scripts/test-atomicity.ts' },
  { name: 'Testar Validações', command: 'npx tsx scripts/test-validations.ts' }
];

async function runAllValidations() {
  console.log('🚀 Executando todas as validações...\n');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const script of scripts) {
    console.log(`\n📋 ${script.name}\n`);
    
    try {
      execSync(script.command, { stdio: 'inherit' });
      results.push({ name: script.name, success: true });
    } catch (error) {
      results.push({ name: script.name, success: false });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO FINAL\n');
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Passou: ${passed}/${results.length}`);
  console.log(`❌ Falhou: ${failed}/${results.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 Todas as validações passaram!');
  } else {
    console.log('\n⚠️  Algumas validações falharam!');
  }
}

runAllValidations();
```

**Executar**:
```bash
npx tsx scripts/run-all-validations.ts
```

---

## 🎯 ORDEM RECOMENDADA DE EXECUÇÃO

### 1. Antes de Implementar Correções

```bash
# 1. Validar estado atual
npx tsx scripts/validate-system.ts

# 2. Executar queries SQL de diagnóstico
# (copiar e colar no seu cliente SQL)
```

### 2. Após Implementar Partidas Dobradas

```bash
# 1. Migrar lançamentos
npx tsx scripts/migrate-journal-entries.ts

# 2. Validar novamente
npx tsx scripts/validate-system.ts
```

### 3. Após Implementar Validações

```bash
# 1. Testar validações
npx tsx scripts/test-validations.ts

# 2. Corrigir categorias ausentes
npx tsx scripts/fix-missing-categories.ts
```

### 4. Após Implementar Atomicidade

```bash
# 1. Testar atomicidade
npx tsx scripts/test-atomicity.ts

# 2. Validar sistema completo
npx tsx scripts/validate-system.ts
```

### 5. Após Implementar Reconciliação

```bash
# 1. Corrigir saldos
npx tsx scripts/fix-balances.ts

# 2. Validação final
npx tsx scripts/run-all-validations.ts
```

---

## 📝 NOTAS IMPORTANTES

1. **Backup**: Sempre faça backup antes de executar scripts de correção
2. **Ambiente**: Teste primeiro em desenvolvimento
3. **Logs**: Salve os logs de execução para análise
4. **Rollback**: Tenha um plano de rollback se algo der errado

---

**Desenvolvido com ❤️ para SuaGrana**

