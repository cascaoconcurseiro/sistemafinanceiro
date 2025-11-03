# 📋 Relatório de Duplicações no Sistema

## 🔴 DUPLICAÇÕES CRÍTICAS ENCONTRADAS

### 1. **Hooks Duplicados**

#### ❌ Dashboard Data
- `use-dashboard-data.ts` (linha 8)
- `useDashboardData.ts` (linha 26)
**Ação:** Manter apenas `use-dashboard-data.ts` (padrão kebab-case)

#### ❌ Reports
- `use-reports-api.ts` (linha 16)
- `use-reports.ts` (linha 17)
**Ação:** Verificar funcionalidade e consolidar

#### ❌ Smart Categorization
- `use-smart-categorization.ts` (linha 18)
- `use-smart-category.ts` (linha 19)
**Ação:** Consolidar em um único hook

### 2. **APIs Duplicadas**

#### ❌ Rotas com sufixo -old (BACKUP NÃO REMOVIDO)
```
src/app/api/installments/route-old.ts
src/app/api/shared-expenses/route-old.ts
src/app/api/transactions/route-old.ts
src/app/api/transactions/[id]/route-new.ts
```
**Ação:** DELETAR todos os arquivos -old e -new

#### ❌ APIs de Pagamento Duplicadas
```
/api/debts/pay/route.ts
/api/shared-debts/pay/route.ts
/api/shared-debts/[id]/pay/route.ts
/api/shared-debts/[id]/payment/route.ts
/api/shared-expenses/pay/route.ts
/api/shared-expenses/[id]/pay/route.ts
```
**Ação:** Consolidar em uma única API de pagamento

#### ❌ APIs de Família Duplicadas
```
/api/family/route.ts
/api/family-members/route.ts
```
**Ação:** Usar apenas family-members

#### ❌ APIs de Itinerário Duplicadas
```
/api/itinerary/route.ts
/api/itinerary-simple/route.ts
```
**Ação:** Consolidar em uma única API

#### ❌ APIs de Notificações Duplicadas
```
/api/notifications/mark-all-read/route.ts
/api/notifications/read-all/route.ts
```
**Ação:** Usar apenas uma (mark-all-read)

### 3. **Contextos/Providers Potencialmente Duplicados**

#### ⚠️ Verificar se há sobreposição:
- `unified-financial-context.tsx` - Contexto unificado principal
- Múltiplos hooks que podem estar fazendo chamadas diretas à API

### 4. **Serviços Duplicados**

#### ⚠️ Verificar consolidação:
- Múltiplas rotas de validação:
  - `/api/accounting/validate`
  - `/api/journal/validate`
  - `/api/validation/validate-transaction`
  - `/api/validation/check-consistency`

- Múltiplas rotas de integridade:
  - `/api/integrity/validate`
  - `/api/integrity/fix`
  - `/api/audit/integrity`
  - `/api/maintenance/verify-integrity`

## 📊 ESTATÍSTICAS

- **Hooks Duplicados:** 3 pares
- **APIs com -old/-new:** 4 arquivos
- **APIs de Pagamento:** 6 rotas (deveria ser 1-2)
- **APIs de Validação:** 4 rotas (deveria ser 1-2)
- **APIs de Integridade:** 4 rotas (deveria ser 1-2)

## ✅ AÇÕES REALIZADAS

### ✅ Prioridade ALTA - CONCLUÍDO

1. **✅ Deletados arquivos -old e -new**
```
✅ src/app/api/installments/route-old.ts - DELETADO
✅ src/app/api/shared-expenses/route-old.ts - DELETADO
✅ src/app/api/transactions/route-old.ts - DELETADO
✅ src/app/api/transactions/[id]/route-new.ts - DELETADO
✅ src/app/api/shared-debts/[id]/pay/route-new.ts - DELETADO
```

2. **✅ Consolidados hooks de dashboard**
- ✅ Mantido: `use-dashboard-data.ts`
- ✅ Deletado: `useDashboardData.ts`

3. **✅ Removidos hooks de categorização não utilizados**
- ✅ Deletado: `use-smart-categorization.ts` (não usado)
- ✅ Deletado: `use-smart-category.ts` (não usado)

## 🔄 AÇÕES PENDENTES

### Prioridade ALTA 🔴

1. **Verificar referências aos arquivos deletados**
- Garantir que nenhum import está quebrado

### Prioridade MÉDIA 🟡

4. **Consolidar APIs de pagamento**
- Criar uma única rota: `/api/payments/route.ts`
- Suportar diferentes tipos via query params

5. **Consolidar APIs de validação**
- Criar: `/api/validation/route.ts`
- Suportar diferentes tipos via query params

6. **Consolidar APIs de integridade**
- Manter apenas: `/api/integrity/route.ts`
- Deletar duplicatas em audit e maintenance

### Prioridade BAIXA 🟢

7. **Revisar e consolidar**
- APIs de família
- APIs de itinerário
- APIs de notificações

## 🎯 BENEFÍCIOS DA LIMPEZA

- ✅ Redução de ~15-20 arquivos
- ✅ Código mais fácil de manter
- ✅ Menos confusão sobre qual API usar
- ✅ Melhor performance (menos rotas para resolver)
- ✅ Facilita testes e debugging

## 📝 NOTAS

- Antes de deletar, verificar se há referências no código
- Fazer backup antes de qualquer alteração
- Testar após cada consolidação
- Atualizar documentação
