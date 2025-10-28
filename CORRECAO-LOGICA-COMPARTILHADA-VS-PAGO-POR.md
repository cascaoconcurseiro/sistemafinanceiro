# 🔧 CORREÇÃO - LÓGICA COMPARTILHADA VS PAGO POR

**Data:** 27/10/2025  
**Problema:** Sistema confunde "Despesa Compartilhada" com "Pago por Outra Pessoa"

---

## 🎯 DOIS CENÁRIOS DIFERENTES

### Cenário 1: DESPESA COMPARTILHADA
**Situação:** EU paguei e divido com outros

```
Exemplo: Paguei R$ 100 no almoço, dividido com Wesley

Dados da Transação:
{
  amount: 100,
  type: 'DESPESA',
  accountId: 'minha_conta',
  isShared: true,
  sharedWith: ['wesley_id'],
  paidBy: null, // ❌ NÃO TEM - porque EU paguei
  myShare: 50,
  totalSharedAmount: 100
}

Resultado:
- ✅ Transação aparece na minha lista (-R$ 100)
- ✅ Meu saldo diminui R$ 100
- ✅ Wesley me deve R$ 50 (aparece na fatura dele)
```

### Cenário 2: PAGO POR OUTRA PESSOA
**Situação:** OUTRA pessoa pagou por mim

```
Exemplo: Wesley pagou R$ 100 no jantar por mim

Dados da Transação:
{
  amount: 100,
  type: 'DESPESA',
  accountId: null, // ❌ NÃO TEM - porque EU não paguei
  isShared: false, // ❌ NÃO É COMPARTILHADA
  sharedWith: null,
  paidBy: 'wesley_id', // ✅ TEM - Wesley pagou
  myShare: 100, // Eu devo tudo
  totalSharedAmount: 100
}

Resultado:
- ❌ Transação NÃO aparece na minha lista (ainda não paguei)
- ❌ Meu saldo NÃO muda (dinheiro não saiu da minha conta)
- ✅ Eu devo R$ 100 para Wesley (aparece na lista de dívidas)
- ✅ Quando eu pagar, AÍ SIM cria transação
```

---

## 🔍 DIFERENÇAS CHAVE

| Campo | Despesa Compartilhada | Pago por Outra Pessoa |
|-------|----------------------|----------------------|
| `accountId` | ✅ Tem (minha conta) | ❌ Null (não usei minha conta) |
| `isShared` | ✅ true | ❌ false |
| `sharedWith` | ✅ Array de pessoas | ❌ null |
| `paidBy` | ❌ null (eu paguei) | ✅ ID da pessoa |
| `myShare` | Minha parte (50%) | Valor total (100%) |
| Aparece na lista? | ✅ SIM | ❌ NÃO (até pagar) |
| Afeta saldo? | ✅ SIM | ❌ NÃO (até pagar) |

---

## ✅ LÓGICA CORRETA

### 1. Ao Criar Transação

```typescript
// DESPESA COMPARTILHADA (EU paguei)
if (isShared && !paidBy) {
  // Criar transação normal
  await createTransaction({
    accountId: myAccount,
    amount: totalAmount,
    isShared: true,
    sharedWith: participants,
    myShare: myPart,
  });
  
  // Resultado:
  // - Transação aparece na lista
  // - Saldo diminui
  // - Outros me devem
}

// PAGO POR OUTRA PESSOA (OUTRO pagou)
if (paidBy && !isShared) {
  // NÃO criar transação ainda
  // Apenas registrar dívida
  await createDebt({
    creditorId: paidBy,
    amount: totalAmount,
    description: description,
  });
  
  // Resultado:
  // - Transação NÃO aparece
  // - Saldo NÃO muda
  // - Eu devo para a pessoa
}
```

### 2. Na Fatura (Billing)

```typescript
// Processar transações
transactions.forEach(transaction => {
  // CASO 1: EU PAGUEI, OUTROS ME DEVEM
  if (transaction.isShared && !transaction.paidBy) {
    transaction.sharedWith.forEach(personId => {
      billingItems.push({
        type: 'CREDIT', // Pessoa me deve
        userEmail: person.email,
        amount: transaction.myShare,
        description: transaction.description,
      });
    });
  }
  
  // CASO 2: OUTRO PAGOU, EU DEVO
  if (transaction.paidBy && !transaction.isShared) {
    billingItems.push({
      type: 'DEBIT', // Eu devo
      userEmail: payer.email,
      amount: transaction.amount,
      description: transaction.description,
    });
  }
});
```

### 3. Ao Pagar Dívida

```typescript
// Quando eu pagar a dívida
async function payDebt(debtId: string, accountId: string) {
  const debt = await getDebt(debtId);
  
  // AGORA SIM criar transação
  await createTransaction({
    accountId: accountId, // Minha conta
    amount: debt.amount,
    type: 'DESPESA',
    description: `Pagamento - ${debt.description}`,
    notes: `Pago para ${debt.creditorName}`,
  });
  
  // Marcar dívida como paga
  await updateDebt(debtId, { status: 'paid' });
  
  // Resultado:
  // - Transação aparece na lista
  // - Saldo diminui
  // - Dívida quitada
}
```

---

## 🎨 INTERFACE

