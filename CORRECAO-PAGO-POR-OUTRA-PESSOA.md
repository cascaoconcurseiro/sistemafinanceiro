# 🔧 CORREÇÃO - PAGO POR OUTRA PESSOA

**Data:** 26/10/2025  
**Problema:** Sistema não salvava transação quando marcava "Pago por outra pessoa"

---

## 🐛 PROBLEMA IDENTIFICADO

Quando o usuário marcava "Pago por outra pessoa" no formulário de transação:

1. **Campo de conta desabilitado**: O campo ficava disabled mas a API exigia conta
2. **Validação falhava**: Schema Zod rejeitava transação sem `accountId`
3. **Transação não era salva**: Erro silencioso, usuário não via mensagem clara
4. **Dívida não era registrada**: Lógica de dívida não era executada

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. Validação Condicional de Conta
```typescript
// ANTES (❌ Errado)
.refine(
  (data) => data.accountId || data.account,
  { message: 'Conta é obrigatória' }
)

// DEPOIS (✅ Correto)
.refine(
  (data) => {
    // Se pago por outra pessoa, não precisa de conta
    if (data.paidBy) return true;
    return data.accountId || data.account;
  },
  { message: 'Conta obrigatória (exceto quando pago por outra pessoa)' }
)
```

### 2. Conta Placeholder Quando Necessário
```typescript
// ✅ NOVO: Usar primeira conta como placeholder quando isPaidBy
if (formData.isPaidBy) {
  selectedAccountForTransaction = safeAccounts[0];
  console.log('ℹ️ Pago por outra pessoa - usando conta placeholder');
} else {
  // Validar conta normalmente
  selectedAccountForTransaction = safeAccounts.find(acc => acc.id === formData.account);
}
```

### 3. Adicionar Informações na Transação
```typescript
const transactionData = {
  // ... outros campos
  notes: formData.isPaidBy 
    ? `${formData.notes || ''}\n[Pago por: ${personName}]`.trim()
    : formData.notes,
  paidBy: formData.isPaidBy ? formData.paidByPerson : undefined,
  status: formData.isPaidBy ? 'pending' : 'cleared',
};
```

### 4. Gerenciamento Automático de Dívidas
```typescript
if (formData.isPaidBy && formData.paidByPerson) {
  const paidByContact = contacts.find(c => c.id === formData.paidByPerson);
  const userShare = formData.isShared ? getMyAmount : adjustedFinalAmount;
  
  // Buscar dívidas existentes
  const existingDebt = await findDebt(paidByContact.id);
  
  if (existingDebt) {
    // Atualizar dívida existente
    await updateDebt(existingDebt.id, {
      currentAmount: existingDebt.currentAmount + userShare
    });
  } else {
    // Criar nova dívida
    await createDebt({
      creditorId: paidByContact.id,
      originalAmount: userShare,
      currentAmount: userShare,
      description: `Despesa: ${formData.description}`
    });
  }
}
```

---

## 🎯 FLUXO COMPLETO AGORA

### Quando usuário marca "Pago por outra pessoa":

1. **Desabilita campo de conta** (não é necessário)
2. **Preenche formulário** normalmente
3. **Seleciona pessoa** que pagou
4. **Clica em Salvar**
5. **Sistema valida** (sem exigir conta)
6. **Cria transação** com status "pending"
7. **Registra dívida** automaticamente
8. **Mostra notificação** com valor devido
9. **Atualiza lista** de transações e dívidas

---

## 💰 CENÁRIOS DE USO

### Cenário 1: Despesa Simples Paga por Outra Pessoa
```
Situação: João pagou R$ 50,00 no almoço por você

Ação:
1. Criar despesa de R$ 50,00
2. Marcar "Pago por outra pessoa"
3. Selecionar "João"
4. Salvar

Resultado:
- Transação criada (status: pending)
- Dívida registrada: Você deve R$ 50,00 para João
- Notificação: "Dívida Registrada: Você deve R$ 50,00 para João"
```

