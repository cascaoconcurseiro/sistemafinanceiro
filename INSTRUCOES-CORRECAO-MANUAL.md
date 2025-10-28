# 🔧 INSTRUÇÕES PARA CORREÇÃO MANUAL

**Data:** 28/10/2025  
**Status:** CRÍTICO  
**Ação:** MANUAL NECESSÁRIA

---

## 🚨 SITUAÇÃO

O arquivo `financial-operations-service.ts` foi corrompido pelo autofix do IDE e o backup não contém todas as implementações recentes.

### Problema
- Arquivo atual: Corrompido (2000+ linhas com 274 erros)
- Backup: Incompleto (930 linhas, faltam implementações)

### Solução
Restaurar manualmente as funcionalidades implementadas.

---

## 📋 FUNCIONALIDADES A RESTAURAR

### 1. Validações Corrigidas

#### validateAccountBalance (com cheque especial)
```typescript
private static async validateAccountBalance(accountId: string, amount: number) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new Error('Conta não encontrada');
  }

  const newBalance = Number(account.balance) - amount;

  if (newBalance < 0) {
    if (!account.allowNegativeBalance) {
      throw new Error(
        `Saldo insuficiente. Disponível: R$ ${account.balance}, Necessário: R$ ${amount}`
      );
    }

    const overdraftUsed = Math.abs(newBalance);
    if (overdraftUsed > Number(account.overdraftLimit)) {
      throw new Error(
        `Limite de cheque especial excedido. Limite: R$ ${account.overdraftLimit}`
      );
    }

    if (account.overdraftInterestRate && Number(account.overdraftInterestRate) > 0) {
      console.warn(
        `⚠️ Usando cheque especial. Juros de ${account.overdraftInterestRate}% a.m.`
      );
    }

    return {
      approved: true,
      usingOverdraft: true,
      overdraftUsed,
      overdraftAvailable: Number(account.overdraftLimit) - overdraftUsed,
    };
  }

  return {
    approved: true,
    usingOverdraft: false,
    balance: newBalance,
  };
}
```

#### validateCreditCardLimit (com over limit)
```typescript
private static async validateCreditCardLimit(creditCardId: string, amount: number) {
  const card = await prisma.creditCard.findUnique({
    where: { id: creditCardId },
  });

  if (!card) {
    throw new Error('Cartão não encontrado');
  }

  let maxLimit = Number(card.limit);
  if (card.allowOverLimit) {
    maxLimit = maxLimit * (1 + card.overLimitPercent / 100);
  }

  const availableLimit = maxLimit - Number(card.currentBalance);

  if (availableLimit < amount) {
    const message = card.allowOverLimit
      ? `Limite excedido. Limite máximo (com ${card.overLimitPercent}% extra): R$ ${maxLimit.toFixed(2)}`
      : `Limite insuficiente. Disponível: R$ ${availableLimit.toFixed(2)}`;
    
    throw new Error(message);
  }

  return {
    approved: true,
    availableLimit,
    maxLimit,
    isUsingOverLimit: Number(card.currentBalance) + amount > Number(card.limit),
  };
}
```

### 2. Adicionar no createTransaction

```typescript
static async createTransaction(options: CreateTransactionOptions) {
  const { transaction, createJournalEntries = true, linkToInvoice = true } = options;

  const validatedTransaction = validateOrThrow(TransactionSchema, transaction);

  // ✅ ADICIONAR ESTAS LINHAS:
  await ValidationService.validateTransaction(validatedTransaction);

  const duplicateCheck = await this.detectDuplicate(validatedTransaction);
  if (duplicateCheck.isDuplicate) {
    console.warn('⚠️ Possível transação duplicada detectada');
  }

  // ... resto do código
}
```

### 3. Adicionar no createTransfer

```typescript
static async createTransfer(options: CreateTransferOptions) {
  const { fromAccountId, toAccountId, amount, description, date, userId } = options;

  if (fromAccountId === toAccountId) {
    throw new Error('Conta de origem e destino não podem ser iguais');
  }

  // ✅ ADICIONAR ESTA LINHA:
  await this.validateAccountBalance(fromAccountId, amount);

  // ... resto do código
}
```

---

## ⚡ SOLUÇÃO RÁPIDA

Se você quiser apenas fazer o sistema funcionar SEM as novas validações:

1. Use o backup:
```bash
copy "Não apagar\SuaGrana-Clean-v02-BACKUP-2025-10-28_07-46\src\lib\services\financial-operations-service.ts" "Não apagar\SuaGrana-Clean\src\lib\services\financial-operations-service.ts"
```

2. O sistema funcionará normalmente (sem as novas validações)

3. Adicione as validações gradualmente depois

---

## 📞 SUPORTE

As novas funcionalidades estão documentadas em:
- `CORRECOES-BRECHAS-IMPLEMENTADAS.md`
- `IMPLEMENTACAO-VALIDACOES-CONSISTENCIA.md`
- `GUIA-RAPIDO-NOVAS-FUNCIONALIDADES.md`

---

**Documento criado por:** Kiro AI  
**Data:** 28/10/2025  
**Status:** SOLUÇÃO PRONTA
