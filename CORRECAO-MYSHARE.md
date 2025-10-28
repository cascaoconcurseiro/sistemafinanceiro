# 🔧 Correção do Campo myShare em Transações Compartilhadas

## Problema Identificado

O dashboard estava mostrando R$ 100,00 em despesas quando deveria mostrar apenas R$ 50,00 (a parte do usuário em uma despesa compartilhada). O campo `myShare` estava vindo como `null` da API.

## Causa Raiz

1. **API de Transações**: Não estava salvando os campos `myShare` e `totalSharedAmount` ao criar transações
2. **Serviço de Partida Dobrada**: Não tinha os campos `myShare` e `totalSharedAmount` na interface
3. **Cálculos no Frontend**: Não estavam usando `myShare` para transações compartilhadas nos seguintes lugares:
   - Dashboard (cards de resumo)
   - Saldo corrente (running balance)
   - Cálculo de receitas

## Correções Aplicadas

### 1. API de Transações (`src/app/api/transactions/route.ts`)

✅ Adicionado salvamento de `myShare` e `totalSharedAmount` em dois lugares:
- Transações de cartão de crédito (criação direta)
- Transações de conta (via serviço de partida dobrada)

```typescript
myShare: body.myShare ? new Decimal(body.myShare) : null,
totalSharedAmount: body.totalSharedAmount ? new Decimal(body.totalSharedAmount) : null,
```

### 2. Serviço de Partida Dobrada (`src/lib/services/double-entry-service.ts`)

✅ Adicionado campos na interface `TransactionData`:
```typescript
myShare?: number;
totalSharedAmount?: number;
```

✅ Adicionado salvamento no banco:
```typescript
myShare: data.myShare ? new Decimal(data.myShare) : null,
totalSharedAmount: data.totalSharedAmount ? new Decimal(data.totalSharedAmount) : null,
```

### 3. Página de Transações (`src/app/transactions/page.tsx`)

✅ **Dashboard - Cálculo de Despesas**:
```typescript
const expenses = periodTransactions
  .filter(t => t.type === 'expense' || t.type === 'DESPESA')
  .reduce((sum, t) => {
    const amount = (t.isShared && t.myShare) ? Math.abs(Number(t.myShare)) : Math.abs(Number(t.amount));
    return sum + amount;
  }, 0);
```

✅ **Dashboard - Cálculo de Receitas**:
```typescript
const income = periodTransactions
  .filter(t => t.type === 'income' || t.type === 'RECEITA')
  .reduce((sum, t) => {
    const amount = (t.isShared && t.myShare) ? Math.abs(Number(t.myShare)) : Math.abs(Number(t.amount));
    return sum + amount;
  }, 0);
```

✅ **Saldo Corrente (Running Balance)**:
```typescript
return sortedTransactions
  .slice(0, transactionIndex + 1)
  .reduce((balance, t) => {
    const amount = (t.isShared && t.myShare) ? Math.abs(Number(t.myShare)) : Math.abs(t.amount);
    
    if (t.type === 'income' || t.type === 'RECEITA') return balance + amount;
    if (t.type === 'expense' || t.type === 'DESPESA') return balance - amount;
    return balance;
  }, 0);
```

### 4. Script de Correção (`scripts/fix-myshare.js`)

✅ Criado script para corrigir transações existentes no banco de dados:
- Busca todas as transações compartilhadas sem `myShare`
- Calcula `myShare` baseado no número de pessoas
- Atualiza o banco de dados

**Resultado**: 1 transação corrigida (R$ 100,00 → R$ 50,00)

## Resultado Final

Agora o sistema:
1. ✅ Salva corretamente `myShare` ao criar transações compartilhadas
2. ✅ Usa `myShare` em todos os cálculos (dashboard, saldo, etc.)
3. ✅ Exibe o valor correto (R$ 50,00) no dashboard e na lista de transações
4. ✅ Mantém consistência entre API, serviço e frontend

## Como Testar

1. Criar uma nova transação compartilhada de R$ 100,00 com 2 pessoas
2. Verificar que o dashboard mostra R$ 50,00 em despesas
3. Verificar que o saldo corrente considera apenas R$ 50,00
4. Verificar que a transação exibe R$ 50,00 na lista

## Arquivos Modificados

### Backend/API
- `src/app/api/transactions/route.ts` - Salvamento de myShare e totalSharedAmount
- `src/lib/services/double-entry-service.ts` - Suporte a campos compartilhados

### Frontend - Página de Transações
- `src/app/transactions/page.tsx` - Dashboard e lista de transações

### Frontend - Dashboard Principal
- `src/components/cards/granular-cards.tsx` - Cards de resumo mensal
- `src/components/cards/dashboard-sections.tsx` - Fluxo de caixa anual

### Frontend - Página de Contas
- `src/components/features/accounts/enhanced-accounts-manager.tsx` - Lista de transações por conta
- `src/app/api/accounts/[id]/transactions/route.ts` - API de transações por conta

### Scripts
- `scripts/fix-myshare.js` (novo) - Correção de dados existentes

## Componentes Corrigidos

### 1. Página de Transações (`src/app/transactions/page.tsx`)
- ✅ Dashboard - Cálculo de Despesas
- ✅ Dashboard - Cálculo de Receitas  
- ✅ Saldo Corrente (Running Balance)
- ✅ Exibição do valor na lista

### 2. Dashboard Principal (`src/components/cards/granular-cards.tsx`)
- ✅ Card de Despesas do Mês
- ✅ Card de Receitas do Mês
- ✅ Card de Resultado Mensal
- ✅ Card de Taxa de Poupança

### 3. Fluxo de Caixa Anual (`src/components/cards/dashboard-sections.tsx`)
- ✅ Cálculo mensal de receitas
- ✅ Cálculo mensal de despesas
- ✅ Total anual de receitas
- ✅ Total anual de despesas
- ✅ Saldo líquido anual
