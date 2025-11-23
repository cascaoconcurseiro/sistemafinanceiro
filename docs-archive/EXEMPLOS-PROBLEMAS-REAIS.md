# 🚨 EXEMPLOS DE PROBLEMAS REAIS QUE PODEM ACONTECER

**Sistema**: SuaGrana - Gestão Financeira Pessoal  
**Data**: 01/11/2025

---

## 📖 ÍNDICE

1. [Problema 1: Dinheiro Desaparece em Transferência](#problema-1)
2. [Problema 2: Saldo Negativo Sem Controle](#problema-2)
3. [Problema 3: Histórico Perdido ao Deletar Conta](#problema-3)
4. [Problema 4: Parcelamento Incompleto](#problema-4)
5. [Problema 5: Limite de Cartão Estourado](#problema-5)
6. [Problema 6: Despesa Compartilhada Errada](#problema-6)
7. [Problema 7: Saldo Desincronizado](#problema-7)

---

<a name="problema-1"></a>
## 🔴 PROBLEMA 1: Dinheiro Desaparece em Transferência

### Cenário

Usuário quer transferir R$ 500 da Conta Corrente para Poupança.

### O que acontece HOJE (SEM atomicidade):

```typescript
// Passo 1: Cria débito na Conta Corrente
await prisma.transaction.create({
  accountId: 'conta-corrente',
  amount: -500,
  description: 'Transferência para Poupança'
});
// ✅ Sucesso! Conta Corrente: R$ 1000 → R$ 500

// Passo 2: Tenta criar crédito na Poupança
await prisma.transaction.create({
  accountId: 'poupanca',
  amount: 500,
  description: 'Transferência da Conta Corrente'
});
// ❌ ERRO! Banco de dados caiu / Timeout / Erro de rede

// RESULTADO:
// Conta Corrente: R$ 500 (debitou)
// Poupança: R$ 200 (NÃO creditou)
// 💸 R$ 500 DESAPARECERAM!
```

### Impacto no Usuário

- ❌ Perdeu R$ 500 do saldo total
- ❌ Não sabe onde está o dinheiro
- ❌ Relatórios mostram valores errados
- ❌ Impossível confiar no sistema



### Como DEVERIA ser (COM atomicidade):

```typescript
await prisma.$transaction(async (tx) => {
  // Passo 1: Cria débito
  await tx.transaction.create({
    accountId: 'conta-corrente',
    amount: -500
  });
  
  // Passo 2: Cria crédito
  await tx.transaction.create({
    accountId: 'poupanca',
    amount: 500
  });
  
  // ✅ Se QUALQUER operação falhar, ROLLBACK automático
  // ✅ TUDO ou NADA
});

// RESULTADO:
// ✅ Sucesso: Ambas transações criadas
// OU
// ✅ Erro: Nenhuma transação criada (rollback)
// ✅ Dinheiro NUNCA desaparece!
```

---

<a name="problema-2"></a>
## 🔴 PROBLEMA 2: Saldo Negativo Sem Controle

### Cenário

Usuário tem R$ 100 na conta e tenta gastar R$ 500.

### O que acontece HOJE (SEM validação):

```typescript
// Saldo atual: R$ 100

// Usuário cria despesa de R$ 500
await prisma.transaction.create({
  accountId: 'conta-corrente',
  amount: -500,
  type: 'DESPESA',
  description: 'Compra no supermercado'
});

// ✅ Transação criada com sucesso!
// ❌ Saldo: R$ 100 - R$ 500 = -R$ 400

// PROBLEMA:
// - Conta não tem cheque especial
// - Usuário não autorizou saldo negativo
// - Sistema permitiu mesmo assim!
```

### Impacto no Usuário

- ❌ Saldo negativo sem autorização
- ❌ Não sabe que está "devendo"
- ❌ Relatórios mostram patrimônio negativo
- ❌ Pode criar múltiplas despesas e ficar -R$ 10.000

### Como DEVERIA ser (COM validação):

```typescript
async function createExpense(accountId, amount) {
  // 1. Buscar conta
  const account = await prisma.account.findUnique({ 
    where: { id: accountId } 
  });
  
  // 2. Validar saldo
  if (!account.allowNegativeBalance && account.balance < amount) {
    throw new Error(
      `❌ Saldo insuficiente!\n` +
      `Disponível: R$ ${account.balance}\n` +
      `Necessário: R$ ${amount}\n` +
      `Faltam: R$ ${amount - account.balance}`
    );
  }
  
  // 3. Se permite negativo, validar limite
  if (account.allowNegativeBalance) {
    const availableLimit = account.balance + account.overdraftLimit;
    if (availableLimit < amount) {
      throw new Error(
        `❌ Limite de cheque especial excedido!\n` +
        `Limite: R$ ${account.overdraftLimit}\n` +
        `Disponível: R$ ${availableLimit}`
      );
    }
  }
  
  // 4. Criar transação
  return await prisma.transaction.create({ ... });
}

// RESULTADO:
// ✅ Erro claro para o usuário
// ✅ Transação NÃO é criada
// ✅ Saldo permanece R$ 100
```

---

<a name="problema-3"></a>
## 🔴 PROBLEMA 3: Histórico Perdido ao Deletar Conta

### Cenário

Usuário tem conta "Nubank" com 500 transações dos últimos 2 anos.  
Decide fechar a conta e deletar do sistema.

### O que acontece HOJE (COM cascade):

```typescript
// Usuário clica em "Deletar Conta"
await prisma.account.delete({
  where: { id: 'nubank-account' }
});

// ✅ Conta deletada
// ❌ TODAS as 500 transações deletadas também! (onDelete: Cascade)

// RESULTADO:
// ❌ Histórico de 2 anos PERDIDO
// ❌ Relatórios quebrados
// ❌ Impossível recuperar
// ❌ Declaração de IR incompleta
```

### Impacto no Usuário

- ❌ Perde todo histórico financeiro
- ❌ Não consegue fazer declaração de IR
- ❌ Relatórios anuais ficam errados
- ❌ Impossível rastrear gastos antigos

### Como DEVERIA ser (COM proteção):

```typescript
async function deleteAccount(accountId) {
  // 1. Verificar se tem transações
  const transactionCount = await prisma.transaction.count({
    where: { accountId, deletedAt: null }
  });
  
  if (transactionCount > 0) {
    throw new Error(
      `❌ Não é possível deletar conta com transações!\n\n` +
      `Esta conta tem ${transactionCount} transações.\n` +
      `Para manter o histórico, use a opção "Inativar Conta".\n\n` +
      `Se realmente deseja deletar:\n` +
      `1. Reclassifique as transações para outra conta\n` +
      `2. Ou exporte os dados antes de deletar`
    );
  }
  
  // 2. Se não tem transações, pode deletar
  return await prisma.account.delete({ where: { id: accountId } });
}

// OU melhor ainda: Inativar em vez de deletar
async function inactivateAccount(accountId) {
  return await prisma.account.update({
    where: { id: accountId },
    data: { 
      isActive: false,
      deletedAt: new Date()
    }
  });
  
  // ✅ Conta não aparece mais na lista
  // ✅ Histórico preservado
  // ✅ Pode reativar se necessário
}
```



---

<a name="problema-4"></a>
## 🔴 PROBLEMA 4: Parcelamento Incompleto

### Cenário

Usuário compra TV de R$ 1.200 em 12x de R$ 100 no cartão.

### O que acontece HOJE (SEM atomicidade):

```typescript
// Criar 12 parcelas
for (let i = 1; i <= 12; i++) {
  await prisma.transaction.create({
    amount: -100,
    description: `TV Samsung - Parcela ${i}/12`,
    installmentNumber: i,
    totalInstallments: 12
  });
  
  // ❌ ERRO na parcela 7! (timeout, erro de rede, etc)
  if (i === 7) throw new Error('Timeout');
}

// RESULTADO:
// ✅ Parcelas 1-6 criadas
// ❌ Parcelas 7-12 NÃO criadas
// ❌ Sistema mostra 6 parcelas de 12
// ❌ Usuário acha que pagou R$ 600, mas deve R$ 1.200
```

### Impacto no Usuário

- ❌ Parcelamento incompleto
- ❌ Não sabe quantas parcelas faltam
- ❌ Fatura do cartão não bate
- ❌ Controle financeiro errado

### Como DEVERIA ser (COM atomicidade):

```typescript
await prisma.$transaction(async (tx) => {
  const installments = [];
  
  // Criar TODAS as 12 parcelas
  for (let i = 1; i <= 12; i++) {
    const installment = await tx.transaction.create({
      amount: -100,
      description: `TV Samsung - Parcela ${i}/12`,
      installmentNumber: i,
      totalInstallments: 12
    });
    
    installments.push(installment);
  }
  
  // ✅ Se QUALQUER parcela falhar, ROLLBACK de todas
  return installments;
});

// RESULTADO:
// ✅ Sucesso: Todas as 12 parcelas criadas
// OU
// ✅ Erro: Nenhuma parcela criada (rollback)
// ✅ Nunca fica pela metade!
```

---

<a name="problema-5"></a>
## 🔴 PROBLEMA 5: Limite de Cartão Estourado

### Cenário

Usuário tem cartão com limite de R$ 1.000 e já gastou R$ 800.  
Tenta comprar algo de R$ 500.

### O que acontece HOJE (SEM validação):

```typescript
// Limite: R$ 1.000
// Usado: R$ 800
// Disponível: R$ 200

// Usuário tenta comprar R$ 500
await prisma.transaction.create({
  creditCardId: 'cartao-nubank',
  amount: -500,
  type: 'DESPESA',
  description: 'Notebook'
});

// ✅ Transação criada!
// ❌ Limite estourado: R$ 800 + R$ 500 = R$ 1.300 (limite R$ 1.000)

// RESULTADO:
// ❌ Cartão com R$ 300 acima do limite
// ❌ Usuário não foi avisado
// ❌ Pode gerar juros reais no cartão
```

### Impacto no Usuário

- ❌ Estoura limite sem saber
- ❌ Pode gerar juros no cartão real
- ❌ Controle financeiro errado
- ❌ Surpresa na fatura

### Como DEVERIA ser (COM validação):

```typescript
async function createCreditCardExpense(cardId, amount) {
  // 1. Buscar cartão
  const card = await prisma.creditCard.findUnique({ 
    where: { id: cardId } 
  });
  
  // 2. Calcular disponível
  const availableLimit = card.limit - card.currentBalance;
  
  // 3. Validar limite normal
  if (!card.allowOverLimit && availableLimit < amount) {
    throw new Error(
      `❌ Limite insuficiente!\n\n` +
      `Limite total: R$ ${card.limit}\n` +
      `Já usado: R$ ${card.currentBalance}\n` +
      `Disponível: R$ ${availableLimit}\n` +
      `Necessário: R$ ${amount}\n` +
      `Faltam: R$ ${amount - availableLimit}`
    );
  }
  
  // 4. Se permite exceder, validar limite máximo
  if (card.allowOverLimit) {
    const maxOverLimit = card.limit * (1 + card.overLimitPercent / 100);
    const totalAvailable = maxOverLimit - card.currentBalance;
    
    if (totalAvailable < amount) {
      throw new Error(
        `❌ Limite máximo excedido!\n\n` +
        `Limite normal: R$ ${card.limit}\n` +
        `Limite estendido: R$ ${maxOverLimit}\n` +
        `Disponível: R$ ${totalAvailable}`
      );
    }
    
    // Avisar que está usando limite estendido
    console.warn(
      `⚠️ ATENÇÃO: Usando limite estendido!\n` +
      `Isso pode gerar juros adicionais.`
    );
  }
  
  // 5. Criar transação
  return await prisma.transaction.create({ ... });
}

// RESULTADO:
// ✅ Erro claro se não tem limite
// ✅ Aviso se está usando limite estendido
// ✅ Usuário sempre informado
```



---

<a name="problema-6"></a>
## 🔴 PROBLEMA 6: Despesa Compartilhada Errada

### Cenário

Você paga R$ 100 no almoço e divide 50/50 com um amigo.

### O que acontece HOJE (SEM partidas dobradas):

```typescript
// Criar despesa compartilhada
await prisma.transaction.create({
  accountId: 'conta-corrente',
  amount: -100,  // ❌ Valor TOTAL
  type: 'DESPESA',
  description: 'Almoço',
  isShared: true,
  myShare: 50,
  totalSharedAmount: 100
});

// PROBLEMA:
// ❌ Relatório mostra que você gastou R$ 100
// ❌ Mas na verdade gastou só R$ 50
// ❌ Não registra que tem R$ 50 a receber
// ❌ Patrimônio líquido errado
```

### Impacto no Usuário

- ❌ Relatório de gastos errado (mostra R$ 100 em vez de R$ 50)
- ❌ Não sabe quanto tem a receber
- ❌ Patrimônio líquido incorreto
- ❌ Decisões financeiras baseadas em dados errados

### Como DEVERIA ser (COM partidas dobradas):

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Criar transação
  const transaction = await tx.transaction.create({
    accountId: 'conta-corrente',
    amount: -100,
    type: 'DESPESA',
    description: 'Almoço',
    isShared: true,
    myShare: 50,
    totalSharedAmount: 100
  });
  
  // 2. Criar lançamentos contábeis
  
  // DÉBITO: Despesa - Alimentação (só sua parte)
  await tx.journalEntry.create({
    transactionId: transaction.id,
    accountId: 'alimentacao-account',
    entryType: 'DEBITO',
    amount: 50,  // ✅ Só sua parte!
    description: 'Almoço (sua parte)'
  });
  
  // DÉBITO: Valores a Receber (parte do amigo)
  await tx.journalEntry.create({
    transactionId: transaction.id,
    accountId: 'valores-a-receber-account',
    entryType: 'DEBITO',
    amount: 50,  // ✅ Parte do amigo!
    description: 'Almoço (a receber do amigo)'
  });
  
  // CRÉDITO: Conta Corrente (total pago)
  await tx.journalEntry.create({
    transactionId: transaction.id,
    accountId: 'conta-corrente',
    entryType: 'CREDITO',
    amount: 100,  // ✅ Total pago
    description: 'Almoço (pagamento)'
  });
  
  // 3. Criar dívida
  await tx.sharedDebt.create({
    creditorId: 'user-id',
    debtorId: 'amigo-id',
    originalAmount: 50,
    currentAmount: 50,
    description: 'Almoço',
    transactionId: transaction.id
  });
});

// RESULTADO:
// ✅ Relatório mostra R$ 50 de despesa (correto!)
// ✅ Mostra R$ 50 a receber
// ✅ Patrimônio líquido correto
// ✅ Validação: Débitos (50+50) = Créditos (100) ✅
```

---

<a name="problema-7"></a>
## 🔴 PROBLEMA 7: Saldo Desincronizado

### Cenário

Sistema calcula saldo manualmente somando transações.  
Uma transação é editada mas saldo não é recalculado.

### O que acontece HOJE (SEM partidas dobradas):

```typescript
// Saldo inicial: R$ 1.000

// 1. Criar despesa de R$ 100
await prisma.transaction.create({
  accountId: 'conta-corrente',
  amount: -100
});

// 2. Atualizar saldo manualmente
await updateAccountBalance('conta-corrente');
// Saldo: R$ 900 ✅

// 3. Usuário edita transação para R$ 200
await prisma.transaction.update({
  where: { id: 'tx-123' },
  data: { amount: -200 }
});

// 4. ❌ ESQUECEU de recalcular saldo!

// RESULTADO:
// ❌ Transação: -R$ 200
// ❌ Saldo: R$ 900 (deveria ser R$ 800)
// ❌ Diferença de R$ 100!
```

### Impacto no Usuário

- ❌ Saldo mostrado está errado
- ❌ Pode gastar mais do que tem
- ❌ Relatórios incorretos
- ❌ Difícil de detectar o erro

### Como DEVERIA ser (COM partidas dobradas):

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Buscar transação original
  const original = await tx.transaction.findUnique({ 
    where: { id: 'tx-123' } 
  });
  
  // 2. Deletar lançamentos antigos
  await tx.journalEntry.deleteMany({
    where: { transactionId: 'tx-123' }
  });
  
  // 3. Atualizar transação
  const updated = await tx.transaction.update({
    where: { id: 'tx-123' },
    data: { amount: -200 }
  });
  
  // 4. Criar novos lançamentos
  await createJournalEntries(tx, updated);
  
  // 5. Recalcular saldo AUTOMATICAMENTE
  const entries = await tx.journalEntry.findMany({
    where: { 
      accountId: 'conta-corrente',
      transaction: { deletedAt: null }
    }
  });
  
  const balance = entries.reduce((sum, entry) => {
    return entry.entryType === 'DEBITO' 
      ? sum + Number(entry.amount)
      : sum - Number(entry.amount);
  }, 0);
  
  await tx.account.update({
    where: { id: 'conta-corrente' },
    data: { balance }
  });
});

// RESULTADO:
// ✅ Transação: -R$ 200
// ✅ Lançamentos atualizados
// ✅ Saldo: R$ 800 (correto!)
// ✅ SEMPRE sincronizado!
```

---

## 📊 RESUMO DOS PROBLEMAS

| Problema | Causa | Impacto | Solução |
|----------|-------|---------|---------|
| Dinheiro Desaparece | Sem atomicidade | CRÍTICO | `prisma.$transaction` |
| Saldo Negativo | Sem validação | ALTO | Validar antes de criar |
| Histórico Perdido | Cascade errado | CRÍTICO | `onDelete: Restrict` |
| Parcelamento Incompleto | Sem atomicidade | ALTO | `prisma.$transaction` |
| Limite Estourado | Sem validação | MÉDIO | Validar limite |
| Despesa Compartilhada | Sem partidas dobradas | ALTO | Implementar JournalEntry |
| Saldo Desincronizado | Cálculo manual | MÉDIO | Usar JournalEntry |

---

## 🎯 CONCLUSÃO

Todos esses problemas são **REAIS** e podem acontecer no sistema atual.

A boa notícia é que **TODOS são corrigíveis** implementando:

1. ✅ **Partidas Dobradas** - Resolve 3 problemas
2. ✅ **Atomicidade** - Resolve 2 problemas
3. ✅ **Validações** - Resolve 2 problemas
4. ✅ **Cascade Correto** - Resolve 1 problema

**Prazo**: 6 semanas para sistema 100% confiável

---

**Desenvolvido com ❤️ para SuaGrana**

