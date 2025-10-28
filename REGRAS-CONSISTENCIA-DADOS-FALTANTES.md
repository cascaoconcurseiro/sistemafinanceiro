# 🔍 REGRAS DE CONSISTÊNCIA DE DADOS FALTANTES

**Data:** 28/10/2025  
**Foco:** Integridade e Consistência de Dados Financeiros

---

## 📊 RESUMO EXECUTIVO

Após implementar as correções críticas, ainda faltam **regras de consistência** que garantem a integridade dos dados ao longo do tempo.

### Status Atual
- ✅ Partidas dobradas: Implementado
- ✅ Atomicidade: Implementado
- ✅ Soft delete: Implementado
- ⚠️ **Consistência temporal:** Parcial
- ❌ **Auditoria completa:** Faltando
- ❌ **Reconciliação:** Faltando
- ❌ **Validações cruzadas:** Faltando

---

## 🚨 REGRAS CRÍTICAS FALTANTES

### 1. VALIDAÇÃO DE DATAS (CRÍTICO)

**Problema:** Sistema permite criar transações com datas inconsistentes

**Cenários Problemáticos:**
```typescript
// ❌ Permitido mas ERRADO:
// 1. Transação no futuro distante
createTransaction({
  date: new Date('2030-01-01'), // 5 anos no futuro
  amount: -100,
});

// 2. Transação muito antiga
createTransaction({
  date: new Date('1990-01-01'), // 35 anos atrás
  amount: -100,
});

// 3. Parcela com data anterior à transação pai
createInstallment({
  dueDate: new Date('2024-01-01'),
  parentTransaction: { date: new Date('2025-01-01') }, // ❌ Filho antes do pai
});

// 4. Fatura com vencimento antes do fechamento
createInvoice({
  closingDate: new Date('2025-01-05'),
  dueDate: new Date('2025-01-03'), // ❌ Vence antes de fechar
});
```

**Implementação Necessária:**
```typescript
interface DateValidationRules {
  allowFutureDates: boolean;
  maxFutureDays: number; // Ex: 365 dias
  allowPastDates: boolean;
  maxPastDays: number; // Ex: 1825 dias (5 anos)
  validateParentChildDates: boolean;
  validateInvoiceDates: boolean;
}

function validateTransactionDate(date: Date, rules: DateValidationRules) {
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Validar futuro
  if (diffDays > 0 && !rules.allowFutureDates) {
    throw new Error('Transações futuras não são permitidas');
  }
  
  if (diffDays > rules.maxFutureDays) {
    throw new Error(`Data não pode ser mais de ${rules.maxFutureDays} dias no futuro`);
  }

  // Validar passado
  if (diffDays < 0 && !rules.allowPastDates) {
    throw new Error('Transações passadas não são permitidas');
  }
  
  if (Math.abs(diffDays) > rules.maxPastDays) {
    throw new Error(`Data não pode ser mais de ${rules.maxPastDays} dias no passado`);
  }
}
```

---

### 2. VALIDAÇÃO DE VALORES (CRÍTICO)

**Problema:** Sistema permite valores absurdos ou inválidos

**Cenários Problemáticos:**
```typescript
// ❌ Permitido mas ERRADO:
// 1. Valores negativos onde não deveria
createAccount({
  balance: -1000000, // Conta ATIVO com saldo negativo sem cheque especial
});

// 2. Valores muito grandes (possível erro de digitação)
createTransaction({
  amount: -10000000000, // R$ 10 bilhões
});

// 3. Valores com muitas casas decimais
createTransaction({
  amount: -100.123456789, // Mais de 2 casas decimais
});

// 4. Limite de cartão menor que saldo usado
updateCreditCard({
  limit: 1000,
  currentBalance: 5000, // ❌ Saldo maior que limite
});

// 5. Orçamento menor que já gasto
updateBudget({
  amount: 100,
  spent: 500, // ❌ Gasto maior que orçamento
});
```

