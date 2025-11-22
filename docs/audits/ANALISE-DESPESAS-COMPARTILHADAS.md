# 🔍 Análise Completa: Lógica de Despesas Compartilhadas

## 📋 Sumário Executivo

O sistema de despesas compartilhadas do SuaGrana implementa uma lógica contábil baseada em **partidas dobradas** com suporte a:
- ✅ Divisão de despesas entre múltiplas pessoas
- ✅ Rastreamento de valores a receber e a pagar
- ✅ Pagamento de faturas individuais ou consolidadas
- ✅ Integração com viagens
- ✅ Histórico completo de transações

---

## 🎯 Conceitos Fundamentais

### 1. **Tipos de Transações Compartilhadas**

#### A) **EU PAGUEI** (Crédito - Outros me devem)
```
Situação: Você paga R$ 100 no almoço e divide com 3 amigos
- Total pago: R$ 100
- Sua parte: R$ 25 (100 ÷ 4)
- Cada amigo deve: R$ 25

Lançamentos Contábeis:
DÉBITO:  Despesa - Alimentação           R$ 25  (sua parte)
DÉBITO:  Valores a Receber                R$ 75  (3 × R$ 25)
CRÉDITO: Conta Corrente                  R$ 100 (total pago)
```

#### B) **OUTRO PAGOU** (Débito - Eu devo)
```
Situação: Amigo paga R$ 100 no almoço e divide com você
- Total pago pelo amigo: R$ 100
- Sua parte: R$ 25 (100 ÷ 4)

Lançamentos Contábeis (quando você pagar):
DÉBITO:  Despesa - Alimentação           R$ 25
CRÉDITO: Conta Corrente                  R$ 25
```

---

## 🔄 Fluxo Completo do Sistema

### **Passo 1: Criação da Despesa Compartilhada**

```typescript
// API: POST /api/shared-expenses
{
  totalAmount: 100.00,
  myShare: 25.00,
  description: "Almoço",
  categoryId: "alimentacao",
  accountId: "conta-corrente",
  sharedWith: ["amigo1-id", "amigo2-id", "amigo3-id"],
  date: "2025-11-15"
}
```

**O que acontece:**

1. **Validação** (Zod Schema)
   - Verifica se todos os campos obrigatórios estão presentes
   - Valida se a soma dos splits = totalAmount
   - Verifica se a conta existe

2. **Criação da Transação Principal**
   ```sql
   INSERT INTO Transaction (
     type: 'DESPESA',
     amount: -100.00,  -- Negativo (saída)
     description: 'Almoço',
     accountId: 'conta-corrente',
     categoryId: 'alimentacao',
     isShared: true,
     sharedWith: '["amigo1-id", "amigo2-id", "amigo3-id"]'
   )
   ```

3. **Criação dos Registros de Dívida**
   ```sql
   -- Para cada pessoa em sharedWith
   INSERT INTO SharedDebt (
     creditorId: 'meu-id',      -- Eu sou o credor
     debtorId: 'amigo1-id',     -- Amigo é o devedor
     amount: 25.00,
     status: 'active',
     transactionId: 'transaction-id'
   )
   ```

4. **Atualização do Saldo da Conta**
   ```sql
   UPDATE Account
   SET balance = balance - 100.00
   WHERE id = 'conta-corrente'
   ```

---

### **Passo 2: Visualização da Fatura**

```typescript
// API: GET /api/unified-financial
// Retorna todas as transações compartilhadas

// API: GET /api/debts
// Retorna todas as dívidas (ativas e pagas)
```

**Processamento no Frontend:**

1. **Filtrar Transações Compartilhadas**
   ```typescript
   const sharedTransactions = transactions.filter(t => 
     t.sharedWith && t.sharedWith.length > 0
   );
   ```

2. **Calcular Valores por Pessoa**
   ```typescript
   sharedTransactions.forEach(transaction => {
     const totalParticipants = transaction.sharedWith.length + 1;
     const amountPerPerson = transaction.amount / totalParticipants;
     
     // Criar item de fatura para cada pessoa
     transaction.sharedWith.forEach(memberId => {
       billingItems.push({
         id: `${transaction.id}-${memberId}`,
         userEmail: memberId,
         amount: amountPerPerson,
         description: transaction.description,
         type: 'CREDIT', // Eles me devem
         isPaid: false
       });
     });
   });
   ```