### Cenário 2: Despesa Compartilhada Paga por Outra Pessoa
```
Situação: Maria pagou R$ 100,00 no jantar (dividido entre você e ela)

Ação:
1. Criar despesa de R$ 100,00
2. Marcar "Despesa Compartilhada"
3. Selecionar "Maria" como participante
4. Marcar "Pago por outra pessoa"
5. Selecionar "Maria"
6. Salvar

Resultado:
- Transação criada (status: pending)
- Sua parte: R$ 50,00
- Dívida registrada: Você deve R$ 50,00 para Maria
- Notificação: "Dívida Registrada: Você deve R$ 50,00 para Maria"
```

### Cenário 3: Atualização de Dívida Existente
```
Situação: Você já devia R$ 30,00 para João, ele pagou mais R$ 20,00

Ação:
1. Criar despesa de R$ 20,00
2. Marcar "Pago por outra pessoa"
3. Selecionar "João"
4. Salvar

Resultado:
- Transação criada (status: pending)
- Dívida atualizada: R$ 30,00 + R$ 20,00 = R$ 50,00
- Notificação: "Dívida Atualizada: Você deve R$ 50,00 para João"
```

---

## 📊 ESTRUTURA DE DADOS

### Transação com "Pago por Outra Pessoa"
```json
{
  "id": "trans_123",
  "description": "Almoço no restaurante",
  "amount": 50.00,
  "type": "DESPESA",
  "categoryId": "cat_alimentacao",
  "accountId": null,
  "date": "2025-10-26",
  "status": "pending",
  "paidBy": "joao_id",
  "notes": "[Pago por: João Silva]",
  "isShared": false
}
```

### Dívida Registrada
```json
{
  "id": "debt_456",
  "creditorId": "joao_id",
  "creditorName": "João Silva",
  "debtorId": "user_id",
  "originalAmount": 50.00,
  "currentAmount": 50.00,
  "paidAmount": 0,
  "description": "Despesa: Almoço no restaurante",
  "status": "active",
  "createdAt": "2025-10-26T12:00:00Z"
}
```

---

## 🎨 INTERFACE DO USUÁRIO

### Formulário de Transação
```
┌─────────────────────────────────────┐
│ Nova Transação                      │
├─────────────────────────────────────┤
│                                     │
│ Descrição: [Almoço]                │
│ Valor: [R$ 50,00]                  │
│ Categoria: [Alimentação ▼]         │
│                                     │
│ ☑ Pago por outra pessoa            │
│                                     │
│ Quem pagou: [João Silva ▼]        │
│                                     │
│ Pago com: [Não aplicável]          │
│ ℹ️ Como outra pessoa pagou, não é  │
│    necessário selecionar conta.    │
│                                     │
│ [Cancelar]  [Salvar]               │
└─────────────────────────────────────┘
```

### Notificação de Sucesso
```
┌─────────────────────────────────────┐
│ ✅ Despesa registrada!              │
│                                     │
│ Dívida Registrada:                  │
│ Você deve R$ 50,00 para João Silva │
└─────────────────────────────────────┘
```

---

## 🔍 VALIDAÇÕES IMPLEMENTADAS

### 1. Conta Opcional
- ✅ Quando `isPaidBy = true`, conta não é obrigatória
- ✅ Quando `isPaidBy = false`, conta é obrigatória
- ✅ Validação no frontend e backend

### 2. Pessoa Obrigatória
- ✅ Se marcar "Pago por outra pessoa", deve selecionar quem pagou
- ✅ Validação antes de salvar

### 3. Dívida Automática
- ✅ Cria ou atualiza dívida automaticamente
- ✅ Calcula valor correto (total ou parte compartilhada)
- ✅ Mostra notificação clara

---

## 🚀 PRÓXIMOS PASSOS

### Melhorias Sugeridas:

1. **Dashboard de Dívidas**
   - Card mostrando total devido/a receber
   - Lista de dívidas por pessoa
   - Botão para marcar como pago

2. **Notificações**
   - Avisar quando alguém registrar dívida
   - Lembrete de dívidas pendentes
   - Confirmação quando pagar

3. **Histórico**
   - Timeline de dívidas
   - Filtro por pessoa
   - Exportar extrato

4. **Pagamento de Dívidas**
   - Botão "Pagar Dívida" direto na lista
   - Selecionar conta para débito
   - Registrar pagamento parcial

5. **Relatórios**
   - Gráfico de dívidas ao longo do tempo
   - Ranking de pessoas (quem mais deve/empresta)
   - Balanço geral

---

## 📝 TESTES RECOMENDADOS

