# ✅ CHECKLIST DE VALIDAÇÃO - SISTEMA FINANCEIRO

**Sistema**: SuaGrana  
**Data**: 01/11/2025  
**Objetivo**: Validar integridade, atomicidade e regras de negócio

---

## 📋 COMO USAR ESTE CHECKLIST

1. Execute cada teste na ordem
2. Marque ✅ se passou ou ❌ se falhou
3. Anote observações em cada item
4. Priorize correção dos itens marcados como CRÍTICO

---

## 1️⃣ PARTIDAS DOBRADAS

### Teste 1.1: Verificar se JournalEntry é populado

**Objetivo**: Confirmar se lançamentos contábeis são criados

**Passos**:
```sql
-- 1. Contar transações
SELECT COUNT(*) as total_transactions FROM transactions WHERE deleted_at IS NULL;

-- 2. Contar lançamentos
SELECT COUNT(*) as total_entries FROM journal_entries;

-- 3. Verificar se cada transação tem lançamentos
SELECT 
  t.id,
  t.description,
  t.amount,
  COUNT(j.id) as entry_count
FROM transactions t
LEFT JOIN journal_entries j ON j.transaction_id = t.id
WHERE t.deleted_at IS NULL
GROUP BY t.id
HAVING COUNT(j.id) = 0;
```

**Resultado Esperado**:
- ✅ Cada transação deve ter pelo menos 2 lançamentos (débito + crédito)
- ✅ Nenhuma transação sem lançamentos

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

### Teste 1.2: Validar balanceamento

**Objetivo**: Confirmar que Débitos = Créditos

**Passos**:
```sql
-- Verificar balanceamento por transação
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
HAVING difference > 0.01;
```

**Resultado Esperado**:
- ✅ Nenhuma transação desbalanceada
- ✅ Diferença sempre = 0

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

## 2️⃣ ATOMICIDADE

### Teste 2.1: Transferência interrompida

**Objetivo**: Verificar se transferência falha atomicamente

**Passos**:
1. Anotar saldo inicial das contas A e B
2. Tentar transferência que vai falhar (ex: conta destino inválida)
3. Verificar se saldos permaneceram iguais

**Código de teste**:
```typescript
const saldoAntes = {
  contaA: await getBalance('conta-a'),
  contaB: await getBalance('conta-b')
};

try {
  await createTransfer('conta-a', 'conta-invalida', 100);
} catch (error) {
  // Esperado falhar
}

const saldoDepois = {
  contaA: await getBalance('conta-a'),
  contaB: await getBalance('conta-b')
};

// Validar
assert(saldoAntes.contaA === saldoDepois.contaA);
assert(saldoAntes.contaB === saldoDepois.contaB);
```

**Resultado Esperado**:
- ✅ Saldos não mudaram
- ✅ Nenhuma transação criada

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

### Teste 2.2: Parcelamento interrompido

**Objetivo**: Verificar se parcelamento falha atomicamente

**Passos**:
1. Contar transações antes
2. Tentar criar parcelamento que vai falhar
3. Verificar se NENHUMA parcela foi criada

**Código de teste**:
```typescript
const countBefore = await prisma.transaction.count();

try {
  await createInstallments({
    amount: 1200,
    installments: 12,
    accountId: 'conta-invalida' // Vai falhar
  });
} catch (error) {
  // Esperado falhar
}

const countAfter = await prisma.transaction.count();

// Validar
assert(countBefore === countAfter); // Nenhuma transação criada
```

**Resultado Esperado**:
- ✅ Nenhuma parcela criada
- ✅ Rollback completo

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```



---

## 3️⃣ VALIDAÇÕES

### Teste 3.1: Saldo insuficiente

**Objetivo**: Verificar se impede despesa maior que saldo

**Passos**:
```typescript
// 1. Criar conta com R$ 100
const account = await prisma.account.create({
  data: {
    name: 'Teste',
    balance: 100,
    allowNegativeBalance: false
  }
});

// 2. Tentar gastar R$ 500
try {
  await createExpense({
    accountId: account.id,
    amount: 500,
    description: 'Teste'
  });
  
  // ❌ NÃO DEVERIA CHEGAR AQUI!
  throw new Error('FALHOU: Permitiu despesa maior que saldo!');
  
} catch (error) {
  // ✅ Esperado: Erro de saldo insuficiente
  assert(error.message.includes('Saldo insuficiente'));
}
```

**Resultado Esperado**:
- ✅ Erro: "Saldo insuficiente"
- ✅ Transação NÃO criada
- ✅ Saldo permanece R$ 100

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

### Teste 3.2: Limite de cartão

**Objetivo**: Verificar se impede compra acima do limite

**Passos**:
```typescript
// 1. Criar cartão com limite R$ 1.000 e R$ 800 usado
const card = await prisma.creditCard.create({
  data: {
    name: 'Teste',
    limit: 1000,
    currentBalance: 800,
    allowOverLimit: false
  }
});

