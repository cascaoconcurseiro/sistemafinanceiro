# 💳 Funcionalidade: Adiantar Parcelas de Cartão de Crédito

## 🎯 Objetivo

Permitir que o usuário adiante o pagamento de parcelas futuras de uma compra parcelada no cartão de crédito, debitando de uma conta bancária e liberando o limite do cartão.

## 📋 Requisitos

### Funcionalidades Principais

1. **Botão "Adiantar Parcela"** ao clicar em uma transação parcelada
2. **Modal de Adiantamento** com:
   - Seleção de conta bancária para débito
   - Valor total a ser adiantado (soma das parcelas restantes)
   - Confirmação da operação
3. **Processamento**:
   - Debitar valor da conta bancária selecionada
   - Liberar limite do cartão de crédito
   - Cancelar parcelas futuras
   - Criar registro de "Adiantamento de Parcela"

## 🔄 Fluxo de Funcionamento

### Cenário Exemplo:
- Compra: R$ 100,00 em 5x de R$ 20,00
- Parcelas pagas: 1/5 (R$ 20,00)
- Parcelas restantes: 4/5 (R$ 80,00)

### Ao Adiantar:
1. ✅ Debita R$ 80,00 da conta bancária escolhida
2. ✅ Libera R$ 80,00 do limite do cartão
3. ✅ Cancela parcelas 2/5, 3/5, 4/5 e 5/5
4. ✅ Cria transação de "Adiantamento - carro (4 parcelas)"
5. ✅ Registra na fatura do cartão como "Adiantamento"

## 📊 Impactos no Sistema

### Conta Bancária
```
Antes: R$ 1.000,00
Débito: -R$ 80,00 (Adiantamento - carro 4x)
Depois: R$ 920,00
```

### Cartão de Crédito
```
Limite: R$ 5.000,00
Antes: R$ 4.900,00 disponível (R$ 100,00 comprometido)
Libera: +R$ 80,00 (4 parcelas canceladas)
Depois: R$ 4.980,00 disponível (R$ 20,00 comprometido - 1ª parcela já paga)
```

### Fatura do Cartão
```
Novembro 2025:
- carro 1/5: R$ 20,00 ✅ Paga
- Adiantamento carro (4x): -R$ 80,00 💰

Dezembro 2025 em diante:
- Parcelas 2/5, 3/5, 4/5, 5/5: ❌ Canceladas
```

## 🛠️ Implementação Técnica

### 1. Componente Modal
**Arquivo:** `src/components/modals/advance-installment-modal.tsx`

```typescript
interface AdvanceInstallmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installment: {
    id: string;
    description: string;
    currentInstallment: number;
    totalInstallments: number;
    installmentAmount: number;
    installmentGroupId: string;
  };
}
```

### 2. API Endpoint
**Arquivo:** `src/app/api/installments/[id]/advance/route.ts`

```typescript
POST /api/installments/[id]/advance
Body: {
  accountId: string;  // Conta para débito
  installmentGroupId: string;
}

Response: {
  success: boolean;
  advancedAmount: number;
  cancelledInstallments: number;
  transaction: Transaction;
}
```

### 3. Lógica de Negócio

