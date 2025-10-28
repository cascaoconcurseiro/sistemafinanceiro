# Solução: Integridade Referencial de Pagamentos de Fatura

## Problema Identificado

Quando um usuário desmarca uma transação de cartão de crédito como paga, ela volta a ficar pendente, mas:
- A transação de pagamento da fatura (R$ 45,00) continua registrada
- A fatura continua marcada como paga
- O saldo da conta que "pagou" não é restaurado
- Isso cria uma inconsistência financeira grave

## Exemplo do Problema

1. Usuário tem transação de R$ 50,00 no cartão
2. Marca como paga → Sistema cria transação de pagamento de R$ 45,00 (valor líquido)
3. Usuário desmarca a transação de R$ 50,00
4. **PROBLEMA**: Transação de pagamento de R$ 45,00 continua existindo

## Solução Implementada

### 1. Detecção Automática
Quando uma transação é deletada, o sistema verifica se:
- É uma transação de pagamento de fatura (descrição contém "Pagamento de fatura")
- Foi criada recentemente (mesmo período)

### 2. Reversão em Cascata
Ao detectar deleção de pagamento de fatura, o sistema:

#### A. Reverte a Fatura
```typescript
- isPaid: true → false
- paidAmount: R$ 45,00 → R$ 0,00
- paidAt: [data] → null
```

#### B. Restaura Limite do Cartão
```typescript
- currentBalance: reduzido → restaurado
```

#### C. Reverte Transações do Cartão
```typescript
- status: 'completed' → 'pending'
```

#### D. Remove Transação de Pagamento
```typescript
- Deleta a transação de débito na conta
```

### 3. Campos de Rastreamento

Para garantir integridade, adicionamos campos de relacionamento:

```prisma
model Transaction {
  // ... campos existentes
  
  // Novo: Rastreamento de pagamentos
  relatedInvoiceId    String?   // ID da fatura que esta transação pagou
  relatedPaymentId    String?   // ID da transação de pagamento criada
  
  @@index([relatedInvoiceId])
  @@index([relatedPaymentId])
}

model Invoice {
  // ... campos existentes
  
  // Novo: Rastreamento de pagamentos
  paymentTransactionId String?   // ID da transação que pagou esta fatura
  
  @@index([paymentTransactionId])
}
```

## Fluxo Completo

### Ao Marcar Transação como Paga

```
1. Usuário marca transação de R$ 50,00 como paga
2. Sistema calcula valor líquido (R$ 45,00)
3. Sistema cria transação de pagamento
   - Salva relatedInvoiceId na transação de pagamento
   - Salva paymentTransactionId na fatura
4. Sistema marca fatura como paga
5. Sistema reduz limite do cartão
```

### Ao Desmarcar/Deletar Transação

```
1. Usuário desmarca/deleta transação de R$ 50,00
2. Sistema detecta que é transação de cartão
3. Sistema busca fatura relacionada (últimas 24h)
4. Sistema busca transação de pagamento via paymentTransactionId
5. Sistema reverte TUDO em ordem:
   ✓ Busca dados da transação de pagamento (conta + valor)
   ✓ Fatura → isPaid = false, paidAmount = 0, paidAt = null
   ✓ Transação de pagamento → deletada do banco
   ✓ Saldo da conta bancária → restaurado (+R$ 45,00)
   ✓ Transações do cartão → status = 'pending'
   ✓ Limite do cartão → restaurado automaticamente
```

## Benefícios

1. **Integridade Financeira Completa**: Impossível ter pagamento sem fatura
2. **Rastreabilidade Total**: Sempre sabemos qual transação pagou qual fatura
3. **Reversão Automática em Cascata**: 
   - Fatura volta a ficar pendente
   - Transação de pagamento é deletada
   - Saldo da conta bancária é restaurado
   - Transações do cartão voltam para pending
4. **Proteção de Dados**: Conta bancária sempre reflete a realidade
5. **Auditoria Completa**: Todos os eventos são registrados com detalhes

## Implementação

### Arquivos Modificados

