# 🚀 FASE 2: IMPLEMENTAÇÃO NAS APIs

**Data:** 28/10/2025  
**Status:** 🔄 EM ANDAMENTO  

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### APIs Prioritárias (Ordem de Implementação)

#### 1. ✅ API de Transações (CRÍTICO)
- [x] Análise do código atual
- [ ] POST /api/transactions - Criar transação
- [ ] PUT /api/transactions/[id] - Editar transação
- [ ] DELETE /api/transactions/[id] - Deletar transação

#### 2. ⏳ API de Parcelamentos (CRÍTICO)
- [x] Análise do código atual
- [ ] POST /api/installments - Criar parcelamento
- [ ] POST /api/installments/[id]/pay - Pagar parcela

#### 3. ⏳ API de Transferências (IMPORTANTE)
- [ ] POST /api/transfers - Criar transferência

#### 4. ⏳ API de Despesas Compartilhadas (IMPORTANTE)
- [ ] POST /api/shared-expenses - Criar despesa compartilhada
- [ ] POST /api/shared-debts/[id]/pay - Pagar dívida

#### 5. ⏳ API de Manutenção (DESEJÁVEL)
- [ ] POST /api/maintenance/recalculate-balances
- [ ] GET /api/maintenance/verify-integrity

---

## 🔍 ANÁLISE DO CÓDIGO ATUAL

### ❌ PROBLEMAS IDENTIFICADOS NAS APIs

#### API de Transações (route.ts)
```typescript
// ❌ PROBLEMA 1: Não usa o serviço financeiro
// Cria transações diretamente no Prisma sem atomicidade

// ❌ PROBLEMA 2: Lógica de parcelamento duplicada
// Cria parcelas manualmente sem usar o serviço

// ❌ PROBLEMA 3: Não valida com schemas Zod
// Usa validação manual inconsistente

// ❌ PROBLEMA 4: Não cria partidas dobradas
// Usa doubleEntryService mas não garante integridade

// ❌ PROBLEMA 5: Não vincula com faturas automaticamente
// Cartão de crédito sem vínculo com invoice
```

#### API de Transações [id] (route.ts)
```typescript
// ❌ PROBLEMA 1: PUT não usa serviço financeiro
// Atualiza diretamente sem validar integridade

// ❌ PROBLEMA 2: DELETE não é atômico
// Múltiplas operações sem prisma.$transaction

// ❌ PROBLEMA 3: Não recalcula saldos
// Saldos podem ficar inconsistentes
```

#### API de Parcelamentos (route.ts)
```typescript
// ❌ PROBLEMA 1: Cria parcelas sem atomicidade
// Pode falhar no meio e deixar dados inconsistentes

// ❌ PROBLEMA 2: Não valida com schemas Zod
// Usa validação manual

// ❌ PROBLEMA 3: Não cria partidas dobradas
// Parcelas sem lançamentos contábeis
```

---

## 🎯 ESTRATÉGIA DE IMPLEMENTAÇÃO

### Fase 2.1: Atualizar API de Transações (2h)

#### POST /api/transactions
```typescript
// ✅ NOVO CÓDIGO
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { TransactionSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return unauthorized();
  
  const body = await request.json();
  
  // ✅ Validar com Zod
  const validated = TransactionSchema.parse(body);
  
  // ✅ Usar serviço financeiro
  const service = new FinancialOperationsService();
  const transaction = await service.createTransaction({
    transaction: validated,
    createJournalEntries: true,
    linkToInvoice: true,
  });
  
  return NextResponse.json(transaction);
}
```

#### PUT /api/transactions/[id]
```typescript
// ✅ NOVO CÓDIGO
export async function PUT(request: NextRequest, { params }) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return unauthorized();
  
  const body = await request.json();
  const validated = TransactionSchema.partial().parse(body);
  
  const service = new FinancialOperationsService();
  const transaction = await service.updateTransaction(
    params.id,
    validated,
    auth.userId
  );
  
  return NextResponse.json(transaction);
}
```

