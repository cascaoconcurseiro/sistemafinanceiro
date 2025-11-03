# Correção: Sistema de Despesas Compartilhadas

## 🔴 PROBLEMA ATUAL

Quando duas pessoas compartilham uma despesa de R$ 100 (50/50):
- Pessoa A deve R$ 50
- Pessoa B deve R$ 50
- **Sistema está zerando incorretamente** (compensando as dívidas)

## ✅ COMPORTAMENTO CORRETO

### Cenário: Despesa de R$ 100 compartilhada 50/50

#### 1. **Criação da Despesa Compartilhada**
Quando Pessoa A cria a despesa e paga:
```
Transação Original:
- Descrição: "Jantar no restaurante"
- Valor: R$ 100
- Tipo: DESPESA
- Conta: Conta da Pessoa A
- Status: cleared (já pago)
- Compartilhado com: Pessoa B
- Divisão: 50/50
```

**Lançamentos Contábeis:**
```
Débito: Despesa (Alimentação) ......... R$ 100
Crédito: Conta Corrente (Pessoa A) .... R$ 100
```

**Dívida Criada:**
```
SharedDebt:
- Devedor: Pessoa B
- Credor: Pessoa A
- Valor: R$ 50
- Status: active
```

#### 2. **Quando Pessoa B Paga a Dívida**

**Opção A: Pagamento Direto (Transferência/PIX)**
```
Transação 1 - RECEITA (Pessoa A):
- Descrição: "Recebimento - Jantar no restaurante"
- Valor: R$ 50
- Tipo: RECEITA
- Conta: Conta da Pessoa A
- Categoria: "Reembolso" ou "Recebimento de Dívida"
- Status: cleared

Lançamentos Contábeis:
Débito: Conta Corrente (Pessoa A) ...... R$ 50
Crédito: Receita (Reembolso) ........... R$ 50
```

```
Transação 2 - DESPESA (Pessoa B):
- Descrição: "Pagamento - Jantar no restaurante"
- Valor: R$ 50
- Tipo: DESPESA
- Conta: Conta da Pessoa B
- Categoria: "Alimentação" (mesma da despesa original)
- Status: cleared

Lançamentos Contábeis:
Débito: Despesa (Alimentação) .......... R$ 50
Crédito: Conta Corrente (Pessoa B) ..... R$ 50
```

**Atualização da Dívida:**
```
SharedDebt:
- Status: paid
- PaidAt: data do pagamento
```

**Opção B: Compensação (quando há dívidas cruzadas)**
Se Pessoa A também deve R$ 30 para Pessoa B:
- Dívida de B para A: R$ 50
- Dívida de A para B: R$ 30
- **Líquido: B paga R$ 20 para A**

```
Transação 1 - RECEITA (Pessoa A):
- Descrição: "Recebimento líquido - Compensação de dívidas"
- Valor: R$ 20
- Tipo: RECEITA
- Notas: "Compensado R$ 30 de dívidas"

Transação 2 - DESPESA (Pessoa B):
- Descrição: "Pagamento líquido - Compensação de dívidas"
- Valor: R$ 20
- Tipo: DESPESA
- Notas: "Compensado R$ 30 de créditos"
```

## 📊 RESUMO DOS LANÇAMENTOS

### Visão da Pessoa A (quem pagou a conta):
1. **Momento da despesa:** -R$ 100 (saída da conta)
2. **Recebimento do reembolso:** +R$ 50 (entrada na conta)
3. **Saldo líquido:** -R$ 50 (sua parte da despesa)

### Visão da Pessoa B (quem deve):
1. **Momento do pagamento:** -R$ 50 (saída da conta)
2. **Saldo líquido:** -R$ 50 (sua parte da despesa)

### Resultado Final:
- Ambos tiveram uma despesa de R$ 50
- Ambos têm o lançamento correto em suas contas
- O sistema reflete a realidade financeira de cada um

## 🔧 IMPLEMENTAÇÃO NECESSÁRIA

### 1. Criar Despesa Compartilhada
```typescript
// No add-transaction-modal.tsx
if (formData.isShared && formData.selectedContacts.length > 0) {
  // Criar transação principal (quem pagou)
  const transaction = await createTransaction({
    description: formData.description,
    amount: formData.amount,
    type: 'DESPESA',
    accountId: formData.account,
    status: 'cleared', // Já foi pago
    sharedWith: formData.selectedContacts,
    splitType: formData.divisionMethod,
  });

  // Criar dívidas para cada participante
  for (const contactId of formData.selectedContacts) {
    const shareAmount = calculateShare(formData.amount, contactId);
    
    await createSharedDebt({
      transactionId: transaction.id,
      creditorId: currentUserId, // Quem pagou
      debtorId: contactId, // Quem deve
      originalAmount: shareAmount,
      currentAmount: shareAmount,
      status: 'active',
    });
  }
}
```

### 2. Pagar Dívida
```typescript
// No pending-debts-list.tsx
const confirmPayment = async () => {
  const summary = getCreditorSummary(selectedDebt.creditorId);
  const netAmount = summary.netAmount; // Após compensação

  if (netAmount > 0) {
    // TRANSAÇÃO 1: RECEITA para o credor
    await createTransaction({
      userId: selectedDebt.creditorId,
      description: `Recebimento - ${selectedDebt.description}`,
      amount: netAmount,
      type: 'RECEITA',
      categoryId: 'reembolso', // Categoria específica
      accountId: creditorAccount, // Conta do credor
      status: 'cleared',
    });

    // TRANSAÇÃO 2: DESPESA para o devedor
    await createTransaction({
      userId: currentUserId,
      description: `Pagamento - ${selectedDebt.description}`,
      amount: netAmount,
      type: 'DESPESA',
      categoryId: selectedDebt.category, // Mesma categoria da despesa original
      accountId: selectedAccount, // Conta do devedor
      status: 'cleared',
    });

    // ATUALIZAR DÍVIDA
    await updateSharedDebt(selectedDebt.id, {
      status: 'paid',
      paidAt: new Date(),
    });
  }
};
```

## 🎯 REGRAS DE NEGÓCIO

1. **Despesa Compartilhada:**
   - Quem paga registra a despesa total na sua conta
   - Sistema cria dívidas para os participantes
   - Status da transação: `cleared` (já foi pago)

2. **Pagamento de Dívida:**
   - Cria RECEITA para quem recebe
   - Cria DESPESA para quem paga
   - Ambas as transações têm status `cleared`
   - Dívida muda para status `paid`

3. **Compensação:**
   - Calcular dívidas líquidas entre as pessoas
   - Criar transações apenas pelo valor líquido
   - Registrar nas notas os valores compensados

4. **Categorias:**
   - Despesa original: categoria real (Alimentação, Transporte, etc.)
   - Recebimento: categoria "Reembolso" ou "Recebimento de Dívida"
   - Pagamento: mesma categoria da despesa original

## 📝 PRÓXIMOS PASSOS

1. ✅ Criar categoria "Reembolso" no sistema
2. ✅ Implementar lógica de criação de dívidas
3. ✅ Implementar lógica de pagamento com 2 transações
4. ✅ Implementar compensação automática
5. ✅ Adicionar relatórios de despesas compartilhadas
6. ✅ Adicionar histórico de pagamentos

## 🔍 VALIDAÇÕES NECESSÁRIAS

- [ ] Verificar se a conta do credor existe
- [ ] Verificar se a conta do devedor tem saldo
- [ ] Validar que o valor da dívida é positivo
- [ ] Garantir atomicidade (todas as transações ou nenhuma)
- [ ] Registrar logs de auditoria
- [ ] Notificar ambas as partes sobre o pagamento
