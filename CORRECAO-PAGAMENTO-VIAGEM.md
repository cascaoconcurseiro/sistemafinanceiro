# Correção: Pagamento de Viagem Não Aparecia como Pago

## Problema

Você pagou a fatura de viagem (recebeu R$ 50,00 de Fran), mas o sistema ainda mostrava como **pendente** na fatura de viagem.

## Causa Raiz

O código estava buscando pagamentos via `/api/unified-financial`, que:
- Filtra transações por período
- Pode não incluir transações de pagamento de fatura
- Estava sujeito a cache

## Solução Implementada

Modificado o código em `shared-expenses-billing.tsx` para:

1. **Buscar diretamente de `/api/transactions`** em vez de `/api/unified-financial`
2. **Filtrar apenas transações de pagamento** (Recebimento/Pagamento)
3. **Sem filtro de período** - busca TODOS os pagamentos

### Código Alterado

```typescript
// ANTES (❌ Problema)
const paymentResponse = await fetch(`/api/unified-financial?_t=${timestamp}`, {
  credentials: 'include',
  cache: 'no-cache',
});

// DEPOIS (✅ Correção)
const paymentResponse = await fetch(`/api/transactions?_t=${timestamp}`, {
  credentials: 'include',
  cache: 'no-cache',
});

const allTransactions = Array.isArray(paymentData) ? paymentData : (paymentData.transactions || []);
const paymentTransactions = allTransactions.filter((tx: any) =>
  (tx.description?.includes('Recebimento -') || tx.description?.includes('Pagamento -')) &&
  tx.metadata
);
```

## Resultado Esperado

Após recarregar a página:
- ✅ Fatura de viagem deve mostrar o item como **PAGO**
- ✅ Valor líquido deve ser R$ 0,00 (ou não mostrar a fatura se tudo estiver pago)
- ✅ Botão "Receber Fatura" não deve aparecer

## Teste

1. Recarregue a página
2. Vá para a aba "Viagens"
3. Verifique se o item "TESTE VIAGEM" aparece como **PAGO**