#### DELETE /api/transactions/[id]
```typescript
// ✅ NOVO CÓDIGO
export async function DELETE(request: NextRequest, { params }) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return unauthorized();
  
  const service = new FinancialOperationsService();
  await service.deleteTransaction(params.id, auth.userId);
  
  return NextResponse.json({ success: true });
}
```

### Fase 2.2: Atualizar API de Parcelamentos (1h)

#### POST /api/installments
```typescript
// ✅ NOVO CÓDIGO
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return unauthorized();
  
  const body = await request.json();
  const validated = InstallmentSchema.parse(body);
  
  const service = new FinancialOperationsService();
  const installments = await service.createInstallments(
    validated,
    auth.userId
  );
  
  return NextResponse.json(installments);
}
```

#### POST /api/installments/[id]/pay
```typescript
// ✅ NOVO CÓDIGO
export async function POST(request: NextRequest, { params }) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return unauthorized();
  
  const body = await request.json();
  
  const service = new FinancialOperationsService();
  const payment = await service.payInstallment(
    params.id,
    body.accountId,
    auth.userId
  );
  
  return NextResponse.json(payment);
}
```

### Fase 2.3: Criar API de Transferências (30min)

#### POST /api/transfers
```typescript
// ✅ NOVO CÓDIGO
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return unauthorized();
  
  const body = await request.json();
  
  const service = new FinancialOperationsService();
  const transfer = await service.createTransfer(
    body.fromAccountId,
    body.toAccountId,
    body.amount,
    body.description,
    auth.userId,
    body.date
  );
  
  return NextResponse.json(transfer);
}
```

### Fase 2.4: Atualizar API de Despesas Compartilhadas (2h)

#### POST /api/shared-expenses
```typescript
// ✅ NOVO CÓDIGO
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return unauthorized();
  
  const body = await request.json();
  const validated = SharedExpenseSchema.parse(body);
  
  const service = new FinancialOperationsService();
  const expense = await service.createSharedExpense(
    validated,
    auth.userId
  );
  
  return NextResponse.json(expense);
}
```

#### POST /api/shared-debts/[id]/pay
```typescript
// ✅ NOVO CÓDIGO
export async function POST(request: NextRequest, { params }) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return unauthorized();
  
  const body = await request.json();
  
  const service = new FinancialOperationsService();
  const payment = await service.paySharedDebt(
    params.id,
    body.accountId,
    auth.userId
  );
  
  return NextResponse.json(payment);
}
```

---

## 📊 PROGRESSO

### Checklist Geral
- [x] Criar serviço financeiro
- [x] Criar schemas de validação
- [x] Verificar código sem brechas
- [ ] Atualizar API de transações
- [ ] Atualizar API de parcelamentos
- [ ] Criar API de transferências
- [ ] Atualizar API de despesas compartilhadas
- [ ] Criar API de manutenção
- [ ] Atualizar contexto unificado
- [ ] Criar testes de integração
- [ ] Documentar mudanças

### Tempo Estimado
- ✅ Fase 1: Serviço + Schemas (3h) - CONCLUÍDO
- ⏳ Fase 2: APIs (8h) - EM ANDAMENTO
- ⏳ Fase 3: Contexto (2h) - PENDENTE
- ⏳ Fase 4: Testes (2h) - PENDENTE
- ⏳ Fase 5: Documentação (1h) - PENDENTE

**Total:** 16 horas

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Criar documento de plano
2. ⏳ Implementar POST /api/transactions
3. ⏳ Implementar PUT /api/transactions/[id]
4. ⏳ Implementar DELETE /api/transactions/[id]
5. ⏳ Implementar POST /api/installments
6. ⏳ Implementar POST /api/installments/[id]/pay

---

**Criado por:** Kiro AI  
**Data:** 28/10/2025  
**Versão:** 1.0.0