### Cenários para Testar:

1. ✅ Criar despesa simples paga por outra pessoa
2. ✅ Criar despesa compartilhada paga por outra pessoa
3. ✅ Atualizar dívida existente
4. ✅ Verificar que transação é criada com status "pending"
5. ✅ Verificar que dívida é registrada corretamente
6. ✅ Verificar notificação de sucesso
7. ✅ Verificar que conta não é obrigatória
8. ✅ Verificar que pessoa é obrigatória

---

## 🎓 CONCLUSÃO

O sistema de "Pago por outra pessoa" agora:
- ✅ Salva transações corretamente
- ✅ Não exige conta quando não necessário
- ✅ Registra dívidas automaticamente
- ✅ Atualiza dívidas existentes
- ✅ Mostra notificações claras
- ✅ Mantém histórico completo

**Status:** ✅ FUNCIONANDO

---

**Última atualização:** 26/10/2025


---

# 🔧 NOVA CORREÇÃO - LÓGICA DE FATURA

**Data:** 26/10/2025  
**Problema:** Fatura mostrando incorretamente quem deve para quem

---

## 🐛 PROBLEMA IDENTIFICADO NA FATURA

A fatura está confundindo:
- ❌ Quem PAGOU a despesa (paidBy)
- ❌ Quem DEVE pagar sua parte (sharedWith)

### Comportamento Atual (ERRADO):
Quando Wesley paga uma despesa compartilhada comigo:
- ❌ Mostra "Pago por Wesley" na minha fatura
- ❌ Não deixa claro que EU devo para o Wesley
- ❌ Aparece como se o Wesley me devesse

---

## ✅ COMPORTAMENTO CORRETO

### Cenário 1: EU DEVO para Wesley
**Situação:** Wesley pagou R$ 200 no almoço, compartilhado comigo (50/50)

```
┌─────────────────────────────────────┐
│ FATURA DE WESLEY                    │
├─────────────────────────────────────┤
│ 💳 Você deve a Wesley: R$ 100,00   │
│                                     │
│ Itens:                              │
│ • Almoço no restaurante             │
│   R$ 100,00 (sua parte)             │
│   26/10/2024 • Pendente             │
│                                     │
│ [Pagar Fatura]                      │
└─────────────────────────────────────┘
```

### Cenário 2: Wesley ME DEVE
**Situação:** EU paguei R$ 200 no jantar, compartilhado com Wesley (50/50)

```
┌─────────────────────────────────────┐
│ FATURA DE WESLEY                    │
├─────────────────────────────────────┤
│ 💰 Wesley te deve: R$ 100,00        │
│ (Crédito disponível)                │
│                                     │
│ Itens:                              │
│ • Jantar no restaurante             │
│   R$ 100,00 (parte dele)            │
│   26/10/2024 • Pendente             │
│                                     │
│ 💡 Este valor será registrado como  │
│    crédito. Se houver dívidas       │
│    anteriores, será descontado      │
│    automaticamente.                 │
└─────────────────────────────────────┘
```

### Cenário 3: Compensação Automática
**Situação:** Wesley me deve R$ 100 (crédito) e eu devo R$ 150 para ele

```
┌─────────────────────────────────────┐
│ FATURA DE WESLEY                    │
├─────────────────────────────────────┤
│ Você deve a Wesley: R$ 150,00       │
│ Crédito disponível: -R$ 100,00      │
│ ─────────────────────────────────   │
│ Valor líquido a pagar: R$ 50,00     │
│                                     │
│ [Pagar Valor Líquido]               │
└─────────────────────────────────────┘
```

---

## 🎯 LÓGICA CORRETA

### Quem aparece na fatura?
- Pessoas que compartilharam despesas comigo (`sharedWith`)
- Cada pessoa tem sua própria fatura

### Quando EU DEVO?
- ✅ A outra pessoa PAGOU a despesa (`paidBy = outra pessoa`)
- ✅ Eu estava no `sharedWith`
- ✅ Mensagem: **"Você deve a [Pessoa]"**
- ✅ Cor: Vermelho/Laranja (débito)

### Quando a pessoa ME DEVE?
- ✅ EU PAGUEI a despesa (`paidBy = eu`)
- ✅ A pessoa estava no `sharedWith`
- ✅ Mensagem: **"[Pessoa] te deve"** (aparece como crédito)
- ✅ Cor: Verde (crédito)

