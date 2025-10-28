# 📋 ESPECIFICAÇÃO COMPLETA - DESPESAS COMPARTILHADAS

**Data:** 27/10/2025  
**Versão:** 2.0

---

## 🎯 VISÃO GERAL

O sistema possui **DOIS recursos independentes** que podem trabalhar juntos:

1. **Despesa Compartilhada** - Divide valor entre participantes
2. **Pago por Outra Pessoa** - Indica quem fez o pagamento

**REGRA IMPORTANTE:** Quando "Pago por outra pessoa" está ativo, a divisão compartilhada ainda acontece internamente, mas o botão fica desabilitado na UI.

---

## ✅ CASO 1: DESPESA COMPARTILHADA (EU PAGUEI)

### Cenário
```
Valor: R$ 100,00
Pago por: EU
Participantes: Eu + Wesley
Divisão: 50/50
```

### Dados da Transação
```json
{
  "amount": 100,
  "type": "DESPESA",
  "accountId": "minha_conta",
  "isShared": true,
  "sharedWith": ["wesley_id"],
  "paidBy": null,
  "myShare": 50,
  "totalSharedAmount": 100,
  "participants": [
    { "id": "eu", "share": 50 },
    { "id": "wesley_id", "share": 50 }
  ]
}
```

### Resultado Imediato
- ✅ Transação aparece na minha lista: **-R$ 100,00**
- ✅ Meu saldo diminui: **-R$ 100,00**
- ✅ Minha parte da despesa: **R$ 50,00**
- ✅ Wesley me deve: **R$ 50,00**

### Fatura de Wesley
```
┌─────────────────────────────────────┐
│ FATURA DE WESLEY                    │
├─────────────────────────────────────┤
│ 🟢 Wesley te deve: R$ 50,00         │
│                                     │
│ • Almoço no restaurante             │
│   R$ 50,00 (parte dele)             │
│   27/10/2024 • Pendente             │
│                                     │
│ [Marcar como Recebido]              │
└─────────────────────────────────────┘
```

---

## 💳 CASO 2: PAGO POR OUTRA PESSOA (COM DIVISÃO AUTOMÁTICA)

### Cenário
```
Valor: R$ 10,00
Pago por: WESLEY
Participantes: Eu + Wesley
Divisão: 50/50 (automática)
```

### Dados da Transação
```json
{
  "amount": 10,
  "type": "DESPESA",
  "accountId": null,
  "isShared": false,
  "sharedWith": ["wesley_id"],
  "paidBy": "wesley_id",
  "myShare": 5,
  "totalSharedAmount": 10,
  "participants": [
    { "id": "eu", "share": 5, "owes": true },
    { "id": "wesley_id", "share": 5, "paid": true }
  ],
  "status": "pending"
}
```

### Resultado Imediato
- ❌ Transação **NÃO** aparece na minha lista
- ❌ Meu saldo **NÃO** muda
- ✅ Dívida registrada: **Eu devo R$ 5,00 para Wesley**
- ✅ Wesley pagou R$ 10,00 (parte dele R$ 5,00 + minha parte R$ 5,00)

### Minha Visão (Lista de Dívidas)
```
┌─────────────────────────────────────┐
│ DÍVIDAS PENDENTES                   │
├─────────────────────────────────────┤
│ 🔴 Você deve a Wesley: R$ 5,00      │
│                                     │
│ • Almoço no restaurante             │
│   R$ 5,00 (sua parte)               │
│   27/10/2024 • Pendente             │
│                                     │
│ 💡 Wesley pagou R$ 10,00 total      │
│    Sua parte: R$ 5,00               │
│                                     │
│ [Pagar Dívida]                      │
└─────────────────────────────────────┘
```

