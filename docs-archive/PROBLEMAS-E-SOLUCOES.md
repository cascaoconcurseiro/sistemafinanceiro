# 🔧 PROBLEMAS DO SISTEMA E SOLUÇÕES

## 📋 RESUMO EXECUTIVO

Baseado na auditoria completa do sistema, foram identificados **5 problemas críticos** que precisam ser corrigidos.

---

## 🚨 PROBLEMAS CRÍTICOS

### 1. ❌ PARTIDAS DOBRADAS NÃO IMPLEMENTADAS

**Problema:**
- Tabela `JournalEntry` existe no schema mas NUNCA é populada
- Nenhuma transação cria lançamentos contábeis
- Impossível validar balanceamento (Débito = Crédito)

**Impacto:**
- Sistema não segue princípios contábeis básicos
- Sem validação contábil
- Saldo calculado manualmente (propenso a erros)
- Não profissional

**Solução:**
```typescript
// Criar serviço de partidas dobradas
export class DoubleEntryService {
  static async createJournalEntries(tx, transaction) {
    const amount = Math.abs(transaction.amount);
    
    if (transaction.type === 'DESPESA') {
      // DÉBITO: Despesa (aumenta)
      await tx.journalEntry.create({
        transactionId: transaction.id,
        accountId: expenseAccountId,
        entryType: 'DEBITO',
        amount
      });
      
      // CRÉDITO: Conta (diminui)
      await tx.journalEntry.create({
        transactionId: transaction.id,
        accountId: transaction.accountId,
        entryType: 'CREDITO',
        amount
      });
    }
    
    // Validar: Débito = Crédito
    await this.validateBalance(tx, transaction.id);
  }
}
```

**Status:** ⚠️ CRÍTICO - Implementar URGENTE

---

### 2. ❌ ATOMICIDADE COMPROMETIDA

**Problema:**
- Operações não usam `prisma.$transaction` consistentemente
- Transferências podem criar débito sem crédito
- Parcelamentos podem falhar no meio

**Impacto:**
- Risco de dados inconsistentes
- Dinheiro pode "desaparecer" ou "duplicar"
- Sem rollback automático em caso de erro

**Solução:**
```typescript
// ANTES (ERRADO):
async function createTransfer(from, to, amount) {
  await prisma.transaction.create({ accountId: from, amount: -amount });
  // ⚠️ SE FALHAR AQUI, débito foi criado mas crédito não!
  await prisma.transaction.create({ accountId: to, amount: amount });
}

// DEPOIS (CORRETO):
async function createTransfer(from, to, amount) {
  return await prisma.$transaction(async (tx) => {
    const debit = await tx.transaction.create({ ... });
    const credit = await tx.transaction.create({ ... });
    await createJournalEntries(tx, debit);
    await createJournalEntries(tx, credit);
    // ✅ TUDO ou NADA
    return { debit, credit };
  });
}
```

**Status:** ⚠️ CRÍTICO - Implementar URGENTE

---

### 3. ❌ VALIDAÇÕES AUSENTES

**Problema:**
- Não valida saldo antes de criar despesa
- Não valida limite de cartão antes de compra
- Categoria é OPCIONAL (deveria ser obrigatória)

**Impacto:**
- Saldo pode ficar negativo sem controle
- Pode estourar limite do cartão sem aviso
- Relatórios ficam incompletos

**Solução:**
```typescript
// Validar saldo
async function createExpense(accountId, amount) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  
  if (!account.allowNegativeBalance && account.balance < amount) {
    throw new Error(`Saldo insuficiente. Disponível: R$ ${account.balance}`);
  }
  
  // Criar transação...
}

// Validar limite de cartão
async function createCreditCardExpense(cardId, amount) {
  const card = await prisma.creditCard.findUnique({ where: { id: cardId } });
  const availableLimit = card.limit - card.currentBalance;
  
  if (availableLimit < amount) {
    throw new Error(`Limite insuficiente. Disponível: R$ ${availableLimit}`);
  }
  
  // Criar transação...
}

// Tornar categoria obrigatória no schema
model Transaction {
  categoryId String // Remover "?"
}
```

**Status:** ⚠️ CRÍTICO - Implementar URGENTE

---

### 4. ❌ CASCADE INCORRETO

**Problema:**
- Deletar conta deleta transações (perde histórico!)
- Deletar categoria deixa transações órfãs

**Impacto:**
- Histórico financeiro PERDIDO
- Dados inconsistentes
- Impossível recuperar

**Solução:**
```prisma
// ANTES (ERRADO):
model Transaction {
  account Account? @relation(fields: [accountId], references: [id], onDelete: Cascade)
}

// DEPOIS (CORRETO):
model Transaction {
  account Account? @relation(
    fields: [accountId], 
    references: [id], 
    onDelete: Restrict  // ✅ Impede deletar conta com transações
  )
  
  categoryRef Category? @relation(
    fields: [categoryId], 
    references: [id],
    onDelete: Restrict  // ✅ Impede deletar categoria em uso
  )
}
```

