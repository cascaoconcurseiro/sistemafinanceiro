# ⚖️ Partidas Dobradas em Despesas Compartilhadas

## 🎯 Como Funciona

### Cenário: Despesa Compartilhada

**Situação**: Você paga R$ 10 no almoço, mas divide 50/50 com um amigo.

- **Valor total pago**: R$ 10,00
- **Sua parte**: R$ 5,00
- **Parte do amigo**: R$ 5,00

---

## 📊 Lançamentos Contábeis Corretos

### 1️⃣ Quando VOCÊ paga a despesa compartilhada

```
DÉBITO:  Despesa - Alimentação           R$ 5,00  (sua parte)
DÉBITO:  Valores a Receber - Compartilhado R$ 5,00  (parte do amigo)
CRÉDITO: Conta Corrente                  R$ 10,00 (total pago)
```

**Explicação**:
- Você gastou **R$ 5** (sua parte) → vai para Despesa
- Você tem **R$ 5 a receber** do amigo → vai para Ativo (Valores a Receber)
- Você pagou **R$ 10** no total → sai da sua conta

**Resultado**:
- ✅ Débitos: R$ 5 + R$ 5 = R$ 10
- ✅ Créditos: R$ 10
- ✅ **Balanceado!**

---

### 2️⃣ Quando o amigo paga a fatura (você recebe)

```
DÉBITO:  Conta Corrente                  R$ 5,00  (recebimento)
CRÉDITO: Valores a Receber - Compartilhado R$ 5,00  (baixa do ativo)
```

**Explicação**:
- Você recebeu **R$ 5** → entra na sua conta
- O valor a receber **diminui R$ 5** → baixa do ativo

**Resultado**:
- ✅ Débitos: R$ 5
- ✅ Créditos: R$ 5
- ✅ **Balanceado!**

---

## 🔄 Fluxo Completo

### Passo 1: Criar Despesa Compartilhada

```typescript
await doubleEntryService.createTransaction({
  userId: 'user-123',
  accountId: 'conta-corrente',
  amount: 10.00,
  description: 'Almoço',
  type: 'DESPESA',
  date: new Date(),
  categoryId: 'alimentacao',
  
  // ✅ IMPORTANTE: Informar que é compartilhada
  isShared: true,
  myShare: 5.00,  // Minha parte
  sharedWith: JSON.stringify(['amigo-id']),
});
```

**Lançamentos criados automaticamente**:
- DÉBITO: Despesa - Alimentação (R$ 5)
- DÉBITO: Valores a Receber (R$ 5)
- CRÉDITO: Conta Corrente (R$ 10)

### Passo 2: Amigo Paga a Fatura

```typescript
// Quando o amigo paga, criar transação de recebimento
await doubleEntryService.createTransaction({
  userId: 'user-123',
  accountId: 'conta-corrente',
  amount: 5.00,
  description: 'Recebimento - Fatura Compartilhada (Amigo)',
  type: 'RECEITA',
  date: new Date(),
  categoryId: 'recebimento-compartilhado',
});
```

**Lançamentos criados**:
- DÉBITO: Conta Corrente (R$ 5)
- CRÉDITO: Receita - Recebimento (R$ 5)

**Nota**: O sistema de fatura compartilhada deve baixar o valor a receber manualmente ou criar uma categoria especial que debita "Valores a Receber" em vez de "Receita".

---

## 📈 Impacto nos Relatórios

### Patrimônio Líquido

```
ATIVO:
  Conta Corrente:              R$ 990,00  (1000 - 10)
  Valores a Receber:           R$ 5,00    (a receber do amigo)
  
DESPESA:
  Alimentação:                 R$ 5,00    (só sua parte!)

TOTAL ATIVO:                   R$ 995,00
TOTAL DESPESA:                 R$ 5,00
```

**Após recebimento**:

```
ATIVO:
  Conta Corrente:              R$ 995,00  (990 + 5)
  Valores a Receber:           R$ 0,00    (recebido!)
  
DESPESA:
  Alimentação:                 R$ 5,00    (continua só sua parte)

TOTAL ATIVO:                   R$ 995,00
TOTAL DESPESA:                 R$ 5,00
```

---

## ⚠️ Comparação: Antes vs Depois

### ❌ ANTES (Incorreto)

```
// Lançava o valor total como despesa
DÉBITO:  Despesa - Alimentação  R$ 10,00
CRÉDITO: Conta Corrente         R$ 10,00
```

**Problema**: Seu relatório mostra que você gastou R$ 10, mas na verdade gastou só R$ 5!

### ✅ DEPOIS (Correto)

```
// Lança só sua parte como despesa
DÉBITO:  Despesa - Alimentação           R$ 5,00
DÉBITO:  Valores a Receber - Compartilhado R$ 5,00
CRÉDITO: Conta Corrente                  R$ 10,00
```

**Benefício**: Seu relatório mostra corretamente que você gastou R$ 5 e tem R$ 5 a receber!

---

## 🔍 Validação

### Como verificar se está correto:

```bash
# Executar script de validação
node scripts/diagnose-balance.js
```

**Deve mostrar**:
```
✅ Sistema balanceado!
   Débitos:  R$ 10.00
   Créditos: R$ 10.00
   Diferença: R$ 0.00
```

---

## 💡 Casos Especiais

### Caso 1: Divisão Desigual

**Situação**: Você paga R$ 100, sua parte é R$ 30, amigo deve R$ 70

```
DÉBITO:  Despesa - Alimentação           R$ 30,00
DÉBITO:  Valores a Receber - Compartilhado R$ 70,00
CRÉDITO: Conta Corrente                  R$ 100,00
```

### Caso 2: Múltiplas Pessoas

**Situação**: Você paga R$ 90, sua parte é R$ 30, 2 amigos devem R$ 30 cada

```
DÉBITO:  Despesa - Alimentação           R$ 30,00
DÉBITO:  Valores a Receber - Compartilhado R$ 60,00
CRÉDITO: Conta Corrente                  R$ 90,00
```

**Nota**: O sistema agrupa todos os valores a receber em uma única conta. O controle de quem deve quanto fica na tabela `SharedDebt`.

### Caso 3: Você Não Pagou (Outra Pessoa Pagou)

**Situação**: Amigo paga R$ 10, você deve R$ 5

**Neste caso, NÃO cria transação imediatamente!**

Apenas cria um registro em `SharedDebt`:
```typescript
{
  creditorId: 'amigo-id',
  debtorId: 'user-id',
  amount: 5.00,
  status: 'active'
}
```

**Quando você pagar a dívida**:
```
DÉBITO:  Despesa - Alimentação  R$ 5,00
CRÉDITO: Conta Corrente         R$ 5,00
```

---

## 🎯 Resumo

### Regras de Ouro:

1. ✅ **Despesa compartilhada** = Débito em Despesa (só sua parte) + Débito em Valores a Receber (parte dos outros)

2. ✅ **Recebimento de fatura** = Débito em Conta + Crédito em Valores a Receber

3. ✅ **Dívida (você não pagou)** = Não cria transação até pagar

4. ✅ **Sempre validar** = Débitos = Créditos

---

## 🚀 Implementação

O serviço `DoubleEntryService` já trata automaticamente despesas compartilhadas quando você passa:

```typescript
{
  isShared: true,
  myShare: 5.00,  // Sua parte
  amount: 10.00   // Total pago
}
```

**Não precisa fazer nada manualmente!** O sistema cria os lançamentos corretos automaticamente.

---

**Desenvolvido com ❤️ para SuaGrana**