### Fatura de Wesley
```
┌─────────────────────────────────────┐
│ FATURA DE [MEU NOME]                │
├─────────────────────────────────────┤
│ 🟢 [Meu Nome] te deve: R$ 5,00      │
│                                     │
│ • Almoço no restaurante             │
│   R$ 5,00 (parte dele)              │
│   27/10/2024 • Pendente             │
│                                     │
│ 💡 Você pagou R$ 10,00 total        │
│    Parte dele: R$ 5,00              │
│                                     │
│ [Marcar como Recebido]              │
└─────────────────────────────────────┘
```

### Quando EU Pagar a Dívida
```
1. Clico em "Pagar Dívida"
2. Seleciono conta: "Nubank"
3. Confirmo pagamento

Resultado:
- ✅ Transação criada: -R$ 5,00
- ✅ Meu saldo diminui: -R$ 5,00
- ✅ Dívida quitada
- ✅ Wesley recebe notificação
```

---

## 💰 CASO 3: PAGO POR OUTRA PESSOA + 3 PARTICIPANTES

### Cenário
```
Valor: R$ 30,00
Pago por: MARIA
Participantes: Eu + Wesley + Maria
Divisão: 33.33% cada (R$ 10,00)
```

### Dados da Transação
```json
{
  "amount": 30,
  "type": "DESPESA",
  "accountId": null,
  "isShared": false,
  "sharedWith": ["wesley_id", "maria_id"],
  "paidBy": "maria_id",
  "myShare": 10,
  "totalSharedAmount": 30,
  "participants": [
    { "id": "eu", "share": 10, "owes": true },
    { "id": "wesley_id", "share": 10, "owes": true },
    { "id": "maria_id", "share": 10, "paid": true }
  ],
  "status": "pending"
}
```

### Resultado
- ❌ Transação **NÃO** aparece na minha lista
- ❌ Meu saldo **NÃO** muda
- ✅ Eu devo R$ 10,00 para Maria
- ✅ Wesley deve R$ 10,00 para Maria
- ✅ Maria pagou R$ 30,00 (parte dela R$ 10,00 + R$ 20,00 dos outros)

### Fatura de Maria
```
┌─────────────────────────────────────┐
│ FATURA DE MARIA                     │
├─────────────────────────────────────┤
│ 🟢 Total a receber: R$ 20,00        │
│                                     │
│ • [Meu Nome]: R$ 10,00              │
│ • Wesley: R$ 10,00                  │
│                                     │
│ Jantar no restaurante               │
│ 27/10/2024 • Pendente               │
│                                     │
│ 💡 Você pagou R$ 30,00 total        │
│    Sua parte: R$ 10,00              │
│    A receber: R$ 20,00              │
└─────────────────────────────────────┘
```

---

## 🎨 INTERFACE DO FORMULÁRIO

### Estado Inicial
```
┌─────────────────────────────────────┐
│ Nova Transação                      │
├─────────────────────────────────────┤
│ Valor: [R$ 100,00]                  │
│ Descrição: [Almoço]                 │
│ Categoria: [Alimentação ▼]          │
│ Pago com: [Nubank ▼]                │
│                                     │
│ ☐ Despesa Compartilhada             │
│ ☐ Pago por outra pessoa             │
└─────────────────────────────────────┘
```