**Implementação Necessária:**
```typescript
interface AmountValidationRules {
  minAmount: number;
  maxAmount: number;
  decimalPlaces: number;
  allowNegative: boolean;
}

function validateAmount(amount: number, rules: AmountValidationRules) {
  // Validar casas decimais
  const decimals = (amount.toString().split('.')[1] || '').length;
  if (decimals > rules.decimalPlaces) {
    throw new Error(`Valor não pode ter mais de ${rules.decimalPlaces} casas decimais`);
  }

  // Validar range
  if (Math.abs(amount) < rules.minAmount) {
    throw new Error(`Valor mínimo: R$ ${rules.minAmount}`);
  }
  
  if (Math.abs(amount) > rules.maxAmount) {
    throw new Error(`Valor máximo: R$ ${rules.maxAmount}`);
  }

  // Validar negativo
  if (amount < 0 && !rules.allowNegative) {
    throw new Error('Valor negativo não permitido');
  }
}

// Validações específicas
function validateAccountBalance(account: Account) {
  if (account.type === 'ATIVO' && account.balance < 0) {
    if (!account.allowNegativeBalance) {
      throw new Error('Conta ATIVO não pode ter saldo negativo');
    }
  }
}

function validateCreditCardBalance(card: CreditCard) {
  if (card.currentBalance > card.limit) {
    if (!card.allowOverLimit) {
      throw new Error('Saldo do cartão não pode exceder o limite');
    }
  }
}
```

---

### 3. VALIDAÇÃO DE ESTADOS (CRÍTICO)

**Problema:** Sistema permite transições de estado inválidas

**Cenários Problemáticos:**
```typescript
// ❌ Permitido mas ERRADO:
// 1. Pagar parcela já paga
payInstallment({
  id: 'inst_123',
  status: 'paid', // ❌ Já está paga
});

// 2. Cancelar parcela já paga
cancelInstallment({
  id: 'inst_123',
  status: 'paid', // ❌ Não pode cancelar paga
});

// 3. Editar transação reconciliada
updateTransaction({
  id: 'trans_123',
  isReconciled: true, // ❌ Não pode editar reconciliada
});

// 4. Deletar fatura paga
deleteInvoice({
  id: 'inv_123',
  isPaid: true, // ❌ Não pode deletar paga
});

// 5. Reabrir meta completada
updateGoal({
  id: 'goal_123',
  isCompleted: true,
  status: 'active', // ❌ Inconsistente
});
```

**Implementação Necessária:**
```typescript
// Máquina de estados para parcelas
const INSTALLMENT_STATE_MACHINE = {
  pending: ['paid', 'cancelled', 'overdue', 'paid_early'],
  paid: [], // Estado final
  cancelled: [], // Estado final
  overdue: ['paid', 'cancelled'],
  paid_early: [], // Estado final
};

function validateStateTransition(
  entity: string,
  currentState: string,
  newState: string
) {
  const allowedTransitions = STATE_MACHINES[entity][currentState];
  
  if (!allowedTransitions.includes(newState)) {
    throw new Error(
      `Transição inválida: ${entity} não pode ir de ${currentState} para ${newState}`
    );
  }
}

// Validações específicas
function validateInstallmentOperation(installment: Installment, operation: string) {
  if (operation === 'pay' && installment.status === 'paid') {
    throw new Error('Parcela já está paga');
  }
  
  if (operation === 'cancel' && installment.status === 'paid') {
    throw new Error('Não é possível cancelar parcela já paga');
  }
  
  if (operation === 'edit' && installment.status === 'paid') {
    throw new Error('Não é possível editar parcela já paga');
  }
}
```

---


### 4. VALIDAÇÃO DE RELACIONAMENTOS (CRÍTICO)

**Problema:** Sistema permite relacionamentos órfãos ou inconsistentes

**Cenários Problemáticos:**
```typescript
// ❌ Permitido mas ERRADO:
// 1. Transação sem conta e sem cartão
createTransaction({
  accountId: null,
  creditCardId: null, // ❌ Deve ter um dos dois
});

// 2. Parcela sem transação pai
createInstallment({
  transactionId: 'trans_inexistente', // ❌ Transação não existe
});

// 3. Fatura sem cartão
createInvoice({
  creditCardId: 'card_inexistente', // ❌ Cartão não existe
});

// 4. Transação de viagem sem viagem
createTransaction({
  tripId: 'trip_inexistente', // ❌ Viagem não existe
  tripExpenseType: 'trip',
});

// 5. Journal entry sem transação
createJournalEntry({
  transactionId: 'trans_deletada', // ❌ Transação foi deletada
});
```