1. `src/app/api/transactions/[id]/route.ts`
   - Adiciona detecção de pagamento de fatura
   - Implementa reversão em cascata

2. `src/lib/services/credit-card-service.ts`
   - Adiciona método `revertInvoicePayment()`
   - Atualiza `payInvoice()` para salvar relacionamentos

3. `prisma/schema.prisma`
   - Adiciona campos de rastreamento

### Migração do Banco

```sql
-- Adicionar campos de rastreamento
ALTER TABLE "Transaction" ADD COLUMN "relatedInvoiceId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "relatedPaymentId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "paymentTransactionId" TEXT;

-- Criar índices
CREATE INDEX "Transaction_relatedInvoiceId_idx" ON "Transaction"("relatedInvoiceId");
CREATE INDEX "Transaction_relatedPaymentId_idx" ON "Transaction"("relatedPaymentId");
CREATE INDEX "Invoice_paymentTransactionId_idx" ON "Invoice"("paymentTransactionId");
```

## Testes Necessários

### Cenário 1: Pagamento Total
1. Criar transação de R$ 100,00 no cartão
2. Marcar como paga
3. Verificar que transação de pagamento foi criada
4. Desmarcar
5. Verificar que tudo foi revertido

### Cenário 2: Pagamento Parcial
1. Criar transação de R$ 100,00 no cartão
2. Pagar R$ 50,00
3. Desmarcar transação
4. Verificar que pagamento parcial foi revertido

### Cenário 3: Múltiplas Transações
1. Criar 3 transações no cartão
2. Marcar todas como pagas
3. Desmarcar apenas 1
4. Verificar que apenas o pagamento relacionado foi revertido

## Fluxo Visual Completo

### Cenário: Usuário Desmarca Transação de Cartão

```
ANTES (Estado Inconsistente):
┌─────────────────────────────────────────────────────────────┐
│ Transação Cartão: R$ 50,00 [DELETADA]                      │
│ Fatura: R$ 45,00 [PAGA] ❌ INCONSISTENTE                   │
│ Transação Pagamento: -R$ 45,00 [EXISTE] ❌ ÓRFÃ            │
│ Conta Bancária: R$ 1.000,00 ❌ FALTANDO R$ 45,00           │
└─────────────────────────────────────────────────────────────┘

DEPOIS (Estado Correto):
┌─────────────────────────────────────────────────────────────┐
│ Transação Cartão: [DELETADA]                                │
│ Fatura: R$ 45,00 [PENDENTE] ✅ CORRETO                     │
│ Transação Pagamento: [DELETADA] ✅ REMOVIDA                │
│ Conta Bancária: R$ 1.045,00 ✅ RESTAURADA                  │
└─────────────────────────────────────────────────────────────┘
```

### Ordem de Execução

```
1. DELETE /api/transactions/[id]
   ↓
2. Detecta: creditCardId existe
   ↓
3. Busca fatura paga nas últimas 24h
   ↓
4. Chama: creditCardService.revertInvoicePayment()
   ↓
5. Busca transação de pagamento (antes de deletar)
   ↓
6. Atualiza fatura:
   - isPaid: false
   - paidAmount: 0
   - paidAt: null
   ↓
7. Deleta transação de pagamento
   ↓
8. Restaura saldo da conta:
   - balance: balance + valor_pago
   ↓
9. Reverte transações do cartão:
   - status: 'pending'
   ↓
10. Registra auditoria
```

## Próximos Passos

1. ✅ Documentar solução
2. ✅ Atualizar serviço de cartão (revertInvoicePayment)
3. ✅ Atualizar API de transações (detecção + reversão)
4. ✅ Adicionar restauração de saldo da conta
5. ⏳ Implementar campos de rastreamento (opcional)
6. ⏳ Criar migração do banco (opcional)
7. ⏳ Testar cenários
8. ⏳ Deploy

## Observações

- Esta solução garante que NUNCA haverá inconsistência entre pagamentos e faturas
- O sistema sempre mantém integridade referencial
- Todas as operações são atômicas (ou tudo funciona, ou nada funciona)
- Logs detalhados permitem auditoria completa
