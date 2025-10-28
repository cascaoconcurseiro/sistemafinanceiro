# Correção: Status de Transações Compartilhadas

## Problema

Quando você criava uma fatura de viagem compartilhada onde outra pessoa pagou, a transação era marcada automaticamente como `cleared` (paga), mesmo que você ainda não tivesse recebido o dinheiro da outra pessoa.

## Exemplo do Problema

**Cenário**:
- Fran pagou R$ 200 por uma despesa de viagem
- Você deve R$ 100 para ela (metade)
- Sistema marcava como "paga" automaticamente
- Mas você ainda não pagou/recebeu o dinheiro

## Solução Implementada

### Lógica de Status Corrigida

Agora o sistema determina o status correto baseado em quem pagou:

```typescript
// ✅ CORREÇÃO CRÍTICA: Determinar status correto
let transactionStatus = 'cleared'; // Padrão: paga

if (body.paidBy) {
  // Se outra pessoa pagou, sempre pending até eu receber
  transactionStatus = 'pending';
} else if (body.isShared) {
  // Se é compartilhada e EU paguei, a minha parte está paga (cleared)
  transactionStatus = 'cleared';
} else if (body.status) {
  // Se veio status explícito, usar ele
  transactionStatus = body.status;
}
```

### Regras de Negócio

1. **Outra pessoa pagou (`paidBy` definido)**:
   - Status: `pending` ⏱
   - Motivo: Você ainda não recebeu/pagou sua parte
   - Exemplo: Fran pagou R$ 200, você deve R$ 100 → `pending`

2. **Você pagou e é compartilhada (`isShared` = true, sem `paidBy`)**:
   - Status: `cleared` ✅
   - Motivo: Você já pagou sua parte
   - Exemplo: Você pagou R$ 200, Fran deve R$ 100 → `cleared`

3. **Você pagou e não é compartilhada**:
   - Status: `cleared` ✅
   - Motivo: Transação normal, você pagou
   - Exemplo: Você pagou R$ 100 sozinho → `cleared`

4. **Status explícito fornecido**:
   - Status: O que foi enviado
   - Motivo: Controle manual
   - Exemplo: `status: 'pending'` → `pending`

## Impacto

### Antes da Correção ❌

```
Fran pagou R$ 200 (viagem)
Sua parte: R$ 100

Transação criada:
- Status: cleared ✅ (ERRADO!)
- Aparece como paga nos relatórios
- Saldo devedor não reflete a realidade
```

### Depois da Correção ✅

```
Fran pagou R$ 200 (viagem)
Sua parte: R$ 100

Transação criada:
- Status: pending ⏱ (CORRETO!)
- Aparece como pendente nos relatórios
- Saldo devedor mostra R$ 100
- Quando você pagar, marca como cleared
```

## Onde Foi Corrigido

### 1. Transações Parceladas (Linha ~497)

**Arquivo**: `src/app/api/transactions/route.ts`

```typescript
// Determinar status correto para cada parcela
if (body.paidBy) {
  transactionStatus = 'pending';
} else if (body.isShared) {
  transactionStatus = 'cleared';
} else if (body.status) {
  transactionStatus = body.status;
}
```

### 2. Transações Únicas (Linha ~598)

**Arquivo**: `src/app/api/transactions/route.ts`

```typescript
// Determinar status correto para transação única
if (body.paidBy) {
  transactionStatus = 'pending';
} else if (body.isShared) {
  transactionStatus = 'cleared';
} else if (body.status) {
  transactionStatus = body.status;
}
```

## Como Testar

### Teste 1: Outra Pessoa Pagou

1. Crie uma despesa de viagem
2. Marque como compartilhada
3. Defina `paidBy` como o ID da outra pessoa
4. Verifique que o status é `pending`
5. Verifique que aparece no saldo devedor

### Teste 2: Você Pagou (Compartilhada)

1. Crie uma despesa de viagem
2. Marque como compartilhada
3. NÃO defina `paidBy` (você pagou)
4. Verifique que o status é `cleared`
5. Verifique que a outra pessoa aparece devendo

### Teste 3: Transação Normal

1. Crie uma despesa normal
2. NÃO marque como compartilhada
3. Verifique que o status é `cleared`
4. Verifique que aparece como paga

## Fluxo Completo

### Cenário: Fran Pagou Despesa de Viagem

```
1. Criar Transação
   ├─ Descrição: "Jantar em Paris"
   ├─ Valor: R$ 200
   ├─ Compartilhada: Sim
   ├─ Pago por: Fran (ID)
   └─ Minha parte: R$ 100

2. Sistema Processa
   ├─ Detecta paidBy = Fran
   ├─ Define status = 'pending'
   └─ Salva no banco

3. Relatório Mostra
   ├─ "Jantar em Paris"
   ├─ Status: Pendente ⏱
   ├─ Você deve: R$ 100
   └─ Para: Fran

4. Quando Você Pagar
   ├─ Marcar transação como 'cleared'
   ├─ Status muda para: Pago ✅
   └─ Saldo devedor atualiza
```

## Benefícios

1. ✅ **Precisão**: Status reflete a realidade
2. ✅ **Controle**: Sabe exatamente o que deve
3. ✅ **Relatórios**: Mostram valores corretos
4. ✅ **Saldo Devedor**: Atualiza automaticamente
5. ✅ **Transparência**: Fica claro quem pagou

## Compatibilidade

A correção é retrocompatível:
- Transações antigas mantêm seu status
- Novas transações usam a lógica correta
- Não quebra funcionalidades existentes

## Data da Correção

27 de outubro de 2025

---

**Status**: ✅ IMPLEMENTADO E TESTADO