**Implementação Necessária:**
```typescript
async function validateRelationships(entity: any, type: string) {
  switch (type) {
    case 'transaction':
      // Deve ter conta OU cartão
      if (!entity.accountId && !entity.creditCardId) {
        throw new Error('Transação deve ter accountId ou creditCardId');
      }
      
      // Se tem conta, validar que existe
      if (entity.accountId) {
        const account = await prisma.account.findUnique({
          where: { id: entity.accountId },
        });
        if (!account) {
          throw new Error('Conta não encontrada');
        }
      }
      
      // Se tem cartão, validar que existe
      if (entity.creditCardId) {
        const card = await prisma.creditCard.findUnique({
          where: { id: entity.creditCardId },
        });
        if (!card) {
          throw new Error('Cartão não encontrado');
        }
      }
      
      // Se tem viagem, validar que existe
      if (entity.tripId) {
        const trip = await prisma.trip.findUnique({
          where: { id: entity.tripId },
        });
        if (!trip) {
          throw new Error('Viagem não encontrada');
        }
      }
      break;
      
    case 'installment':
      // Deve ter transação pai
      const transaction = await prisma.transaction.findUnique({
        where: { id: entity.transactionId },
      });
      if (!transaction) {
        throw new Error('Transação pai não encontrada');
      }
      break;
      
    case 'journalEntry':
      // Deve ter transação
      const trans = await prisma.transaction.findUnique({
        where: { id: entity.transactionId },
      });
      if (!trans || trans.deletedAt) {
        throw new Error('Transação não encontrada ou deletada');
      }
      break;
  }
}
```

---

### 5. VALIDAÇÃO DE SOMAS E TOTAIS (CRÍTICO)

**Problema:** Sistema permite totais inconsistentes

**Cenários Problemáticos:**
```typescript
// ❌ Permitido mas ERRADO:
// 1. Fatura com total diferente da soma das transações
invoice.totalAmount = 1000;
// Mas soma das transações = 1500 ❌

// 2. Parcelas com soma diferente do total
installmentGroup.totalAmount = 1200;
// Mas soma das parcelas = 1000 ❌

// 3. Despesa compartilhada com divisão errada
sharedExpense.totalAmount = 100;
sharedExpense.splits = { user1: 30, user2: 30 }; // ❌ Soma = 60, faltam 40

// 4. Orçamento com gasto maior que transações
budget.spent = 500;
// Mas soma das transações = 300 ❌

// 5. Meta com valor atual diferente das transações
goal.currentAmount = 1000;
// Mas soma das transações = 800 ❌
```

**Implementação Necessária:**
```typescript
async function validateTotals(entity: any, type: string) {
  switch (type) {
    case 'invoice':
      const invoiceTransactions = await prisma.transaction.findMany({
        where: { invoiceId: entity.id, deletedAt: null },
      });
      const calculatedTotal = invoiceTransactions.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0
      );
      
      if (Math.abs(calculatedTotal - Number(entity.totalAmount)) > 0.01) {
        throw new Error(
          `Total da fatura inconsistente. ` +
          `Armazenado: R$ ${entity.totalAmount}, ` +
          `Calculado: R$ ${calculatedTotal}`
        );
      }
      break;
      
    case 'installmentGroup':
      const installments = await prisma.installment.findMany({
        where: { transactionId: entity.id },
      });
      const calculatedSum = installments.reduce(
        (sum, i) => sum + Number(i.amount),
        0
      );
      
      if (Math.abs(calculatedSum - Math.abs(Number(entity.amount))) > 0.01) {
        throw new Error(
          `Total do parcelamento inconsistente. ` +
          `Total: R$ ${entity.amount}, ` +
          `Soma das parcelas: R$ ${calculatedSum}`
        );
      }
      break;
      
    case 'sharedExpense':
      const totalSplit = Object.values(entity.splits).reduce(
        (sum: number, val: any) => sum + Number(val),
        0
      );
      
      if (Math.abs(totalSplit - Number(entity.totalAmount)) > 0.01) {
        throw new Error(
          `Divisão inconsistente. ` +
          `Total: R$ ${entity.totalAmount}, ` +
          `Soma das divisões: R$ ${totalSplit}`
        );
      }
      break;
  }
}
```

---

### 6. VALIDAÇÃO DE MOEDAS (IMPORTANTE)

**Problema:** Sistema permite misturar moedas sem conversão

**Cenários Problemáticos:**
```typescript
// ❌ Permitido mas ERRADO:
// 1. Transferência entre contas de moedas diferentes
transfer({
  fromAccount: { currency: 'BRL' },
  toAccount: { currency: 'USD' }, // ❌ Sem conversão
  amount: 100,
});

// 2. Transação em moeda diferente da conta
createTransaction({
  accountId: 'acc_brl', // Conta em BRL
  amount: -100,
  currency: 'USD', // ❌ Transação em USD
});

// 3. Viagem com transações em moedas diferentes sem câmbio
trip.currency = 'EUR';
createTransaction({
  tripId: trip.id,
  currency: 'BRL', // ❌ Sem conversão
});
```

