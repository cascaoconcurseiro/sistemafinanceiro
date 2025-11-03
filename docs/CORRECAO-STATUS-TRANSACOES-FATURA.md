# Correção: Status de Transações ao Desmarcar Fatura

## 🐛 Problema Identificado

Quando o usuário desmarca uma transação na fatura (mudando de "pago" para "não pago"), o sistema não está atualizando o status das transações individuais de "cleared" para "pending".

### Comportamento Atual
1. Usuário paga a fatura → Fatura fica como `isPaid: true`
2. Usuário desmarca a fatura → Fatura volta para `isPaid: false`
3. ❌ **PROBLEMA**: As transações da fatura continuam com `status: 'cleared'` ao invés de voltar para `status: 'pending'`

### Comportamento Esperado
1. Usuário paga a fatura → Fatura `isPaid: true` + Transações `status: 'cleared'`
2. Usuário desmarca a fatura → Fatura `isPaid: false` + Transações `status: 'pending'`

## 🔍 Análise do Código

### Arquivo Afetado
`src/app/api/credit-cards/[id]/invoices/[invoiceId]/pay/route.ts`

### Código Atual
```typescript
// Atualiza apenas a fatura, não as transações
const updatedInvoice = await tx.invoice.update({
  where: { id: invoiceId },
  data: {
    paidAmount: newPaidAmount,
    isPaid: isPaid,
    status: isPaid ? 'paid' : newPaidAmount > 0 ? 'partial' : 'open',
    paidAt: isPaid ? new Date(paymentDate) : null
  }
});
```

## ✅ Solução

### 1. Criar Endpoint para Reverter Pagamento
Criar `src/app/api/credit-cards/[id]/invoices/[invoiceId]/unpay/route.ts`

### 2. Atualizar Status das Transações em Cascata
Quando a fatura for despaga, atualizar todas as transações relacionadas:

```typescript
// Atualizar transações da fatura para pending
await tx.transaction.updateMany({
  where: {
    invoiceId: invoiceId,
    creditCardId: cardId
  },
  data: {
    status: 'pending'
  }
});
```

### 3. Atualizar Status ao Pagar
Quando a fatura for paga, atualizar todas as transações para cleared:

```typescript
// Atualizar transações da fatura para cleared
await tx.transaction.updateMany({
  where: {
    invoiceId: invoiceId,
    creditCardId: cardId
  },
  data: {
    status: 'cleared'
  }
});
```

## 📝 Implementação

### ✅ Passo 1: Criar Endpoint de Despagar Fatura
**Arquivo**: `src/app/api/credit-cards/[id]/invoices/[invoiceId]/unpay/route.ts`

Endpoint POST que:
1. Deleta (soft delete) as transações de pagamento da fatura
2. ✅ **Atualiza status das transações da fatura para `pending`**
3. Atualiza fatura para `isPaid: false`
4. Restaura o limite do cartão

### ✅ Passo 2: Atualizar Endpoint de Pagar Fatura
**Arquivo**: `src/app/api/credit-cards/[id]/invoices/[invoiceId]/pay/route.ts`

Adicionado código para:
- ✅ **Atualizar status das transações para `cleared` quando fatura é paga totalmente**
- Manter como `pending` em pagamentos parciais

### ✅ Passo 3: Adicionar Botão no Frontend
**Arquivo**: `src/components/features/credit-cards/credit-card-bills.tsx`

Adicionado botão "Desmarcar como Paga" que:
- Aparece quando a fatura está paga
- Chama o endpoint `/unpay`
- Recarrega a fatura e os cartões após reverter

## 🎯 Resultado

### Antes
- ❌ Desmarcar fatura não atualizava status das transações
- ❌ Transações ficavam como `cleared` mesmo com fatura em aberto

### Depois
- ✅ Desmarcar fatura atualiza todas as transações para `pending`
- ✅ Pagar fatura atualiza todas as transações para `cleared`
- ✅ Efeito cascata funciona corretamente
- ✅ Limite do cartão é restaurado corretamente

## 🧪 Como Testar

1. Acesse a página de Faturas de Cartão
2. Selecione um cartão com fatura paga
3. Clique em "Desmarcar como Paga"
4. Confirme a ação
5. Verifique que:
   - Fatura volta para status "Em Aberto"
   - Transações voltam para status "pending"
   - Limite do cartão é restaurado
   - Badge da fatura muda de "Paga" para "Em Aberto"

## 📊 Impacto

- **Integridade de Dados**: ✅ Garantida
- **Experiência do Usuário**: ✅ Melhorada
- **Consistência**: ✅ Status sincronizado entre fatura e transações
- **Reversibilidade**: ✅ Pagamentos podem ser revertidos com segurança
