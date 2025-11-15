# 🏗️ Nova Arquitetura de Billing - Solução Definitiva

## 🎯 Problema Identificado

### ❌ Arquitetura Antiga (Problemática)

```
Frontend:
1. Busca transações (/api/unified-financial)
2. Busca dívidas (/api/debts)
3. Processa e junta tudo no cliente
4. Tenta evitar duplicações com lógica complexa
5. Resultado: Duplicações, bugs, confusão
```

**Problemas:**
- ❌ Mistura transações originais com dívidas
- ❌ Lógica complexa no frontend
- ❌ Duplicações constantes
- ❌ Difícil de manter
- ❌ Difícil de debugar

---

## ✅ Nova Arquitetura (Solução Definitiva)

### 🎯 Regra de Ouro

> **A fatura exibe APENAS obrigações financeiras, NUNCA transações originais**

### 📋 Fluxo Simplificado

```
Frontend:
1. Chama /api/billing
2. Recebe lista normalizada de obrigações
3. Exibe diretamente
4. FIM!
```

**Benefícios:**
- ✅ Zero duplicações (impossível duplicar)
- ✅ Lógica simples no frontend
- ✅ Fácil de manter
- ✅ Fácil de debugar
- ✅ Performance melhor

---

## 🔄 Separação Clara de Conceitos

### 1️⃣ **Transação Original** (Histórico)

```json
{
  "id": "tx-123",
  "description": "Pizza em grupo",
  "amount": 100.00,
  "date": "2025-11-15",
  "category": "Alimentação",
  "sharedWith": ["user1", "user2", "user3"]
}
```

**Onde aparece:** Apenas no histórico de transações

**Não aparece:** Na fatura de cobrança

---

### 2️⃣ **Obrigação Financeira** (Fatura)

```json
{
  "id": "debt-456",
  "debtId": "456",
  "originTransactionId": "tx-123",
  "description": "Pizza em grupo",
  "category": "Alimentação",
  "owedValue": 25.00,
  "paidAmount": 0,
  "remainingAmount": 25.00,
  "type": "DEBIT",
  "counterparty": {
    "id": "user1",
    "name": "João",
    "email": "joao@email.com"
  }
}
```

**Onde aparece:** Na fatura de cobrança

**Não aparece:** No histórico de transações

---

## 🆕 Nova API: `/api/billing`

### **Endpoint**

```
GET /api/billing?mode=regular
GET /api/billing?mode=trip&tripId=123
```

### **Resposta**

```json
{
  "success": true,
  "obligations": [
    {
      "id": "debt-456",
      "debtId": "456",
      "originTransactionId": "tx-123",
      "description": "Pizza em grupo",
      "category": "Alimentação",
      "categoryId": "cat-food",
      "owedValue": 25.00,
      "paidAmount": 0,
      "remainingAmount": 25.00,
      "date": "2025-11-15",
      "dueDate": "2025-12-10",
      "status": "active",
      "type": "DEBIT",
      "counterparty": {
        "id": "user1",
        "name": "João",
        "email": "joao@email.com"
      },
      "tripId": null
    }
  ],
  "billingByUser": {
    "user1": {
      "user": {
        "id": "user1",
        "name": "João",
        "email": "joao@email.com"
      },
      "netBalance": -25.00,
      "obligations": [...]
    }
  },
  "summary": {
    "totalDebts": 1,
    "totalCredits": 0,
    "totalDebtAmount": 25.00,
    "totalCreditAmount": 0
  }
}
```

---

## 🔄 Fluxo Completo

### **1. Criação de Despesa Compartilhada**

```typescript
// POST /api/shared-expenses
{
  totalAmount: 100.00,
  myShare: 25.00,
  sharedWith: ["user1", "user2", "user3"]
}
```

**O que acontece:**

1. Cria transação original
2. Cria 3 registros em `SharedDebt`:
   - user1 deve R$ 25 para mim
   - user2 deve R$ 25 para mim
   - user3 deve R$ 25 para mim

---

### **2. Visualização da Fatura**

```typescript
// GET /api/billing?mode=regular
```

**O que retorna:**

- Lista de obrigações (não transações!)
- Agrupadas por pessoa
- Saldo líquido calculado

**Frontend:**

```typescript
const { billingByUser } = await fetch('/api/billing?mode=regular');

// Exibir diretamente, sem processamento!
Object.values(billingByUser).map(billing => (
  <BillingCard
    user={billing.user}
    netBalance={billing.netBalance}
    obligations={billing.obligations}
  />
));
```

---

### **3. Pagamento de Fatura**

```typescript
// POST /api/billing/pay
{
  obligationIds: ["debt-456", "debt-789"],
  accountId: "account-123",
  paymentDate: "2025-11-15"
}
```

**O que acontece:**

1. Para cada obrigação:
   - Cria transação de pagamento/recebimento
   - Atualiza `SharedDebt.currentAmount`
   - Se `currentAmount = 0`, marca como `paid`

2. Retorna:
   - Transações criadas
   - Obrigações atualizadas
   - Novo saldo

---

## 📊 Comparação: Antes vs Depois

### ❌ **ANTES (Complexo e Bugado)**

```typescript
// Frontend fazia isso:
const transactions = await fetch('/api/unified-financial');
const debts = await fetch('/api/debts');

// Lógica complexa para juntar
const billingItems = [];

transactions.forEach(tx => {
  if (tx.sharedWith) {
    tx.sharedWith.forEach(user => {
      // Calcular valor por pessoa
      // Verificar se já existe dívida
      // Evitar duplicação
      // ...100 linhas de código
    });
  }
});

debts.forEach(debt => {
  // Verificar se já foi adicionado
  // Verificar se tem transação vinculada
  // Evitar duplicação
  // ...mais 100 linhas
});

// Resultado: Bugs e duplicações
```

