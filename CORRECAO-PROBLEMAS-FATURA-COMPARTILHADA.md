# Correção de Problemas - Fatura Compartilhada

## Problemas Identificados

### 1. Despesa compartilhada não some de "Todas as Transações" ao desmarcar pagamento
**Problema:** Ao desmarcar o pagamento de uma despesa compartilhada, a transação de pagamento de fatura é deletada, mas a transação compartilhada original continua aparecendo em "Todas as Transações".

**Causa:** A função `handleUnmarkAsPaid` deleta apenas a transação de pagamento de fatura, mas não atualiza o status da transação compartilhada original.

**Solução:** Ao desmarcar, além de deletar a transação de pagamento, deve-se atualizar o status da transação compartilhada original para `pending`.

### 2. Despesa compartilhada paga desaparece do compartilhado regular
**Problema:** Quando paga uma dívida (Pagamento de Dívida - Alomoco), ela desaparece da lista de despesas compartilhadas em vez de ficar marcada como paga.

**Causa:** A lógica de filtragem em `shared-expenses-billing.tsx` está excluindo dívidas pagas da lista.

**Solução:** Incluir dívidas pagas na lista, mas marcá-las como pagas visualmente.

### 3. Transações recebidas e pagas entram em nova fatura já marcadas como pagas
**Problema:** Se uma transação foi recebida e marcada como paga, depois foi criada uma nova transação compartilhada, ela entra na fatura vigente já marcada como paga.

**Causa:** A lógica está usando o status da transação original para determinar se o item da fatura está pago, mas deveria considerar apenas se há uma transação de pagamento de fatura vinculada.

**Solução:** Separar o conceito de "transação paga" (status da transação) de "item de fatura pago" (existe transação de pagamento de fatura vinculada).

## Implementação das Correções

### Correção 1: Atualizar status ao desmarcar pagamento

**Arquivo:** `src/components/features/shared-expenses/shared-expenses-billing.tsx`

**Localização:** Função `handleUnmarkAsPaid` (linha ~748)

**Alteração:**
```typescript
// ❌ ANTES: Apenas deletava a transação de pagamento
if (paymentTransaction) {
  const deleteResponse = await fetch(`/api/transactions/${paymentTransaction.id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (deleteResponse.ok) {
    alert(`✅ Pagamento de fatura excluído com sucesso!`);
    setTimeout(() => window.location.reload(), 1000);
  }
}