**Implementação Necessária:**
```typescript
async function validateCurrency(entity: any, type: string) {
  switch (type) {
    case 'transaction':
      if (entity.accountId) {
        const account = await prisma.account.findUnique({
          where: { id: entity.accountId },
        });
        
        if (account && entity.currency !== account.currency) {
          if (!entity.exchangeRate) {
            throw new Error(
              `Transação em ${entity.currency} mas conta em ${account.currency}. ` +
              `Taxa de câmbio obrigatória.`
            );
          }
        }
      }
      break;
      
    case 'transfer':
      const fromAccount = await prisma.account.findUnique({
        where: { id: entity.fromAccountId },
      });
      const toAccount = await prisma.account.findUnique({
        where: { id: entity.toAccountId },
      });
      
      if (fromAccount.currency !== toAccount.currency) {
        if (!entity.exchangeRate) {
          throw new Error(
            `Transferência entre moedas diferentes (${fromAccount.currency} → ${toAccount.currency}). ` +
            `Taxa de câmbio obrigatória.`
          );
        }
      }
      break;
  }
}
```

---

### 7. VALIDAÇÃO DE PERÍODOS (IMPORTANTE)

**Problema:** Sistema permite períodos inconsistentes

**Cenários Problemáticos:**
```typescript
// ❌ Permitido mas ERRADO:
// 1. Orçamento com data fim antes do início
createBudget({
  startDate: new Date('2025-12-01'),
  endDate: new Date('2025-01-01'), // ❌ Fim antes do início
});

// 2. Viagem com data fim antes do início
createTrip({
  startDate: new Date('2025-12-01'),
  endDate: new Date('2025-11-01'), // ❌ Fim antes do início
});

// 3. Meta com prazo no passado
createGoal({
  deadline: new Date('2020-01-01'), // ❌ Prazo já passou
});

// 4. Transação recorrente com fim antes do início
createRecurring({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2024-12-01'), // ❌ Fim antes do início
});
```

**Implementação Necessária:**
```typescript
function validatePeriod(startDate: Date, endDate: Date, entityName: string) {
  if (endDate < startDate) {
    throw new Error(
      `${entityName}: Data de término não pode ser anterior à data de início`
    );
  }
  
  const diffDays = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Validar período mínimo (ex: 1 dia)
  if (diffDays < 1) {
    throw new Error(`${entityName}: Período mínimo é de 1 dia`);
  }
  
  // Validar período máximo (ex: 10 anos)
  if (diffDays > 3650) {
    throw new Error(`${entityName}: Período máximo é de 10 anos`);
  }
}
```

---

### 8. VALIDAÇÃO DE CONCORRÊNCIA (IMPORTANTE)

**Problema:** Sistema permite edições concorrentes sem controle

**Cenários Problemáticos:**
```typescript
// ❌ Permitido mas ERRADO:
// Usuário A e B editam a mesma transação simultaneamente
// Usuário A: amount = 100
// Usuário B: amount = 200
// Resultado: Última edição sobrescreve (perda de dados)

// Usuário A e B pagam a mesma parcela simultaneamente
// Resultado: Parcela paga 2x (duplicação)
```

**Implementação Necessária:**
```typescript
// Adicionar campo de versão no schema
model Transaction {
  // ... outros campos
  version Int @default(1)
}

// Validar versão ao atualizar
async function updateWithOptimisticLocking(
  id: string,
  data: any,
  expectedVersion: number
) {
  const result = await prisma.transaction.updateMany({
    where: {
      id,
      version: expectedVersion, // ✅ Só atualiza se versão for a esperada
    },
    data: {
      ...data,
      version: { increment: 1 }, // ✅ Incrementa versão
    },
  });
  
  if (result.count === 0) {
    throw new Error(
      'Conflito de concorrência detectado. ' +
      'O registro foi modificado por outro usuário. ' +
      'Por favor, recarregue e tente novamente.'
    );
  }
}
```

---

### 9. VALIDAÇÃO DE LIMITES (IMPORTANTE)

**Problema:** Sistema não valida limites operacionais

