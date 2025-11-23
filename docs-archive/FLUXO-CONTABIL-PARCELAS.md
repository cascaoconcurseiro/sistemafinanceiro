# 📚 Fluxo Contábil de Parcelas - Como Sistemas Financeiros Reais Funcionam

## 🎯 Princípios Fundamentais

### 1. Partidas Dobradas
Todo lançamento tem **origem** e **destino**. O total de débitos sempre é igual ao total de créditos.

### 2. Tipos de Contas
- **ATIVO**: Bens e direitos (Conta Corrente, Poupança)
- **PASSIVO**: Obrigações (Cartão de Crédito, Empréstimos)
- **RECEITA**: Entradas de dinheiro
- **DESPESA**: Saídas de dinheiro

---

## 📊 Cenário Completo: Compra Parcelada

### Exemplo Real:
**Compra de Notebook por R$ 1.200 em 12x de R$ 100 no cartão de crédito**

---

## 1️⃣ MOMENTO DA COMPRA (Mês 1)

### O que acontece no mundo real:
- Você compra o notebook
- A loja recebe o dinheiro do banco do cartão
- Você fica devendo R$ 1.200 ao banco
- O limite do cartão diminui R$ 1.200

### Lançamentos Contábeis:

```
┌─────────────────────────────────────────────────────────┐
│ TRANSAÇÃO: Compra de Notebook                           │
├─────────────────────────────────────────────────────────┤
│ DÉBITO:  Despesa (Eletrônicos)        R$ 1.200,00      │
│ CRÉDITO: Cartão de Crédito (Passivo)  R$ 1.200,00      │
└─────────────────────────────────────────────────────────┘

RESULTADO:
- Despesa registrada: R$ 1.200
- Dívida no cartão: R$ 1.200
- Limite disponível: REDUZ R$ 1.200
```

### No Sistema:

```javascript
// Criar 12 parcelas
for (let i = 1; i <= 12; i++) {
  Transaction.create({
    description: `Notebook - Parcela ${i}/12`,
    amount: -100, // Negativo = despesa
    type: 'DESPESA',
    status: i === 1 ? 'pending' : 'pending', // Primeira parcela vence no mês
    installmentNumber: i,
    totalInstallments: 12,
    installmentGroupId: 'group-123',
    creditCardId: 'card-456',
    date: addMonths(today, i - 1), // Cada parcela em um mês diferente
  });
}

// Atualizar cartão de crédito
Account.update({
  id: 'card-456',
  balance: balance - 1200, // Aumenta a dívida (saldo negativo)
});
```

---

## 2️⃣ PAGAMENTO MENSAL DA FATURA (Todo mês)

### O que acontece no mundo real:
- Chega a fatura do cartão com R$ 100
- Você paga a fatura da sua conta corrente
- O banco do cartão recebe o pagamento
- Seu limite é liberado em R$ 100

### Lançamentos Contábeis:

```
┌─────────────────────────────────────────────────────────┐
│ TRANSAÇÃO: Pagamento Fatura Cartão - Parcela 1/12      │
├─────────────────────────────────────────────────────────┤
│ DÉBITO:  Cartão de Crédito (Passivo)  R$ 100,00        │
│ CRÉDITO: Conta Corrente (Ativo)       R$ 100,00        │
└─────────────────────────────────────────────────────────┘

RESULTADO:
- Conta Corrente: REDUZ R$ 100
- Dívida no cartão: REDUZ R$ 100
- Limite disponível: AUMENTA R$ 100
```

### No Sistema:

```javascript
// 1. Marcar parcela como paga
Transaction.update({
  id: 'parcela-1-id',
  status: 'paid',
});

// 2. Criar transação de pagamento
Transaction.create({
  description: 'Pagamento Fatura - Notebook Parcela 1/12',
  amount: -100, // Sai da conta corrente
  type: 'DESPESA',
  accountId: 'conta-corrente-id',
  creditCardId: 'card-456',
  status: 'completed',
});

// 3. Atualizar conta corrente
Account.update({
  id: 'conta-corrente-id',
  balance: balance - 100, // Reduz saldo
});

// 4. Atualizar cartão de crédito
Account.update({
  id: 'card-456',
  balance: balance + 100, // Reduz dívida (aumenta saldo negativo)
});
```

---

## 3️⃣ ADIANTAMENTO DE PARCELAS (O que você quer fazer)

### Cenário:
Você está na parcela 3/12 e decide adiantar 3 parcelas (4, 5, 6) = R$ 300

### O que acontece no mundo real:
- Você paga R$ 300 de uma vez
- O banco do cartão recebe R$ 300
- Seu limite é liberado em R$ 300 **imediatamente**
- As parcelas 4, 5 e 6 são marcadas como pagas
- Você não precisa pagar essas parcelas nos próximos meses

### Lançamentos Contábeis:

```
┌─────────────────────────────────────────────────────────┐
│ TRANSAÇÃO: Pagamento Antecipado - 3 Parcelas           │
├─────────────────────────────────────────────────────────┤
│ DÉBITO:  Cartão de Crédito (Passivo)  R$ 300,00        │
│ CRÉDITO: Conta Corrente (Ativo)       R$ 300,00        │
└─────────────────────────────────────────────────────────┘

RESULTADO:
- Conta Corrente: REDUZ R$ 300 (saída única)
- Dívida no cartão: REDUZ R$ 300 (imediato)
- Limite disponível: AUMENTA R$ 300 (imediato)
- Parcelas 4, 5, 6: Status = "paid"
```

