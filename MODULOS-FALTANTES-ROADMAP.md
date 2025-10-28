# 🗺️ ROADMAP - MÓDULOS FALTANTES

## 🎯 Objetivo

Implementar os módulos que ainda não foram migrados do serviço antigo.

---

## 📋 MÓDULOS A IMPLEMENTAR

### 1. SharedExpenseCreator (Prioridade: ALTA)

**Arquivo**: `src/lib/services/transactions/shared-expense-creator.ts`

**Funcionalidades**:
- Criar despesa compartilhada
- Dividir valor entre participantes
- Criar dívidas individuais
- Suportar divisão igual, por porcentagem ou customizada

**Estimativa**: 3 horas

**Estrutura**:
```typescript
export class SharedExpenseCreator {
  static async create(options: CreateSharedExpenseOptions) {
    // 1. Criar transação principal
    // 2. Calcular divisão
    // 3. Criar dívidas para cada participante
    // 4. Atualizar saldos
  }

  static async settle(sharedExpenseId: string, participantId: string) {
    // Marcar dívida como paga
  }
}
```

---

### 2. InvoiceCalculator (Prioridade: ALTA)

**Arquivo**: `src/lib/services/calculations/invoice-calculator.ts`

**Funcionalidades**:
- Recalcular total de fatura
- Recalcular todas as faturas de um usuário
- Verificar consistência de faturas

**Estimativa**: 2 horas

**Estrutura**:
```typescript
export class InvoiceCalculator {
  static async recalculateInvoiceTotal(
    tx: Prisma.TransactionClient,
    invoiceId: string
  ): Promise<void> {
    // Somar todas as transações da fatura
    // Atualizar total
  }

  static async recalculateAllInvoices(userId: string): Promise<void> {
    // Recalcular todas as faturas do usuário
  }
}
```

---

### 3. TripCalculator (Prioridade: MÉDIA)

**Arquivo**: `src/lib/services/calculations/trip-calculator.ts`

**Funcionalidades**:
- Recalcular gastos de viagem
- Recalcular todas as viagens de um usuário
- Verificar consistência de viagens

**Estimativa**: 2 horas

**Estrutura**:
```typescript
export class TripCalculator {
  static async recalculateTripSpent(
    tx: Prisma.TransactionClient,
    tripId: string
  ): Promise<void> {
    // Somar todas as transações da viagem
    // Atualizar total gasto
  }

  static async recalculateAllTrips(userId: string): Promise<void> {
    // Recalcular todas as viagens do usuário
  }
}
```

---

### 4. GoalCalculator (Prioridade: MÉDIA)

**Arquivo**: `src/lib/services/calculations/goal-calculator.ts`

**Funcionalidades**:
- Recalcular progresso de meta
- Recalcular todas as metas de um usuário
- Verificar se meta foi atingida

**Estimativa**: 1.5 horas

**Estrutura**:
```typescript
export class GoalCalculator {
  static async recalculateGoalAmount(
    tx: Prisma.TransactionClient,
    goalId: string
  ): Promise<void> {
    // Somar todas as contribuições
    // Atualizar progresso
    // Verificar se atingiu meta
  }

  static async recalculateAllGoals(userId: string): Promise<void> {
    // Recalcular todas as metas do usuário
  }
}
```

---

### 5. BudgetCalculator (Prioridade: MÉDIA)

**Arquivo**: `src/lib/services/calculations/budget-calculator.ts`

**Funcionalidades**:
- Recalcular gastos de orçamento
- Recalcular todos os orçamentos de um usuário
- Verificar se orçamento foi excedido

**Estimativa**: 1.5 horas

**Estrutura**:
```typescript
export class BudgetCalculator {
  static async recalculateBudgetSpent(
    tx: Prisma.TransactionClient,
    budgetId: string
  ): Promise<void> {
    // Somar todas as despesas da categoria
    // Atualizar total gasto
    // Verificar se excedeu
  }

  static async recalculateAllBudgets(userId: string): Promise<void> {
    // Recalcular todos os orçamentos do usuário
  }
}
```

---

### 6. ConsistencyChecker (Prioridade: BAIXA)

**Arquivo**: `src/lib/services/integrity/consistency-checker.ts`

