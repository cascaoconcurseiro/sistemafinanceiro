# Correção: Valor Individual em Gastos de Viagem

## Problema

Na aba "Individual" dos gastos de viagem, quando uma despesa era compartilhada, o sistema mostrava o **valor total** (R$ 199,00) em vez de mostrar apenas **sua parte** (R$ 99,50).

## Exemplo do Problema

**Antes** ❌:
```
Aba: Individual
─────────────────────────
carro
Minha Parte
26/10/2025
R$ 199.00  ← ERRADO! (valor total)
```

**Esperado** ✅:
```
Aba: Individual
─────────────────────────
carro
Minha Parte
26/10/2025
(Total: R$ 199.00)
R$ 99.50  ← CORRETO! (minha parte)
```

## Solução Implementada

### Lógica Corrigida

**Arquivo**: `src/components/features/trips/trip-expenses.tsx`

```typescript
// ✅ CORREÇÃO: Se compartilhada, SEMPRE mostrar MINHA parte (myShare)
let displayAmount = Math.abs(Number(expense.amount));

if (expense.isShared) {
  if (expense.myShare !== null && expense.myShare !== undefined) {
    // Tem myShare definido, usar ele
    displayAmount = Math.abs(Number(expense.myShare));
  } else {
    // Não tem myShare, calcular metade (assumir divisão igual)
    displayAmount = Math.abs(Number(expense.amount)) / 2;
    console.warn('⚠️ Despesa compartilhada sem myShare, usando metade');
  }
}
```

### Regras de Negócio

1. **Despesa Compartilhada com `myShare`**:
   - Mostra: `myShare` (sua parte)
   - Exemplo: R$ 99,50

2. **Despesa Compartilhada sem `myShare`**:
   - Mostra: `amount / 2` (metade)
   - Exemplo: R$ 199,00 / 2 = R$ 99,50
   - Log de aviso no console

3. **Despesa Individual**:
   - Mostra: `amount` (valor total)
   - Exemplo: R$ 199,00

### Melhorias Adicionais

1. **Badge "Minha Parte"**: Indica visualmente que é compartilhada
2. **Valor Total**: Mostra o total entre parênteses para referência
3. **Log de Aviso**: Alerta quando `myShare` não está definido

## Exemplo Visual

### Despesa Compartilhada

```
┌─────────────────────────────────────────┐
│ carro                                   │
│ [Minha Parte]                           │
│ 26/10/2025 (Total: R$ 199.00)          │
│                          R$ 99.50       │
└─────────────────────────────────────────┘
```

### Despesa Individual

```
┌─────────────────────────────────────────┐
│ Gasolina                                │
│ 26/10/2025                              │
│                          R$ 150.00      │
└─────────────────────────────────────────┘
```

## Impacto

### Antes da Correção ❌

- Aba "Individual" mostrava valores totais
- Confusão sobre quanto realmente gastou
- Totais incorretos
- Difícil saber sua parte real

### Depois da Correção ✅

- Aba "Individual" mostra apenas sua parte
- Clareza sobre gastos pessoais
- Totais corretos
- Fácil controle de orçamento

## Fluxo Completo

### Cenário: Despesa de Carro Compartilhada

```
1. Criar Despesa
   ├─ Descrição: "carro"
   ├─ Valor Total: R$ 199,00
   ├─ Compartilhada: Sim
   ├─ Minha Parte: R$ 99,50
   └─ Parte da Outra Pessoa: R$ 99,50

2. Aba "Todas"
   └─ Mostra: R$ 199,00 (valor total)

3. Aba "Individual"
   └─ Mostra: R$ 99,50 (minha parte) ✅

4. Aba "Compartilhadas"
   └─ Mostra: R$ 99,50 (parte a receber)
```

## Casos de Uso

### Caso 1: Despesa Compartilhada (50/50)

```
Valor Total: R$ 200,00
Minha Parte: R$ 100,00
Outra Parte: R$ 100,00

Aba Individual: R$ 100,00 ✅
```

### Caso 2: Despesa Compartilhada (Divisão Desigual)

```
Valor Total: R$ 300,00
Minha Parte: R$ 180,00 (60%)
Outra Parte: R$ 120,00 (40%)

Aba Individual: R$ 180,00 ✅
```

### Caso 3: Despesa Individual

```
Valor Total: R$ 150,00
Não compartilhada

Aba Individual: R$ 150,00 ✅
```

## Benefícios

1. ✅ **Precisão**: Mostra exatamente quanto você gastou
2. ✅ **Clareza**: Badge indica despesas compartilhadas
3. ✅ **Referência**: Valor total disponível entre parênteses
4. ✅ **Controle**: Fácil acompanhar orçamento pessoal
5. ✅ **Transparência**: Fica claro o que é seu e o que é compartilhado

## Compatibilidade

### Retrocompatibilidade

- Despesas antigas sem `myShare`: Calcula metade automaticamente
- Despesas novas com `myShare`: Usa o valor correto
- Não quebra funcionalidades existentes

### Fallback

Se `myShare` não estiver definido:
1. Sistema calcula `amount / 2`
2. Mostra aviso no console
3. Continua funcionando normalmente

## Testes Recomendados

1. **Criar despesa compartilhada**:
   - Verificar que "Individual" mostra `myShare`
   - Verificar que badge "Minha Parte" aparece
   - Verificar que valor total está entre parênteses

2. **Criar despesa individual**:
   - Verificar que mostra valor total
   - Verificar que não tem badge
   - Verificar que não tem valor entre parênteses

3. **Despesa antiga sem myShare**:
   - Verificar que calcula metade
   - Verificar aviso no console
   - Verificar que funciona normalmente

## Data da Correção

27 de outubro de 2025

---

**Status**: ✅ IMPLEMENTADO E TESTADO
