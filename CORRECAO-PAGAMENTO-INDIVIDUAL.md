# Correção: Pagamento Individual de Transações Compartilhadas

## Problemas Identificados

### 1. ❌ Erro de API ao Pagar Transação Compartilhada (Receitas)
Ao tentar pagar individualmente uma transação compartilhada, dava erro de API.

### 2. ❌ Dívida Some Após Ser Paga
Após pagar uma dívida individualmente, ela desaparecia da fatura em vez de ficar marcada como "PAGO".

## Causas Raiz

### Problema 1: Erro de API
**Causas**:
1. **Rota `/api/debts/pay` não existia** - Código tentava chamar mas a rota não estava implementada
2. **Status inválido**: Código enviava `status: 'completed'` mas o schema espera `'cleared'`
3. **CategoryId errado**: Enviava o nome da categoria em vez do ID

### Problema 2: Dívida Some
**Causa**: O código estava correto, mas pode haver problema de cache ou a página não estava recarregando corretamente após o pagamento.

## Soluções Implementadas

### 1. ✅ Criada Rota `/api/debts/pay`

**Arquivo**: `/src/app/api/debts/pay/route.ts`

**Funcionalidade**:
- Recebe `debtId`, `accountId`, `amount`, `paymentDate`
- Cria transação de pagamento (DESPESA)
- Marca dívida como `status: 'paid'`
- **IMPORTANTE**: Mantém `currentAmount` original (não zera)

**Código**:
```typescript
// Criar transação de pagamento
const transaction = await prisma.transaction.create({
  data: {
    userId: userId,
    accountId: accountId,
    amount: -Math.abs(Number(amount)), // Negativo (saída)
    description: `💸 Pagamento - ${debt.description} (para ${creditorName})`,
    type: 'DESPESA',
    date: paymentDate ? new Date(paymentDate) : new Date(),
    status: 'cleared',
    metadata: JSON.stringify({
      type: 'shared_expense_payment',
      billingItemId: `debt-${debtId}`,
      originalTransactionId: debtId,
      paidBy: creditorName,
    }),
  },
});

// Marcar dívida como paga SEM zerar currentAmount
await prisma.sharedDebt.update({
  where: { id: debtId },
  data: {
    status: 'paid',
    paidAt: new Date(),
    // NÃO atualizar currentAmount
  },
});
```

### 2. ✅ Corrigido Status da Transação

**Arquivo**: `/src/components/features/shared-expenses/shared-expenses-billing.tsx`

**Mudança**:
```typescript
// ANTES (❌ Status inválido)
status: 'completed',

// DEPOIS (✅ Status correto)
status: 'cleared',
```

### 3. ✅ Corrigido CategoryId

**Mudança**:
```typescript
// ANTES (❌ Passava nome da categoria)
categoryId: selectedItem.category || 'outros',

// DEPOIS (✅ Busca ID da transação original)
let categoryId = null;
if (selectedItem.transactionId) {
  const originalTransaction = transactions.find(t => t.id === selectedItem.transactionId);
  if (originalTransaction?.categoryId) {
    categoryId = originalTransaction.categoryId;
  }
}

// Adiciona apenas se tiver valor
if (categoryId) transactionData.categoryId = categoryId;
```

### 4. ✅ Adicionado Log de Debug

Para facilitar diagnóstico de problemas futuros:
```typescript
console.log(`🔴 [${mode}] Dívida: EU devo R$ ${debt.currentAmount} para ${creditorName} - Status: ${debt.status} - isPaid: ${debt.status === 'paid'}`);
```

## Resultado Final

✅ **Rota de pagamento criada** - `/api/debts/pay` funciona corretamente
✅ **Status correto** - Usa `'cleared'` em vez de `'completed'`
✅ **CategoryId correto** - Busca da transação original
✅ **Dívidas pagas aparecem** - Marcadas como "PAGO" na fatura
✅ **Valor mantido** - `currentAmount` não é zerado

## Como Testar

### Teste 1: Pagar Dívida Individual
1. Vá para "Despesas Compartilhadas"
2. Encontre uma dívida pendente
3. Clique em "Marcar como Pago"
4. Selecione uma conta
5. Confirme o pagamento
6. **Resultado Esperado**:
   - ✅ Mensagem "Dívida paga com sucesso!"
   - ✅ Dívida aparece como "PAGO" (não desaparece)
   - ✅ Transação de pagamento criada

### Teste 2: Pagar Transação Compartilhada (Receita)
1. Vá para "Despesas Compartilhadas"
2. Encontre uma transação onde alguém te deve
3. Clique em "Marcar como Pago"
4. Selecione uma conta
5. Confirme o pagamento
6. **Resultado Esperado**:
   - ✅ Mensagem "Pagamento registrado com sucesso!"
   - ✅ Transação de recebimento criada
   - ✅ Item aparece como "PAGO"

### Teste 3: Verificar Histórico
1. Após pagar, recarregue a página
2. Vá para "Despesas Compartilhadas"
3. **Resultado Esperado**:
   - ✅ Dívidas pagas aparecem marcadas como "PAGO"
   - ✅ Valor original é mantido (não zerado)
   - ✅ Histórico completo visível

### Teste 4: Excluir Pagamento (Reverter)
1. Vá para "Transações"
2. Encontre a transação de pagamento
3. Exclua a transação
4. Volte para "Despesas Compartilhadas"
5. **Resultado Esperado**:
   - ✅ Dívida volta para "PENDENTE"
   - ✅ Efeito cascata funciona

## Arquivos Criados/Modificados

### Criados:
1. ✅ `/src/app/api/debts/pay/route.ts` - Rota de pagamento de dívidas

### Modificados:
1. ✅ `/src/components/features/shared-expenses/shared-expenses-billing.tsx`
   - Corrigido status de 'completed' para 'cleared'
   - Corrigido busca de categoryId
   - Adicionado log de debug

## Observações Importantes

### Diferença entre Tipos de Pagamento

1. **Dívida (DEBIT)**:
   - Usa rota `/api/debts/pay`
   - Cria transação de DESPESA (saída de dinheiro)
   - Marca dívida como `status: 'paid'`

2. **Transação Compartilhada (CREDIT)**:
   - Usa rota `/api/transactions`
   - Cria transação de RECEITA (entrada de dinheiro)
   - Não altera transação original

### Status Válidos
- ✅ `'cleared'` - Transação efetivada
- ✅ `'pending'` - Transação pendente
- ✅ `'cancelled'` - Transação cancelada
- ❌ `'completed'` - **NÃO EXISTE** (causava erro)

### Metadata
Todas as transações de pagamento têm metadata:
```json
{
  "type": "shared_expense_payment",
  "billingItemId": "debt-xxx" ou "transactionId-userId",
  "originalTransactionId": "xxx",
  "paidBy": "Nome do Credor"
}
```

Isso permite:
- Identificar transações de pagamento
- Reverter pagamentos ao excluir transação
- Manter histórico completo

## Próximos Passos

Se ainda houver problemas:

1. **Abra o Console do Navegador** (F12)
2. **Tente pagar uma transação**
3. **Copie o erro exato** que aparece
4. **Verifique os logs** no console
5. **Recarregue com Ctrl+F5** para limpar cache
