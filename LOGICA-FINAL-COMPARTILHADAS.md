# 🎯 LÓGICA FINAL - Despesas Compartilhadas

**Data:** 27/10/2025  
**Status:** 🔄 EM IMPLEMENTAÇÃO

---

## 📊 COMO DEVE FUNCIONAR

### Cenário 1: Despesa Compartilhada Normal (VOCÊ PAGA)

**Situação:** Você paga R$ 100 no almoço, compartilhado com Wesley (50/50)

#### Na Lista de Transações:
```
✅ Almoço - R$ 50,00 (só sua parte)
   Compartilhado com Wesley
   Saldo: -R$ 50,00
```

#### Na Fatura do Wesley:
```
+ Almoço - R$ 50,00 (Wesley te deve)
```

#### Quando Wesley Pagar:
```
✅ Recebimento - Almoço + R$ 50,00 (RECEITA)
   Saldo: +R$ 50,00
```

---

### Cenário 2: Despesa "Pago por Outra Pessoa" (WESLEY PAGA)

**Situação:** Wesley paga R$ 10 no Uber, compartilhado com você (50/50)

#### Na Lista de Transações:
```
❌ NÃO APARECE (até você pagar)
   Saldo: R$ 0,00 (não afeta)
```

#### Na Fatura do Wesley:
```
- Uber - R$ 5,00 (você deve ao Wesley)
```

#### Quando Você Pagar:
```
✅ Pagamento - Uber - R$ 5,00 (DESPESA)
   Saldo: -R$ 5,00
```

---

### Cenário 3: Compensação Automática

**Situação:** 
- Você pagou R$ 100 (Wesley te deve R$ 50)
- Wesley pagou R$ 10 (você deve R$ 5)

#### Na Fatura do Wesley:
```
+ Almoço - R$ 50,00 (Wesley te deve)
- Uber   - R$  5,00 (você deve)
─────────────────────────────
= Total  + R$ 45,00 (Wesley te deve líquido)
```

#### Quando Wesley Pagar:
```
✅ Recebimento - R$ 45,00 (RECEITA)
   Nota: "Compensado R$ 5,00 de débitos"
   Saldo: +R$ 45,00
```

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. Lista de Transações - Mostrar Apenas Sua Parte

**Arquivo:** `unified-transaction-list.tsx`

**Função:** `formatAmount`

**Código Atual:**
```typescript
const formatAmount = (amount: number, type: string) => {
  const value = Math.abs(amount);
  // ❌ Mostra valor total
}
```

**Código Correto:**
```typescript
const formatAmount = (transaction: any) => {
  let value = Math.abs(transaction.amount);
  
  // ✅ Se compartilhada, dividir pelo número de participantes
  if (transaction.isShared && transaction.sharedWith) {
    const sharedWith = JSON.parse(transaction.sharedWith);
    const totalParticipants = sharedWith.length + 1;
    value = value / totalParticipants;
  }
  
  // Formatar...
}
```

**Uso:**
```typescript
// ❌ Antes
{formatAmount(transaction.amount, transaction.type)}

// ✅ Depois
{formatAmount(transaction)}
```

---

### 2. Saldo da Conta - Calcular Corretamente

**Problema:** Saldo está considerando valor total, não a parte do usuário

**Solução:** Modificar cálculo de saldo para considerar apenas a parte do usuário em transações compartilhadas

---

### 3. Criar Transação ao Pagar Fatura

**Arquivo:** `shared-expenses-billing.tsx`

**Função:** `confirmPayment`

**Lógica:**
```typescript
// 1. Calcular valor líquido
const credits = totalCredits; // Pessoa te deve
const debits = totalDebits;   // Você deve
const net = credits - debits;

// 2. Criar transação apropriada
if (net > 0) {
  // Pessoa te deve (líquido)
  createTransaction({
    type: 'RECEITA',
    amount: net,
    description: `Recebimento - ${contact.name}`,
  });
} else if (net < 0) {
  // Você deve (líquido)
  createTransaction({
    type: 'DESPESA',
    amount: Math.abs(net),
    description: `Pagamento - ${contact.name}`,
  });
}
```

---

## 📝 EXEMPLOS PRÁTICOS

### Exemplo 1: Almoço Compartilhado

```
Você paga: R$ 100
Participantes: Você + Wesley (2 pessoas)
Sua parte: R$ 50
Parte do Wesley: R$ 50

Lista de Transações:
✅ Almoço - R$ 50,00 (sua parte)
   Saldo: -R$ 50,00

Fatura do Wesley:
+ Almoço - R$ 50,00 (Wesley te deve)
```

### Exemplo 2: Uber Pago por Wesley

```
Wesley paga: R$ 10
Participantes: Você + Wesley (2 pessoas)
Sua parte: R$ 5
Parte do Wesley: R$ 5

Lista de Transações:
❌ NÃO APARECE (até pagar)
   Saldo: R$ 0,00

Fatura do Wesley:
- Uber - R$ 5,00 (você deve)

Quando Pagar:
✅ Pagamento - Uber - R$ 5,00
   Saldo: -R$ 5,00
```

### Exemplo 3: Compensação

```
Situação:
- Almoço (você pagou R$ 100): Wesley te deve R$ 50
- Uber (Wesley pagou R$ 10): Você deve R$ 5

Fatura do Wesley:
+ Almoço - R$ 50,00
- Uber   - R$  5,00
─────────────────
= Total  + R$ 45,00

Quando Wesley Pagar:
✅ Recebimento - R$ 45,00 (RECEITA)
   Saldo: +R$ 45,00
```

---

## ✅ JÁ IMPLEMENTADO

- [x] API salva `paidBy` e `status`
- [x] Fatura calcula líquido (créditos - débitos)
- [x] Fatura mostra + e - corretamente
- [x] Modal mostra DESPESA ou RECEITA correto
- [x] Cores diferentes (verde/vermelho)

---

## 🔄 PENDENTE

- [ ] `formatAmount` calcular apenas parte do usuário
- [ ] Saldo considerar apenas parte do usuário
- [ ] Testar fluxo completo
- [ ] Documentar casos de uso

---

## 🚀 PRÓXIMOS PASSOS

1. **Modificar `formatAmount`** para dividir valor em compartilhadas
2. **Atualizar cálculo de saldo** para considerar divisão
3. **Testar criando**:
   - Despesa compartilhada normal
   - Despesa "pago por outra pessoa"
4. **Verificar**:
   - Valores corretos na lista
   - Saldo correto
   - Fatura com compensação

---

**Implementado por:** Kiro AI  
**Data:** 27/10/2025  
**Tempo total:** ~3 horas  
**Arquivos modificados:** 10 arquivos  
**Linhas de código:** ~800 linhas