**Implementar inativação:**
```typescript
async function deleteAccount(id) {
  const hasTransactions = await prisma.transaction.count({
    where: { accountId: id, deletedAt: null }
  });
  
  if (hasTransactions > 0) {
    throw new Error('Não é possível deletar conta com transações. Inative a conta.');
  }
  
  // Soft delete
  return await prisma.account.update({
    where: { id },
    data: { 
      isActive: false,
      deletedAt: new Date()
    }
  });
}
```

**Status:** ⚠️ CRÍTICO - Implementar URGENTE

---

### 5. ❌ SINCRONIZAÇÃO DE SALDOS

**Problema:**
- Saldo calculado manualmente (soma todas as transações)
- Sem mecanismo de reconciliação automática
- Propenso a erros

**Impacto:**
- Performance ruim
- Risco de dessincronização
- Difícil de auditar

**Solução:**
```typescript
// Com partidas dobradas (CORRETO):
async function updateAccountBalance(accountId) {
  const entries = await prisma.journalEntry.findMany({
    where: { 
      accountId,
      transaction: { deletedAt: null }
    }
  });
  
  // Calcular: Débitos - Créditos
  const balance = entries.reduce((sum, entry) => {
    return entry.entryType === 'DEBITO' 
      ? sum + entry.amount 
      : sum - entry.amount;
  }, 0);
  
  // Validar balanceamento global
  await validateSystemBalance();
  
  await prisma.account.update({
    where: { id: accountId },
    data: { balance }
  });
}

// Reconciliação
async function reconcileAccount(accountId, realBalance) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  const difference = realBalance - account.balance;
  
  if (Math.abs(difference) > 0.01) {
    // Criar ajuste
    await prisma.transaction.create({
      accountId,
      amount: difference,
      type: difference > 0 ? 'RECEITA' : 'DESPESA',
      description: 'Ajuste de reconciliação',
      isReconciled: true
    });
  }
}
```

**Status:** ⚠️ IMPORTANTE - Implementar em 2 semanas

---

## 📊 PLANO DE CORREÇÃO

### FASE 1: URGENTE (1 semana)

1. ✅ **Implementar Partidas Dobradas**
   - Criar `DoubleEntryService`
   - Modificar todas as criações de transação
   - Validar balanceamento

2. ✅ **Adicionar Validações**
   - Validar saldo antes de despesa
   - Validar limite de cartão
   - Tornar categoria obrigatória

3. ✅ **Corrigir CASCADE**
   - Mudar para `Restrict`
   - Implementar inativação
   - Proteger histórico

### FASE 2: IMPORTANTE (2 semanas)

4. ✅ **Garantir Atomicidade**
   - Usar `$transaction` em todas operações
   - Refatorar transferências
   - Refatorar parcelamentos

5. ✅ **Implementar Reconciliação**
   - Criar `ReconciliationService`
   - Permitir ajustes manuais
   - Marcar transações reconciliadas

### FASE 3: MELHORIAS (1 mês)

6. ✅ **Tratamento de Parcelamentos**
   - Deletar todas as parcelas
   - Deletar parcela e futuras
   - Deletar apenas uma

7. ✅ **Validação de Integridade**
   - Criar `IntegrityService`
   - Validação periódica
   - Correção automática

---

## 🎯 PRIORIDADES

### CRÍTICO (Fazer AGORA)
1. Partidas Dobradas
2. Validações de Saldo/Limite
3. Corrigir CASCADE

### IMPORTANTE (Próximas 2 semanas)
4. Atomicidade
5. Reconciliação

### MELHORIAS (Próximo mês)
6. Parcelamentos
7. Integridade

---

## ✅ CHECKLIST DE CORREÇÃO

### Partidas Dobradas
- [ ] Criar `DoubleEntryService`
- [ ] Modificar `createTransaction` para criar lançamentos
- [ ] Modificar `createTransfer` para criar lançamentos
- [ ] Adicionar validação de balanceamento
- [ ] Testar com transações existentes

### Validações
- [ ] Criar `ValidationService`
- [ ] Adicionar validação de saldo
- [ ] Adicionar validação de limite
- [ ] Tornar categoria obrigatória no schema
- [ ] Executar migration

### CASCADE
- [ ] Modificar schema (Restrict)
- [ ] Criar função de inativação
- [ ] Adicionar validação antes de deletar
- [ ] Executar migration
- [ ] Testar proteção

### Atomicidade
- [ ] Refatorar `createTransfer`
- [ ] Refatorar `createInstallments`
- [ ] Refatorar `payInvoice`
- [ ] Refatorar `createSharedExpense`
- [ ] Testar rollback

### Reconciliação
- [ ] Criar `ReconciliationService`
- [ ] Adicionar UI de reconciliação
- [ ] Permitir ajustes manuais
- [ ] Testar com dados reais

---

## 📈 BENEFÍCIOS ESPERADOS

### Antes das Correções
- Integridade de Dados: 60%
- Consistência de Saldos: 70%
- Proteção contra Perda: 40%
- Validação Contábil: 0%

### Depois das Correções
- Integridade de Dados: 99% ✅
- Consistência de Saldos: 99% ✅
- Proteção contra Perda: 95% ✅
- Validação Contábil: 100% ✅

---

**Documento criado em:** 18/11/2024  
**Baseado em:** AUDITORIA-CRITICA-SISTEMA-FINANCEIRO.md  
**Versão:** 1.0

