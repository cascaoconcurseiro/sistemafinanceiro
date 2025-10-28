# 🔧 CORREÇÃO: Erros em Parcelado, Compartilhado e Investimentos

**Data:** 28/10/2025  
**Problemas:** Erros 400 e 500 em transações

---

## 🔍 PROBLEMAS IDENTIFICADOS

### 1. **Erro em Investimentos - metadata como objeto**
```
Error: id: Invalid cuid, metadata: Expected string, received object
```

**Causa:** O modal de investimentos está enviando:
- `id` gerado manualmente (não é cuid válido)
- `metadata` como objeto (deve ser string JSON)

### 2. **Erro em Transações Parceladas/Compartilhadas**
```
Transaction save error: Error: Dados inválidos
```

**Causa:** Validação do schema falhando

### 3. **Erro 500 em Shared Debts**
```
api/shared-debts:1 Failed to load resource: 500
```

**Causa:** API não existe ou tem erro

---

## ✅ CORREÇÕES

### CORREÇÃO 1: Investment Operation Modal


## ✅ CORREÇÕES APLICADAS

### 1. ✅ Investment Operation Modal - CORRIGIDO

**Problema:** Enviando `id` manual e `metadata` como objeto

**Correção:**
```typescript
// ❌ ANTES
const transactionData = {
  id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ❌ ID inválido
  metadata: {  // ❌ Objeto
    assetType,
    brokerId,
    ...
  }
}

// ✅ DEPOIS
const transactionData = {
  // Sem id - backend gera automaticamente
  metadata: JSON.stringify({  // ✅ String JSON
    assetType,
    brokerId,
    ...
  })
}
```

**Arquivos alterados:**
- `src/components/investments/investment-operation-modal.tsx`

---

### 2. ✅ Investment IR Report - CORRIGIDO

**Problema:** `parseISO` não aceita strings ISO com timezone

**Correção:**
```typescript
// ❌ ANTES
const txnDate = parseISO(txn.date); // Falha com "2025-10-27T00:28:47.086Z"

// ✅ DEPOIS
const txnDate = typeof txn.date === 'string' ? new Date(txn.date) : txn.date;
```

**Arquivos alterados:**
- `src/components/investments/investment-ir-report.tsx`

---

### 3. ⚠️ Shared Debts API - VERIFICAR

**Problema:** Erro 500 ao buscar dívidas

**Possível causa:** 
- Campo `userId` não existe na tabela `SharedDebt`
- Usar `creditorId` e `debtorId` ao invés de `creditor` e `debtor`

**Verificar schema:**
```prisma
model SharedDebt {
  id             String       @id @default(cuid())
  userId         String       @map("user_id")  // ❓ Este campo existe?
  creditorId     String       @map("creditor_id")  // ✅ Usar este
  debtorId       String       @map("debtor_id")    // ✅ Usar este
  ...
}
```

---

### 4. ⚠️ Transações Parceladas/Compartilhadas - VERIFICAR

**Problema:** Erro 400 "Dados inválidos"

**Possíveis causas:**
1. Campo `sharedWith` sendo enviado como array mas esperado como string JSON
2. Campo `paidBy` não está no schema de validação
3. Campo `metadata` sendo enviado como string mas esperado como objeto

**Verificar:**
- Schema de validação em `src/lib/validation/schemas.ts`
- Dados enviados pelo modal de transações

---

## 🔍 PRÓXIMOS PASSOS

### 1. Testar Investimentos
- [ ] Criar compra de ativo
- [ ] Criar venda de ativo
- [ ] Verificar se não há mais erro de `id` e `metadata`

### 2. Verificar Shared Debts
- [ ] Verificar schema do Prisma
- [ ] Corrigir campos `creditor/debtor` vs `creditorId/debtorId`
- [ ] Testar GET /api/shared-debts

### 3. Verificar Transações Compartilhadas
- [ ] Ver logs detalhados do erro 400
- [ ] Verificar schema de validação
- [ ] Testar criação de transação compartilhada

---

## 📝 LOGS PARA ANÁLISE

### Erro em Investimentos (CORRIGIDO)
```
Error: id: Invalid cuid, metadata: Expected string, received object
```

### Erro em Shared Debts (PENDENTE)
```
api/shared-debts:1 Failed to load resource: 500 (Internal Server Error)
```

### Erro em Transações (PENDENTE)
```
Transaction save error: Error: Dados inválidos
```

---

**Data:** 28/10/2025  
**Status:** 2/4 corrigidos, 2 pendentes de verificação