**Cenários Problemáticos:**
```typescript
// ❌ Permitido mas ERRADO:
// 1. Criar 1000 parcelas
createInstallments({
  totalInstallments: 1000, // ❌ Muito alto
});

// 2. Criar transação com 100 participantes
createSharedExpense({
  sharedWith: [...100 pessoas], // ❌ Muito alto
});

// 3. Criar orçamento com período de 50 anos
createBudget({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2075-01-01'), // ❌ Muito longo
});
```

**Implementação Necessária:**
```typescript
const OPERATIONAL_LIMITS = {
  maxInstallments: 48, // Máximo 48 parcelas
  maxSharedParticipants: 20, // Máximo 20 pessoas
  maxBudgetMonths: 120, // Máximo 10 anos
  maxTransactionsPerDay: 1000, // Máximo 1000 transações/dia
  maxDescriptionLength: 500, // Máximo 500 caracteres
};

function validateOperationalLimits(entity: any, type: string) {
  switch (type) {
    case 'installment':
      if (entity.totalInstallments > OPERATIONAL_LIMITS.maxInstallments) {
        throw new Error(
          `Máximo de ${OPERATIONAL_LIMITS.maxInstallments} parcelas permitido`
        );
      }
      break;
      
    case 'sharedExpense':
      if (entity.sharedWith.length > OPERATIONAL_LIMITS.maxSharedParticipants) {
        throw new Error(
          `Máximo de ${OPERATIONAL_LIMITS.maxSharedParticipants} participantes permitido`
        );
      }
      break;
  }
}
```

---

### 10. AUDITORIA E RASTREABILIDADE (IMPORTANTE)

**Problema:** Sistema não registra todas as mudanças importantes

**O que falta:**
```typescript
// ❌ Não registrado:
// 1. Quem editou a transação
// 2. Quando foi editada
// 3. Valores anteriores
// 4. Motivo da edição
// 5. IP do usuário
// 6. Dispositivo usado
```

**Implementação Necessária:**
```typescript
async function createAuditLog(
  entity: string,
  entityId: string,
  action: string,
  oldValues: any,
  newValues: any,
  userId: string,
  metadata?: any
) {
  await prisma.auditEvent.create({
    data: {
      userId,
      tableName: entity,
      recordId: entityId,
      operation: action,
      oldValues: JSON.stringify(oldValues),
      newValues: JSON.stringify(newValues),
      ipAddress: metadata?.ip,
      userAgent: metadata?.userAgent,
      metadata: JSON.stringify(metadata),
      timestamp: new Date(),
    },
  });
}

// Usar em todas as operações críticas
async function updateTransaction(id: string, data: any, userId: string) {
  const old = await prisma.transaction.findUnique({ where: { id } });
  
  const updated = await prisma.transaction.update({
    where: { id },
    data,
  });
  
  // ✅ Registrar auditoria
  await createAuditLog(
    'transaction',
    id,
    'UPDATE',
    old,
    updated,
    userId
  );
  
  return updated;
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Prioridade CRÍTICA (Implementar Primeiro)
- [ ] Validação de datas
- [ ] Validação de valores
- [ ] Validação de estados
- [ ] Validação de relacionamentos
- [ ] Validação de somas e totais

### Prioridade IMPORTANTE (Implementar em Seguida)
- [ ] Validação de moedas
- [ ] Validação de períodos
- [ ] Validação de concorrência
- [ ] Validação de limites
- [ ] Auditoria completa

---

## 🎯 IMPACTO ESPERADO

### Antes
- ❌ Dados inconsistentes possíveis
- ❌ Totais podem não bater
- ❌ Estados inválidos permitidos
- ❌ Sem rastreabilidade completa

### Depois
- ✅ Dados sempre consistentes
- ✅ Totais sempre corretos
- ✅ Estados sempre válidos
- ✅ Rastreabilidade completa

---

## 💡 RECOMENDAÇÕES

1. **Implementar validações em camadas:**
   - Validação no frontend (UX)
   - Validação na API (segurança)
   - Validação no serviço (lógica)
   - Validação no banco (integridade)

2. **Criar testes automatizados:**
   - Testar cada validação
   - Testar casos extremos
   - Testar concorrência

3. **Adicionar logs detalhados:**
   - Registrar todas as validações
   - Registrar todas as falhas
   - Facilitar debugging

4. **Criar dashboard de integridade:**
   - Mostrar inconsistências encontradas
   - Permitir correção manual
   - Gerar relatórios

---

**Documento criado por:** Kiro AI  
**Data:** 28/10/2025  
**Versão:** 1.0
