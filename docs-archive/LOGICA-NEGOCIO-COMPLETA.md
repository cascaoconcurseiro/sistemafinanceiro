# 📚 LÓGICA DE NEGÓCIO COMPLETA - SISTEMA FINANCEIRO PESSOAL

## 📋 ÍNDICE

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Regras de Negócio Fundamentais](#2-regras-de-negócio-fundamentais)
3. [Formulário de Nova Transação](#3-formulário-de-nova-transação)
4. [Despesas Compartilhadas](#4-despesas-compartilhadas)
5. [Viagens](#5-viagens)
6. [Partidas Dobradas](#6-partidas-dobradas)
7. [Cartões de Crédito e Faturas](#7-cartões-de-crédito-e-faturas)
8. [Parcelamento](#8-parcelamento)
9. [Casos de Uso Completos](#9-casos-de-uso-completos)

---

## 1. VISÃO GERAL DO SISTEMA

### 🎯 Objetivo

Sistema de gestão financeira pessoal que permite:
- Controlar receitas e despesas
- Gerenciar múltiplas contas bancárias
- Compartilhar despesas com outras pessoas
- Organizar gastos por viagens
- Parcelar compras
- Usar cartões de crédito
- Manter contabilidade com partidas dobradas

### 🏗️ Arquitetura Conceitual

```
┌─────────────────────────────────────────────────────────────┐
│                    USUÁRIO                                  │
│                                                             │
│  • Tem contas bancárias                                    │
│  • Tem cartões de crédito                                  │
│  • Faz transações                                          │
│  • Participa de viagens                                    │
│  • Compartilha despesas                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  TRANSAÇÃO                                  │
│                                                             │
│  • Receita (entrada de dinheiro)                           │
│  • Despesa (saída de dinheiro)                             │
│  • Transferência (entre contas)                            │
│                                                             │
│  Pode ser:                                                 │
│  • Simples (só você)                                       │
│  • Compartilhada (dividida com outros)                     │
│  • De viagem (vinculada a uma viagem)                      │
│  • Parcelada (dividida em meses)                           │
│  • Paga por outro (você não pagou)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. REGRAS DE NEGÓCIO FUNDAMENTAIS

### 💰 Regra 1: Conservação de Valor

**Princípio:** O dinheiro não desaparece, apenas muda de lugar.

```
RECEITA:
  Conta Bancária (+) ← Dinheiro entra
  
DESPESA:
  Conta Bancária (-) ← Dinheiro sai
  
TRANSFERÊNCIA:
  Conta A (-) → Conta B (+)
  Total do sistema = 0
```

**Exemplo:**
```
Situação inicial:
  Conta Corrente: R$ 1.000
  Poupança: R$ 500
  Total: R$ 1.500

Transferência de R$ 200 (Corrente → Poupança):
  Conta Corrente: R$ 800 (-200)
  Poupança: R$ 700 (+200)
  Total: R$ 1.500 ✅ (mantém)
```

### 📊 Regra 2: Partidas Dobradas

**Princípio:** Toda transação tem dois lados (débito e crédito).

```
DESPESA de R$ 100 em Alimentação:
  DÉBITO:  Alimentação (Despesa) +100
  CRÉDITO: Conta Corrente (Ativo) -100
  
RECEITA de R$ 500 (Salário):
  DÉBITO:  Conta Corrente (Ativo) +500
  CRÉDITO: Salário (Receita) +500
```

**Por que isso importa?**
- Mantém o balanço contábil
- Permite rastreabilidade total
- Facilita auditoria
- Gera relatórios precisos

### 🤝 Regra 3: Compartilhamento Justo

**Princípio:** Despesas compartilhadas são divididas proporcionalmente.

```
Despesa de R$ 300 compartilhada entre 3 pessoas:
  Total: R$ 300
  Participantes: Você, Maria, João
  Divisão igual: R$ 300 ÷ 3 = R$ 100 cada

Resultado:
  Você paga: R$ 300 (da sua conta)
  Você gasta: R$ 100 (sua parte)
  Maria deve: R$ 100
  João deve: R$ 100
```

### ✈️ Regra 4: Isolamento de Viagens

**Princípio:** Gastos de viagem são contabilizados separadamente.

```
Orçamento da viagem: R$ 5.000
Gasto individual: R$ 1.200
Gasto compartilhado: R$ 800 (sua parte: R$ 400)

Total gasto na viagem: R$ 1.600
Disponível: R$ 3.400
Utilização: 32%
```

### 💳 Regra 5: Cartão de Crédito é Dívida

**Princípio:** Compra no cartão não sai da conta imediatamente.

```
Compra de R$ 500 no cartão:
  Limite disponível: -R$ 500
  Saldo da conta: mantém
  Fatura do mês: +R$ 500
  
Pagamento da fatura:
  Saldo da conta: -R$ 500
  Fatura: R$ 0
  Limite disponível: +R$ 500
```

---



## 3. FORMULÁRIO DE NOVA TRANSAÇÃO

### 📝 Campos e Suas Funções

#### 3.1 Campos Básicos

**Descrição**
- O que foi comprado/recebido
- Exemplo: "Almoço no restaurante", "Salário de novembro"
- Obrigatório
- Máximo 500 caracteres

**Valor**
- Quanto custou/recebeu
- Formato brasileiro: 100,50 (vírgula para decimais)
- Sempre positivo (o tipo define se é entrada ou saída)
- Obrigatório

**Tipo**
- RECEITA: dinheiro entrando
- DESPESA: dinheiro saindo
- TRANSFERÊNCIA: movendo entre contas
- Obrigatório

**Data**
- Quando aconteceu
- Formato: dd/mm/aaaa
- Padrão: hoje
- Obrigatório

**Categoria**
- Classificação da transação
- Exemplos: Alimentação, Transporte, Salário
- Obrigatório
- Usada para relatórios

#### 3.2 Conta/Cartão

**Lógica de Seleção:**

```typescript
if (isPaidBy) {
  // Pago por outra pessoa
  // NÃO precisa selecionar conta
  // Cria apenas dívida
} else if (type === 'RECEITA') {
  // Receita
  // Seleciona conta para RECEBER
  // NÃO pode ser cartão de crédito
} else {
  // Despesa
  // Pode ser:
  //   - Conta bancária (débito imediato)
  //   - Cartão de crédito (vai para fatura)
}
```

**Exemplo:**
```
Despesa de R$ 100:
  Opção 1: Conta Corrente
    → Saldo: -R$ 100 (imediato)
  
  Opção 2: Cartão Visa
    → Limite: -R$ 100 (imediato)
    → Fatura: +R$ 100 (para pagar depois)
    → Saldo da conta: mantém
```

#### 3.3 Compartilhamento

**Switch: "Despesa Compartilhada"**

Quando ativado:
1. Mostra lista de contatos
2. Permite selecionar participantes
3. Calcula divisão automática

**Métodos de Divisão:**

```
1. IGUAL (padrão):
   Total: R$ 300
   Participantes: 3
   Cada um: R$ 100

2. PORCENTAGEM:
   Total: R$ 300
   Você: 50% = R$ 150
   Maria: 30% = R$ 90
   João: 20% = R$ 60

3. VALOR FIXO:
   Total: R$ 300
   Você: R$ 120
   Maria: R$ 100
   João: R$ 80
```

**Cálculo Automático:**

```typescript
// Código real do sistema
const totalParticipants = selectedContacts.length + 1; // +1 para você
const myShare = amount / totalParticipants;

// Exemplo:
// amount = 300
// selectedContacts = ['maria', 'joao'] (2 pessoas)
// totalParticipants = 3
// myShare = 100
```

#### 3.4 Viagem

**Switch: "Vincular a Viagem"**

Quando ativado:
1. Mostra lista de viagens
2. Seleciona viagem
3. Vincula transação

**Efeitos:**
- Transação aparece nos gastos da viagem
- Conta para o orçamento da viagem
- Pode ser filtrada por viagem
- Se compartilhada, dívidas ficam vinculadas à viagem

**Exemplo:**
```
Viagem: Paris 2024
Orçamento: R$ 5.000

Despesa: Jantar (R$ 300, compartilhada com 2)
  Minha parte: R$ 100
  Gasto da viagem: R$ 100
  Orçamento restante: R$ 4.900
```

#### 3.5 Parcelamento

**Campo: "Parcelar em X vezes"**

Divide a compra em parcelas mensais.

**Lógica:**
```
Compra de R$ 600 em 3x:
  Parcela 1: R$ 200 (hoje)
  Parcela 2: R$ 200 (daqui 1 mês)
  Parcela 3: R$ 200 (daqui 2 meses)

Se for cartão:
  Fatura mês 1: R$ 200
  Fatura mês 2: R$ 200
  Fatura mês 3: R$ 200

Se for conta:
  Saldo mês 1: -R$ 200
  Saldo mês 2: -R$ 200
  Saldo mês 3: -R$ 200
```

**Código:**
```typescript
if (installments > 1) {
  // Criar transação pai
  const parentTransaction = {
    ...data,
    isInstallment: true,
    totalInstallments: installments
  };

  // Criar parcelas
  for (let i = 1; i <= installments; i++) {
    const installmentDate = addMonths(date, i - 1);
    const installmentAmount = amount / installments;
    
    createTransaction({
      ...parentTransaction,
      installmentNumber: i,
      amount: installmentAmount,
      date: installmentDate
    });
  }
}
```

#### 3.6 Pago por Outra Pessoa

**Switch: "Pago por Outra Pessoa"**

Quando ativado:
1. Não precisa selecionar conta
2. Seleciona quem pagou
3. Cria apenas dívida (não debita da conta)

**Exemplo:**
```
Uber de R$ 30 pago pela Maria:
  
  NÃO cria transação na sua conta
  Cria SharedDebt:
    Você deve: R$ 30
    Para: Maria
    Status: active
```

**Diferença importante:**
```
VOCÊ PAGOU (compartilhada):
  Transaction: -R$ 300 (sua conta)
  SharedDebt: Maria deve R$ 100
  SharedDebt: João deve R$ 100
  Seu gasto: R$ 100

MARIA PAGOU:
  Transaction: NÃO cria
  SharedDebt: Você deve R$ 100 para Maria
  Seu gasto: R$ 100 (mas não saiu da sua conta)
```

---

## 4. DESPESAS COMPARTILHADAS

### 🤝 Conceito

Despesa compartilhada é quando várias pessoas dividem o custo de algo.

**Exemplo do mundo real:**
```
Você, Maria e João vão jantar.
Conta: R$ 300
Vocês decidem dividir igualmente.
Você paga a conta toda.

Resultado:
  Você gastou: R$ 100 (sua parte)
  Maria deve: R$ 100
  João deve: R$ 100
```

### 💡 Lógica de Criação

**Passo 1: Criar Transação**
```typescript
const transaction = {
  description: "Jantar",
  amount: 300,
  type: "DESPESA",
  accountId: "sua-conta",
  isShared: true,
  myShare: 100,
  totalSharedAmount: 300,
  sharedWith: ["maria-id", "joao-id"]
};

// Debita R$ 300 da sua conta
account.balance -= 300;
```

**Passo 2: Criar Dívidas**
```typescript
// Para cada participante
for (const participantId of sharedWith) {
  createSharedDebt({
    creditorId: "você",      // Quem pagou
    debtorId: participantId, // Quem deve
    amount: myShare,         // Quanto deve
    transactionId: transaction.id,
    status: "active"
  });
}

// Resultado:
// SharedDebt 1: Maria deve R$ 100
// SharedDebt 2: João deve R$ 100
```

### 📊 Tipos de Itens na Fatura

**CRÉDITO (Credit)** - Alguém te deve
```
Você pagou R$ 300
Maria deve R$ 100
João deve R$ 100

Na fatura de Maria:
  Tipo: CREDIT
  Descrição: Jantar
  Valor: R$ 100
  Status: Pendente
```

**DÉBITO (Debit)** - Você deve
```
Maria pagou R$ 300
Você deve R$ 100

Na sua fatura:
  Tipo: DEBIT
  Descrição: Jantar
  Valor: R$ 100
  Status: Pendente
```

### 💳 Fatura Consolidada

**Conceito:** Agrupar todas as dívidas de uma pessoa para pagar de uma vez.

**Exemplo:**
```
Maria te deve:
  1. Jantar (05/12) - R$ 100
  2. Uber (06/12) - R$ 30
  3. Cinema (07/12) - R$ 50
  
Total: R$ 180

Você clica "Receber Tudo":
  1. Seleciona conta para receber
  2. Define data do pagamento
  3. Sistema cria:
     - Transação de RECEITA: R$ 180
     - Marca as 3 dívidas como "paid"
     - Atualiza saldo da conta: +R$ 180
```

### 🔄 Fluxo Completo

```
1. CRIAR DESPESA COMPARTILHADA
   └─> Você paga R$ 300
       └─> Sua conta: -R$ 300
       └─> Seu gasto: R$ 100 (myShare)
       └─> Cria dívidas: Maria (R$ 100), João (R$ 100)

2. VISUALIZAR FATURA
   └─> Aba "Pendentes"
       └─> Maria te deve: R$ 100
       └─> João te deve: R$ 100
       └─> Total a receber: R$ 200

3. MARIA PAGA
   └─> Clica "Pagar Tudo"
       └─> Seleciona conta
       └─> Confirma
       └─> Sistema cria:
           ├─> Transaction (RECEITA): +R$ 100
           ├─> Atualiza conta: +R$ 100
           └─> Marca dívida: status = "paid"

4. RESULTADO FINAL
   └─> Você gastou: R$ 100 (sua parte)
   └─> Você recebeu: R$ 100 (de Maria)
   └─> Gasto líquido: R$ 0
   └─> Aguardando: R$ 100 (de João)
```

---



## 5. VIAGENS

### ✈️ Conceito

Viagem é um agrupador de despesas com orçamento próprio.

**Por que usar viagens?**
- Separar gastos de férias do dia a dia
- Controlar orçamento específico
- Compartilhar despesas com companheiros de viagem
- Ter visão clara do que foi gasto

### 📋 Estrutura de uma Viagem

```typescript
interface Trip {
  id: string;
  name: string;              // "Férias em Paris"
  destination: string;       // "Paris, França"
  startDate: Date;          // Início
  endDate: Date;            // Fim
  budget: number;           // Orçamento total
  spent: number;            // Quanto já gastou
  currency: string;         // "EUR", "BRL", etc
  participants: string[];   // ["Você", "Maria", "João"]
  status: 'planned' | 'active' | 'completed';
}
```

### 💰 Cálculo de Gastos

**Regra Fundamental:** Só conta SUA PARTE das despesas.

```
Despesa 1: Hotel R$ 600 (só você)
  Gasto da viagem: R$ 600

Despesa 2: Jantar R$ 300 (compartilhada com 2)
  Total: R$ 300
  Sua parte: R$ 100
  Gasto da viagem: R$ 100

Despesa 3: Reembolso R$ 50 (Maria te pagou)
  Tipo: RECEITA
  Gasto da viagem: -R$ 50

Total gasto: R$ 600 + R$ 100 - R$ 50 = R$ 650
```

**Código:**
```typescript
const calculateTripSpent = (transactions) => {
  return transactions.reduce((sum, t) => {
    const isIncome = t.type === 'RECEITA';
    
    // Para compartilhadas, usar myShare
    const value = t.isShared && t.myShare !== null
      ? Math.abs(t.myShare)
      : Math.abs(t.amount);
    
    // RECEITA subtrai (reembolso), DESPESA soma
    return isIncome ? sum - value : sum + value;
  }, 0);
};
```

### 🎯 Orçamento e Progresso

```
Orçamento: R$ 5.000
Gasto: R$ 1.200
Disponível: R$ 3.800
Progresso: 24%

Cálculo:
  progresso = (gasto / orçamento) * 100
  disponível = orçamento - gasto
```

**Alertas:**
```
< 80%: Verde (tudo bem)
80-100%: Amarelo (atenção)
> 100%: Vermelho (excedeu)
```

### 👥 Participantes

**Função:** Definir quem está na viagem.

**Importante:**
- Participantes da viagem ≠ Participantes de cada despesa
- Você pode ter 5 pessoas na viagem
- Mas cada despesa pode ser com pessoas diferentes

**Exemplo:**
```
Viagem: Paris 2024
Participantes: Você, Maria, João, Ana, Pedro

Despesa 1: Jantar (Você, Maria, João)
  Compartilhada entre 3

Despesa 2: Museu (Você, Ana)
  Compartilhada entre 2

Despesa 3: Hotel (Você, Maria, João, Ana, Pedro)
  Compartilhada entre 5
```

### 🔗 Vinculação de Transações

**Automática:**
```typescript
// Quando cria transação com tripId
const transaction = {
  description: "Jantar",
  amount: 300,
  tripId: "paris-2024",
  // ...
};

// Sistema automaticamente:
// 1. Vincula à viagem
// 2. Atualiza spent da viagem
// 3. Mostra na lista de despesas da viagem
```

**Manual:**
```
Transação já existe sem viagem
  → Editar transação
  → Selecionar viagem
  → Salvar
  → Agora aparece na viagem
```

### 📊 Visão da Viagem

**Informações Exibidas:**

```
┌─────────────────────────────────────────┐
│ PARIS 2024                              │
│ Paris, França                           │
│ 01/12/2024 - 10/12/2024 (10 dias)      │
├─────────────────────────────────────────┤
│ Orçamento: €5.000                       │
│ Meu Gasto: €1.200 (24%)                 │
│ Disponível: €3.800                      │
├─────────────────────────────────────────┤
│ Participantes: 3 pessoas                │
│ • Você (organizador)                    │
│ • Maria                                 │
│ • João                                  │
├─────────────────────────────────────────┤
│ DESPESAS:                               │
│ • Hotel - €600 (só você)                │
│ • Jantar - €300 (compartilhada)         │
│   Sua parte: €100                       │
│ • Museu - €200 (compartilhada)          │
│   Sua parte: €100                       │
│                                         │
│ RECEBIMENTOS:                           │
│ • Maria pagou - €100                    │
└─────────────────────────────────────────┘
```

---

## 6. PARTIDAS DOBRADAS

### 📚 Conceito Contábil

Partidas dobradas é um método contábil onde toda transação tem dois lados:
- **DÉBITO:** Onde o dinheiro vai
- **CRÉDITO:** De onde o dinheiro vem

**Regra de Ouro:** DÉBITO = CRÉDITO (sempre)

### 💡 Por que Usar?

1. **Rastreabilidade:** Sabe exatamente de onde veio e para onde foi
2. **Auditoria:** Pode verificar se tudo está correto
3. **Relatórios:** Gera balanços e demonstrativos precisos
4. **Profissional:** Usado por empresas do mundo todo

### 🔢 Tipos de Contas

```
ATIVO (o que você TEM):
  • Conta Corrente
  • Poupança
  • Investimentos
  • Dinheiro em espécie

PASSIVO (o que você DEVE):
  • Cartão de Crédito
  • Empréstimos
  • Financiamentos

RECEITA (o que você GANHA):
  • Salário
  • Freelance
  • Investimentos
  • Vendas

DESPESA (o que você GASTA):
  • Alimentação
  • Transporte
  • Moradia
  • Lazer
```

### 📝 Exemplos Práticos

**Exemplo 1: Receber Salário**
```
Valor: R$ 5.000
Tipo: RECEITA

Partidas Dobradas:
  DÉBITO:  Conta Corrente (Ativo) +5.000
  CRÉDITO: Salário (Receita) +5.000

Interpretação:
  "Minha conta corrente aumentou R$ 5.000
   porque recebi salário de R$ 5.000"
```

**Exemplo 2: Pagar Almoço**
```
Valor: R$ 50
Tipo: DESPESA

Partidas Dobradas:
  DÉBITO:  Alimentação (Despesa) +50
  CRÉDITO: Conta Corrente (Ativo) -50

Interpretação:
  "Minha despesa com alimentação aumentou R$ 50
   e minha conta corrente diminuiu R$ 50"
```

**Exemplo 3: Transferência entre Contas**
```
Valor: R$ 1.000
De: Conta Corrente
Para: Poupança

Partidas Dobradas:
  DÉBITO:  Poupança (Ativo) +1.000
  CRÉDITO: Conta Corrente (Ativo) -1.000

Interpretação:
  "Minha poupança aumentou R$ 1.000
   e minha conta corrente diminuiu R$ 1.000"
```

**Exemplo 4: Compra no Cartão**
```
Valor: R$ 500
Tipo: DESPESA
Cartão: Visa

Partidas Dobradas:
  DÉBITO:  Compras (Despesa) +500
  CRÉDITO: Cartão Visa (Passivo) +500

Interpretação:
  "Minha despesa com compras aumentou R$ 500
   e minha dívida no cartão aumentou R$ 500"
```

**Exemplo 5: Pagar Fatura do Cartão**
```
Valor: R$ 500
De: Conta Corrente
Para: Cartão Visa

Partidas Dobradas:
  DÉBITO:  Cartão Visa (Passivo) -500
  CRÉDITO: Conta Corrente (Ativo) -500

Interpretação:
  "Minha dívida no cartão diminuiu R$ 500
   e minha conta corrente diminuiu R$ 500"
```

### 🎯 Balanço Patrimonial

Com partidas dobradas, você pode gerar um balanço:

```
ATIVO (o que você tem):
  Conta Corrente:    R$ 5.000
  Poupança:          R$ 10.000
  Investimentos:     R$ 20.000
  ─────────────────────────────
  Total Ativo:       R$ 35.000

PASSIVO (o que você deve):
  Cartão Visa:       R$ 2.000
  Empréstimo:        R$ 5.000
  ─────────────────────────────
  Total Passivo:     R$ 7.000

PATRIMÔNIO LÍQUIDO:
  Ativo - Passivo = R$ 28.000
```

---

## 7. CARTÕES DE CRÉDITO E FATURAS

### 💳 Conceito

Cartão de crédito é uma linha de crédito que permite comprar agora e pagar depois.

**Diferença fundamental:**
```
DÉBITO:
  Compra R$ 100
  Saldo da conta: -R$ 100 (imediato)

CRÉDITO:
  Compra R$ 100
  Saldo da conta: mantém
  Limite disponível: -R$ 100
  Fatura: +R$ 100 (para pagar depois)
```

### 📅 Ciclo do Cartão

```
Dia 1: Fechamento da fatura anterior
Dia 5: Compra de R$ 100
Dia 10: Compra de R$ 200
Dia 15: Compra de R$ 150
Dia 30: Fechamento da fatura atual

Fatura do mês:
  Total: R$ 450
  Vencimento: Dia 10 do próximo mês
```

### 💰 Lógica de Faturas

**Estrutura:**
```typescript
interface Invoice {
  id: string;
  creditCardId: string;
  month: number;           // 1-12
  year: number;           // 2024
  totalAmount: number;    // Total da fatura
  paidAmount: number;     // Quanto já pagou
  dueDate: Date;         // Vencimento
  status: 'open' | 'partial' | 'paid' | 'overdue';
}
```

**Estados:**
```
OPEN (Aberta):
  Fatura do mês atual
  Ainda pode adicionar compras
  
PARTIAL (Parcial):
  Pagou parte da fatura
  Ainda tem saldo devedor
  
PAID (Paga):
  Pagou tudo
  Fatura fechada
  
OVERDUE (Vencida):
  Passou do vencimento
  Não pagou
```

### 🔄 Fluxo Completo

```
1. COMPRA NO CARTÃO
   └─> Transaction:
       ├─> amount: R$ 500
       ├─> type: DESPESA
       ├─> creditCardId: "visa-123"
       └─> Partidas Dobradas:
           ├─> DÉBITO: Compras +500
           └─> CRÉDITO: Cartão Visa +500
   
   └─> CreditCard:
       ├─> limit: R$ 5.000
       ├─> currentBalance: R$ 500 (+500)
       └─> available: R$ 4.500 (-500)
   
   └─> Invoice (mês atual):
       └─> totalAmount: R$ 500 (+500)

2. FECHAMENTO DA FATURA
   └─> Invoice:
       ├─> status: "open" → "open" (aguardando pagamento)
       ├─> dueDate: 10/próximo mês
       └─> totalAmount: R$ 500

3. PAGAMENTO DA FATURA
   └─> Transaction:
       ├─> amount: R$ 500
       ├─> type: DESPESA
       ├─> accountId: "conta-corrente"
       └─> Partidas Dobradas:
           ├─> DÉBITO: Cartão Visa -500
           └─> CRÉDITO: Conta Corrente -500
   
   └─> Account:
       └─> balance: -R$ 500
   
   └─> CreditCard:
       ├─> currentBalance: R$ 0 (-500)
       └─> available: R$ 5.000 (+500)
   
   └─> Invoice:
       ├─> paidAmount: R$ 500
       └─> status: "paid"
```

---



## 8. PARCELAMENTO

### 📦 Conceito

Parcelamento divide uma compra em várias parcelas mensais.

**Exemplo do mundo real:**
```
TV de R$ 1.200 em 3x sem juros:
  Parcela 1: R$ 400 (hoje)
  Parcela 2: R$ 400 (mês que vem)
  Parcela 3: R$ 400 (daqui 2 meses)
```

### 💡 Lógica de Criação

**Passo 1: Criar Transação Pai**
```typescript
const parentTransaction = {
  description: "TV Samsung 50\"",
  amount: 1200,
  type: "DESPESA",
  creditCardId: "visa-123",
  isInstallment: true,
  totalInstallments: 3,
  installmentNumber: 0, // Pai não tem número
};
```

**Passo 2: Criar Parcelas**
```typescript
for (let i = 1; i <= 3; i++) {
  const installmentDate = addMonths(baseDate, i - 1);
  const installmentAmount = 1200 / 3; // R$ 400
  
  createTransaction({
    description: "TV Samsung 50\" (parcela 1/3)",
    amount: 400,
    type: "DESPESA",
    creditCardId: "visa-123",
    date: installmentDate,
    isInstallment: true,
    installmentNumber: i,
    totalInstallments: 3,
    parentTransactionId: parentTransaction.id,
  });
}
```

**Resultado:**
```
Transaction 1 (Pai):
  id: "parent-123"
  description: "TV Samsung 50\""
  amount: 1200
  isInstallment: true
  totalInstallments: 3
  installmentNumber: 0

Transaction 2 (Parcela 1):
  id: "inst-1"
  description: "TV Samsung 50\" (1/3)"
  amount: 400
  date: 2024-12-01
  installmentNumber: 1
  parentTransactionId: "parent-123"

Transaction 3 (Parcela 2):
  id: "inst-2"
  description: "TV Samsung 50\" (2/3)"
  amount: 400
  date: 2025-01-01
  installmentNumber: 2
  parentTransactionId: "parent-123"

Transaction 4 (Parcela 3):
  id: "inst-3"
  description: "TV Samsung 50\" (3/3)"
  amount: 400
  date: 2025-02-01
  installmentNumber: 3
  parentTransactionId: "parent-123"
```

### 💳 Parcelamento no Cartão

**Impacto nas Faturas:**
```
Compra: R$ 1.200 em 3x
Cartão: Visa

Fatura Dezembro/2024:
  • TV Samsung (1/3): R$ 400
  • Outras compras: R$ 200
  Total: R$ 600

Fatura Janeiro/2025:
  • TV Samsung (2/3): R$ 400
  • Outras compras: R$ 150
  Total: R$ 550

Fatura Fevereiro/2025:
  • TV Samsung (3/3): R$ 400
  • Outras compras: R$ 100
  Total: R$ 500
```

### 🔄 Fluxo Completo

```
1. USUÁRIO COMPRA PARCELADO
   └─> Formulário:
       ├─> Valor: R$ 1.200
       ├─> Parcelas: 3x
       └─> Cartão: Visa

2. SISTEMA CRIA PARCELAS
   └─> 3 transações:
       ├─> Parcela 1: Dez/2024 - R$ 400
       ├─> Parcela 2: Jan/2025 - R$ 400
       └─> Parcela 3: Fev/2025 - R$ 400

3. CADA PARCELA VAI PARA SUA FATURA
   └─> Fatura Dez: +R$ 400
   └─> Fatura Jan: +R$ 400
   └─> Fatura Fev: +R$ 400

4. USUÁRIO PAGA CADA FATURA
   └─> Paga Fatura Dez: -R$ 400 (conta)
   └─> Paga Fatura Jan: -R$ 400 (conta)
   └─> Paga Fatura Fev: -R$ 400 (conta)
```

### ⚠️ Regras Importantes

1. **Não pode editar parcela individual**
   - Edita a transação pai
   - Sistema recalcula todas as parcelas

2. **Não pode deletar parcela individual**
   - Deleta a transação pai
   - Sistema deleta todas as parcelas

3. **Parcelas são independentes nas faturas**
   - Cada parcela vai para a fatura do seu mês
   - Pode pagar fatura sem pagar todas as parcelas

---

## 9. CASOS DE USO COMPLETOS

### 📖 Caso 1: Despesa Simples

**Cenário:** Almoço no restaurante

```
1. USUÁRIO PREENCHE:
   Descrição: "Almoço no Restaurante X"
   Valor: R$ 45,00
   Tipo: DESPESA
   Categoria: Alimentação
   Conta: Conta Corrente
   Data: 18/11/2024

2. SISTEMA PROCESSA:
   Transaction:
     ├─> amount: 45
     ├─> type: DESPESA
     └─> accountId: conta-corrente
   
   Account (Conta Corrente):
     └─> balance: -45
   
   JournalEntry:
     ├─> DÉBITO: Alimentação +45
     └─> CRÉDITO: Conta Corrente -45

3. RESULTADO:
   ✅ Transação criada
   ✅ Saldo atualizado
   ✅ Partidas dobradas registradas
```

### 📖 Caso 2: Despesa Compartilhada

**Cenário:** Jantar com amigos

```
1. USUÁRIO PREENCHE:
   Descrição: "Jantar no Restaurante Y"
   Valor: R$ 300,00
   Tipo: DESPESA
   Categoria: Alimentação
   Conta: Conta Corrente
   Data: 18/11/2024
   ☑ Compartilhada
   Participantes: Maria, João
   Divisão: Igual

2. SISTEMA CALCULA:
   Total: R$ 300
   Participantes: 3 (Você + Maria + João)
   Cada um: R$ 100

3. SISTEMA PROCESSA:
   Transaction:
     ├─> amount: 300
     ├─> type: DESPESA
     ├─> accountId: conta-corrente
     ├─> isShared: true
     ├─> myShare: 100
     └─> totalSharedAmount: 300
   
   Account:
     └─> balance: -300
   
   SharedDebt (Maria):
     ├─> creditorId: você
     ├─> debtorId: maria
     ├─> amount: 100
     └─> status: active
   
   SharedDebt (João):
     ├─> creditorId: você
     ├─> debtorId: joao
     ├─> amount: 100
     └─> status: active

4. RESULTADO:
   ✅ Você pagou: R$ 300
   ✅ Seu gasto: R$ 100
   ✅ Maria deve: R$ 100
   ✅ João deve: R$ 100
```

### 📖 Caso 3: Despesa de Viagem Compartilhada

**Cenário:** Jantar em Paris

```
1. USUÁRIO PREENCHE:
   Descrição: "Jantar na Torre Eiffel"
   Valor: €150
   Tipo: DESPESA
   Categoria: Alimentação
   Conta: Conta Corrente
   Data: 05/12/2024
   ☑ Compartilhada
   Participantes: Maria, João
   ☑ Vincular a Viagem
   Viagem: Paris 2024

2. SISTEMA CALCULA:
   Total: €150
   Participantes: 3
   Cada um: €50

3. SISTEMA PROCESSA:
   Transaction:
     ├─> amount: 150
     ├─> type: DESPESA
     ├─> accountId: conta-corrente
     ├─> tripId: paris-2024
     ├─> isShared: true
     ├─> myShare: 50
     └─> totalSharedAmount: 150
   
   Account:
     └─> balance: -150
   
   Trip (Paris 2024):
     └─> spent: +50 (sua parte)
   
   SharedDebt (Maria):
     ├─> amount: 50
     ├─> tripId: paris-2024
     └─> status: active
   
   SharedDebt (João):
     ├─> amount: 50
     ├─> tripId: paris-2024
     └─> status: active

4. RESULTADO:
   ✅ Você pagou: €150
   ✅ Seu gasto na viagem: €50
   ✅ Maria deve: €50
   ✅ João deve: €50
   ✅ Orçamento da viagem atualizado
```

### 📖 Caso 4: Receber Pagamento de Dívida

**Cenário:** Maria paga o jantar

```
1. USUÁRIO ACESSA:
   Despesas Compartilhadas
   → Aba "Pendentes"
   → Maria te deve: €50
   → Clica "Receber Tudo"

2. USUÁRIO PREENCHE:
   Conta: Conta Corrente
   Data: 10/12/2024

3. SISTEMA PROCESSA:
   Transaction (Recebimento):
     ├─> description: "💰 Recebimento - Jantar (Maria)"
     ├─> amount: 50
     ├─> type: RECEITA
     ├─> accountId: conta-corrente
     ├─> tripId: paris-2024
     └─> metadata: {
           type: "shared_expense_payment",
           originalTransactionId: "trans-123",
           paidBy: "Maria"
         }
   
   Account:
     └─> balance: +50
   
   SharedDebt (Maria):
     ├─> status: active → paid
     └─> paidAt: 2024-12-10
   
   Trip (Paris 2024):
     └─> spent: 50 - 50 = 0 (reembolso)

4. RESULTADO:
   ✅ Você recebeu: €50
   ✅ Dívida marcada como paga
   ✅ Gasto líquido da viagem: €0
```

### 📖 Caso 5: Compra Parcelada no Cartão

**Cenário:** Comprar notebook

```
1. USUÁRIO PREENCHE:
   Descrição: "Notebook Dell"
   Valor: R$ 3.600,00
   Tipo: DESPESA
   Categoria: Eletrônicos
   Cartão: Visa
   Data: 18/11/2024
   Parcelas: 12x

2. SISTEMA CALCULA:
   Total: R$ 3.600
   Parcelas: 12
   Cada parcela: R$ 300

3. SISTEMA PROCESSA:
   Transaction (Pai):
     ├─> amount: 3600
     ├─> isInstallment: true
     └─> totalInstallments: 12
   
   12 Transactions (Parcelas):
     ├─> Parcela 1: Nov/2024 - R$ 300
     ├─> Parcela 2: Dez/2024 - R$ 300
     ├─> ...
     └─> Parcela 12: Out/2025 - R$ 300
   
   CreditCard (Visa):
     └─> currentBalance: +3600
   
   Invoice (Nov/2024):
     └─> totalAmount: +300
   
   Invoice (Dez/2024):
     └─> totalAmount: +300
   
   ... (e assim por diante)

4. RESULTADO:
   ✅ 12 parcelas criadas
   ✅ Cada parcela vai para sua fatura
   ✅ Limite do cartão: -R$ 3.600
```

---

## 10. RESUMO DAS REGRAS DE NEGÓCIO

### ✅ Regras Fundamentais

1. **Conservação de Valor**
   - Dinheiro não desaparece, apenas muda de lugar
   - Total do sistema sempre fecha

2. **Partidas Dobradas**
   - Toda transação tem débito e crédito
   - Débito = Crédito (sempre)

3. **Compartilhamento Justo**
   - Divisão proporcional entre participantes
   - Cada um paga sua parte

4. **Isolamento de Viagens**
   - Gastos de viagem separados
   - Orçamento próprio
   - Só conta sua parte

5. **Cartão é Dívida**
   - Compra no cartão não sai da conta
   - Vai para fatura
   - Paga depois

### 🎯 Fluxos Principais

```
DESPESA SIMPLES:
  Formulário → API → Transaction → Account (-) → Partidas Dobradas

DESPESA COMPARTILHADA:
  Formulário → API → Transaction → Account (-) → SharedDebts → Partidas Dobradas

DESPESA DE VIAGEM:
  Formulário → API → Transaction → Account (-) → Trip.spent (+) → Partidas Dobradas

DESPESA COMPARTILHADA DE VIAGEM:
  Formulário → API → Transaction → Account (-) → Trip.spent (+) → SharedDebts → Partidas Dobradas

RECEBER PAGAMENTO:
  Fatura → API → Transaction (RECEITA) → Account (+) → SharedDebt.status = paid

COMPRA NO CARTÃO:
  Formulário → API → Transaction → CreditCard.balance (+) → Invoice (+) → Partidas Dobradas

PAGAR FATURA:
  Fatura → API → Transaction → Account (-) → CreditCard.balance (-) → Invoice.status = paid
```

### 📊 Cálculos Importantes

**Gasto Individual em Compartilhada:**
```typescript
myShare = totalAmount / (participants.length + 1)
```

**Gasto da Viagem:**
```typescript
tripSpent = sum(
  transactions
    .filter(t => t.tripId === tripId)
    .map(t => {
      const value = t.isShared ? t.myShare : t.amount;
      return t.type === 'RECEITA' ? -value : value;
    })
)
```

**Progresso do Orçamento:**
```typescript
progress = (spent / budget) * 100
available = budget - spent
```

**Saldo da Conta:**
```typescript
balance = initialBalance + sum(receitas) - sum(despesas)
```

**Limite Disponível do Cartão:**
```typescript
available = limit - currentBalance
```

---

**Documento criado em:** 18/11/2024  
**Última atualização:** 18/11/2024  
**Versão:** 1.0  
**Autor:** Sistema de Documentação