### ✅ **DEPOIS (Simples e Correto)**

```typescript
// Frontend faz isso:
const { billingByUser } = await fetch('/api/billing?mode=regular');

// Exibir diretamente!
Object.values(billingByUser).map(billing => (
  <BillingCard {...billing} />
));

// Resultado: Zero bugs, zero duplicações
```

---

## 🎯 Regras de Negócio

### **1. O que aparece na fatura?**

✅ **APENAS obrigações financeiras:**
- Dívidas ativas (eu devo)
- Créditos ativos (me devem)
- Dívidas/créditos pagos (histórico)

❌ **NUNCA transações originais:**
- Transações compartilhadas
- Transações de pagamento
- Qualquer outra transação

### **2. Como evitar duplicações?**

✅ **Fonte única de verdade:**
- Tabela `SharedDebt` é a única fonte
- API `/api/billing` consulta apenas `SharedDebt`
- Frontend nunca processa transações

❌ **Nunca fazer:**
- Misturar transações com dívidas
- Processar no frontend
- Tentar "deduzir" obrigações

### **3. Como funciona o pagamento?**

✅ **Fluxo correto:**
1. Usuário paga obrigação
2. Sistema cria transação de pagamento
3. Sistema atualiza `SharedDebt.currentAmount`
4. API `/api/billing` retorna novo saldo

❌ **Nunca fazer:**
- Deletar dívida ao pagar
- Criar nova dívida ao pagar
- Modificar transação original

---

## 🔍 Casos de Uso

### **Caso 1: Eu paguei, outros me devem**

```
Situação: Paguei R$ 100, dividi com 3 amigos

SharedDebt criadas:
- João me deve R$ 25 (creditorId: eu, debtorId: João)
- Maria me deve R$ 25 (creditorId: eu, debtorId: Maria)
- Pedro me deve R$ 25 (creditorId: eu, debtorId: Pedro)

API /api/billing retorna:
{
  "billingByUser": {
    "joao": {
      "netBalance": 25.00,  // Positivo = me deve
      "obligations": [{ type: "CREDIT", amount: 25 }]
    },
    "maria": {
      "netBalance": 25.00,
      "obligations": [{ type: "CREDIT", amount: 25 }]
    },
    "pedro": {
      "netBalance": 25.00,
      "obligations": [{ type: "CREDIT", amount: 25 }]
    }
  }
}
```

### **Caso 2: Outro pagou, eu devo**

```
Situação: João pagou R$ 100, eu devo R$ 25

SharedDebt criada:
- Eu devo R$ 25 ao João (creditorId: João, debtorId: eu)

API /api/billing retorna:
{
  "billingByUser": {
    "joao": {
      "netBalance": -25.00,  // Negativo = eu devo
      "obligations": [{ type: "DEBIT", amount: 25 }]
    }
  }
}
```

### **Caso 3: Pagamento parcial**

```
Situação: Devo R$ 100, paguei R$ 30

SharedDebt atualizada:
- amount: 100.00 (original)
- currentAmount: 70.00 (restante)
- status: "active"

API /api/billing retorna:
{
  "obligations": [{
    "owedValue": 100.00,
    "paidAmount": 30.00,
    "remainingAmount": 70.00,
    "status": "active"
  }]
}
```

---

## 🚀 Migração

### **Passo 1: Criar nova API**

✅ Já criado: `/api/billing/route.ts`

### **Passo 2: Atualizar Frontend**

```typescript
// Antes
const loadSharedTransactions = async () => {
  const transactions = await fetch('/api/unified-financial');
  const debts = await fetch('/api/debts');
  // ...lógica complexa
};

// Depois
const loadBilling = async () => {
  const { billingByUser } = await fetch('/api/billing?mode=regular');
  setBillingData(billingByUser);
};
```

### **Passo 3: Remover lógica antiga**

- ❌ Remover processamento de transações no frontend
- ❌ Remover lógica de evitar duplicações
- ❌ Remover cálculos de valores

### **Passo 4: Testar**

- ✅ Criar despesa compartilhada
- ✅ Verificar fatura (sem duplicações)
- ✅ Pagar fatura
- ✅ Verificar atualização

---

## 📈 Benefícios

### **Performance**

- ✅ Menos queries no banco
- ✅ Menos processamento no frontend
- ✅ Resposta mais rápida

### **Manutenibilidade**

- ✅ Código mais simples
- ✅ Menos bugs
- ✅ Mais fácil de entender

### **Escalabilidade**

- ✅ Suporta milhares de obrigações
- ✅ Suporta pagamentos parciais
- ✅ Suporta múltiplas moedas (futuro)

---

## 🎯 Conclusão

### **Antes:**
- ❌ Complexo
- ❌ Bugado
- ❌ Duplicações
- ❌ Difícil de manter

### **Depois:**
- ✅ Simples
- ✅ Correto
- ✅ Zero duplicações
- ✅ Fácil de manter

### **Regra de Ouro:**

> **Fatura = Obrigações Financeiras**
> 
> **Histórico = Transações Originais**
> 
> **NUNCA misturar os dois!**

---

**Desenvolvido com ❤️ para SuaGrana**
**Arquitetura revisada em: 15/11/2025**
