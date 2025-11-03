# 🔧 Correções: "Pago por Outra Pessoa"

## ❌ Problema Identificado

Quando cria uma despesa marcando "Pago por outra pessoa", o sistema está:
- ❌ Criando Transaction
- ❌ Debitando da conta/cartão
- ❌ Registrando como despesa

**Mas NÃO DEVERIA fazer isso!**

---

## ✅ Comportamento Correto

Quando "Pago por outra pessoa":
1. ❌ NÃO criar Transaction
2. ✅ Criar apenas SharedDebt
3. ❌ NÃO debitar conta
4. ❌ NÃO registrar despesa
5. ✅ Aparecer na fatura compartilhada

---

## 🔧 Correções Necessárias

### 1. API `/api/transactions` (POST)

**Arquivo**: `src/app/api/transactions/route.ts`

**Adicionar validação**:

```typescript
export async function POST(request: Request) {
  const body = await request.json();
  
  // ✅ NOVO: Se é "pago por outra pessoa", criar SharedDebt em vez de Transaction
  if (body.paidBy && body.paidBy !== session.user.id) {
    // Criar SharedDebt
    const debt = await prisma.sharedDebt.create({
      data: {
        userId: session.user.id,
        creditorId: body.paidBy, // Quem pagou
        debtorId: session.user.id, // Eu (quem deve)
        originalAmount: body.myShare || body.amount,
        currentAmount: body.myShare || body.amount,
        description: body.description,
        status: 'active',
        metadata: JSON.stringify({
          category: body.categoryId,
          date: body.date,
          sharedWith: body.sharedWith,
        }),
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      debt,
      message: 'Dívida registrada com sucesso'
    });
  }
  
  // Continua com criação normal de Transaction...
}
```

---

### 2. Formulário de Transação

**Arquivo**: `src/components/modals/transactions/add-transaction-modal.tsx`

**Adicionar placeholders**:

```typescript
// No select de conta
<SelectTrigger>
  <SelectValue placeholder="Selecione uma conta" />
</SelectTrigger>

// No select de cartão
<SelectTrigger>
  <SelectValue placeholder="Selecione um cartão" />
</SelectTrigger>

// No select de categoria
<SelectTrigger>
  <SelectValue placeholder="Selecione uma categoria" />
</SelectTrigger>
```

**Desabilitar conta quando "pago por outra pessoa"**:

```typescript
<Select
  value={formData.account}
  onValueChange={(value) => setFormData(prev => ({ ...prev, account: value }))}
  disabled={formData.isPaidBy} // ✅ Desabilita se pago por outro
>
  <SelectTrigger>
    <SelectValue placeholder={
      formData.isPaidBy 
        ? "Não precisa selecionar (pago por outra pessoa)" 
        : "Selecione uma conta"
    } />
  </SelectTrigger>
</Select>
```

---

### 3. Validação no Submit

**Arquivo**: `src/components/modals/transactions/add-transaction-modal.tsx`

**Atualizar validação**:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // ✅ CORREÇÃO: Só validar conta se NÃO for "pago por outra pessoa"
  if (!formData.isPaidBy) {
    if (!formData.account) {
      toast.error('Selecione uma conta');
      return;
    }
  } else {
    // ✅ NOVO: Validar quem pagou
    if (!formData.paidByPerson) {
      toast.error('Selecione quem pagou');
      return;
    }
  }
  
  // Continua...
}
```

---

## 📊 Fluxo Correto

### Cenário: Amigo paga R$ 10, dividimos 50/50

```
1. Usuário preenche:
   - Descrição: "Almoço"
   - Valor: R$ 10
   - Compartilhar: Sim
   - Dividir: 50/50
   - ✅ Pago por: Amigo
   - Conta: (desabilitado)

2. Sistema cria:
   ✅ SharedDebt:
      - creditorId: amigo-id
      - debtorId: user-id
      - amount: R$ 5 (minha parte)
      - status: 'active'
   
   ❌ NÃO cria Transaction
   ❌ NÃO debita conta

3. Resultado:
   - Conta: R$ 0 (não mudou)
   - Despesa: R$ 0 (ainda não registrei)
   - Devo: R$ 5 (para o amigo)
   - Fatura: Aparece como DEBIT

4. Quando PAGAR a fatura:
   ✅ Aí sim cria Transaction:
      DÉBITO:  Despesa R$ 5
      CRÉDITO: Conta R$ 5
   
   ✅ Marca SharedDebt como paga
```

---

## 🧪 Teste de Validação

Após correções, testar:

1. ✅ Criar despesa "pago por outra pessoa"
   - Verificar: NÃO criou Transaction
   - Verificar: NÃO debitou conta
   - Verificar: Criou SharedDebt
   - Verificar: Aparece na fatura

2. ✅ Pagar fatura
   - Verificar: Criou Transaction
   - Verificar: Debitou conta
   - Verificar: Registrou despesa
   - Verificar: Marcou SharedDebt como paga

---

## 📝 Checklist de Implementação

- [ ] Adicionar validação na API `/api/transactions`
- [ ] Criar SharedDebt quando `paidBy` está preenchido
- [ ] Adicionar placeholders nos selects
- [ ] Desabilitar select de conta quando "pago por outra pessoa"
- [ ] Atualizar validação no submit
- [ ] Testar criação de despesa "pago por outra pessoa"
- [ ] Testar pagamento de fatura
- [ ] Verificar lançamentos contábeis

---

## ✅ Transação Excluída

- ✅ Transação "oi" (R$ 30) foi excluída
- ✅ Lançamentos contábeis removidos
- ✅ Saldo da conta deve voltar para R$ 9.900,00

---

**Correções documentadas em: 30 de Outubro de 2025**
**Status: AGUARDANDO IMPLEMENTAÇÃO**