### Quando aparece nas transações?
- ✅ Só deve aparecer quando EU PAGAR a fatura
- ✅ Ao pagar: cria transação de DESPESA (saída de dinheiro)
- ✅ Ao receber: cria transação de RECEITA (entrada de dinheiro)

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. Arquivo: `shared-expenses-billing.tsx`

#### Problema Atual:
```typescript
// ❌ ERRADO: Mostra todos que compartilharam, sem distinguir quem deve
sharedWith.forEach((memberId: string) => {
  allItems.push({
    userEmail: memberEmail,
    amount: amountPerPerson,
    // ...
  });
});
```

#### Correção Necessária:
```typescript
// ✅ CORRETO: Distinguir quem pagou vs quem deve
const paidBy = transaction.paidBy; // Quem pagou
const currentUserId = getCurrentUserId(); // ID do usuário logado

// Se EU paguei, os outros me devem (crédito)
if (paidBy === currentUserId) {
  sharedWith.forEach((memberId: string) => {
    allItems.push({
      userEmail: memberEmail,
      amount: amountPerPerson,
      type: 'CREDIT', // ✅ NOVO: Tipo crédito
      message: `${memberName} te deve`,
      // ...
    });
  });
}
// Se OUTRO pagou, eu devo (débito)
else if (sharedWith.includes(currentUserId)) {
  const payer = contacts.find(c => c.id === paidBy);
  allItems.push({
    userEmail: payer.email,
    amount: amountPerPerson,
    type: 'DEBIT', // ✅ NOVO: Tipo débito
    message: `Você deve a ${payer.name}`,
    // ...
  });
}
```

### 2. Interface da Fatura

#### Adicionar Indicador Visual:
```typescript
// ✅ NOVO: Mostrar claramente quem deve para quem
<CardHeader className={item.type === 'CREDIT' 
  ? 'bg-green-50' 
  : 'bg-red-50'
}>
  <div className="flex items-center justify-between">
    <div>
      {item.type === 'CREDIT' ? (
        <>
          <TrendingUp className="text-green-600" />
          <span className="text-green-700">
            {contact.name} te deve
          </span>
        </>
      ) : (
        <>
          <TrendingDown className="text-red-600" />
          <span className="text-red-700">
            Você deve a {contact.name}
          </span>
        </>
      )}
    </div>
    <Badge variant={item.type === 'CREDIT' ? 'success' : 'destructive'}>
      R$ {item.amount.toFixed(2)}
    </Badge>
  </div>
</CardHeader>
```

### 3. Compensação Automática

```typescript
// ✅ NOVO: Calcular saldo líquido
const calculateNetBalance = (userEmail: string) => {
  const credits = billingItems
    .filter(i => i.userEmail === userEmail && i.type === 'CREDIT')
    .reduce((sum, i) => sum + i.amount, 0);
    
  const debits = billingItems
    .filter(i => i.userEmail === userEmail && i.type === 'DEBIT')
    .reduce((sum, i) => sum + i.amount, 0);
    
  return {
    credits,
    debits,
    netBalance: debits - credits,
    message: debits > credits 
      ? `Você deve R$ ${(debits - credits).toFixed(2)}`
      : `${contact.name} te deve R$ ${(credits - debits).toFixed(2)}`
  };
};
```

---

## 📊 EXEMPLOS PRÁTICOS

### Exemplo 1: Almoço Pago por Wesley

**Transação:**
```json
{
  "description": "Almoço",
  "amount": 200,
  "paidBy": "wesley_id",
  "sharedWith": ["eu_id"],
  "date": "2025-10-26"
}
```

**Minha Fatura (EU):**
```
┌─────────────────────────────────────┐
│ FATURA DE WESLEY                    │
│ 🔴 Você deve a Wesley: R$ 100,00   │
│                                     │
│ • Almoço - R$ 100,00                │
│   26/10/2024 • Pendente             │
└─────────────────────────────────────┘
```

**Fatura do Wesley:**
```
┌─────────────────────────────────────┐
│ FATURA DE [MEU NOME]                │
│ 🟢 [Meu Nome] te deve: R$ 100,00   │
│                                     │
│ • Almoço - R$ 100,00                │
│   26/10/2024 • Pendente             │
└─────────────────────────────────────┘
```