### Quando Marca "Despesa Compartilhada"
```
┌─────────────────────────────────────┐
│ Nova Transação                      │
├─────────────────────────────────────┤
│ Valor: [R$ 100,00]                  │
│ Descrição: [Almoço]                 │
│ Categoria: [Alimentação ▼]          │
│ Pago com: [Nubank ▼]                │
│                                     │
│ ☑ Despesa Compartilhada             │
│ ☐ Pago por outra pessoa             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Participantes:                  │ │
│ │ [Wesley] [Maria] [+ Adicionar]  │ │
│ │                                 │ │
│ │ Divisão: ⦿ Igual  ○ Personalizada│ │
│ │                                 │ │
│ │ Você: R$ 50,00                  │ │
│ │ Wesley: R$ 50,00                │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Quando Marca "Pago por outra pessoa"
```
┌─────────────────────────────────────┐
│ Nova Transação                      │
├─────────────────────────────────────┤
│ Valor: [R$ 10,00]                   │
│ Descrição: [Almoço]                 │
│ Categoria: [Alimentação ▼]          │
│ Pago com: [Não aplicável]           │
│ ℹ️ Como outra pessoa pagou, não é  │
│    necessário selecionar conta.    │
│                                     │
│ ☐ Despesa Compartilhada (desabilitado)│
│ ☑ Pago por outra pessoa             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Quem pagou: [Wesley ▼]          │ │
│ │                                 │ │
│ │ ⚙️ Divisão automática:          │ │
│ │ Você: R$ 5,00 (sua parte)       │ │
│ │ Wesley: R$ 5,00 (parte dele)    │ │
│ │                                 │ │
│ │ 💡 Você passará a dever R$ 5,00 │ │
│ │    para Wesley                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### 1. Estrutura de Dados

```typescript
interface Transaction {
  id: string;
  userId: string;
  accountId: string | null; // null se paidBy != null
  amount: number;
  type: 'RECEITA' | 'DESPESA';
  description: string;
  date: Date;
  categoryId: string;
  
  // Compartilhamento
  isShared: boolean;
  sharedWith: string[] | null; // IDs dos participantes
  myShare: number | null;
  totalSharedAmount: number | null;
  
  // Pago por outra pessoa
  paidBy: string | null; // ID de quem pagou
  
  // Status
  status: 'pending' | 'completed';
  
  // Metadados
  participants: Participant[];
}

interface Participant {
  id: string;
  name: string;
  share: number;
  owes?: boolean; // Deve pagar
  paid?: boolean; // Já pagou
}

interface Debt {
  id: string;
  debtorId: string; // Quem deve
  creditorId: string; // Para quem deve
  amount: number;
  description: string;
  transactionId: string;
  status: 'pending' | 'paid';
  createdAt: Date;
  paidAt: Date | null;
}
```

### 2. Lógica de Criação

```typescript
async function createSharedTransaction(data: TransactionInput) {
  const { amount, paidBy, participants } = data;
  
  // Calcular divisão
  const totalParticipants = participants.length;
  const sharePerPerson = amount / totalParticipants;
  
  // CASO 1: EU PAGUEI
  if (!paidBy) {
    // Criar transação normal
    const transaction = await prisma.transaction.create({
      data: {
        userId: currentUserId,
        accountId: data.accountId,
        amount: amount,
        type: 'DESPESA',
        isShared: true,
        sharedWith: JSON.stringify(participants.map(p => p.id)),
        myShare: sharePerPerson,
        totalSharedAmount: amount,
        status: 'completed',
      }
    });
    
    // Criar dívidas para cada participante
    for (const participant of participants) {
      if (participant.id !== currentUserId) {
        await prisma.debt.create({
          data: {
            debtorId: participant.id,
            creditorId: currentUserId,
            amount: sharePerPerson,
            description: data.description,
            transactionId: transaction.id,
            status: 'pending',
          }
        });
      }
    }
    
    return transaction;
  }
  
  // CASO 2: OUTRO PAGOU
  else {
    // NÃO criar transação ainda
    // Apenas registrar dívida
    const myShare = sharePerPerson;
    
    await prisma.debt.create({
      data: {
        debtorId: currentUserId,
        creditorId: paidBy,
        amount: myShare,
        description: data.description,
        transactionId: null, // Será preenchido quando pagar
        status: 'pending',
        metadata: JSON.stringify({
          totalAmount: amount,
          participants: participants,
          sharePerPerson: sharePerPerson,
        })
      }
    });
    
    // Criar dívidas para outros participantes também
    for (const participant of participants) {
      if (participant.id !== currentUserId && participant.id !== paidBy) {
        await prisma.debt.create({
          data: {
            debtorId: participant.id,
            creditorId: paidBy,
            amount: sharePerPerson,
            description: data.description,
            status: 'pending',
          }
        });
      }
    }
    
    return { success: true, debtCreated: true };
  }
}
```

