# 🚀 GUIA RÁPIDO - NOVAS FUNCIONALIDADES

**Referência Rápida para Desenvolvedores**

---

## 📋 ÍNDICE

1. [Cheque Especial](#cheque-especial)
2. [Limite Excedido em Cartão](#limite-excedido-em-cartão)
3. [Parcelamento com Juros](#parcelamento-com-juros)
4. [Antecipação de Parcelas](#antecipação-de-parcelas)
5. [Detecção de Duplicatas](#detecção-de-duplicatas)
6. [Validação de Orçamento](#validação-de-orçamento)
7. [Partidas Dobradas para Cartão](#partidas-dobradas-para-cartão)

---

## 1. CHEQUE ESPECIAL

### Configurar Conta

```typescript
await prisma.account.update({
  where: { id: accountId },
  data: {
    allowNegativeBalance: true,
    overdraftLimit: 500, // R$ 500 de limite
    overdraftInterestRate: 8.0, // 8% a.m. (opcional)
  },
});
```

### Como Funciona

- Se `allowNegativeBalance = false`: Bloqueia se saldo < 0
- Se `allowNegativeBalance = true`: Permite até `overdraftLimit`
- Se `overdraftInterestRate` definido: Avisa sobre juros

### Exemplo

```
Saldo: R$ 100
Cheque especial: R$ 500
Despesa: R$ 300
Resultado: ✅ Aprovado (usando R$ 200 do cheque especial)
```

---

## 2. LIMITE EXCEDIDO EM CARTÃO

### Configurar Cartão

```typescript
await prisma.creditCard.update({
  where: { id: cardId },
  data: {
    allowOverLimit: true,
    overLimitPercent: 10, // Permite até 110% do limite
  },
});
```

### Como Funciona

- Se `allowOverLimit = false`: Bloqueia no limite exato
- Se `allowOverLimit = true`: Permite até `limit * (1 + overLimitPercent/100)`

### Exemplo

```
Limite: R$ 1.000
Over limit: 10%
Limite máximo: R$ 1.100
Usado: R$ 950
Compra: R$ 100
Resultado: ✅ Aprovado
```

---

## 3. PARCELAMENTO COM JUROS

### Criar Parcelamento SEM Juros (Loja)

```typescript
await FinancialOperationsService.createInstallments({
  baseTransaction: {
    userId,
    accountId,
    amount: -1200,
    description: 'Notebook',
    type: 'DESPESA',
    date: new Date(),
  },
  totalInstallments: 12,
  firstDueDate: new Date(),
  frequency: 'monthly',
  installmentType: 'STORE', // ✅ Sem juros
});

// Resultado: 12x R$ 100,00 = R$ 1.200,00
```

### Criar Parcelamento COM Juros (Banco)

```typescript
await FinancialOperationsService.createInstallments({
  baseTransaction: {
    userId,
    accountId,
    amount: -1200,
    description: 'Notebook',
    type: 'DESPESA',
    date: new Date(),
  },
  totalInstallments: 12,
  firstDueDate: new Date(),
  frequency: 'monthly',
  installmentType: 'BANK', // ✅ Com juros
  interestRate: 2.99, // ✅ 2.99% a.m.
});

// Resultado: 12x R$ 113,45 = R$ 1.361,40
// Juros: R$ 161,40
```

### Fórmula de Juros Compostos

```
PMT = P * [r(1+r)^n] / [(1+r)^n - 1]

Onde:
P = Principal (valor total)
r = Taxa mensal (em decimal)
n = Número de parcelas
PMT = Valor da parcela
```

---

## 4. ANTECIPAÇÃO DE PARCELAS

### Via API

```typescript
const response = await fetch('/api/installments/anticipate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    installmentGroupId: 'inst_123',
    accountId: 'acc_123',
    discountPercent: 10, // 10% de desconto
  }),
});

const result = await response.json();
```

### Via Contexto

```typescript
const { actions } = useUnifiedFinancialContext();

const result = await actions.anticipateInstallments(
  'inst_123', // installmentGroupId
  'acc_123', // accountId
  10 // discountPercent
);
```

### Resposta

```json
{
  "success": true,
  "installmentsPaid": 9,
  "originalTotal": 900.00,
  "discount": 90.00,
  "totalPaid": 810.00,
  "savedAmount": 90.00
}
```

---

## 5. DETECÇÃO DE DUPLICATAS

### Como Funciona

Automaticamente detecta transações duplicadas ao criar:

```typescript
// Ao criar transação, o sistema verifica:
// - Mesmo valor
// - Mesma descrição
// - Data próxima (±1 dia)

// Se encontrar, avisa no console:
console.warn('⚠️ Possível transação duplicada detectada');
```

### Configurar para Bloquear

```typescript
// No método createTransaction, adicione:
const duplicateCheck = await this.detectDuplicate(transaction);
if (duplicateCheck.isDuplicate) {
  throw new Error('Transação duplicada detectada!');
}
```

---

## 6. VALIDAÇÃO DE ORÇAMENTO

### Modo Aviso (Padrão)

```typescript
// Apenas avisa, não bloqueia
await FinancialOperationsService.createTransaction({
  transaction: {
    // ... dados da transação
  },
});

// Se exceder orçamento:
// - Cria notificação
// - Avisa no console
// - MAS permite criar transação
```

### Modo Bloqueio

```typescript
// Bloqueia se exceder 100%
await validateBudget(tx, transaction, {
  blockIfExceeded: true, // ✅ Bloqueia
});

// Se exceder orçamento:
// - Lança erro
// - NÃO cria transação
```

---

## 7. PARTIDAS DOBRADAS PARA CARTÃO

### Como Funciona

**Compra no Cartão:**
```
❌ NÃO cria journal entries imediatamente
✅ Apenas registra a compra
```

**Pagamento da Fatura:**
```
✅ Cria journal entries:
- Débito: Passivo (Cartão) - diminui dívida
- Crédito: Ativo (Conta) - diminui saldo
```

### Exemplo

```typescript
// 1. Compra no cartão (não cria journal entries)
await createTransaction({
  creditCardId: 'card_123',
  amount: -100,
  description: 'Compra',
  // ❌ Não cria journal entries ainda
});

// 2. Pagamento da fatura (cria journal entries)
await payInvoice({
  invoiceId: 'inv_123',
  accountId: 'acc_123',
  amount: 100,
  // ✅ Agora cria journal entries:
  // Débito: Passivo (Cartão) R$ 100
  // Crédito: Ativo (Conta) R$ 100
});
```

---

## 📚 REFERÊNCIAS COMPLETAS

- **Auditoria Completa:** `BRECHAS-REGRAS-FINANCEIRAS-COMPLETO.md`
- **Correções Detalhadas:** `CORRECOES-BRECHAS-IMPLEMENTADAS.md`
- **Guia de Aplicação:** `APLICAR-CORRECOES.md`
- **Resumo Final:** `RESUMO-FINAL-IMPLEMENTACAO.md`

---

## 🆘 TROUBLESHOOTING

### Erro: "Property 'allowNegativeBalance' does not exist"

```bash
npx prisma generate
```

### Erro: "Column not found"

```bash
npx prisma migrate dev
```

### Validação não funciona

```bash
# Reiniciar servidor
npm run dev
```

---

**Guia criado por:** Kiro AI  
**Data:** 28/10/2025  
**Versão:** 1.0