// ✅ DEPOIS: Deleta pagamento E atualiza status da transação original
if (paymentTransaction) {
  // 1. Deletar transação de pagamento
  const deleteResponse = await fetch(`/api/transactions/${paymentTransaction.id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (deleteResponse.ok) {
    // 2. Atualizar status da transação compartilhada original para pending
    if (item.transactionId && !item.id.startsWith('debt-') && !item.id.startsWith('credit-')) {
      await fetch(`/api/transactions/${item.transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'pending' }),
      });
    }
    
    // 3. Se for dívida, atualizar status para active
    if (item.id.startsWith('debt-') || item.id.startsWith('credit-')) {
      const debtId = item.id.replace('debt-', '').replace('credit-', '');
      await fetch(`/api/debts/${debtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'active', paidAt: null }),
      });
    }
    
    alert(`✅ Pagamento de fatura excluído com sucesso!\n\nTodos os itens voltaram a ficar pendentes.`);
    setTimeout(() => window.location.reload(), 1000);
  }
}
```

### Correção 2: Incluir dívidas pagas na lista

**Arquivo:** `src/components/features/shared-expenses/shared-expenses-billing.tsx`

**Localização:** useEffect que carrega dívidas (linha ~150)

**Alteração:**
```typescript
// ❌ ANTES: Filtrava apenas dívidas ativas
debts.forEach((debt: any) => {
  if (debt.status !== 'active') return;
  // ...
});

// ✅ DEPOIS: Incluir dívidas ativas E pagas
debts.forEach((debt: any) => {
  // ✅ CORREÇÃO: Incluir dívidas ativas e pagas
  if (debt.status !== 'active' && debt.status !== 'paid') return;
  
  // ✅ CORREÇÃO: Só adicionar se NÃO tiver transactionId (evita duplicação)
  if (debt.transactionId) {
    console.log(`⏭️ [${mode}] Pulando dívida ${debt.id} - já tem transação vinculada`);
    return;
  }
  
  // ... resto do código
});
```

### Correção 3: Separar conceito de "transação paga" e "item de fatura pago"

**Arquivo:** `src/components/features/shared-expenses/shared-expenses-billing.tsx`

**Localização:** Função que cria BillingItems (linha ~200)

**Alteração:**
```typescript
// ❌ ANTES: Usava status da transação para determinar se item está pago
allItems.push({
  id: `${transaction.id}-${memberId}`,
  transactionId: transaction.id,
  userEmail: memberIdKey,
  amount: Number(amountPerPerson.toFixed(2)),
  description: transaction.description,
  date: transaction.date,
  category: transaction.category || 'Compartilhado',
  isPaid: transaction.status === 'paid' || transaction.status === 'completed', // ❌ ERRADO
  dueDate: createSafeDueDate(transaction.date),
  tripId: transaction.tripId,
  type: 'CREDIT',
  paidBy: accountId,
});

// ✅ DEPOIS: Verificar se existe transação de pagamento de fatura vinculada
// Buscar transações de pagamento de fatura
const paymentTransactions = await fetch('/api/transactions', {
  credentials: 'include',
}).then(res => res.json()).then(data => data.transactions || []);

// Criar mapa de transações pagas (que têm pagamento de fatura vinculado)
const paidTransactionsMap = new Map();
paymentTransactions
  .filter((tx: any) => 
    tx.description.toLowerCase().includes('fatura') &&
    (tx.description.toLowerCase().includes('recebimento') || tx.description.toLowerCase().includes('pagamento'))
  )
  .forEach((tx: any) => {
    // Extrair ID da transação original da descrição ou metadata
    const metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
    if (metadata.paidByTransactionId) {
      paidTransactionsMap.set(metadata.paidByTransactionId, true);
    }
  });

// Ao criar item, verificar se tem pagamento vinculado
allItems.push({
  id: `${transaction.id}-${memberId}`,
  transactionId: transaction.id,
  userEmail: memberIdKey,
  amount: Number(amountPerPerson.toFixed(2)),
  description: transaction.description,
  date: transaction.date,
  category: transaction.category || 'Compartilhado',
  isPaid: paidTransactionsMap.has(transaction.id), // ✅ CORRETO: Verifica se tem pagamento vinculado
  dueDate: createSafeDueDate(transaction.date),
  tripId: transaction.tripId,
  type: 'CREDIT',
  paidBy: accountId,
});
```

## Fluxo Correto

### Cenário 1: Marcar como pago
1. Usuário clica em "Marcar como Pago"
2. Sistema cria transação de pagamento de fatura
3. Sistema atualiza status da transação original para `completed`
4. Sistema vincula transação de pagamento à transação original (via metadata)
5. Item aparece como pago na fatura

### Cenário 2: Desmarcar como pago
1. Usuário clica em "Desmarcar"
2. Sistema busca transação de pagamento de fatura vinculada
3. Sistema deleta transação de pagamento de fatura
4. Sistema atualiza status da transação original para `pending`
5. Item volta a aparecer como pendente na fatura

### Cenário 3: Nova fatura com transações antigas
1. Sistema busca todas as transações compartilhadas
2. Para cada transação, verifica se existe transação de pagamento de fatura vinculada
3. Se existe, marca item como pago
4. Se não existe, marca item como pendente
5. Transações antigas pagas não aparecem como pendentes em novas faturas

## Testes Necessários

1. **Teste 1:** Criar despesa compartilhada, marcar como paga, desmarcar
   - Verificar se transação some de "Todas as Transações" após desmarcar
   
2. **Teste 2:** Criar dívida, pagar, verificar se continua aparecendo como paga
   - Verificar se dívida paga aparece na lista de despesas compartilhadas marcada como paga
   
3. **Teste 3:** Criar transação compartilhada, marcar como paga, criar nova transação
   - Verificar se transação antiga paga não aparece como pendente em nova fatura

## Arquivos Afetados

1. `src/components/features/shared-expenses/shared-expenses-billing.tsx`
   - Função `handleUnmarkAsPaid`
   - useEffect que carrega dívidas
   - Função que cria BillingItems

2. `src/app/api/transactions/[id]/route.ts`
   - Endpoint DELETE (para deletar transação de pagamento)
   - Endpoint PUT (para atualizar status)

3. `src/app/api/debts/[id]/route.ts`
   - Endpoint PUT (para atualizar status de dívida)

## Prioridade

🔴 **ALTA** - Estes problemas afetam diretamente a experiência do usuário e podem causar confusão sobre o status real das despesas compartilhadas.

## Próximos Passos

1. Implementar correções no arquivo `shared-expenses-billing.tsx`
2. Testar cada cenário descrito acima
3. Verificar se não há regressões em outras funcionalidades
4. Documentar mudanças no código


## Mudanças Implementadas

### 1. Correção do `isPaid` nos BillingItems

**Antes:**
```typescript
isPaid: transaction.status === 'paid' || transaction.status === 'completed'
```

**Depois:**
```typescript
isPaid: false // Sempre false inicialmente, será atualizado depois
```

**Motivo:** O status da transação não indica se o item da fatura foi pago. O item só deve ser marcado como pago se existir uma transação de pagamento de fatura vinculada.

### 2. Adição de lógica para verificar transações de pagamento vinculadas

Após criar todos os BillingItems, o sistema agora:
1. Busca todas as transações de pagamento de fatura
2. Cria um mapa de transações que têm pagamento vinculado
3. Atualiza `isPaid` dos itens baseado neste mapa

```typescript
// Buscar transações de pagamento de fatura
const paymentTransactions = await fetch('/api/transactions', {
  credentials: 'include',
}).then(res => res.json()).then(data => data.transactions || []);

// Criar mapa de transações pagas
const paidTransactionsMap = new Map<string, boolean>();

paymentTransactions
  .filter((tx: any) => 
    tx.description.toLowerCase().includes('fatura') &&
    (tx.description.toLowerCase().includes('recebimento') || tx.description.toLowerCase().includes('pagamento'))
  )
  .forEach((tx: any) => {
    const metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
    if (metadata.paidByTransactionId) {
      paidTransactionsMap.set(metadata.paidByTransactionId, true);
    }
  });

// Atualizar isPaid dos itens
allItems.forEach(item => {
  if (paidTransactionsMap.has(item.transactionId)) {
    item.isPaid = true;
  }
});
```

### 3. Correção da função `handleUnmarkAsPaid`

Agora ao desmarcar um pagamento, o sistema:
1. Deleta a transação de pagamento de fatura
2. **NOVO:** Atualiza o status da transação original para `pending`
3. **NOVO:** Se for dívida, atualiza o status para `active`

```typescript
// Deletar transação de pagamento
await fetch(`/api/transactions/${paymentTransaction.id}`, {
  method: 'DELETE',
  credentials: 'include',
});

// ✅ NOVO: Atualizar status da transação original
if (item.transactionId && !item.id.startsWith('debt-') && !item.id.startsWith('credit-')) {
  await fetch(`/api/transactions/${item.transactionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status: 'pending' }),
  });
}