3. **Processar Dívidas**
   ```typescript
   debts.forEach(debt => {
     if (debt.debtorId === myUserId) {
       // EU DEVO
       billingItems.push({
         id: `debt-${debt.id}`,
         userEmail: debt.creditorId,
         amount: debt.currentAmount,
         type: 'DEBIT', // Eu devo
         isPaid: debt.status === 'paid'
       });
     } else if (debt.creditorId === myUserId) {
       // ME DEVEM
       billingItems.push({
         id: `credit-${debt.id}`,
         userEmail: debt.debtorId,
         amount: debt.currentAmount,
         type: 'CREDIT', // Me devem
         isPaid: debt.status === 'paid'
       });
     }
   });
   ```

4. **Agrupar por Pessoa**
   ```typescript
   const billingByUser = {};
   billingItems.forEach(item => {
     if (!billingByUser[item.userEmail]) {
       billingByUser[item.userEmail] = [];
     }
     billingByUser[item.userEmail].push(item);
   });
   ```

---

### **Passo 3: Pagamento da Fatura**

#### **Opção A: Pagar Fatura Completa**

```typescript
// Usuário clica em "Receber Fatura - R$ 75,00"
// Sistema cria MÚLTIPLAS transações individuais

const userPendingItems = billingItems.filter(
  item => item.userEmail === selectedUser && !item.isPaid
);

// Para cada item pendente
for (const item of userPendingItems) {
  // Criar transação individual
  await fetch('/api/transactions', {
    method: 'POST',
    body: JSON.stringify({
      type: item.type === 'CREDIT' ? 'RECEITA' : 'DESPESA',
      amount: item.type === 'CREDIT' ? item.amount : -item.amount,
      description: `Recebimento - ${item.description} (${userName})`,
      accountId: selectedAccount,
      categoryId: item.categoryId, // ✅ Preserva categoria original
      date: paymentDate,
      metadata: {
        type: 'shared_expense_payment',
        billingItemId: item.id,
        originalTransactionId: item.transactionId
      }
    })
  });
}
```

**Lançamentos Criados:**

```
Item 1: Almoço - R$ 25
DÉBITO:  Conta Corrente                  R$ 25
CRÉDITO: Receita - Alimentação           R$ 25

Item 2: Cinema - R$ 30
DÉBITO:  Conta Corrente                  R$ 30
CRÉDITO: Receita - Lazer                 R$ 30

Item 3: Uber - R$ 20
DÉBITO:  Conta Corrente                  R$ 20
CRÉDITO: Receita - Transporte            R$ 20

TOTAL RECEBIDO: R$ 75
```

#### **Opção B: Pagar Item Individual**

```typescript
// Usuário clica em "Marcar como Pago" em um item específico

await fetch('/api/transactions', {
  method: 'POST',
  body: JSON.stringify({
    type: 'RECEITA',
    amount: 25.00,
    description: 'Recebimento - Almoço (João)',
    accountId: selectedAccount,
    categoryId: 'alimentacao',
    date: paymentDate,
    metadata: {
      type: 'shared_expense_payment',
      billingItemId: item.id
    }
  })
});
```

---

## 📊 Estrutura de Dados

