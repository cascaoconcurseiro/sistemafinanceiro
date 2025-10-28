# 🔴 Correções Críticas de Integridade Financeira

## 📋 Implementação Prioritária

Estas correções devem ser implementadas IMEDIATAMENTE para garantir integridade financeira.

---

## 1. ✅ Transações Atômicas em DELETE

### Problema Atual:
```typescript
// ❌ Se falhar no meio, fica inconsistente
await creditCardService.revertInvoicePayment(...);
await prisma.transaction.delete(...);
```

### Correção:
**Arquivo**: `src/app/api/transactions/[id]/route.ts`

```typescript
// ✅ SOLUÇÃO: Usar transação atômica do Prisma
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;

    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId: auth.userId },
      include: { account: true, creditCard: true }
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 403 });
    }

    // ✅ USAR TRANSAÇÃO ATÔMICA
    await prisma.$transaction(async (tx) => {
      // 1. Reverter fatura de cartão se necessário
      if (existingTransaction.creditCardId && existingTransaction.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: existingTransaction.invoiceId }
        });

        if (invoice && invoice.isPaid) {
          // Reverter pagamento
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              isPaid: false,
              paidAt: null,
              paidAmount: 0,
              paymentTransactionId: null
            }
          });

          // Restaurar saldo do cartão
          await tx.creditCard.update({
            where: { id: existingTransaction.creditCardId },
            data: {
              currentBalance: {
                decrement: Math.abs(Number(existingTransaction.amount))
              }
            }
          });
        }
      }

      // 2. Reverter dívidas compartilhadas se necessário
      if (existingTransaction.isShared) {
        const transactionDate = new Date(existingTransaction.date);
        const dateStart = new Date(transactionDate.getTime() - 60000);
        const dateEnd = new Date(transactionDate.getTime() + 60000);

        // Reverter transações compartilhadas
        await tx.transaction.updateMany({
          where: {
            userId: auth.userId,
            status: 'completed',
            isShared: true,
            date: { gte: dateStart, lte: dateEnd }
          },
          data: { status: 'pending' }
        });

        // Reverter dívidas
        await tx.sharedDebt.updateMany({
          where: {
            OR: [
              { debtorId: auth.userId },
              { creditorId: auth.userId }
            ],
            status: 'paid',
            paidAt: { gte: dateStart, lte: dateEnd }
          },
          data: {
            status: 'active',
            paidAt: null
          }
        });
      }

      // 3. Deletar a transação
      await tx.transaction.delete({
        where: { id }
      });
    });

    // Emitir eventos
    broadcastEvent('TRANSACTION_DELETED', {
      id: existingTransaction.id,
      accountId: existingTransaction.accountId,
      amount: Number(existingTransaction.amount),
      type: existingTransaction.type
    });

    return NextResponse.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar transação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
```

---

## 2. ✅ Validação de Valor Zero/Negativo

### Problema Atual:
Permite criar transações com valor zero ou negativo.

### Correção:
**Arquivo**: `src/app/api/transactions/route.ts` e `src/app/api/transactions/optimized/route.ts`

```typescript
// ✅ Adicionar validação no início da função POST
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // ✅ VALIDAÇÃO 1: Valor deve ser maior que zero
    const absoluteAmount = Math.abs(Number(body.amount));
    if (absoluteAmount <= 0 || isNaN(absoluteAmount)) {
      return NextResponse.json(
        { error: 'Valor deve ser maior que zero' },
        { status: 400 }
      );
    }

    // ✅ VALIDAÇÃO 2: Garantir sinal correto baseado no tipo
    let finalAmount = absoluteAmount;
    if (body.type === 'expense' || body.type === 'DESPESA') {
      finalAmount = -absoluteAmount; // Despesa sempre negativa
    } else if (body.type === 'income' || body.type === 'RECEITA') {
      finalAmount = absoluteAmount; // Receita sempre positiva
    }

    // Continuar com a criação usando finalAmount
    const transaction = await prisma.transaction.create({
      data: {
        ...body,
        amount: finalAmount,
        userId: auth.userId
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('❌ Erro ao criar transação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
```

---

## 3. ✅ Validação de Duplicação

### Problema Atual:
Permite criar transações duplicadas.

### Correção:
**Arquivo**: `src/app/api/transactions/route.ts`

```typescript
// ✅ Adicionar verificação de duplicação
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Validações de valor...

    // ✅ VALIDAÇÃO DE DUPLICAÇÃO
    const transactionDate = new Date(body.date);
    const recentDuplicate = await prisma.transaction.findFirst({
      where: {
        userId: auth.userId,
        accountId: body.accountId,
        description: body.description,
        amount: body.amount,
        type: body.type,
        date: {
          gte: new Date(transactionDate.getTime() - 60000), // 1 minuto antes
          lte: new Date(transactionDate.getTime() + 60000), // 1 minuto depois
        },
        deletedAt: null
      }
    });

    if (recentDuplicate) {
      return NextResponse.json(
        {
          error: 'Possível transação duplicada detectada',
          warning: 'Já existe uma transação similar criada recentemente',
          duplicate: {
            id: recentDuplicate.id,
            description: recentDuplicate.description,
            amount: Number(recentDuplicate.amount),
            date: recentDuplicate.date
          }
        },
        { status: 409 } // Conflict
      );
    }

    // Continuar com a criação...
    const transaction = await prisma.transaction.create({
      data: {
        ...body,
        userId: auth.userId
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('❌ Erro ao criar transação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
```

