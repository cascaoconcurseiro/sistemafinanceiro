# Instruções para Testar Soft Delete de Parcelas

## Problema Relatado

Transações parceladas excluídas ainda aparecem no relatório de parcelamentos.

## Correções Implementadas

1. ✅ Soft delete em cascata na API (backend)
2. ✅ Filtro de `deletedAt` no componente de relatório (frontend)
3. ✅ Agrupamento correto por `installmentGroupId`
4. ✅ Logs de debug para diagnóstico

## Como Testar

### 1. Limpar Cache do Navegador

**IMPORTANTE**: O navegador pode estar usando dados em cache. Faça um hard refresh:

- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows) ou `Cmd + Shift + R` (Mac)
- **Safari**: `Cmd + Option + R`

Ou abra o DevTools (F12) e clique com botão direito no botão de refresh → "Limpar cache e recarregar"

### 2. Verificar Console do Navegador

Abra o Console (F12) e procure por:

```
🗑️ [InstallmentsReport] Transações deletadas encontradas
📊 [InstallmentsReport] Transações parceladas ativas
```

Isso mostrará:
- Quantas transações deletadas foram encontradas
- Quantas transações ativas existem
- Detalhes de cada transação

### 3. Testar Exclusão

1. Crie uma transação parcelada (ex: 3x de R$ 100)
2. Verifique que aparece no relatório de parcelamentos
3. Exclua a transação
4. **Aguarde 2-3 segundos** para o refresh automático
5. Faça um hard refresh (Ctrl + Shift + R)
6. Verifique que:
   - A transação NÃO aparece mais na lista
   - O relatório de parcelamentos NÃO mostra as parcelas
   - Os totais foram recalculados corretamente

### 4. Verificar no Console

Após excluir, você deve ver no console:

```
🔄 [DELETE] Detectada transação parcelada, fazendo soft delete de TODAS as parcelas do grupo
🔄 [DELETE] Grupo: [ID do grupo]
🔄 [DELETE] Encontradas X parcelas no grupo
✅ [DELETE] X parcelas marcadas como deletadas (soft delete)
```

E no frontend:

```
🗑️ [InstallmentsReport] Transações deletadas encontradas: { total: X, ... }
📊 [InstallmentsReport] Transações parceladas ativas: { total: 0, ... }
```

## Se Ainda Aparecer

### Opção 1: Forçar Refresh Manual

No console do navegador, execute:

```javascript
// Forçar refresh do contexto unificado
window.dispatchEvent(new CustomEvent('cache-invalidation', { 
  detail: { entity: 'unified-financial-data' } 
}));
```

### Opção 2: Verificar Banco de Dados

Se o problema persistir, pode ser que as transações não foram marcadas como deletadas no banco. Verifique:

```sql
-- Ver transações parceladas deletadas
SELECT id, description, "installmentNumber", "totalInstallments", "deletedAt"
FROM transactions
WHERE "installmentGroupId" IS NOT NULL
AND "deletedAt" IS NOT NULL
ORDER BY "createdAt" DESC;

-- Ver transações parceladas ativas
SELECT id, description, "installmentNumber", "totalInstallments"
FROM transactions
WHERE "installmentGroupId" IS NOT NULL
AND "deletedAt" IS NULL
ORDER BY "createdAt" DESC;
```

### Opção 3: Limpar Cache Completamente

1. Feche todas as abas do navegador
2. Limpe o cache do navegador (Configurações → Privacidade → Limpar dados)
3. Abra novamente e faça login

## Logs Úteis

### Backend (Terminal do Servidor)

```
🔄 [DELETE] Detectada transação parcelada
✅ [DELETE] X parcelas marcadas como deletadas
📊 [Unified API] Retornando dados: { transactions: X }
```

### Frontend (Console do Navegador)

```
📡 [UnifiedContext] Buscando dados unificados...
✅ [UnifiedContext] Dados unificados recebidos
🗑️ [InstallmentsReport] Transações deletadas encontradas
📊 [InstallmentsReport] Transações parceladas ativas
```

## Troubleshooting

### Problema: Parcelas ainda aparecem após exclusão

**Causa Provável**: Cache do navegador

**Solução**: 
1. Hard refresh (Ctrl + Shift + R)
2. Limpar cache do navegador
3. Verificar console para logs de debug

### Problema: Erro ao excluir

**Causa Provável**: Problema de autenticação ou permissão

**Solução**: 
1. Verificar se está logado
2. Verificar console para erros
3. Verificar logs do servidor

### Problema: Totais incorretos

**Causa Provável**: Cálculo não está considerando soft delete

**Solução**: 
1. Verificar se o componente está filtrando `deletedAt`
2. Verificar logs de debug no console
3. Forçar refresh manual

## Contato

Se o problema persistir após seguir todas as instruções, documente:
1. Logs do console (frontend)
2. Logs do terminal (backend)
3. Screenshots do problema
4. Passos para reproduzir
