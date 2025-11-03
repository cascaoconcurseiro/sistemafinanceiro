# Correção: Reverter Status ao Deletar Pagamento de Fatura Compartilhada

## Problema Identificado

Quando o usuário exclui uma transação de pagamento de fatura compartilhada da página de transações, o sistema:

✅ Remove a transação (soft delete)
✅ Atualiza o saldo da conta
❌ **NÃO reverte o status da dívida/item para pendente**
❌ **O item não volta a aparecer na fatura como não pago**

## Comportamento Esperado

Ao deletar uma transação de pagamento compartilhado:

1. **Transação é marcada como deletada** (soft delete)
2. **Saldo da conta é atualizado** (valor volta)
3. **Status da dívida/item volta para pendente**
4. **Item volta a aparecer na fatura** como não pago

## Solução Proposta

### Modificar o método `deleteTransaction` em `financial-operations-service.ts`

Adicionar lógica para detectar e reverter pagamentos de fatura compartilhada:

```typescript
static async deleteTransaction(transactionId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar transação
    const transaction = await tx.transaction.findFirst({
      where: { id: transactionId, userId, deletedAt: null },
    });

    if (!transaction) {
      throw new Error('Transação não encontrada');
    }

    // 2. ✅ NOVO: Verificar se é pagamento de fatura compartilhada
    const metadata = transaction.metadata 
      ? JSON.parse(transaction.metadata as string) 
      : null;
    
    const isSharedExpensePayment = metadata?.type === 'shared_expense_payment';
    
    if (isSharedExpensePayment) {
      console.log('💰 [deleteTransaction] É pagamento de fatura compartilhada - revertendo status');
      
      const originalTransactionId = metadata.originalTransactionId;
      const billingItemId = metadata.billingItemId;
      
      // Se é uma dívida (ID começa com 'debt-')
      if (billingItemId?.startsWith('debt-')) {
        const debtId = billingItemId.replace('debt-', '');
        
        // Reativar a dívida
        await tx.sharedDebt.update({
          where: { id: debtId },
          data: {
            status: 'active',
            paidAt: null,
          },
        });
        
        console.log(`✅ [deleteTransaction] Dívida ${debtId} reativada`);
      }
      
      // Se é uma transação compartilhada
      else if (originalTransactionId) {
        // A transação original já existe e não foi marcada como paga
        // Ela automaticamente volta a aparecer na fatura
        console.log(`✅ [deleteTransaction] Transação ${originalTransactionId} volta a ficar pendente`);
      }
    }

    // 3. Soft delete da transação
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        deletedAt: new Date(),
        status: 'cancelled',
      },
    });

    // 4. Atualizar saldos
    if (transaction.accountId) {
      await this.updateAccountBalance(tx, transaction.accountId);
    }

    if (transaction.creditCardId) {
      await this.updateCreditCardBalance(tx, transaction.creditCardId);
    }

    // 5. Deletar lançamentos contábeis
    await tx.journalEntry.deleteMany({
      where: { transactionId },
    });

    return {
      success: true,
      deletedCount: 1,
      revertedSharedExpense: isSharedExpensePayment,
    };
  });
}
```

## Como Funciona

### Cenário 1: Deletar pagamento de dívida

```
ANTES:
┌─────────────────────────────────────┐
│ Fatura - Fran                       │
│ ✅ Carro: R$ 50 (PAGO)             │
│ Total: R$ 0                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Transações                          │
│ 💸 Pagamento - Carro: -R$ 50       │
│ [Deletar] ← Clique                  │
└─────────────────────────────────────┘

DEPOIS:
┌─────────────────────────────────────┐
│ Fatura - Fran                       │
│ ⏳ Carro: R$ 50 (PENDENTE)         │
│ Total: R$ 50                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Transações                          │
│ (transação removida)                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Conta                               │
│ Saldo: +R$ 50 (valor voltou)        │
└─────────────────────────────────────┘
```

### Cenário 2: Deletar recebimento de transação compartilhada

```
ANTES:
┌─────────────────────────────────────┐
│ Fatura - Fran                       │
│ ✅ Maria: R$ 50 (PAGO)              │
│ Total: R$ 0                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Transações                          │
│ 💰 Recebimento - Maria: +R$ 50     │
│ [Deletar] ← Clique                  │
└─────────────────────────────────────┘

DEPOIS:
┌─────────────────────────────────────┐
│ Fatura - Fran                       │
│ ⏳ Maria: R$ 50 (PENDENTE)          │
│ Total: R$ 50                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Transações                          │
│ (transação removida)                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Conta                               │
│ Saldo: -R$ 50 (valor voltou)        │
└─────────────────────────────────────┘
```

## Metadata da Transação

Quando uma transação de pagamento de fatura é criada, ela tem metadata:

```json
{
  "type": "shared_expense_payment",
  "originalTransactionId": "cmhe4wb72000jze10ju8dvzjg",
  "billingItemId": "cmhe4wb72000jze10ju8dvzjg-cmhe4f9c90007ze10zy0y4pig",
  "paidBy": "Fran"
}
```

Ou para dívidas:

```json
{
  "type": "shared_expense_payment",
  "originalTransactionId": "cmhe4j8hy000gze10pwuhp1jc",
  "billingItemId": "debt-cmhe4j8hy000gze10pwuhp1jc",
  "paidBy": "Fran"
}
```

## Implementação Necessária

### Arquivo: `src/lib/services/financial-operations-service.ts`

**ATENÇÃO**: O arquivo atualmente tem **dois métodos `deleteTransaction` duplicados**. É necessário:

1. **Remover o método duplicado** (linhas ~1320-1345)
2. **Manter apenas um método** com a lógica completa
3. **Adicionar a verificação de metadata** para reverter status

### Passos:

1. Abrir `financial-operations-service.ts`
2. Procurar por `static async deleteTransaction`
3. Consolidar em um único método
4. Adicionar a lógica de reversão de status

## Teste Recomendado

1. **Criar uma dívida manual** de R$ 50 com Fran
2. **Pagar a dívida** pela fatura
3. **Verificar** que a dívida some da fatura
4. **Deletar a transação de pagamento** da página de transações
5. **Verificar** que:
   - ✅ Dívida volta a aparecer na fatura como pendente
   - ✅ Saldo da conta volta ao valor anterior
   - ✅ Transação some da lista

## Benefícios

1. **Integridade de dados**: Status sempre consistente
2. **Experiência do usuário**: Pode desfazer pagamentos
3. **Auditoria**: Histórico completo de operações
4. **Flexibilidade**: Permite correção de erros

## Data da Análise

31 de outubro de 2025