### **Tabela: Transaction**
```sql
CREATE TABLE Transaction (
  id              TEXT PRIMARY KEY,
  userId          TEXT NOT NULL,
  type            TEXT NOT NULL,  -- 'RECEITA' | 'DESPESA'
  amount          DECIMAL NOT NULL,
  description     TEXT NOT NULL,
  date            DATETIME NOT NULL,
  accountId       TEXT,
  categoryId      TEXT,
  isShared        BOOLEAN DEFAULT false,
  sharedWith      TEXT,  -- JSON array de IDs
  metadata        TEXT,  -- JSON com informações extras
  status          TEXT DEFAULT 'completed',
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Tabela: SharedDebt**
```sql
CREATE TABLE SharedDebt (
  id              TEXT PRIMARY KEY,
  creditorId      TEXT NOT NULL,  -- Quem vai receber
  debtorId        TEXT NOT NULL,  -- Quem deve pagar
  amount          DECIMAL NOT NULL,
  currentAmount   DECIMAL NOT NULL,
  description     TEXT NOT NULL,
  status          TEXT DEFAULT 'active',  -- 'active' | 'paid' | 'cancelled'
  transactionId   TEXT,  -- Vinculado à transação original
  tripId          TEXT,  -- Se for despesa de viagem
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✅ Validações e Regras de Negócio

### **1. Criação de Despesa Compartilhada**

```typescript
// ✅ Validações
- totalAmount > 0
- myShare > 0
- myShare <= totalAmount
- sharedWith.length > 0
- soma dos splits = totalAmount
- conta existe e pertence ao usuário
- saldo suficiente na conta
```

### **2. Pagamento de Fatura**

```typescript
// ✅ Validações
- conta de recebimento existe
- itens pertencem ao usuário
- itens não estão pagos
- valores são positivos
```

### **3. Integridade Contábil**

```typescript
// ✅ Sempre verificar
- Débitos = Créditos
- Saldo da conta atualizado corretamente
- Transações vinculadas corretamente
- Metadata preservado
```

---

## 🎨 Interface do Usuário

### **Visualização da Fatura**

```
┌─────────────────────────────────────────────────────────────────┐
│ FATURA DE JOÃO                                                   │
│ Valor Líquido: R$ 75,00 a receber                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ [Receber Fatura - R$ 75,00]  ← Paga tudo de uma vez            │
│                                                                  │
│ Itens da Fatura (3):                                            │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💰 Almoço                                                    │ │
│ │ Alimentação • 15/11/2025                                     │ │
│ │                                    +R$ 25,00  [Marcar Pago] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎬 Cinema                                                    │ │
│ │ Lazer • 15/11/2025                                           │ │
│ │                                    +R$ 30,00  [Marcar Pago] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🚗 Uber                                                      │ │
│ │ Transporte • 15/11/2025                                      │ │
│ │                                    +R$ 20,00  [Marcar Pago] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Cores e Indicadores**

```
🟢 Verde (+R$): Você vai RECEBER (crédito)
🔴 Vermelho (-R$): Você vai PAGAR (débito)

✅ Pago: Fundo verde, badge "Pago"
⏳ Pendente: Fundo laranja, badge "Pendente"
```

---

## 🔍 Casos de Uso Detalhados

### **Caso 1: Divisão Igual**

```
Situação: 4 amigos dividem R$ 100 igualmente

Você paga: R$ 100
Sua parte: R$ 25
Cada amigo deve: R$ 25

Lançamentos:
DÉBITO:  Despesa - Alimentação           R$ 25
DÉBITO:  Valores a Receber                R$ 75
CRÉDITO: Conta Corrente                  R$ 100

Resultado:
- Seu gasto real: R$ 25 ✅
- A receber: R$ 75 ✅
- Saldo da conta: -R$ 100 ✅
```

### **Caso 2: Divisão Desigual**

```
Situação: Você paga R$ 100, mas sua parte é R$ 30

Você paga: R$ 100
Sua parte: R$ 30
Amigos devem: R$ 70

Lançamentos:
DÉBITO:  Despesa - Alimentação           R$ 30
DÉBITO:  Valores a Receber                R$ 70
CRÉDITO: Conta Corrente                  R$ 100

Resultado:
- Seu gasto real: R$ 30 ✅
- A receber: R$ 70 ✅
```

### **Caso 3: Você Não Pagou**

```
Situação: Amigo paga R$ 100, você deve R$ 25

Sistema cria apenas registro em SharedDebt:
{
  creditorId: 'amigo-id',
  debtorId: 'seu-id',
  amount: 25.00,
  status: 'active'
}

Quando você pagar:
DÉBITO:  Despesa - Alimentação           R$ 25
CRÉDITO: Conta Corrente                  R$ 25

Resultado:
- Seu gasto real: R$ 25 ✅
- Dívida quitada ✅
```

---

## 🚨 Problemas Identificados e Soluções

### **❌ Problema 1: Duplicação de Itens**

**Sintoma:** Mesma despesa aparece 2x na fatura

**Causa:** Dívida com `transactionId` + Transação compartilhada

**Solução Implementada:**
```typescript
// Pular dívidas que têm transação vinculada E a transação existe
if (debt.transactionId) {
  const transactionExists = transactions.some(t => t.id === debt.transactionId);
  if (transactionExists && debt.status === 'active') {
    return; // Pular para evitar duplicação
  }
}
```

### **❌ Problema 2: Categoria Genérica**

**Sintoma:** Recebimentos ficam sem categoria específica

**Causa:** Sistema criava transação consolidada sem preservar categorias

**Solução Implementada:**
```typescript
// Criar transação individual para cada item
for (const item of userPendingItems) {
  await createTransaction({
    categoryId: item.categoryId, // ✅ Preserva categoria original
    description: `Recebimento - ${item.description}`,
    amount: item.amount
  });
}
```

### **❌ Problema 3: Status Incorreto**

**Sintoma:** Itens aparecem como não pagos mesmo após pagamento

**Causa:** Falta de vinculação entre transação de pagamento e item original

**Solução Implementada:**
```typescript
// Adicionar metadata na transação de pagamento
metadata: {
  type: 'shared_expense_payment',
  billingItemId: item.id, // ✅ Vincula ao item original
  originalTransactionId: item.transactionId
}

// Buscar transações de pagamento e atualizar status
const paidTransactionsMap = new Map();
paymentTransactions.forEach(tx => {
  if (tx.metadata.billingItemId) {
    paidTransactionsMap.set(tx.metadata.billingItemId, true);
  }
});

// Atualizar isPaid
allItems.forEach(item => {
  if (paidTransactionsMap.has(item.id)) {
    item.isPaid = true; // ✅ Marca como pago
  }
});
```

---

## 📈 Impacto nos Relatórios

### **Antes da Correção:**

```
Relatório de Despesas:
- Alimentação: R$ 100 ❌ (valor total, não sua parte)

Relatório de Receitas:
- Recebimento Genérico: R$ 75 ❌ (sem categoria)
```

### **Depois da Correção:**

```
Relatório de Despesas:
- Alimentação: R$ 25 ✅ (só sua parte)

Relatório de Receitas:
- Alimentação: R$ 25 ✅ (recebimento categorizado)
- Lazer: R$ 30 ✅
- Transporte: R$ 20 ✅
```

---

## ✅ Checklist de Validação

### **Para Desenvolvedores:**

- [ ] Débitos = Créditos em todas as transações
- [ ] Saldo da conta atualizado corretamente
- [ ] Categorias preservadas nos recebimentos
- [ ] Metadata vinculando transações
- [ ] Sem duplicação de itens
- [ ] Status de pagamento correto
- [ ] Filtros de período funcionando
- [ ] Integração com viagens funcionando

### **Para Usuários:**

- [ ] Valores corretos nas faturas
- [ ] Itens individuais visíveis
- [ ] Pode pagar tudo de uma vez
- [ ] Pode pagar item por item
- [ ] Status atualiza após pagamento
- [ ] Relatórios mostram valores corretos
- [ ] Histórico completo disponível

---

## 🎯 Conclusão

### **✅ Pontos Fortes:**

1. **Contabilidade Correta:** Partidas dobradas implementadas
2. **Flexibilidade:** Múltiplas formas de pagamento
3. **Transparência:** Todos os itens visíveis
4. **Rastreabilidade:** Histórico completo
5. **Integração:** Funciona com viagens e categorias

### **⚠️ Pontos de Atenção:**

1. **Complexidade:** Lógica complexa pode gerar bugs
2. **Performance:** Múltiplas queries podem ser lentas
3. **Sincronização:** Precisa manter consistência entre tabelas
4. **UX:** Interface pode ser confusa para novos usuários

### **🚀 Recomendações:**

1. ✅ **Manter lógica atual:** Está correta contabilmente
2. ✅ **Adicionar testes:** Cobrir todos os casos de uso
3. ✅ **Documentar:** Manter documentação atualizada
4. ✅ **Monitorar:** Logs detalhados para debug
5. ✅ **Otimizar:** Cache e queries mais eficientes

---

**Desenvolvido com ❤️ para SuaGrana**
**Análise realizada em: 15/11/2025**