// 2. Tentar comprar R$ 500 (disponível: R$ 200)
try {
  await createCreditCardExpense({
    creditCardId: card.id,
    amount: 500,
    description: 'Teste'
  });
  
  // ❌ NÃO DEVERIA CHEGAR AQUI!
  throw new Error('FALHOU: Permitiu compra acima do limite!');
  
} catch (error) {
  // ✅ Esperado: Erro de limite insuficiente
  assert(error.message.includes('Limite insuficiente'));
}
```

**Resultado Esperado**:
- ✅ Erro: "Limite insuficiente"
- ✅ Transação NÃO criada
- ✅ Saldo do cartão permanece R$ 800

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

### Teste 3.3: Categoria obrigatória

**Objetivo**: Verificar se impede transação sem categoria

**Passos**:
```typescript
// Tentar criar transação sem categoria
try {
  await prisma.transaction.create({
    data: {
      accountId: 'conta-teste',
      amount: -100,
      description: 'Teste',
      type: 'DESPESA',
      // categoryId: undefined ❌
    }
  });
  
  // ❌ NÃO DEVERIA CHEGAR AQUI!
  throw new Error('FALHOU: Permitiu transação sem categoria!');
  
} catch (error) {
  // ✅ Esperado: Erro de validação
  assert(error.message.includes('categoria'));
}
```

**Resultado Esperado**:
- ✅ Erro: "Categoria obrigatória"
- ✅ Transação NÃO criada

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

## 4️⃣ CASCADE E PROTEÇÃO

### Teste 4.1: Deletar conta com transações

**Objetivo**: Verificar se impede deletar conta com histórico

**Passos**:
```typescript
// 1. Criar conta com transações
const account = await prisma.account.create({
  data: { name: 'Teste', balance: 1000 }
});

await prisma.transaction.create({
  data: {
    accountId: account.id,
    amount: -100,
    description: 'Teste'
  }
});

// 2. Tentar deletar conta
try {
  await prisma.account.delete({
    where: { id: account.id }
  });
  
  // ❌ NÃO DEVERIA CHEGAR AQUI!
  throw new Error('FALHOU: Permitiu deletar conta com transações!');
  
} catch (error) {
  // ✅ Esperado: Erro de constraint
  assert(error.code === 'P2003' || error.message.includes('transações'));
}

// 3. Verificar se transação ainda existe
const transaction = await prisma.transaction.findFirst({
  where: { accountId: account.id }
});

assert(transaction !== null); // ✅ Transação preservada
```

**Resultado Esperado**:
- ✅ Erro ao tentar deletar
- ✅ Conta NÃO deletada
- ✅ Transações preservadas

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

### Teste 4.2: Deletar categoria em uso

**Objetivo**: Verificar se impede deletar categoria com transações

**Passos**:
```typescript
// 1. Criar categoria com transações
const category = await prisma.category.create({
  data: { name: 'Teste', type: 'DESPESA' }
});

await prisma.transaction.create({
  data: {
    categoryId: category.id,
    amount: -100,
    description: 'Teste'
  }
});

// 2. Tentar deletar categoria
try {
  await prisma.category.delete({
    where: { id: category.id }
  });
  
  // ❌ NÃO DEVERIA CHEGAR AQUI!
  throw new Error('FALHOU: Permitiu deletar categoria em uso!');
  
} catch (error) {
  // ✅ Esperado: Erro de constraint
  assert(error.code === 'P2003' || error.message.includes('transações'));
}
```

**Resultado Esperado**:
- ✅ Erro ao tentar deletar
- ✅ Categoria NÃO deletada
- ✅ Transações preservadas

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

## 5️⃣ SINCRONIZAÇÃO DE SALDOS

### Teste 5.1: Saldo calculado corretamente

**Objetivo**: Verificar se saldo bate com soma de transações

**Passos**:
```sql
-- Para cada conta, comparar saldo armazenado vs calculado
SELECT 
  a.id,
  a.name,
  a.balance as stored_balance,
  COALESCE(SUM(t.amount), 0) as calculated_balance,
  ABS(a.balance - COALESCE(SUM(t.amount), 0)) as difference
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id AND t.deleted_at IS NULL
GROUP BY a.id, a.name, a.balance
HAVING ABS(a.balance - COALESCE(SUM(t.amount), 0)) > 0.01;
```

**Resultado Esperado**:
- ✅ Nenhuma conta com diferença
- ✅ Saldo armazenado = Saldo calculado

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

### Teste 5.2: Saldo atualizado após edição

**Objetivo**: Verificar se saldo é recalculado ao editar transação

**Passos**:
```typescript
// 1. Criar transação de R$ 100
const transaction = await prisma.transaction.create({
  data: {
    accountId: 'conta-teste',
    amount: -100,
    description: 'Teste'
  }
});

