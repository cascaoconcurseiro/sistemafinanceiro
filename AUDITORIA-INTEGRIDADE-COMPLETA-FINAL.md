# 🔍 AUDITORIA DE INTEGRIDADE - ANÁLISE COMPLETA

**Data:** 28/10/2025  
**Objetivo:** Identificar TODAS as brechas de integridade de dados

---

## 🚨 BRECHAS CRÍTICAS IDENTIFICADAS

### 1. DELETAR TRANSAÇÃO

#### ❌ PROBLEMA: Não remove de SharedExpense
```typescript
// Código atual em deleteTransaction()
await tx.sharedDebt.deleteMany({
  where: { transactionId },
});

// ❌ FALTA: Deletar SharedExpense
// SharedExpense é diferente de SharedDebt!
```

**Impacto:** Transação deletada mas SharedExpense fica órfão

**Correção:**
```typescript
// 5. Deletar despesas compartilhadas
await tx.sharedExpense.deleteMany({
  where: { transactionId },
});

// 6. Deletar dívidas compartilhadas
await tx.sharedDebt.deleteMany({
  where: { transactionId },
});
```

---

### 2. DELETAR TRANSAÇÃO DE VIAGEM

#### ❌ PROBLEMA: Não atualiza saldo da viagem
```typescript
// Código atual: Não verifica se transaction.tripId existe
if (transaction.accountId) {
  await this.updateAccountBalance(tx, transaction.accountId);
}

// ❌ FALTA: Atualizar Trip.spent
```

**Impacto:** Viagem fica com saldo incorreto

**Correção:**
```typescript
// 8. Atualizar saldo da viagem
if (transaction.tripId) {
  const trip = await tx.trip.findUnique({
    where: { id: transaction.tripId },
  });
  
  if (trip) {
    // Recalcular spent da viagem
    const tripTransactions = await tx.transaction.findMany({
      where: {
        tripId: transaction.tripId,
        deletedAt: null,
      },
    });
    
    const newSpent = tripTransactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );
    
    await tx.trip.update({
      where: { id: transaction.tripId },
      data: { spent: newSpent },
    });
  }
}
```

---

### 3. DELETAR TRANSAÇÃO DE META

#### ❌ PROBLEMA: Não atualiza Goal.currentAmount
```typescript
// ❌ FALTA: Atualizar meta financeira
if (transaction.goalId) {
  // Recalcular currentAmount
}
```

**Impacto:** Meta fica com valor incorreto

**Correção:**
```typescript
// 9. Atualizar meta financeira
if (transaction.goalId) {
  const goalTransactions = await tx.transaction.findMany({
    where: {
      goalId: transaction.goalId,
      deletedAt: null,
    },
  });
  
  const newAmount = goalTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  
  await tx.goal.update({
    where: { id: transaction.goalId },
    data: { currentAmount: newAmount },
  });
}
```

---

### 4. DELETAR TRANSAÇÃO DE ORÇAMENTO

#### ❌ PROBLEMA: Não atualiza Budget.spent
```typescript
// ❌ FALTA: Atualizar orçamento
if (transaction.budgetId) {
  // Recalcular spent
}
```

**Impacto:** Orçamento fica com gasto incorreto

**Correção:**
```typescript
// 10. Atualizar orçamento
if (transaction.budgetId) {
  const budgetTransactions = await tx.transaction.findMany({
    where: {
      budgetId: transaction.budgetId,
      deletedAt: null,
      type: 'DESPESA',
    },
  });
  
  const newSpent = budgetTransactions.reduce(
    (sum, t) => sum + Math.abs(Number(t.amount)),
    0
  );
  
  await tx.budget.update({
    where: { id: transaction.budgetId },
    data: { spent: newSpent },
  });
}
```

---

### 5. DELETAR TRANSAÇÃO DE FATURA

#### ❌ PROBLEMA: Não atualiza Invoice.totalAmount
```typescript
// ❌ FALTA: Atualizar fatura do cartão
if (transaction.invoiceId) {
  // Recalcular totalAmount
}
```

