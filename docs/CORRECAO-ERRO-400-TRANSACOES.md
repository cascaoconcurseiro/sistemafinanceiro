# Correção: Erro 400 ao Criar Transações de Fatura Compartilhada

## Problema Identificado

Ao tentar pagar uma fatura compartilhada (botão "Pagar Tudo"), o sistema estava retornando erro 400 (Bad Request) com a mensagem "Dados inválidos".

### Logs do Erro

```
POST http://localhost:3000/api/transactions 400 (Bad Request)
❌ [confirmPayment] Erro na API: Dados inválidos {error: 'Dados inválidos', details: Array(1)}
```

### Causa Raiz

O problema estava no arquivo `shared-expenses-billing.tsx`, na função `confirmPayment`, onde os dados da transação tinham dois problemas:

#### Problema 1: Campos opcionais com `undefined` explícito

```typescript
const transactionData = {
  description: transactionDescription,
  amount: item.amount,
  type: transactionType,
  categoryId: categoryId || undefined, // ❌ PROBLEMA: undefined explícito
  accountId: selectedAccount,
  date: paymentDate,
  tripId: item.tripId || undefined,    // ❌ PROBLEMA: undefined explícito
  // ...
};
```

Quando um objeto JavaScript é convertido para JSON, campos com valor `undefined` são incluídos no JSON como `"categoryId": null` ou podem causar problemas na validação do Zod.

O schema `TransactionSchema` em `schemas.ts` define `categoryId` como:

```typescript
categoryId: z.string().cuid().optional(),
```

Isso significa que o campo pode:
- Não existir no objeto (omitido)
- Ser uma string CUID válida

Mas NÃO pode ser `undefined` ou `null` explicitamente.

#### Problema 2: Status inválido

O código estava enviando `status: 'completed'`, mas o schema só aceita:

```typescript
status: TransactionStatus.default('cleared'),
// TransactionStatus = z.enum(['pending', 'cleared', 'reconciled', 'cancelled'])
```

O valor `'completed'` não existe no enum, causando erro de validação.

## Solução Implementada

### Correção 1: Remover campos undefined

Modificamos o código para adicionar campos opcionais apenas quando eles têm valor válido:

```typescript
// ✅ CORREÇÃO: Montar objeto sem campos undefined
const transactionData: any = {
  description: transactionDescription,
  amount: item.amount,
  type: transactionType,
  accountId: selectedAccount,
  date: paymentDate,
  notes: `${item.type === 'CREDIT' ? 'Recebimento' : 'Pagamento'} de despesa compartilhada${item.tripId ? ' da viagem' : ''}`,
  status: 'cleared', // ✅ CORREÇÃO: 'cleared' em vez de 'completed'
  metadata: JSON.stringify({
    type: 'shared_expense_payment',
    originalTransactionId: item.transactionId,
    billingItemId: item.id,
    paidBy: contact?.name || selectedItem.userEmail,
  }),
};

// Adicionar campos opcionais apenas se tiverem valor
if (categoryId) transactionData.categoryId = categoryId;
if (item.tripId) transactionData.tripId = item.tripId;
```

### Correção 2: Status correto

Alteramos `status: 'completed'` para `status: 'cleared'`, que é um valor válido do enum `TransactionStatus`.

## Benefícios da Correção

1. **Validação Correta**: Os dados agora passam pela validação do Zod sem erros
2. **JSON Limpo**: Campos opcionais sem valor não são incluídos no JSON
3. **Status Válido**: Usa valores do enum correto para o status da transação
4. **Compatibilidade**: Segue o padrão esperado pela API
5. **Manutenibilidade**: Código mais claro sobre quais campos são realmente opcionais

## Arquivos Modificados

- `src/components/features/shared-expenses/shared-expenses-billing.tsx` (linhas 572-590)

## Teste Recomendado

1. Criar uma transação compartilhada
2. Criar uma dívida manual
3. Ir para a aba "Fatura"
4. Clicar em "Pagar Tudo" para o contato
5. Verificar que as transações são criadas com sucesso
6. Confirmar que os valores aparecem corretamente no dashboard

## Lições Aprendidas

- Sempre omitir campos opcionais em vez de enviá-los como `undefined`
- Usar validação de schema para garantir consistência de dados
- Testar fluxos completos de ponta a ponta
- Logs detalhados ajudam a identificar problemas rapidamente

## Data da Correção

31 de outubro de 2025