const saldoApos100 = await getBalance('conta-teste');

// 2. Editar para R$ 200
await prisma.transaction.update({
  where: { id: transaction.id },
  data: { amount: -200 }
});

const saldoApos200 = await getBalance('conta-teste');

// 3. Validar
const diferenca = saldoApos100 - saldoApos200;
assert(Math.abs(diferenca - 100) < 0.01); // Diferença deve ser R$ 100
```

**Resultado Esperado**:
- ✅ Saldo atualizado automaticamente
- ✅ Diferença correta (R$ 100)

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```



---

## 6️⃣ DESPESAS COMPARTILHADAS

### Teste 6.1: Lançamentos corretos

**Objetivo**: Verificar se despesa compartilhada cria lançamentos corretos

**Passos**:
```typescript
// 1. Criar despesa compartilhada de R$ 100 (sua parte: R$ 50)
const transaction = await createSharedExpense({
  accountId: 'conta-teste',
  amount: 100,
  myShare: 50,
  description: 'Almoço',
  sharedWith: ['amigo-id']
});

// 2. Verificar lançamentos
const entries = await prisma.journalEntry.findMany({
  where: { transactionId: transaction.id }
});

// Deve ter 3 lançamentos:
// - DÉBITO: Despesa (R$ 50)
// - DÉBITO: Valores a Receber (R$ 50)
// - CRÉDITO: Conta (R$ 100)

assert(entries.length === 3);

const despesa = entries.find(e => e.entryType === 'DEBITO' && e.amount === 50);
const aReceber = entries.find(e => e.entryType === 'DEBITO' && e.amount === 50);
const conta = entries.find(e => e.entryType === 'CREDITO' && e.amount === 100);

assert(despesa !== undefined);
assert(aReceber !== undefined);
assert(conta !== undefined);
```

**Resultado Esperado**:
- ✅ 3 lançamentos criados
- ✅ Débito: Despesa (R$ 50)
- ✅ Débito: Valores a Receber (R$ 50)
- ✅ Crédito: Conta (R$ 100)
- ✅ Balanceado: 50+50 = 100

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

### Teste 6.2: Relatório mostra valor correto

**Objetivo**: Verificar se relatório mostra apenas sua parte

**Passos**:
```typescript
// 1. Criar despesa compartilhada
await createSharedExpense({
  accountId: 'conta-teste',
  amount: 100,
  myShare: 50,
  categoryId: 'alimentacao'
});

// 2. Buscar total de despesas em Alimentação
const totalAlimentacao = await getTotalByCategory('alimentacao');

// 3. Validar
assert(totalAlimentacao === 50); // ✅ Só sua parte!
```

**Resultado Esperado**:
- ✅ Relatório mostra R$ 50 (não R$ 100)
- ✅ Patrimônio líquido correto

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

## 7️⃣ INTEGRIDADE GERAL

### Teste 7.1: Transações órfãs

**Objetivo**: Verificar se existem transações sem conta e sem cartão

**Passos**:
```sql
SELECT 
  id,
  description,
  amount,
  account_id,
  credit_card_id
FROM transactions
WHERE deleted_at IS NULL
  AND account_id IS NULL
  AND credit_card_id IS NULL;
```

**Resultado Esperado**:
- ✅ Nenhuma transação órfã
- ✅ Toda transação tem conta OU cartão

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

### Teste 7.2: Categorias inválidas

**Objetivo**: Verificar se existem transações com categoria inválida

**Passos**:
```sql
SELECT 
  t.id,
  t.description,
  t.category_id
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.deleted_at IS NULL
  AND t.category_id IS NOT NULL
  AND c.id IS NULL;
```

**Resultado Esperado**:
- ✅ Nenhuma transação com categoria inválida
- ✅ Todas as categorias existem

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

### Teste 7.3: Tipo de categoria incompatível

**Objetivo**: Verificar se RECEITA tem categoria de RECEITA

**Passos**:
```sql
SELECT 
  t.id,
  t.description,
  t.type as transaction_type,
  c.type as category_type
FROM transactions t
JOIN categories c ON c.id = t.category_id
WHERE t.deleted_at IS NULL
  AND t.type != c.type
  AND t.type != 'TRANSFERENCIA';
```

