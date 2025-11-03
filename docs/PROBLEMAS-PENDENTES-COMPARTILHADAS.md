# Problemas Pendentes - Despesas Compartilhadas

## ✅ Problemas Corrigidos Hoje (31/10/2025)

1. ✅ Erro 400 ao criar transações de pagamento (campos undefined)
2. ✅ Status inválido ('completed' → 'cleared')
3. ✅ Código duplicado removido (279 linhas)
4. ✅ Reversão de pagamento ao deletar transação
5. ✅ Categorias aparecendo em transações de pagamento
6. ✅ Dívidas pagas aparecem no histórico da fatura

## ❌ Problemas Identificados Ainda Não Corrigidos

### 1. Transação Compartilhada Debita Valor Total da Conta

**Problema**: Quando você cria uma transação compartilhada de R$ 100 (50/50), o sistema debita **R$ 100** da sua conta em vez de **R$ 50** (sua parte).

**Exemplo**:
```
Transação: "Teste" - R$ 100 compartilhada com Fran
Esperado: Debitar R$ 50 da conta (sua parte)
Atual: Debita R$ 100 da conta ❌
```

**Causa**: O `updateAccountBalance` não está considerando `myShare` ao calcular o saldo.

**Solução Necessária**:
- Modificar `updateAccountBalance` em `financial-operations-service.ts`
- Quando `isShared = true`, usar `myShare` em vez de `amount`
- Atualizar lógica de cálculo de saldo

**Impacto**: ALTO - Afeta integridade financeira

---

### 2. Desmarcar Pagamento Não Deleta Transação

**Problema**: Quando você desmarca um item como "pago" na fatura, ele volta a ficar pendente, mas a transação de pagamento **não é deletada** da página de transações nem da conta.

**Exemplo**:
```
1. Pagar item "maria" → Cria transação de R$ 50
2. Desmarcar como pago → Item volta a pendente
3. Transação de R$ 50 continua existindo ❌
4. Saldo da conta não é revertido ❌
```

**Causa**: Não há funcionalidade de "desmarcar como pago" implementada.

**Solução Necessária**:
- Adicionar botão "Desmarcar como Pago" na fatura
- Ao desmarcar:
  1. Buscar transação de pagamento pelo `billingItemId` no metadata
  2. Deletar a transação de pagamento
  3. Reverter status da dívida/item para pendente
  4. Atualizar saldo da conta

**Impacto**: MÉDIO - Causa inconsistência de dados

---

### 3. Fatura Não Mostra Itens Pagos Corretamente

**Status**: PARCIALMENTE CORRIGIDO

**O que foi feito**:
- ✅ Dívidas pagas agora aparecem na fatura
- ✅ Itens são marcados como pagos baseado no metadata

**O que ainda falta**:
- ⏳ Verificar se todos os itens pagos estão aparecendo
- ⏳ Testar com múltiplos pagamentos
- ⏳ Validar histórico completo da fatura

---

## 🔧 Correções Prioritárias

### Prioridade 1: Transação Compartilhada Debita Valor Correto

Este é o problema mais crítico pois afeta a integridade financeira do sistema.

**Arquivo**: `src/lib/services/financial-operations-service.ts`

**Método**: `updateAccountBalance`

**Mudança Necessária**:
```typescript
private static async updateAccountBalance(tx: any, accountId: string) {
  const transactions = await tx.transaction.findMany({
    where: {
      accountId,
      deletedAt: null,
      status: { in: ['cleared', 'completed'] },
    },
  });

  const balance = transactions.reduce((sum, t) => {
    // ✅ NOVO: Se é compartilhada, usar myShare
    const amount = t.isShared && t.myShare 
      ? Number(t.myShare) 
      : Number(t.amount);
    
    if (t.type === 'RECEITA') return sum + amount;
    if (t.type === 'DESPESA') return sum - amount;
    return sum;
  }, 0);

  await tx.account.update({
    where: { id: accountId },
    data: { balance },
  });
}
```

### Prioridade 2: Implementar "Desmarcar como Pago"

**Arquivo**: `src/components/features/shared-expenses/shared-expenses-billing.tsx`

**Funcionalidade Nova**:
1. Adicionar botão "Desmarcar" ao lado de itens pagos
2. Criar função `handleUnmarkAsPaid`
3. Buscar e deletar transação de pagamento
4. Reverter status do item

---

## 📊 Status Geral

- ✅ Correções Implementadas: 6
- ⏳ Correções Pendentes: 2
- 🔴 Bugs Críticos: 1 (valor compartilhado)
- 🟡 Bugs Médios: 1 (desmarcar pagamento)

---

## 🧪 Testes Necessários

### Teste 1: Transação Compartilhada
1. Criar transação de R$ 100 compartilhada 50/50
2. Verificar que debita apenas R$ 50 da conta
3. Verificar que R$ 50 aparece na fatura do outro

### Teste 2: Desmarcar Pagamento
1. Pagar um item da fatura
2. Desmarcar como pago
3. Verificar que transação foi deletada
4. Verificar que saldo voltou ao normal
5. Verificar que item voltou a pendente

### Teste 3: Histórico da Fatura
1. Pagar vários itens
2. Verificar que todos aparecem como pagos
3. Verificar que valor líquido está correto
4. Verificar que histórico está completo

---

**Data**: 31 de outubro de 2025
**Status**: DOCUMENTADO - AGUARDANDO IMPLEMENTAÇÃO