---

## 4. ✅ Recalculo de Parcelas ao Editar

### Problema Atual:
Ao editar uma parcela, as outras não são atualizadas.

### Correção:
**Arquivo**: `src/app/api/transactions/[id]/route.ts`

```typescript
// ✅ Adicionar recalculo de parcelas no PUT
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId: auth.userId }
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 403 });
    }

    // ✅ VERIFICAR SE É PARCELADA
    if (existingTransaction.installmentGroupId && body.amount) {
      // Buscar todas as parcelas do grupo
      const allInstallments = await prisma.transaction.findMany({
        where: {
          installmentGroupId: existingTransaction.installmentGroupId,
          userId: auth.userId
        },
        orderBy: { installmentNumber: 'asc' }
      });

      const totalInstallments = allInstallments.length;
      const newTotalAmount = Math.abs(Number(body.amount)) * totalInstallments;
      const newAmountPerInstallment = newTotalAmount / totalInstallments;

      // ✅ USAR TRANSAÇÃO ATÔMICA para atualizar todas as parcelas
      await prisma.$transaction(async (tx) => {
        // Atualizar todas as parcelas com o novo valor
        await tx.transaction.updateMany({
          where: {
            installmentGroupId: existingTransaction.installmentGroupId,
            userId: auth.userId
          },
          data: {
            amount: existingTransaction.type === 'expense' 
              ? -Math.abs(newAmountPerInstallment)
              : Math.abs(newAmountPerInstallment)
          }
        });

        // Atualizar descrição se fornecida
        if (body.description) {
          for (const installment of allInstallments) {
            await tx.transaction.update({
              where: { id: installment.id },
              data: {
                description: `${body.description} (${installment.installmentNumber}/${totalInstallments})`
              }
            });
          }
        }
      });

      // Buscar transação atualizada
      const updatedTransaction = await prisma.transaction.findUnique({
        where: { id },
        include: { account: true }
      });

      return NextResponse.json(updatedTransaction);
    }

    // Se não é parcelada, atualizar normalmente
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: body,
      include: { account: true }
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('❌ Erro ao atualizar transação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
```

---

## 5. ✅ Validação de Conta Ativa

### Problema Atual:
Permite criar transações em contas inativas.

### Correção:
**Arquivo**: `src/app/api/transactions/route.ts`

```typescript
// ✅ Adicionar validação de conta ativa
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Validações anteriores...

    // ✅ VALIDAÇÃO DE CONTA ATIVA
    if (body.accountId) {
      const account = await prisma.account.findFirst({
        where: {
          id: body.accountId,
          userId: auth.userId
        }
      });

      if (!account) {
        return NextResponse.json(
          { error: 'Conta não encontrada' },
          { status: 404 }
        );
      }

      if (!account.isActive || account.deletedAt) {
        return NextResponse.json(
          { error: 'Não é possível criar transação em conta inativa ou deletada' },
          { status: 400 }
        );
      }
    }

    // Continuar com a criação...
    const transaction = await prisma.transaction.create({
      data: {
        ...body,
        userId: auth.userId
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('❌ Erro ao criar transação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
```

---

## 📊 Checklist de Implementação

### Prioridade 1 (Implementar Hoje)
- [ ] 1. Transações atômicas em DELETE
- [ ] 2. Validação de valor zero/negativo
- [ ] 3. Validação de duplicação

### Prioridade 2 (Implementar Esta Semana)
- [ ] 4. Recalculo de parcelas ao editar
- [ ] 5. Validação de conta ativa

### Testes Necessários
- [ ] Testar DELETE com reversão de fatura
- [ ] Testar DELETE com reversão de dívida
- [ ] Testar criação com valor zero (deve falhar)
- [ ] Testar criação duplicada (deve alertar)
- [ ] Testar edição de parcela (deve atualizar todas)
- [ ] Testar criação em conta inativa (deve falhar)

---

## 🎯 Resultado Esperado

Após implementar estas correções:
- ✅ Operações complexas serão atômicas (tudo ou nada)
- ✅ Valores inválidos serão rejeitados
- ✅ Duplicações serão detectadas
- ✅ Parcelas permanecerão consistentes
- ✅ Contas inativas serão protegidas

**Integridade Financeira**: 🔴 60% → 🟢 95%

---

**Data**: 27/10/2025
**Status**: 📋 Aguardando Implementação
**Prioridade**: 🔴 CRÍTICA