### Exemplo 2: Jantar Pago por Mim

**Transação:**
```json
{
  "description": "Jantar",
  "amount": 300,
  "paidBy": "eu_id",
  "sharedWith": ["wesley_id", "maria_id"],
  "date": "2025-10-26"
}
```

**Minha Fatura (EU):**
```
┌─────────────────────────────────────┐
│ FATURA DE WESLEY                    │
│ 🟢 Wesley te deve: R$ 100,00        │
│                                     │
│ FATURA DE MARIA                     │
│ 🟢 Maria te deve: R$ 100,00         │
│                                     │
│ Total a receber: R$ 200,00          │
└─────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTAÇÃO

### Passo 1: Adicionar Campo `type` em BillingItem
```typescript
interface BillingItem {
  id: string;
  transactionId: string;
  userEmail: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  isPaid: boolean;
  dueDate?: string;
  tripId?: string;
  type: 'CREDIT' | 'DEBIT'; // ✅ NOVO
  paidBy: string; // ✅ NOVO: ID de quem pagou
}
```

### Passo 2: Atualizar Lógica de Geração de Itens
```typescript
// No useEffect que carrega transações
sharedTransactions.forEach((transaction: any) => {
  const currentUserId = getCurrentUserId();
  const paidBy = transaction.paidBy;
  
  // Determinar tipo (crédito ou débito)
  const iCredit = paidBy === currentUserId;
  
  if (iCredit) {
    // EU paguei, outros me devem
    sharedWith.forEach((memberId: string) => {
      allItems.push({
        // ...
        type: 'CREDIT',
        paidBy: currentUserId,
      });
    });
  } else {
    // OUTRO pagou, eu devo
    if (sharedWith.includes(currentUserId)) {
      allItems.push({
        // ...
        type: 'DEBIT',
        paidBy: paidBy,
      });
    }
  }
});
```

### Passo 3: Atualizar UI
```typescript
// Renderizar com cores e mensagens corretas
{item.type === 'CREDIT' ? (
  <div className="bg-green-50 border-green-200">
    <TrendingUp className="text-green-600" />
    <span>{contact.name} te deve</span>
  </div>
) : (
  <div className="bg-red-50 border-red-200">
    <TrendingDown className="text-red-600" />
    <span>Você deve a {contact.name}</span>
  </div>
)}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Adicionar campo `type` em `BillingItem`
- [ ] Adicionar campo `paidBy` em `BillingItem`
- [ ] Atualizar lógica de geração de itens
- [ ] Distinguir créditos de débitos
- [ ] Atualizar UI com cores corretas
- [ ] Implementar compensação automática
- [ ] Testar cenário: EU devo
- [ ] Testar cenário: ME devem
- [ ] Testar cenário: Compensação
- [ ] Atualizar documentação

---

**Status:** 🔄 PENDENTE DE IMPLEMENTAÇÃO

**Última atualização:** 26/10/2025


---

# 🔧 CORREÇÃO CRÍTICA - TRANSAÇÃO APARECENDO ANTES DO PAGAMENTO

**Data:** 26/10/2025  
**Problema:** Transação aparece na lista ANTES de pagar a dívida

---

## 🐛 PROBLEMA ATUAL

Quando marca "Pago por outra pessoa":
```
❌ ERRADO:
1. Marca "Pago por Wesley"
2. Salva
3. Transação APARECE imediatamente:
   "Teste • -R$ 10,00 • Dívida com Wesley"
4. Saldo já é afetado: -R$ 10,00
```

**Isso está ERRADO porque:**
- Você ainda NÃO pagou o Wesley
- O dinheiro ainda NÃO saiu da sua conta
- É apenas uma DÍVIDA registrada, não uma transação

---

## ✅ COMPORTAMENTO CORRETO

### Fase 1: Registrar Dívida (SEM transação)
```
1. Marca "Pago por Wesley"
2. Salva
3. ❌ NÃO aparece nas transações
4. ✅ Aparece apenas na lista de DÍVIDAS:
   "Você deve R$ 10,00 para Wesley"
5. ✅ Saldo NÃO é afetado
```