### 3. Lógica de Pagamento de Dívida

```typescript
async function payDebt(debtId: string, accountId: string) {
  const debt = await prisma.debt.findUnique({
    where: { id: debtId },
    include: { creditor: true }
  });
  
  if (!debt) throw new Error('Dívida não encontrada');
  
  // Criar transação de pagamento
  const transaction = await prisma.transaction.create({
    data: {
      userId: debt.debtorId,
      accountId: accountId,
      amount: debt.amount,
      type: 'DESPESA',
      description: `Pagamento - ${debt.description}`,
      categoryId: 'pagamento_divida',
      status: 'completed',
      metadata: JSON.stringify({
        debtId: debt.id,
        creditorId: debt.creditorId,
        creditorName: debt.creditor.name,
      })
    }
  });
  
  // Atualizar dívida
  await prisma.debt.update({
    where: { id: debtId },
    data: {
      status: 'paid',
      paidAt: new Date(),
      transactionId: transaction.id,
    }
  });
  
  // Notificar credor
  await createNotification({
    userId: debt.creditorId,
    type: 'debt_paid',
    message: `${debt.debtor.name} pagou R$ ${debt.amount.toFixed(2)}`,
  });
  
  return transaction;
}
```

### 4. Lógica de Fatura

```typescript
function generateBilling(userId: string) {
  const debts = await prisma.debt.findMany({
    where: {
      OR: [
        { debtorId: userId, status: 'pending' }, // Eu devo
        { creditorId: userId, status: 'pending' }, // Me devem
      ]
    },
    include: {
      debtor: true,
      creditor: true,
    }
  });
  
  const billingByPerson: Record<string, BillingItem[]> = {};
  
  for (const debt of debts) {
    // Eu devo
    if (debt.debtorId === userId) {
      const key = debt.creditor.email;
      if (!billingByPerson[key]) billingByPerson[key] = [];
      
      billingByPerson[key].push({
        type: 'DEBIT',
        amount: debt.amount,
        description: debt.description,
        creditorName: debt.creditor.name,
      });
    }
    
    // Me devem
    if (debt.creditorId === userId) {
      const key = debt.debtor.email;
      if (!billingByPerson[key]) billingByPerson[key] = [];
      
      billingByPerson[key].push({
        type: 'CREDIT',
        amount: debt.amount,
        description: debt.description,
        debtorName: debt.debtor.name,
      });
    }
  }
  
  return billingByPerson;
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- [ ] Criar tabela `Debt` no Prisma
- [ ] Criar API `/api/debts` (GET, POST, PUT, DELETE)
- [ ] Implementar `createSharedTransaction()`
- [ ] Implementar `payDebt()`
- [ ] Implementar `generateBilling()`
- [ ] Adicionar validações de negócio

### Frontend
- [ ] Atualizar formulário de transação
- [ ] Desabilitar "Despesa Compartilhada" quando "Pago por outra pessoa" ativo
- [ ] Mostrar divisão automática quando "Pago por outra pessoa"
- [ ] Criar página `/debts` para gerenciar dívidas
- [ ] Atualizar componente de fatura
- [ ] Implementar modal de pagamento de dívida
- [ ] Adicionar notificações

### Testes
- [ ] Testar: Despesa compartilhada (eu paguei)
- [ ] Testar: Pago por outra pessoa (2 participantes)
- [ ] Testar: Pago por outra pessoa (3+ participantes)
- [ ] Testar: Pagamento de dívida
- [ ] Testar: Geração de fatura
- [ ] Testar: Notificações

---

**Status:** 📋 ESPECIFICAÇÃO COMPLETA

**Prioridade:** 🔴 CRÍTICA

**Última atualização:** 27/10/2025