**Resultado Esperado**:
- ✅ Nenhuma incompatibilidade
- ✅ RECEITA só tem categoria RECEITA
- ✅ DESPESA só tem categoria DESPESA

**Status**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] ⚠️ Parcial

**Observações**:
```
_______________________________________________________
_______________________________________________________
```

---

## 📊 RESUMO DOS TESTES

### Contagem

- **Total de testes**: 15
- **Testes passados**: ___
- **Testes falhados**: ___
- **Testes parciais**: ___

### Por Categoria

| Categoria | Total | Passou | Falhou | Parcial |
|-----------|-------|--------|--------|---------|
| Partidas Dobradas | 2 | ___ | ___ | ___ |
| Atomicidade | 2 | ___ | ___ | ___ |
| Validações | 3 | ___ | ___ | ___ |
| Cascade | 2 | ___ | ___ | ___ |
| Saldos | 2 | ___ | ___ | ___ |
| Compartilhadas | 2 | ___ | ___ | ___ |
| Integridade | 3 | ___ | ___ | ___ |

### Prioridade de Correção

**CRÍTICO** (Corrigir URGENTE):
- [ ] Partidas Dobradas
- [ ] Atomicidade
- [ ] Cascade

**ALTO** (Corrigir em 1 semana):
- [ ] Validações
- [ ] Saldos

**MÉDIO** (Corrigir em 2 semanas):
- [ ] Despesas Compartilhadas
- [ ] Integridade

---

## 🔧 SCRIPT DE VALIDAÇÃO AUTOMÁTICA

Você pode executar todos os testes automaticamente com este script:

```typescript
// scripts/validate-system.ts

import { prisma } from '@/lib/prisma';

async function validateSystem() {
  const results = {
    passed: 0,
    failed: 0,
    partial: 0,
    tests: []
  };
  
  // Teste 1.1: JournalEntry populado
  try {
    const transactionsWithoutEntries = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        journalEntries: { none: {} }
      }
    });
    
    if (transactionsWithoutEntries.length === 0) {
      results.passed++;
      results.tests.push({ name: '1.1 JournalEntry', status: 'PASSOU' });
    } else {
      results.failed++;
      results.tests.push({ 
        name: '1.1 JournalEntry', 
        status: 'FALHOU',
        details: `${transactionsWithoutEntries.length} transações sem lançamentos`
      });
    }
  } catch (error) {
    results.failed++;
    results.tests.push({ name: '1.1 JournalEntry', status: 'ERRO', error });
  }
  
  // Teste 1.2: Balanceamento
  try {
    const unbalanced = await prisma.$queryRaw`
      SELECT 
        transaction_id,
        SUM(CASE WHEN entry_type = 'DEBITO' THEN amount ELSE 0 END) as debits,
        SUM(CASE WHEN entry_type = 'CREDITO' THEN amount ELSE 0 END) as credits
      FROM journal_entries
      GROUP BY transaction_id
      HAVING ABS(debits - credits) > 0.01
    `;
    
    if (unbalanced.length === 0) {
      results.passed++;
      results.tests.push({ name: '1.2 Balanceamento', status: 'PASSOU' });
    } else {
      results.failed++;
      results.tests.push({ 
        name: '1.2 Balanceamento', 
        status: 'FALHOU',
        details: `${unbalanced.length} transações desbalanceadas`
      });
    }
  } catch (error) {
    results.failed++;
    results.tests.push({ name: '1.2 Balanceamento', status: 'ERRO', error });
  }
  
  // ... adicionar outros testes
  
  // Relatório final
  console.log('\n📊 RELATÓRIO DE VALIDAÇÃO\n');
  console.log(`✅ Passou: ${results.passed}`);
  console.log(`❌ Falhou: ${results.failed}`);
  console.log(`⚠️  Parcial: ${results.partial}`);
  console.log(`\nTotal: ${results.passed + results.failed + results.partial}`);
  
  console.log('\n📋 DETALHES:\n');
  results.tests.forEach(test => {
    const icon = test.status === 'PASSOU' ? '✅' : test.status === 'FALHOU' ? '❌' : '⚠️';
    console.log(`${icon} ${test.name}: ${test.status}`);
    if (test.details) console.log(`   ${test.details}`);
  });
  
  return results;
}

// Executar
validateSystem()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Erro ao validar sistema:', error);
    process.exit(1);
  });
```

**Executar**:
```bash
npx tsx scripts/validate-system.ts
```

---

**Desenvolvido com ❤️ para SuaGrana**