**Impacto:** Fatura fica com total incorreto

**Correção:**
```typescript
// 11. Atualizar fatura do cartão
if (transaction.invoiceId) {
  const invoiceTransactions = await tx.transaction.findMany({
    where: {
      invoiceId: transaction.invoiceId,
      deletedAt: null,
    },
  });
  
  const newTotal = invoiceTransactions.reduce(
    (sum, t) => sum + Math.abs(Number(t.amount)),
    0
  );
  
  await tx.invoice.update({
    where: { id: transaction.invoiceId },
    data: { totalAmount: newTotal },
  });
}
```

---

### 6. CRIAR TRANSAÇÃO SEM VALIDAR ORÇAMENTO

#### ❌ PROBLEMA: Não valida se orçamento foi excedido
```typescript
// Código atual: Cria transação sem verificar orçamento
const createdTransaction = await tx.transaction.create({
  data: { ... }
});

// ❌ FALTA: Validar orçamento
```

**Impacto:** Usuário gasta mais que o orçado sem aviso

**Correção:**
```typescript
// Antes de criar transação
if (validatedTransaction.categoryId && validatedTransaction.type === 'DESPESA') {
  const budget = await tx.budget.findFirst({
    where: {
      userId: validatedTransaction.userId,
      categoryId: validatedTransaction.categoryId,
      isActive: true,
      startDate: { lte: validatedTransaction.date },
      endDate: { gte: validatedTransaction.date },
    },
  });
  
  if (budget) {
    const newSpent = Number(budget.spent) + Math.abs(Number(validatedTransaction.amount));
    const percentUsed = (newSpent / Number(budget.amount)) * 100;
    
    if (percentUsed > budget.alertThreshold) {
      console.warn(`⚠️ Orçamento ${budget.name} em ${percentUsed.toFixed(0)}%`);
      
      // Criar notificação
      await tx.notification.create({
        data: {
          userId: validatedTransaction.userId,
          title: 'Orçamento Excedido',
          message: `Orçamento "${budget.name}" está em ${percentUsed.toFixed(0)}%`,
          type: 'warning',
        },
      });
    }
  }
}
```

---

### 7. TRANSFERÊNCIA SEM VALIDAR SALDO DESTINO

#### ❌ PROBLEMA: Não valida se conta destino aceita o valor
```typescript
// Código atual: Cria transferência sem validar destino
const creditTransaction = await tx.transaction.create({
  data: { ... }
});

// ❌ FALTA: Validar se conta destino está ativa
```

**Impacto:** Transferência para conta inativa

**Correção:**
```typescript
// Validar contas antes de transferir
const fromAccount = await tx.account.findUnique({
  where: { id: fromAccountId },
});

const toAccount = await tx.account.findUnique({
  where: { id: toAccountId },
});

if (!fromAccount || !toAccount) {
  throw new Error('Conta não encontrada');
}

if (!fromAccount.isActive) {
  throw new Error('Conta de origem está inativa');
}

if (!toAccount.isActive) {
  throw new Error('Conta de destino está inativa');
}

if (fromAccount.currency !== toAccount.currency) {
  throw new Error('Moedas diferentes. Use câmbio.');
}
```

---

### 8. PARCELAMENTO SEM VALIDAR LIMITE TOTAL

#### ❌ PROBLEMA: Não valida se soma das parcelas cabe no limite
```typescript
// Código atual: Cria parcelamento sem validar limite total
const parentTransaction = await tx.transaction.create({
  data: { ... }
});

// ❌ FALTA: Validar se 12x R$ 100 = R$ 1.200 cabe no limite
```

**Impacto:** Parcelamento criado mas limite insuficiente