### No Sistema (IMPLEMENTAÇÃO CORRETA):

```javascript
// 1. Marcar parcelas como pagas
const parcelas = [4, 5, 6];
for (const num of parcelas) {
  Transaction.update({
    id: `parcela-${num}-id`,
    status: 'paid',
    metadata: {
      advancedAt: new Date(),
      advancedPaymentId: 'payment-xyz',
    },
  });
}

// 2. Criar transação de pagamento antecipado
const payment = Transaction.create({
  description: '💳 Pagamento Antecipado - 3x Notebook',
  amount: -300, // Sai da conta corrente
  type: 'DESPESA',
  accountId: 'conta-corrente-id',
  creditCardId: 'card-456',
  status: 'completed',
  metadata: {
    type: 'installment_advance_payment',
    installmentIds: ['parcela-4-id', 'parcela-5-id', 'parcela-6-id'],
    installmentsAdvanced: 3,
  },
});

// 3. Atualizar conta corrente (débito)
Account.update({
  id: 'conta-corrente-id',
  balance: balance - 300, // Reduz saldo
});

// 4. ✅ CRÍTICO: Atualizar cartão de crédito (crédito)
Account.update({
  id: 'card-456',
  balance: balance + 300, // Reduz dívida = libera limite
});
```

---

## 🔍 Visualização do Fluxo

### Antes do Adiantamento:
```
CONTA CORRENTE:        R$ 5.000,00
CARTÃO (Dívida):      -R$ 1.000,00 (10 parcelas restantes)
LIMITE DISPONÍVEL:     R$ 2.000,00 (de R$ 3.000 total)
```

### Depois do Adiantamento (3 parcelas):
```
CONTA CORRENTE:        R$ 4.700,00  (-R$ 300)
CARTÃO (Dívida):      -R$   700,00  (+R$ 300)
LIMITE DISPONÍVEL:     R$ 2.300,00  (+R$ 300) ✅
```

---

## 📋 Checklist de Validação

Para garantir que a implementação está correta:

### ✅ Transações:
- [ ] Parcelas marcadas como "paid"
- [ ] Transação de pagamento criada
- [ ] Metadata com rastreabilidade (IDs das parcelas)
- [ ] Descrição clara ("Pagamento Antecipado")

### ✅ Contas:
- [ ] Conta corrente: saldo REDUZ
- [ ] Cartão de crédito: dívida REDUZ (saldo aumenta)
- [ ] Limite do cartão: AUMENTA imediatamente

### ✅ Relatórios:
- [ ] Parcelas não aparecem mais como pendentes
- [ ] Fluxo de caixa mostra saída única
- [ ] Limite do cartão atualizado nos gráficos

### ✅ Auditoria:
- [ ] Logs de todas as operações
- [ ] Rastreabilidade completa (qual parcela foi paga por qual transação)
- [ ] Possibilidade de reverter (se necessário)

---

## 🚫 Erros Comuns

### ❌ ERRO 1: Não liberar o limite do cartão
```javascript
// ERRADO:
Account.update({ id: accountId, balance: balance - 300 }); // Só atualiza conta corrente

// CERTO:
Account.update({ id: accountId, balance: balance - 300 }); // Conta corrente
Account.update({ id: cardId, balance: balance + 300 });    // Cartão (libera limite)
```

### ❌ ERRO 2: Criar despesa duplicada
```javascript
// ERRADO: Criar nova despesa de R$ 300
Transaction.create({ type: 'DESPESA', amount: -300 }); // Duplica a despesa!

// CERTO: Apenas marcar parcelas como pagas e criar transação de PAGAMENTO
Transaction.update({ status: 'paid' }); // Parcelas
Transaction.create({ type: 'DESPESA', description: 'Pagamento Antecipado' }); // Pagamento
```

### ❌ ERRO 3: Perder rastreabilidade
```javascript
// ERRADO: Sem metadata
Transaction.create({ description: 'Pagamento' });

// CERTO: Com metadata completo
Transaction.create({
  description: 'Pagamento Antecipado - 3x Notebook',
  metadata: {
    type: 'installment_advance_payment',
    installmentIds: [...],
    installmentsAdvanced: 3,
  },
});
```

---

## 📊 Comparação com Sistemas Reais

### Nubank:
- ✅ Libera limite imediatamente
- ✅ Parcelas somem da fatura
- ✅ Histórico mostra "Pagamento Antecipado"
- ✅ Pode reverter em até 24h

### Itaú:
- ✅ Libera limite no mesmo dia
- ✅ Parcelas marcadas como "Quitadas"
- ✅ Extrato mostra débito único
- ✅ Confirmação por SMS/App

### Inter:
- ✅ Limite atualizado em tempo real
- ✅ Notificação push
- ✅ Histórico detalhado
- ✅ Possibilidade de agendar

---

## 🎓 Conclusão

O fluxo correto de adiantamento de parcelas segue 3 princípios:

1. **Partidas Dobradas**: Débito na conta corrente = Crédito no cartão
2. **Rastreabilidade**: Metadata completo para auditoria
3. **Atualização Imediata**: Limite do cartão liberado instantaneamente

A implementação atual foi corrigida para seguir esses princípios! 🎉

---

**Desenvolvido com ❤️ para SuaGrana**
