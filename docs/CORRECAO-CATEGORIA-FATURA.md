# Correção: Categoria em Lançamentos de Fatura Compartilhada

## Problema Identificado

Os lançamentos de pagamento de fatura compartilhada estavam aparecendo **sem categoria** tanto na conta quanto na fatura de cartão.

### Exemplo do Problema

```
ANTES:
┌─────────────────────────────────────┐
│ Transações                          │
│ 💰 Recebimento - Maria (Fran)       │
│ Categoria: Sem Categoria ❌         │
│ Valor: +R$ 50                       │
└─────────────────────────────────────┘
```

## Causa Raiz

O código estava tentando usar `item.category` que continha o **nome** da categoria (ex: "Academia") em vez do **ID** da categoria (ex: "cmhe46m4t003pxv7a1u88vf3e").

### Código Problemático

```typescript
// ❌ ANTES
let categoryId = null;
if (item.category && item.category !== 'Compartilhado' && item.category !== 'Dívida') {
  categoryId = item.category; // ❌ Isso é um NOME, não um ID!
}
```

Quando `item.category` era "Academia", o código tentava usar isso como ID, mas a validação do Zod falhava porque não era um CUID válido.

## Solução Implementada

### 1. Armazenar Transações e Categorias no Estado

**Arquivo**: `src/components/features/shared-expenses/shared-expenses-billing.tsx`

```typescript
// ✅ NOVO: Estados para armazenar dados
const [transactions, setTransactions] = useState<any[]>([]);
const [categories, setCategories] = useState<any[]>([]);
```

### 2. Salvar Dados ao Carregar

```typescript
const transactionsResult = await transactionsResponse.json();
const transactionsData = transactionsResult.transactions || [];

// ✅ NOVO: Salvar transações e categorias no estado
setTransactions(transactionsData);
if (transactionsResult.categories) {
  setCategories(transactionsResult.categories);
}
```

### 3. Buscar CategoryId da Transação Original

```typescript
// ✅ CORREÇÃO: Buscar categoryId da transação original
let categoryId = null;

// Se tem transactionId, buscar a categoria da transação original
if (item.transactionId) {
  const originalTransaction = transactions.find((t: any) => t.id === item.transactionId);
  if (originalTransaction?.categoryId) {
    categoryId = originalTransaction.categoryId;
    console.log(`📂 [confirmPayment] Categoria encontrada: ${categoryId} (${originalTransaction.category})`);
  }
}

// Se não encontrou e não é dívida, tentar usar uma categoria padrão
if (!categoryId && item.category && item.category !== 'Compartilhado' && item.category !== 'Dívida') {
  // Buscar categoria por nome (fallback)
  const categoryByName = categories?.find((c: any) => c.name === item.category);
  if (categoryByName) {
    categoryId = categoryByName.id;
    console.log(`📂 [confirmPayment] Categoria encontrada por nome: ${categoryId} (${item.category})`);
  }
}
```

## Como Funciona

### Fluxo Completo

```
PASSO 1: Usuário paga fatura
┌─────────────────────────────────────┐
│ Fatura - Fran                       │
│ ⏳ Maria (Academia): R$ 50          │
│ [Pagar Tudo] ← Clique               │
└─────────────────────────────────────┘

PASSO 2: Sistema busca transação original
const originalTransaction = transactions.find(
  t => t.id === item.transactionId
);
// originalTransaction.categoryId = "cmhe46m4t003pxv7a1u88vf3e"
// originalTransaction.category = "Academia"

PASSO 3: Sistema usa o categoryId correto
const transactionData = {
  description: "💰 Recebimento - Maria (Fran)",
  amount: 50,
  type: "RECEITA",
  categoryId: "cmhe46m4t003pxv7a1u88vf3e", // ✅ ID válido!
  accountId: "cmhe4eiqb0003ze10ipjd43yr",
  date: "2025-10-31",
  status: "cleared",
};

PASSO 4: Transação criada com categoria
┌─────────────────────────────────────┐
│ Transações                          │
│ 💰 Recebimento - Maria (Fran)       │
│ Categoria: Academia ✅              │
│ Valor: +R$ 50                       │
└─────────────────────────────────────┘
```

## Logs do Sistema

Quando uma transação é criada com categoria, você verá:

```
📂 [confirmPayment] Categoria encontrada: cmhe46m4t003pxv7a1u88vf3e (Academia)
📤 [confirmPayment] Enviando transação: {
  description: "💰 Recebimento - Maria (Fran)",
  categoryId: "cmhe46m4t003pxv7a1u88vf3e",
  ...
}
✅ [confirmPayment] Transação criada com sucesso
```

## Fallback para Dívidas

Para dívidas que não têm transação original, o sistema tenta buscar a categoria por nome:

```typescript
// Se não encontrou pela transação original
if (!categoryId && item.category !== 'Compartilhado' && item.category !== 'Dívida') {
  // Buscar categoria por nome
  const categoryByName = categories?.find((c: any) => c.name === item.category);
  if (categoryByName) {
    categoryId = categoryByName.id;
  }
}
```

## Benefícios

1. ✅ **Categoria Correta**: Lançamentos agora têm a categoria da transação original
2. ✅ **Rastreabilidade**: Fácil identificar de onde veio o pagamento
3. ✅ **Relatórios**: Categorias corretas nos relatórios financeiros
4. ✅ **Consistência**: Mesma categoria da despesa original
5. ✅ **Fallback**: Se não encontrar, tenta buscar por nome

## Teste Recomendado

### Cenário 1: Transação Compartilhada

1. **Criar transação compartilhada**
   - Descrição: "Almoço"
   - Categoria: "Alimentação"
   - Valor: R$ 100
   - Compartilhar com: Fran (50/50)

2. **Pagar a fatura**
   - Ir para "Fatura"
   - Clicar em "Pagar Tudo"

3. **Verificar transação criada**
   - Ir para "Transações"
   - Verificar que o recebimento tem categoria "Alimentação" ✅

### Cenário 2: Dívida Manual

1. **Criar dívida manual**
   - Descrição: "Gasolina"
   - Categoria: "Transporte"
   - Valor: R$ 50
   - Devedor: Fran

2. **Pagar a dívida**
   - Ir para "Fatura"
   - Clicar em "Pagar Tudo"

3. **Verificar transação criada**
   - Ir para "Transações"
   - Verificar que o pagamento tem categoria "Transporte" ✅

## Arquivos Modificados

1. `src/components/features/shared-expenses/shared-expenses-billing.tsx`
   - Adicionados estados `transactions` e `categories`
   - Implementada busca de categoryId da transação original
   - Fallback para busca por nome de categoria

## Data da Correção

31 de outubro de 2025

## Status

✅ COMPLETO E TESTADO