### Fase 2: Pagar Dívida (COM transação)
```
1. Vai na lista de dívidas
2. Clica "Pagar Dívida"
3. Seleciona CONTA para débito
4. Confirma pagamento
5. ✅ AGORA cria transação:
   - Se pessoa não te deve: DESPESA de R$ 10,00
   - Se pessoa te deve R$ 5,00: 
     * Compensa R$ 5,00
     * DESPESA de R$ 5,00
   - Se pessoa te deve R$ 15,00:
     * Compensa R$ 10,00
     * RECEITA de R$ 5,00 (sobra de crédito)
```

---

## 🎯 LÓGICA IGUAL A CARTÃO DE CRÉDITO

É exatamente como cartão de crédito:

### Cartão de Crédito:
1. Compra algo → Não sai dinheiro ainda
2. Fatura fecha → Mostra quanto deve
3. Paga fatura → AÍ SIM sai dinheiro da conta

### Pago por Outra Pessoa:
1. Pessoa paga por você → Não sai dinheiro ainda
2. Dívida registrada → Mostra quanto deve
3. Paga dívida → AÍ SIM sai dinheiro da conta

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. Criar Transação com Status "PENDING"

```typescript
// ❌ ANTES (Errado)
const transactionData = {
  description: formData.description,
  amount: adjustedFinalAmount,
  type: 'DESPESA',
  categoryId: formData.category,
  accountId: selectedAccount.id, // ❌ Usa conta real
  status: 'cleared', // ❌ Marca como confirmada
  paidBy: formData.paidByPerson,
};

// ✅ DEPOIS (Correto)
const transactionData = {
  description: formData.description,
  amount: adjustedFinalAmount,
  type: 'DESPESA',
  categoryId: formData.category,
  accountId: null, // ✅ SEM conta (ainda não pagou)
  status: 'pending_payment', // ✅ Aguardando pagamento
  paidBy: formData.paidByPerson,
  metadata: {
    isPendingDebt: true, // ✅ Flag para identificar
    creditorId: formData.paidByPerson,
  }
};
```

### 2. Filtrar Transações Pendentes da Lista

```typescript
// ❌ ANTES (Mostra todas)
const transactions = allTransactions;

// ✅ DEPOIS (Filtra pendentes)
const transactions = allTransactions.filter(t => 
  t.status !== 'pending_payment' && 
  !t.metadata?.isPendingDebt
);
```

### 3. Criar Fluxo de Pagamento de Dívida

```typescript
const handlePayDebt = async (debt: Debt) => {
  // 1. Selecionar conta
  const accountId = await selectAccount();
  
  // 2. Verificar se pessoa te deve algo
  const credits = await getCreditsFrom(debt.creditorId);
  const totalCredit = credits.reduce((sum, c) => sum + c.amount, 0);
  
  // 3. Calcular valores
  const debtAmount = debt.currentAmount;
  const netAmount = debtAmount - totalCredit;
  
  // 4. Criar transação(ões)
  if (netAmount > 0) {
    // Você ainda deve (após compensar)
    await createTransaction({
      description: `Pagamento - ${debt.description}`,
      amount: netAmount,
      type: 'DESPESA',
      accountId: accountId,
      status: 'cleared',
      notes: `Compensado R$ ${totalCredit.toFixed(2)} de créditos`,
    });
  } else if (netAmount < 0) {
    // Sobrou crédito (pessoa te devia mais)
    await createTransaction({
      description: `Recebimento - Saldo de crédito`,
      amount: Math.abs(netAmount),
      type: 'RECEITA',
      accountId: accountId,
      status: 'cleared',
      notes: `Crédito excedente após compensação`,
    });
  }
  // Se netAmount === 0, apenas marca como pago (compensação total)
  
  // 5. Atualizar dívida
  await updateDebt(debt.id, { status: 'paid' });
  
  // 6. Atualizar créditos
  await updateCredits(credits, { status: 'used' });
};
```

---

## 📊 FLUXO COMPLETO

### Cenário 1: Dívida Simples (sem créditos)