```typescript
async function advanceInstallments(
  installmentId: string,
  accountId: string,
  userId: string
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar parcela atual
    const currentInstallment = await tx.transaction.findUnique({
      where: { id: installmentId }
    });

    // 2. Buscar parcelas futuras do mesmo grupo
    const futureInstallments = await tx.transaction.findMany({
      where: {
        installmentGroupId: currentInstallment.installmentGroupId,
        installmentNumber: { gt: currentInstallment.installmentNumber },
        status: 'pending'
      }
    });

    // 3. Calcular valor total
    const totalAmount = futureInstallments.reduce(
      (sum, inst) => sum + Math.abs(inst.amount), 
      0
    );

    // 4. Criar transação de débito na conta
    const debitTransaction = await tx.transaction.create({
      data: {
        userId,
        accountId,
        amount: -totalAmount,
        description: `Adiantamento - ${currentInstallment.description} (${futureInstallments.length}x)`,
        type: 'DESPESA',
        status: 'cleared',
        date: new Date(),
        categoryId: currentInstallment.categoryId,
        metadata: JSON.stringify({
          type: 'installment_advance',
          originalInstallmentId: installmentId,
          cancelledInstallments: futureInstallments.length
        })
      }
    });

    // 5. Cancelar parcelas futuras
    await tx.transaction.updateMany({
      where: {
        id: { in: futureInstallments.map(i => i.id) }
      },
      data: {
        status: 'cancelled',
        deletedAt: new Date()
      }
    });

    // 6. Atualizar saldo da conta
    await updateAccountBalance(tx, accountId);

    // 7. Liberar limite do cartão
    if (currentInstallment.creditCardId) {
      await updateCreditCardBalance(tx, currentInstallment.creditCardId);
    }

    return {
      success: true,
      advancedAmount: totalAmount,
      cancelledInstallments: futureInstallments.length,
      transaction: debitTransaction
    };
  });
}
```

## 🎨 Interface do Usuário

### Botão na Transação Parcelada
```tsx
{transaction.isInstallment && transaction.installmentNumber < transaction.totalInstallments && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleAdvanceInstallment(transaction)}
  >
    <FastForward className="w-4 h-4 mr-2" />
    Adiantar Parcelas
  </Button>
)}
```

### Modal de Confirmação
```
┌─────────────────────────────────────────┐
│ 💳 Adiantar Parcelas                    │
├─────────────────────────────────────────┤
│                                         │
│ Compra: carro                           │
│ Parcela atual: 1/5                      │
│ Parcelas a adiantar: 4 (2/5 até 5/5)   │
│                                         │
│ Valor total: R$ 80,00                   │
│                                         │
│ Conta para débito:                      │
│ [Selecionar conta ▼]                    │
│                                         │
│ ⚠️ Esta ação não pode ser desfeita!     │
│                                         │
│ [Cancelar]  [Confirmar Adiantamento]   │
└─────────────────────────────────────────┘
```

## ✅ Checklist de Implementação

### Fase 1: Backend
- [ ] Criar API `/api/installments/[id]/advance`
- [ ] Implementar lógica de adiantamento
- [ ] Adicionar validações (saldo suficiente, parcelas válidas)
- [ ] Atualizar saldo da conta
- [ ] Liberar limite do cartão
- [ ] Criar testes unitários

### Fase 2: Frontend
- [ ] Criar componente `AdvanceInstallmentModal`
- [ ] Adicionar botão "Adiantar" nas transações parceladas
- [ ] Implementar seleção de conta
- [ ] Adicionar confirmação de operação
- [ ] Mostrar feedback de sucesso/erro

### Fase 3: Integração
- [ ] Integrar com contexto unificado
- [ ] Atualizar lista de transações após adiantamento
- [ ] Atualizar saldo do cartão em tempo real
- [ ] Adicionar logs de auditoria

### Fase 4: Testes
- [ ] Testar adiantamento de 1 parcela
- [ ] Testar adiantamento de múltiplas parcelas
- [ ] Testar com saldo insuficiente
- [ ] Testar cancelamento de parcelas
- [ ] Testar liberação de limite

## 📝 Notas Importantes

1. **Validação de Saldo**: Verificar se a conta tem saldo suficiente antes de processar
2. **Atomicidade**: Usar transação do Prisma para garantir consistência
3. **Auditoria**: Registrar todas as operações para rastreabilidade
4. **Reversão**: Considerar implementar funcionalidade de desfazer (opcional)
5. **Notificações**: Enviar notificação ao usuário após conclusão

## 🚀 Próximos Passos

1. Implementar backend (API + lógica)
2. Criar componente modal
3. Integrar com interface existente
4. Testar fluxo completo
5. Documentar para usuários finais