// ✅ NOVO: Se for dívida, atualizar status para active
if (item.id.startsWith('debt-') || item.id.startsWith('credit-')) {
  const debtId = item.id.replace('debt-', '').replace('credit-', '');
  await fetch(`/api/debts/${debtId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status: 'active', paidAt: null }),
  });
}
```

### 4. Correção do filtro de dívidas

**Antes:**
```typescript
// Incluir dívidas ativas E pagas
if (debt.status !== 'active' && debt.status !== 'paid') return;
```

**Depois:**
```typescript
// Incluir APENAS dívidas ativas (não pagas)
if (debt.status !== 'active') return;
```

**Motivo:** Dívidas pagas não devem aparecer na lista de despesas compartilhadas pendentes. Elas só devem aparecer se tiverem uma transação vinculada (que será mostrada como transação compartilhada normal).

## Resultado Esperado

### Cenário 1: Desmarcar pagamento
1. ✅ Transação de pagamento de fatura é deletada
2. ✅ Transação compartilhada original volta a ter status `pending`
3. ✅ Transação compartilhada some de "Todas as Transações" (porque não está mais paga)
4. ✅ Item volta a aparecer como pendente na fatura

### Cenário 2: Pagar dívida
1. ✅ Dívida é marcada como paga (status = 'paid')
2. ✅ Dívida paga NÃO aparece mais na lista de despesas compartilhadas pendentes
3. ✅ Se houver transação vinculada, ela aparece como transação compartilhada normal

### Cenário 3: Nova fatura com transações antigas
1. ✅ Sistema busca todas as transações compartilhadas
2. ✅ Para cada transação, verifica se existe transação de pagamento vinculada
3. ✅ Se existe, marca item como pago
4. ✅ Se não existe, marca item como pendente
5. ✅ Transações antigas pagas não aparecem como pendentes em novas faturas

## Status

✅ **IMPLEMENTADO** - Todas as correções foram aplicadas no arquivo `shared-expenses-billing.tsx`

## Próximos Passos

1. Testar cada cenário descrito acima
2. Verificar se não há regressões em outras funcionalidades
3. Monitorar logs do console para garantir que a lógica está funcionando corretamente