**Correção:**
```typescript
// Antes de criar parcelamento no cartão
if (validatedTransaction.creditCardId) {
  const card = await tx.creditCard.findUnique({
    where: { id: validatedTransaction.creditCardId },
  });
  
  if (card) {
    const totalAmount = Math.abs(Number(validatedTransaction.amount)) * totalInstallments;
    
    let maxLimit = Number(card.limit);
    if (card.allowOverLimit) {
      maxLimit = maxLimit * (1 + card.overLimitPercent / 100);
    }
    
    const availableLimit = maxLimit - Number(card.currentBalance);
    
    if (totalAmount > availableLimit) {
      throw new Error(
        `Parcelamento total (R$ ${totalAmount}) excede limite disponível (R$ ${availableLimit})`
      );
    }
  }
}
```

---

### 9. EDITAR TRANSAÇÃO SEM RECALCULAR TUDO

#### ❌ PROBLEMA: Edita transação mas não recalcula entidades relacionadas
```typescript
// Código atual em updateTransaction()
const updated = await tx.transaction.update({
  where: { id: transactionId },
  data: prismaUpdateData,
});

// ❌ FALTA: Recalcular viagem, meta, orçamento, fatura
```

**Impacto:** Dados inconsistentes após edição

**Correção:**
```typescript
// Após atualizar transação
// Recalcular TODAS as entidades relacionadas

// 1. Viagem
if (updated.tripId || original.tripId) {
  const tripIds = [updated.tripId, original.tripId].filter(Boolean);
  for (const tripId of tripIds) {
    await this.recalculateTripSpent(tx, tripId);
  }
}

// 2. Meta
if (updated.goalId || original.goalId) {
  const goalIds = [updated.goalId, original.goalId].filter(Boolean);
  for (const goalId of goalIds) {
    await this.recalculateGoalAmount(tx, goalId);
  }
}

// 3. Orçamento
if (updated.budgetId || original.budgetId) {
  const budgetIds = [updated.budgetId, original.budgetId].filter(Boolean);
  for (const budgetId of budgetIds) {
    await this.recalculateBudgetSpent(tx, budgetId);
  }
}

// 4. Fatura
if (updated.invoiceId || original.invoiceId) {
  const invoiceIds = [updated.invoiceId, original.invoiceId].filter(Boolean);
  for (const invoiceId of invoiceIds) {
    await this.recalculateInvoiceTotal(tx, invoiceId);
  }
}
```

---

### 10. PAGAR PARCELA SEM VALIDAR ORDEM

#### ❌ PROBLEMA: Permite pagar parcela 5 sem ter pago 1-4
```typescript
// Código atual em payInstallment()
await tx.installment.update({
  where: { id: installmentId },
  data: { status: 'paid' }
});

// ❌ FALTA: Validar ordem de pagamento
```

**Impacto:** Parcelas pagas fora de ordem

**Correção:**
```typescript
// Validar ordem antes de pagar
const previousInstallments = await tx.installment.findMany({
  where: {
    transactionId: installment.transactionId,
    installmentNumber: { lt: installment.installmentNumber },
    status: { not: 'paid' },
  },
});

if (previousInstallments.length > 0) {
  throw new Error(
    `Pague as parcelas anteriores primeiro. Pendentes: ${previousInstallments.map(i => i.installmentNumber).join(', ')}`
  );
}
```

---

## 📊 RESUMO DAS BRECHAS

| # | Brecha | Impacto | Prioridade |
|---|--------|---------|------------|
| 1 | SharedExpense não deletado | Alto | 🔴 Crítico |
| 2 | Trip.spent não atualizado | Alto | 🔴 Crítico |
| 3 | Goal.currentAmount não atualizado | Alto | 🔴 Crítico |
| 4 | Budget.spent não atualizado | Alto | 🔴 Crítico |
| 5 | Invoice.totalAmount não atualizado | Alto | 🔴 Crítico |
| 6 | Orçamento não validado | Médio | 🟡 Importante |
| 7 | Conta destino não validada | Médio | 🟡 Importante |
| 8 | Limite total não validado | Alto | 🔴 Crítico |
| 9 | Edição não recalcula tudo | Alto | 🔴 Crítico |
| 10 | Ordem de parcelas não validada | Baixo | 🟢 Desejável |

