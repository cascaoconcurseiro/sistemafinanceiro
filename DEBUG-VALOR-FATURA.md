# 🐛 DEBUG: Valor Incorreto no Modal de Pagamento

**Data**: 01/11/2025  
**Status**: 🔍 EM INVESTIGAÇÃO

---

## 🐛 PROBLEMA REPORTADO

### Valores Mostrados

**Na Fatura**:
- Valor Líquido: R$ 28,33 a receber ✅ (CORRETO)

**No Modal de Pagamento**:
- Valor a receber: R$ 19,98 ❌ (INCORRETO)

### Itens da Fatura

1. +R$ 8,33 - TESTE NORMAL PARCELADO (Compartilhado)
2. +R$ 50,00 - TESTE NORMAL (Compartilhado)
3. -R$ 30,00 - TESTE PAGO POR (Dívida)

**Cálculo Esperado**: 8,33 + 50,00 - 30,00 = **R$ 28,33** ✅

---

## 🔍 ANÁLISE

### Onde o Cálculo Está Correto

**Arquivo**: `shared-expenses-billing.tsx`  
**Linha**: ~1067

```typescript
// ✅ CÁLCULO CORRETO (usado na fatura)
const totalCredits = pendingItems
  .filter(item => item.type === 'CREDIT')
  .reduce((sum, item) => sum + item.amount, 0);

const totalDebits = pendingItems
  .filter(item => item.type === 'DEBIT')
  .reduce((sum, item) => sum + item.amount, 0);

const netAmount = totalCredits - totalDebits; // = 28.33
```

### Onde o Cálculo Pode Estar Errado

**Arquivo**: `shared-expenses-billing.tsx`  
**Função**: `handlePayAllBill`  
**Linha**: ~997

```typescript
// ⚠️ POSSÍVEL PROBLEMA
const totalCredits = pendingItems
  .filter(item => item.type === 'CREDIT')
  .reduce((sum, item) => sum + item.amount, 0);

const totalDebits = pendingItems
  .filter(item => item.type === 'DEBIT')
  .reduce((sum, item) => sum + item.amount, 0);

const netValue = totalCredits - totalDebits; // Deveria ser 28.33
```

---

## 🔧 DEBUG ADICIONADO

Adicionei logs detalhados na função `handlePayAllBill`:

```typescript
console.log('🎯 [handlePayAllBill] Cálculo DETALHADO:', {
  totalItems: items.length,
  pendingItems: pendingItems.length,
  credits: pendingItems.filter(i => i.type === 'CREDIT').map(i => ({ 
    desc: i.description, 
    amount: i.amount 
  })),
  debits: pendingItems.filter(i => i.type === 'DEBIT').map(i => ({ 
    desc: i.description, 
    amount: i.amount 
  })),
  totalCredits,
  totalDebits,
  netValue,
  theyOweMe
});
```

---

## 📋 PRÓXIMOS PASSOS

### Para Investigar

1. **Abra o Console do Navegador** (F12)
2. **Clique em "Receber Fatura"**
3. **Procure o log**: `🎯 [handlePayAllBill] Cálculo DETALHADO:`
4. **Verifique**:
   - Quantos itens estão em `pendingItems`?
   - Quais são os valores de `credits`?
   - Quais são os valores de `debits`?
   - Qual é o `netValue` calculado?

### Possíveis Causas

1. **Filtro Incorreto**: Algum item não está sendo considerado
2. **Tipo Errado**: Algum item tem `type` incorreto
3. **Valor Errado**: Algum item tem `amount` incorreto
4. **Item Duplicado**: Algum item está sendo contado duas vezes
5. **Item Faltando**: Algum item não está em `pendingItems`

---

## 🎯 INFORMAÇÕES NECESSÁRIAS

Por favor, forneça o output do console com:

```
🎯 [handlePayAllBill] Cálculo DETALHADO: {
  totalItems: ?,
  pendingItems: ?,
  credits: [
    { desc: "...", amount: ? },
    ...
  ],
  debits: [
    { desc: "...", amount: ? },
    ...
  ],
  totalCredits: ?,
  totalDebits: ?,
  netValue: ?,
  theyOweMe: ?
}
```

Com essas informações, poderei identificar exatamente onde está o problema!

---

## 🔍 HIPÓTESES

### Hipótese 1: Item Parcelado

O item "TESTE NORMAL PARCELADO" pode estar sendo:
- Contado apenas uma vez (R$ 8,33) quando deveria ser o total
- Ou dividido incorretamente

### Hipótese 2: Filtro de Status

Algum item pode estar marcado como `isPaid: true` quando não deveria.

### Hipótese 3: Tipo Incorreto

Algum item pode ter `type` diferente de 'CREDIT' ou 'DEBIT'.

---

**Aguardando informações do console para continuar a investigação!** 🔍

