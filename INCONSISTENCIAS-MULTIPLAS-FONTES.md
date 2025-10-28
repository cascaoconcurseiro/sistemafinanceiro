# 🚨 AUDITORIA: MÚLTIPLAS FONTES DE DADOS INCONSISTENTES

## Problema Crítico Identificado

**Data:** 27/10/2025  
**Severidade:** CRÍTICA  
**Impacto:** Sistema mostra valores diferentes em componentes diferentes

---

## 📊 Inconsistências Detectadas

### Cards Superiores (Correto ✅)
- Receitas outubro: R$ 1.050,00
- Despesas outubro: R$ 105,00
- Saldo: R$ 945,00

### Fluxo de Caixa (Incorreto ❌)
- Total Receitas: R$ 1.050,00 ✅
- Total Despesas: R$ 138,33 ❌ **(deveria ser R$ 105,00)**
- Saldo Líquido: R$ 911,67 ❌ **(deveria ser R$ 945,00)**
- Novembro: -R$ 16,67 ❌ **(parcela futura)**
- Dezembro: -R$ 16,67 ❌ **(parcela futura)**

### Cálculo do Erro
```
R$ 138,33 = R$ 105,00 (outubro) + R$ 16,67 (nov) + R$ 16,67 (dez)
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                   PARCELAS FUTURAS (não deveriam contar)
```

---

## 🔍 Causa Raiz

**Diferentes componentes usam diferentes lógicas de filtro:**

1. **Cards superiores** (`granular-cards.tsx`):
   - ✅ Filtra corretamente por mês selecionado
   - ✅ Usa `selectedMonth` e `selectedYear`

2. **Fluxo de Caixa** (`dashboard-sections.tsx`):
   - ❌ Está somando TODAS as transações de 2025
   - ❌ Não respeita o período selecionado no filtro
   - ❌ Conta parcelas futuras

---

## 📁 Arquivos Afetados

### Componentes com Cálculos Corretos
- ✅ `src/components/cards/granular-cards.tsx`
- ✅ `src/app/transactions/page.tsx` (periodSummary)

### Componentes com Cálculos Incorretos
- ❌ `src/components/cards/dashboard-sections.tsx` (CashFlowCard)
- ❌ `src/components/cards/dashboard-sections.tsx` (CategoryBudgetCard)

---

## 🎯 Solução Necessária

### Regra de Negócio Unificada

**TODOS os componentes DEVEM:**

1. **Usar o mesmo contexto de período:**
   ```typescript
   const { selectedMonth, selectedYear } = usePeriod();
   ```

2. **Filtrar transações da mesma forma:**
   ```typescript
   const filteredTransactions = transactions.filter(t => {
     const date = new Date(t.date);
     return date.getMonth() === selectedMonth && 
            date.getFullYear() === selectedYear &&
            t.status !== 'cancelled' &&
            !t.deletedAt;
   });
   ```

3. **Calcular totais da mesma forma:**
   ```typescript
   const income = filteredTransactions
     .filter(t => t.type === 'income' || t.type === 'RECEITA')
     .reduce((sum, t) => sum + Math.abs(t.amount), 0);
   
   const expenses = filteredTransactions
     .filter(t => t.type === 'expense' || t.type === 'DESPESA')
     .reduce((sum, t) => sum + Math.abs(t.amount), 0);
   ```

---

## ⚠️ Impacto

Esta inconsistência:
- ❌ Confunde o usuário com valores diferentes
- ❌ Compromete a confiabilidade do sistema
- ❌ Torna impossível confiar nos relatórios
- ❌ Viola o princípio de "fonte única da verdade"

---

## 🔧 Ação Imediata Necessária

1. Padronizar TODOS os componentes para usar a mesma lógica
2. Criar um hook centralizado `useFinancialSummary()`
3. Remover cálculos duplicados
4. Garantir que TODOS usem o contexto unificado

---

## 📝 Princípio Fundamental

**"Uma única fonte da verdade"**

Todos os dados financeiros devem vir do mesmo lugar:
- ✅ Contexto Unificado (`unified-financial-context.tsx`)
- ✅ Mesma lógica de filtro
- ✅ Mesmos cálculos
- ✅ Mesmas regras de negócio