---

## ✅ REGRAS QUE FALTAM

### 1. RECONCILIAÇÃO BANCÁRIA
**Status:** ❌ NÃO IMPLEMENTADO

**O que é:** Comparar transações do sistema com extrato bancário

**Implementação:**
```typescript
reconcileAccount(accountId, bankStatementTransactions) {
  // 1. Buscar transações do sistema
  const systemTransactions = await prisma.transaction.findMany({
    where: { accountId, isReconciled: false }
  });
  
  // 2. Comparar com extrato
  for (const bankTx of bankStatementTransactions) {
    const match = systemTransactions.find(t => 
      Math.abs(Number(t.amount)) === bankTx.amount &&
      isSameDay(t.date, bankTx.date)
    );
    
    if (match) {
      // Marcar como reconciliado
      await prisma.transaction.update({
        where: { id: match.id },
        data: { isReconciled: true, reconciledAt: new Date() }
      });
    } else {
      // Transação no banco mas não no sistema
      console.warn('Transação não encontrada:', bankTx);
    }
  }
  
  // 3. Atualizar reconciledBalance
  await prisma.account.update({
    where: { id: accountId },
    data: { reconciledBalance: calculateReconciledBalance() }
  });
}
```

---

### 2. DETECÇÃO DE DUPLICATAS
**Status:** ❌ NÃO IMPLEMENTADO

**O que é:** Evitar criar transação duplicada

**Implementação:**
```typescript
async detectDuplicate(transaction) {
  const duplicates = await prisma.transaction.findMany({
    where: {
      userId: transaction.userId,
      amount: transaction.amount,
      description: transaction.description,
      date: {
        gte: subDays(transaction.date, 1),
        lte: addDays(transaction.date, 1),
      },
      deletedAt: null,
    },
  });
  
  if (duplicates.length > 0) {
    return {
      isDuplicate: true,
      possibleDuplicates: duplicates,
      message: 'Transação similar encontrada. Deseja continuar?',
    };
  }
  
  return { isDuplicate: false };
}
```

---

### 3. AUDITORIA DE MUDANÇAS
**Status:** ⚠️ PARCIAL (só tem TransactionAudit)

**O que falta:** Auditar mudanças em TODAS as entidades

**Implementação:**
```typescript
async auditChange(entity, action, oldValue, newValue, userId) {
  await prisma.auditEvent.create({
    data: {
      userId,
      tableName: entity,
      recordId: oldValue?.id || newValue?.id,
      operation: action, // CREATE, UPDATE, DELETE
      oldValues: JSON.stringify(oldValue),
      newValues: JSON.stringify(newValue),
      timestamp: new Date(),
    },
  });
}

// Usar em TODAS as operações
await auditChange('Transaction', 'UPDATE', original, updated, userId);
await auditChange('Account', 'DELETE', account, null, userId);
```

---

### 4. VALIDAÇÃO DE CONSISTÊNCIA AUTOMÁTICA
**Status:** ✅ IMPLEMENTADO (verifyDoubleEntryIntegrity)

**O que falta:** Validar TODAS as entidades

