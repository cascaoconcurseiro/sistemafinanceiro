# Simplificação da função confirmPayment

## Problema Atual
A função está muito complexa e tem código duplicado/antigo misturado.

## Solução Simplificada

```typescript
const confirmPayment = async () => {
  if (!selectedItem || !selectedAccount) {
    alert('Selecione uma conta');
    return;
  }

  setIsProcessing(true);
  try {
    const contact = getContactByEmail(selectedItem.userEmail);
    
    // 1. Criar transação (DESPESA ou RECEITA)
    const transactionType = selectedItem.type === 'CREDIT' ? 'income' : 'expense';
    const description = selectedItem.type === 'CREDIT'
      ? `Recebimento - ${selectedItem.description} (${contact?.name || selectedItem.userEmail})`
      : `Pagamento - ${selectedItem.description} (para ${contact?.name || selectedItem.userEmail})`;
    
    await actions.createTransaction({
      description,
      amount: selectedItem.amount,
      type: transactionType,
      category: selectedItem.category || 'Outros',
      accountId: selectedAccount,
      date: paymentDate,
      status: 'cleared',
    });
    
    // 2. Atualizar transação original para paga
    if (selectedItem.transactionId) {
      await actions.updateTransaction(selectedItem.transactionId, {
        status: 'cleared',
      });
    }

    alert('✅ Pagamento registrado com sucesso!');
    setPaymentModalOpen(false);
    setSelectedItem(null);
    
    // Recarregar
    setTimeout(() => window.location.reload(), 500);
    
  } catch (error) {
    console.error('Erro:', error);
    alert('❌ Erro ao processar pagamento');
  } finally {
    setIsProcessing(false);
  }
};
```

## Benefícios
- ✅ Código mais limpo
- ✅ Usa actions do contexto
- ✅ Não precisa buscar categorias
- ✅ Funciona com ou sem categorias cadastradas
