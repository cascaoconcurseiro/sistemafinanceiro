# Correção: Soft Delete de Parcelas

## Problema Identificado

Quando uma transação parcelada era excluída, as parcelas ainda apareciam nos relatórios porque:

1. **Hard Delete**: O código estava usando `delete()` do Prisma, removendo fisicamente as parcelas do banco
2. **Inconsistência**: A API unificada filtra por `deletedAt: null`, mas as parcelas eram deletadas fisicamente
3. **Efeito Colateral**: Parcelas excluídas continuavam aparecendo em relatórios e cálculos

## Solução Implementada

### 1. Soft Delete de Parcelas em Cascata

**Arquivo**: `src/app/api/transactions/[id]/route.ts`

**Antes**:
```typescript
// Deletar todas as parcelas (HARD DELETE)
const deleteResult = await tx.transaction.deleteMany({
  where: {
    installmentGroupId: existingTransaction.installmentGroupId,
    userId: auth.userId
  }
});
```

**Depois**:
```typescript
// ✅ SOFT DELETE: Marcar todas as parcelas como deletadas
const deleteResult = await tx.transaction.updateMany({
  where: {
    installmentGroupId: existingTransaction.installmentGroupId,
    userId: auth.userId,
    deletedAt: null
  },
  data: {
    deletedAt: new Date()
  }
});
```

### 2. Soft Delete de Transação Individual

**Antes**:
```typescript
await tx.transaction.delete({
  where: { id }
});
```

**Depois**:
```typescript
await tx.transaction.update({
  where: { id },
  data: {
    deletedAt: new Date()
  }
});
```

### 3. Verificação de Parcelas Não Deletadas

Adicionado filtro `deletedAt: null` ao buscar parcelas:

```typescript
const allInstallments = await tx.transaction.findMany({
  where: {
    installmentGroupId: existingTransaction.installmentGroupId,
    userId: auth.userId,
    deletedAt: null // ✅ Apenas parcelas não deletadas
  }
});
```

## Benefícios

1. **Consistência**: Todas as exclusões agora usam soft delete
2. **Auditoria**: Histórico de exclusões preservado no banco
3. **Integridade**: Relatórios não mostram mais parcelas excluídas
4. **Reversibilidade**: Possibilidade de restaurar transações excluídas no futuro

## Impacto

- ✅ Parcelas excluídas não aparecem mais em relatórios
- ✅ Filtros `deletedAt: null` funcionam corretamente
- ✅ Histórico de transações preservado para auditoria
- ✅ Limite de cartão de crédito restaurado corretamente

## Testes Recomendados

1. Criar uma transação parcelada (ex: 3x)
2. Excluir a transação parcelada
3. Verificar que:
   - Nenhuma parcela aparece na lista de transações
   - Nenhuma parcela aparece nos relatórios
   - Saldo da conta está correto
   - Limite do cartão foi restaurado (se aplicável)

## Correções Adicionais no Frontend

### 1. Filtro de Transações Deletadas no Relatório

**Arquivo**: `src/components/features/reports/installments-report.tsx`

**Problema**: O componente não estava filtrando transações com `deletedAt`, mostrando parcelas excluídas.

**Solução**:
```typescript
// ✅ CORREÇÃO: Filtrar apenas transações parceladas E NÃO DELETADAS
const installmentTransactions = transactions.filter(
  (t) => t.installmentNumber && 
         t.totalInstallments && 
         t.totalInstallments > 1 &&
         !(t as any).deletedAt // ✅ Excluir transações deletadas
);
```

### 2. Agrupamento Correto por installmentGroupId

**Problema**: O agrupamento estava usando apenas `parentTransactionId || description`, ignorando `installmentGroupId`.

**Solução**:
```typescript
// ✅ CORREÇÃO: Priorizar installmentGroupId
const groupKey = (t as any).installmentGroupId || t.parentTransactionId || t.description;
```

### 3. Logs de Debug

Adicionados logs para facilitar diagnóstico:
- Transações deletadas encontradas
- Transações parceladas ativas
- Detalhes de cada transação

## Fluxo Completo de Exclusão

1. **Frontend**: Usuário clica em "Excluir" em uma transação parcelada
2. **API**: `DELETE /api/transactions/[id]`
   - Detecta que é parcelada (`installmentGroupId`)
   - Marca TODAS as parcelas com `deletedAt = new Date()`
   - Restaura limite do cartão (se aplicável)
3. **Contexto**: Chama `fetchUnifiedData()` para atualizar dados
4. **API Unificada**: Retorna apenas transações com `deletedAt: null`
5. **Frontend**: Componente filtra transações deletadas
6. **Resultado**: Parcelas não aparecem mais em nenhum lugar

## Data da Correção

27 de outubro de 2025