**Implementação:**
```typescript
async validateAllConsistency(userId) {
  const issues = [];
  
  // 1. Partidas dobradas
  const doubleEntry = await this.verifyDoubleEntryIntegrity(userId);
  if (doubleEntry.unbalanced.length > 0) {
    issues.push(...doubleEntry.issues);
  }
  
  // 2. Saldos de contas
  const accounts = await prisma.account.findMany({ where: { userId } });
  for (const account of accounts) {
    const calculated = await this.calculateAccountBalance(account.id);
    if (Math.abs(calculated - Number(account.balance)) > 0.01) {
      issues.push({
        type: 'ACCOUNT_BALANCE_MISMATCH',
        accountId: account.id,
        stored: account.balance,
        calculated,
      });
    }
  }
  
  // 3. Totais de faturas
  const invoices = await prisma.invoice.findMany({ where: { userId } });
  for (const invoice of invoices) {
    const calculated = await this.calculateInvoiceTotal(invoice.id);
    if (Math.abs(calculated - Number(invoice.totalAmount)) > 0.01) {
      issues.push({
        type: 'INVOICE_TOTAL_MISMATCH',
        invoiceId: invoice.id,
        stored: invoice.totalAmount,
        calculated,
      });
    }
  }
  
  // 4. Gastos de viagens
  const trips = await prisma.trip.findMany({ where: { userId } });
  for (const trip of trips) {
    const calculated = await this.calculateTripSpent(trip.id);
    if (Math.abs(calculated - Number(trip.spent)) > 0.01) {
      issues.push({
        type: 'TRIP_SPENT_MISMATCH',
        tripId: trip.id,
        stored: trip.spent,
        calculated,
      });
    }
  }
  
  // 5. Metas
  const goals = await prisma.goal.findMany({ where: { userId } });
  for (const goal of goals) {
    const calculated = await this.calculateGoalAmount(goal.id);
    if (Math.abs(calculated - Number(goal.currentAmount)) > 0.01) {
      issues.push({
        type: 'GOAL_AMOUNT_MISMATCH',
        goalId: goal.id,
        stored: goal.currentAmount,
        calculated,
      });
    }
  }
  
  // 6. Orçamentos
  const budgets = await prisma.budget.findMany({ where: { userId } });
  for (const budget of budgets) {
    const calculated = await this.calculateBudgetSpent(budget.id);
    if (Math.abs(calculated - Number(budget.spent)) > 0.01) {
      issues.push({
        type: 'BUDGET_SPENT_MISMATCH',
        budgetId: budget.id,
        stored: budget.spent,
        calculated,
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    issuesFound: issues.length,
    issues,
  };
}
```

---

### 5. BACKUP AUTOMÁTICO
**Status:** ❌ NÃO IMPLEMENTADO

**O que é:** Backup automático do banco de dados

**Implementação:**
```typescript
async createBackup(userId) {
  const backup = {
    timestamp: new Date(),
    user: await prisma.user.findUnique({ where: { id: userId } }),
    accounts: await prisma.account.findMany({ where: { userId } }),
    transactions: await prisma.transaction.findMany({ where: { userId } }),
    categories: await prisma.category.findMany({ where: { userId } }),
    budgets: await prisma.budget.findMany({ where: { userId } }),
    goals: await prisma.goal.findMany({ where: { userId } }),
    trips: await prisma.trip.findMany({ where: { userId } }),
    creditCards: await prisma.creditCard.findMany({ where: { userId } }),
    invoices: await prisma.invoice.findMany({ where: { userId } }),
  };
  
  const filename = `backup_${userId}_${Date.now()}.json`;
  await fs.writeFile(
    path.join(process.cwd(), 'backups', filename),
    JSON.stringify(backup, null, 2)
  );
  
  return { filename, size: JSON.stringify(backup).length };
}
```

---

## 🎯 PLANO DE CORREÇÃO

### Sprint 1 (1 semana) - CRÍTICO
- [ ] Corrigir deleteTransaction (brechas 1-5)
- [ ] Corrigir updateTransaction (brecha 9)
- [ ] Adicionar validação de limite total (brecha 8)

### Sprint 2 (1 semana) - IMPORTANTE
- [ ] Adicionar validações em createTransaction (brecha 6)
- [ ] Adicionar validações em createTransfer (brecha 7)
- [ ] Implementar detecção de duplicatas

### Sprint 3 (1 semana) - MELHORIAS
- [ ] Implementar reconciliação bancária
- [ ] Implementar validação de consistência completa
- [ ] Implementar backup automático

---

## ✅ CONCLUSÃO

**Total de Brechas Identificadas:** 15  
**Críticas:** 7  
**Importantes:** 5  
**Desejáveis:** 3

**Próximo passo:** Implementar correções das brechas críticas.