### Despesa Compartilhada (EU paguei)
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
│ 💡 Você pagou esta despesa e        │
│    dividiu com Wesley               │
│                                     │
│ [Marcar como Recebido]              │
└─────────────────────────────────────┘
```

### Pago por Outra Pessoa (OUTRO pagou)
```
┌─────────────────────────────────────┐
│ DÍVIDAS PENDENTES                   │
├─────────────────────────────────────┤
│ 🔴 Você deve a Wesley: R$ 100,00    │
│                                     │
│ • Jantar no restaurante             │
│   R$ 100,00 (total)                 │
│   27/10/2024 • Pendente             │
│                                     │
│ 💡 Wesley pagou esta despesa        │
│    por você                         │
│                                     │
│ [Pagar Dívida]                      │
└─────────────────────────────────────┘
```

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. Modal de Despesa Compartilhada

**NÃO deve ter opção "Pago por outra pessoa"**

```typescript
// shared-expense-modal.tsx
// ❌ REMOVER: Checkbox "Pago por outra pessoa"
// ✅ MANTER: Apenas divisão entre participantes

// Este modal é APENAS para:
// - EU paguei
// - Divido com outros
// - Outros me devem
```

### 2. Criar Modal Separado: "Registrar Dívida"

```typescript
// debt-modal.tsx (NOVO)
export function DebtModal() {
  return (
    <Dialog>
      <DialogTitle>Registrar Dívida</DialogTitle>
      <DialogContent>
        <Label>Quem pagou por você?</Label>
        <Select>
          <SelectItem value="wesley">Wesley</SelectItem>
          <SelectItem value="maria">Maria</SelectItem>
        </Select>
        
        <Label>Valor</Label>
        <Input type="number" />
        
        <Label>Descrição</Label>
        <Input placeholder="Ex: Almoço, Uber..." />
        
        <Button>Registrar Dívida</Button>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Billing - Remover Lógica de Crédito

```typescript
// shared-expenses-billing.tsx

// ❌ REMOVER: Seção "Crédito de Dívidas Anteriores"
// ❌ REMOVER: Cálculo de compensação automática
// ❌ REMOVER: Valor líquido

// ✅ MANTER: Apenas mostrar quem me deve
// ✅ MANTER: Botão "Marcar como Recebido"
```

### 4. Criar Página de Dívidas

```typescript
// app/debts/page.tsx (NOVO)
export default function DebtsPage() {
  return (
    <div>
      <h1>Minhas Dívidas</h1>
      
      {/* Dívidas que EU devo */}
      <Card>
        <CardTitle>Você deve</CardTitle>
        {debts.filter(d => d.type === 'DEBIT').map(debt => (
          <div key={debt.id}>
            <p>{debt.creditorName}: R$ {debt.amount}</p>
            <Button onClick={() => payDebt(debt.id)}>
              Pagar Dívida
            </Button>
          </div>
        ))}
      </Card>
      
      {/* Dívidas que ME devem */}
      <Card>
        <CardTitle>Te devem</CardTitle>
        {debts.filter(d => d.type === 'CREDIT').map(debt => (
          <div key={debt.id}>
            <p>{debt.debtorName}: R$ {debt.amount}</p>
            <Button onClick={() => markAsReceived(debt.id)}>
              Marcar como Recebido
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
```

---

## 📊 ESTRUTURA DE DADOS

### Tabela: Transaction
```sql
CREATE TABLE Transaction (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  accountId TEXT, -- ✅ Tem se EU paguei, NULL se outro pagou
  amount DECIMAL NOT NULL,
  type TEXT NOT NULL, -- 'RECEITA' ou 'DESPESA'
  description TEXT NOT NULL,
  date DATETIME NOT NULL,
  
  -- Despesa Compartilhada (EU paguei)
  isShared BOOLEAN DEFAULT false,
  sharedWith TEXT, -- JSON array de IDs
  myShare DECIMAL,
  totalSharedAmount DECIMAL,
  
  -- Pago por Outra Pessoa (OUTRO pagou)
  paidBy TEXT, -- ID da pessoa que pagou
  
  -- Regra: (isShared = true E paidBy = null) OU (isShared = false E paidBy != null)
  -- Nunca os dois ao mesmo tempo!
);
```

### Tabela: Debt (NOVA)
```sql
CREATE TABLE Debt (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL, -- Quem deve
  creditorId TEXT NOT NULL, -- Para quem deve
  amount DECIMAL NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid'
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  paidAt DATETIME,
  transactionId TEXT, -- ID da transação de pagamento (quando pagar)
  
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (creditorId) REFERENCES Contact(id)
);
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Remover "Pago por outra pessoa" do modal de despesa compartilhada
- [ ] Criar modal separado "Registrar Dívida"
- [ ] Criar tabela `Debt` no banco
- [ ] Criar API `/api/debts` (GET, POST, PUT, DELETE)
- [ ] Criar página `/debts` para gerenciar dívidas
- [ ] Remover lógica de crédito/compensação do billing
- [ ] Atualizar billing para mostrar apenas "quem me deve"
- [ ] Implementar fluxo de pagamento de dívida
- [ ] Testar cenário: Despesa compartilhada
- [ ] Testar cenário: Pago por outra pessoa
- [ ] Atualizar documentação

---

**Status:** 🔄 PENDENTE DE IMPLEMENTAÇÃO

**Prioridade:** 🔴 CRÍTICA

**Última atualização:** 27/10/2025