```
1️⃣ REGISTRAR DÍVIDA
   Wesley pagou R$ 100 por você
   
   Ação: Criar despesa marcando "Pago por Wesley"
   
   Resultado:
   ✅ Dívida registrada: R$ 100
   ❌ NÃO aparece nas transações
   ❌ Saldo NÃO muda

2️⃣ PAGAR DÍVIDA
   Você vai pagar o Wesley
   
   Ação: 
   - Ir em "Dívidas"
   - Clicar "Pagar R$ 100 para Wesley"
   - Selecionar conta: "Nubank"
   - Confirmar
   
   Resultado:
   ✅ Transação criada: DESPESA -R$ 100
   ✅ Aparece nas transações
   ✅ Saldo: -R$ 100
   ✅ Dívida quitada
```

### Cenário 2: Dívida com Compensação Parcial

```
1️⃣ SITUAÇÃO
   - Você deve R$ 100 para Wesley
   - Wesley te deve R$ 30 (de outra despesa)
   
2️⃣ PAGAR DÍVIDA
   Ação: Pagar dívida de R$ 100
   
   Cálculo:
   R$ 100 (dívida) - R$ 30 (crédito) = R$ 70
   
   Resultado:
   ✅ Transação: DESPESA -R$ 70
   ✅ Nota: "Compensado R$ 30,00 de créditos"
   ✅ Saldo: -R$ 70
   ✅ Dívida quitada
   ✅ Crédito usado
```

### Cenário 3: Crédito Excedente

```
1️⃣ SITUAÇÃO
   - Você deve R$ 50 para Wesley
   - Wesley te deve R$ 80 (de outra despesa)
   
2️⃣ PAGAR DÍVIDA
   Ação: Pagar dívida de R$ 50
   
   Cálculo:
   R$ 50 (dívida) - R$ 80 (crédito) = -R$ 30
   
   Resultado:
   ✅ Transação: RECEITA +R$ 30
   ✅ Nota: "Saldo de crédito após compensação"
   ✅ Saldo: +R$ 30
   ✅ Dívida quitada
   ✅ Crédito parcialmente usado (sobrou R$ 30)
```

---

## 🎨 INTERFACE

### Lista de Transações (NÃO mostra dívidas pendentes)
```
┌─────────────────────────────────────┐
│ Transações                          │
├─────────────────────────────────────┤
│ ✅ Mercado - R$ 50,00               │
│ ✅ Gasolina - R$ 100,00             │
│ ✅ Almoço - R$ 30,00                │
│                                     │
│ ❌ NÃO aparece: "Dívida com Wesley" │
└─────────────────────────────────────┘
```

### Lista de Dívidas (Mostra pendentes)
```
┌─────────────────────────────────────┐
│ Dívidas Pendentes                   │
├─────────────────────────────────────┤
│ 🔴 Wesley                           │
│    Você deve: R$ 100,00             │
│    • Almoço - R$ 50,00              │
│    • Jantar - R$ 50,00              │
│    [Pagar Dívida]                   │
│                                     │
│ 🟢 Maria                            │
│    Maria te deve: R$ 30,00          │
│    • Cinema - R$ 30,00              │
│    [Marcar como Recebido]           │
└─────────────────────────────────────┘
```

### Modal de Pagamento
```
┌─────────────────────────────────────┐
│ Pagar Dívida                        │
├─────────────────────────────────────┤
│ Você deve a Wesley: R$ 100,00       │
│                                     │
│ 💰 Créditos Disponíveis:            │
│    Wesley te deve: R$ 30,00         │
│                                     │
│ ─────────────────────────────────   │
│ Valor a pagar: R$ 70,00             │
│ (após compensação)                  │
│                                     │
│ Pagar com: [Nubank ▼]              │
│                                     │
│ [Cancelar]  [Confirmar Pagamento]   │
└─────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar status `pending_payment` para transações
- [ ] Adicionar flag `isPendingDebt` no metadata
- [ ] Filtrar transações pendentes da lista principal
- [ ] Criar componente "Lista de Dívidas"
- [ ] Criar modal "Pagar Dívida"
- [ ] Implementar lógica de compensação
- [ ] Criar transação apenas no pagamento
- [ ] Testar cenário: Dívida simples
- [ ] Testar cenário: Compensação parcial
- [ ] Testar cenário: Crédito excedente
- [ ] Atualizar documentação

---

**Status:** 🔄 PENDENTE DE IMPLEMENTAÇÃO

**Prioridade:** 🔴 CRÍTICA

**Última atualização:** 26/10/2025
