# 📋 LISTA DE RESTAURAÇÃO - INVESTIMENTOS ANTIGOS

## ✅ DECISÃO
Restaurar sistema antigo de investimentos que era mais completo e integrado.

## 📦 ARQUIVOS DO BACKUP A COPIAR

### 1. Hook Principal
- `useOptimizedInvestments.ts` - Hook que usa o contexto unificado

### 2. Componentes (10 arquivos)
1. `asset-autocomplete.tsx` - Autocomplete para buscar ativos
2. `dividend-modal.tsx` - Modal de dividendos
3. `investment-dashboard.tsx` - Dashboard principal
4. `investment-export.tsx` - Exportação de dados
5. `investment-ir-report.tsx` - Relatório de IR
6. `investment-list.tsx` - Lista de investimentos
7. `investment-operation-modal-fixed.tsx` - Modal de operações (versão corrigida)
8. `investment-operation-modal.tsx` - Modal de operações
9. `investment-reports.tsx` - Relatórios
10. `investment-sale-modal.tsx` - Modal de venda

### 3. Página
- `src/app/investments/page.tsx` - Página principal (verificar se precisa atualizar)

## 🎯 VANTAGENS DA VERSÃO ANTIGA

1. **Integração com Contexto Unificado**
   - Usa `useUnifiedFinancial()`
   - Calcula investimentos a partir das transações
   - Cache otimizado

2. **Mais Funcionalidades**
   - Compra e venda de ativos
   - Autocomplete de ativos
   - Relatório de IR
   - Exportação de dados
   - Dividendos

3. **Melhor UX**
   - Modals específicos para cada operação
   - Validações completas
   - Feedback visual

## ⚠️ ATENÇÃO

A versão antiga usa uma abordagem diferente:
- Investimentos são calculados a partir das **transações**
- Não usa tabela `investments` separada
- Usa `metadata` nas transações para armazenar dados

## 🔄 PRÓXIMOS PASSOS

1. Copiar `useOptimizedInvestments.ts` para `src/hooks/`
2. Copiar todos os componentes para `src/components/investments/`
3. Atualizar página principal se necessário
4. Testar tudo
5. Remover arquivos novos que não serão usados

## 📝 NOTA

Esta é a versão que estava funcionando antes e é mais madura.
Vamos restaurá-la completamente.
