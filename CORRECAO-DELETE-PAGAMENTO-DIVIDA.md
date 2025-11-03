# Correção: Delete de Pagamento de Dívida

## Problemas Identificados

### 1. Dívida Paga Desaparece da Fatura ❌
Quando você marca uma dívida como paga, ela **desaparece** da fatura. Deveria **continuar aparecendo** mas marcada como "PAGO".

**Status**: ✅ JÁ ESTÁ CORRETO NO CÓDIGO
- O código em `shared-expenses-billing.tsx` linha 342-345 já inclui dívidas pagas
- O código em `shared-expenses-billing.tsx` linha 398 já marca `isPaid: debt.status === 'paid'`
- A renderização em `shared-expenses-billing.tsx` linha 1158 mostra TODOS os itens (pagos e não pagos)

**Possível causa**: Cache do navegador ou dados não atualizados. Recarregue a página com Ctrl+F5.

### 2. Excluir Transação de Pagamento Não Desfaz o Pagamento ❌
Quando você exclui a transação de pagamento, a dívida não volta para "pendente" (efeito cascata não funciona).

**Status**: ❌ PRECISA SER IMPLEMENTADO

## Solução para Problema 2

Adicionar lógica no método `deleteTransaction` para:

1. **Detectar se é transação de pagamento de dívida**
   - Verificar se `metadata.type === 'shared_expense_payment'`
   - Verificar se `metadata.billingItemId` começa com `debt-`

2. **Reverter o pagamento da dívida**
   - Extrair o `debtId` do `billingItemId`
   - Atualizar a dívida para `status: 'active'`
   - Limpar o campo `paidAt`

### Código a Adicionar

```typescript
// No método deleteTransaction, após buscar a transação:

// ✅ NOVO: Verificar se é pagamento de dívida
if (transaction.metadata) {
  try {
    const metadata = JSON.parse(transaction.metadata);
    
    if (metadata.type === 'shared_expense_payment' && metadata.billingItemId) {
      const billingItemId = metadata.billingItemId;
      
      // Se é uma dívida (ID começa com "debt-")
      if (billingItemId.startsWith('debt-')) {
        const debtId = billingItemId.replace('debt-', '');
        
        console.log(`🔄 [deleteTransaction] Revertendo pagamento de dívida: ${debtId}`);
        
        // Reverter status da dívida para 'active'
        await tx.sharedDebt.update({
          where: { id: debtId },
          data: {
            status: 'active',
            paidAt: null,
          },
        });
        
        console.log(`✅ [deleteTransaction] Dívida ${debtId} revertida para 'active'`);
      }
    }
  } catch (e) {
    console.warn('⚠️ [deleteTransaction] Erro ao processar metadata:', e);
  }
}
```

## Implementação

Vou adicionar essa lógica no arquivo `financial-operations-service.ts`.