**Funcionalidades**:
- Verificar consistência de dados
- Detectar inconsistências
- Gerar relatório de problemas

**Estimativa**: 3 horas

**Estrutura**:
```typescript
export class ConsistencyChecker {
  static async checkUserData(userId: string): Promise<ConsistencyReport> {
    // Verificar saldos
    // Verificar faturas
    // Verificar viagens
    // Verificar metas
    // Verificar orçamentos
    // Retornar relatório
  }
}
```

---

### 7. DataFixer (Prioridade: BAIXA)

**Arquivo**: `src/lib/services/integrity/data-fixer.ts`

**Funcionalidades**:
- Corrigir inconsistências detectadas
- Recalcular tudo
- Gerar relatório de correções

**Estimativa**: 2 horas

**Estrutura**:
```typescript
export class DataFixer {
  static async fixUserData(userId: string): Promise<FixReport> {
    // Recalcular saldos
    // Recalcular faturas
    // Recalcular viagens
    // Recalcular metas
    // Recalcular orçamentos
    // Retornar relatório
  }
}
```

---

## 📅 CRONOGRAMA SUGERIDO

### Semana 1 (10h):
**Foco**: Módulos de Alta Prioridade

- [ ] Dia 1-2: SharedExpenseCreator (3h)
- [ ] Dia 3: InvoiceCalculator (2h)
- [ ] Dia 4: TripCalculator (2h)
- [ ] Dia 5: Testes dos módulos criados (3h)

### Semana 2 (8h):
**Foco**: Módulos de Média Prioridade

- [ ] Dia 1: GoalCalculator (1.5h)
- [ ] Dia 2: BudgetCalculator (1.5h)
- [ ] Dia 3-4: ConsistencyChecker (3h)
- [ ] Dia 5: Testes dos módulos criados (2h)

### Semana 3 (4h):
**Foco**: Finalização

- [ ] Dia 1: DataFixer (2h)
- [ ] Dia 2: Testes finais (1h)
- [ ] Dia 3: Documentação (1h)

**Total**: ~22 horas

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO

### Fase 1 (Crítico):
1. SharedExpenseCreator
2. InvoiceCalculator

### Fase 2 (Importante):
3. TripCalculator
4. GoalCalculator
5. BudgetCalculator

### Fase 3 (Opcional):
6. ConsistencyChecker
7. DataFixer

---

## 📊 DEPENDÊNCIAS

```
SharedExpenseCreator
  ↓
TransactionCreator (já existe)
  ↓
BalanceCalculator (já existe)

InvoiceCalculator
  ↓
BalanceCalculator (já existe)

TripCalculator
  ↓
(independente)

GoalCalculator
  ↓
(independente)

BudgetCalculator
  ↓
(independente)

ConsistencyChecker
  ↓
Todos os calculadores

DataFixer
  ↓
ConsistencyChecker
```

---

## ✅ CRITÉRIOS DE SUCESSO

Para cada módulo:

- [ ] Código implementado
- [ ] Testes unitários criados
- [ ] Documentação atualizada
- [ ] Integrado ao orquestrador
- [ ] Testado manualmente
- [ ] Code review realizado

---

## 📝 TEMPLATE DE IMPLEMENTAÇÃO

```typescript
/**
 * [NOME DO MÓDULO]
 * [Descrição breve]
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class [NomeDoModulo] {
  /**
   * [Descrição do método]
   */
  static async [nomeDoMetodo](
    tx: Prisma.TransactionClient,
    [parametros]: [tipos]
  ): Promise<[retorno]> {
    // 1. Buscar dados
    
    // 2. Processar
    
    // 3. Atualizar
    
    // 4. Retornar resultado
  }
}
```

---

## 🔄 ATUALIZAÇÃO DO ORQUESTRADOR

Após implementar cada módulo, atualizar:

**Arquivo**: `src/lib/services/financial-operations-orchestrator.ts`

```typescript
// Adicionar import
import { SharedExpenseCreator } from './transactions/shared-expense-creator';

// Adicionar método
static async createSharedExpense(options: CreateSharedExpenseOptions) {
  return await SharedExpenseCreator.create(options);
}
```

---

**Pronto para implementar os módulos faltantes!** 🚀
