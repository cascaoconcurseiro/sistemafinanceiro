# 🚀 PLANO DE IMPLEMENTAÇÃO COMPLETA

**Data**: 01/11/2025  
**Objetivo**: Implementar TODAS as funcionalidades faltantes  
**Tempo Estimado**: 3-4 meses  
**Nota Atual**: 48.5/100  
**Nota Alvo**: 95/100

---

## ⚠️ AVISO IMPORTANTE

Implementar TODAS as funcionalidades faltantes requer:
- **3-4 meses** de desenvolvimento full-time
- **~120 horas** de trabalho
- **50+ arquivos** novos/modificados
- **Testes extensivos**
- **Migração de dados**

**Recomendação**: Implementar por fases, testando cada uma antes de prosseguir.

---

## 📊 PRIORIZAÇÃO

### 🔴 FASE 1: CRÍTICO (2 semanas - 40h)
**Objetivo**: Eliminar riscos de segurança e duplicação  
**Nota esperada**: 48.5 → 65/100

### 🟡 FASE 2: IMPORTANTE (1 mês - 40h)
**Objetivo**: Completar funcionalidades core  
**Nota esperada**: 65 → 80/100

### 🟢 FASE 3: MELHORIAS (2 meses - 40h)
**Objetivo**: Adicionar funcionalidades avançadas  
**Nota esperada**: 80 → 95/100

---

## 🔴 FASE 1: CRÍTICO (2 semanas)

### 1.1 Idempotência ⏱️ 8h

#### Schema Changes
```prisma
// prisma/schema.prisma
model Transaction {
  // ... campos existentes
  operationUuid String? @unique @map("operation_uuid")
  
  @@index([operationUuid])
}
```

#### Migração
```bash
npx prisma migrate dev --name add-operation-uuid
```

#### Serviço
```typescript
// src/lib/services/idempotency-service.ts
export class IdempotencyService {
  static async checkDuplicate(operationUuid: string): Promise<boolean> {
    const existing = await prisma.transaction.findUnique({
      where: { operationUuid }
    });
    return !!existing;
  }
  
  static generateUuid(): string {
    return crypto.randomUUID();
  }
}
```

#### Integração
```typescript
// Modificar financial-operations-service.ts
static async createTransaction(options: CreateTransactionOptions) {
  const operationUuid = options.operationUuid || IdempotencyService.generateUuid();
  
  // Verificar duplicata
  if (await IdempotencyService.checkDuplicate(operationUuid)) {
    throw new Error('Operação duplicada detectada');
  }
  
  // ... resto do código
  const transaction = await tx.transaction.create({
    data: {
      ...validatedTransaction,
      operationUuid
    }
  });
}
```

---

### 1.2 Segurança (Criptografia) ⏱️ 12h

#### Instalar Dependências
```bash
npm install bcrypt @types/bcrypt
npm install crypto-js @types/crypto-js
```

#### Serviço de Criptografia
```typescript
// src/lib/services/encryption-service.ts
import bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static SECRET_KEY = process.env.ENCRYPTION_KEY!;
  
  // Senhas (bcrypt)
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
  
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
  
  // Dados sensíveis (AES-256)
  static encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
  }
  
  static decrypt(encrypted: string): string {
    const bytes = CryptoJS.AES.decrypt(encrypted, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
```

#### Migrar Senhas Existentes
```typescript
// scripts/migrate-passwords.ts
import { prisma } from '@/lib/prisma';
import { EncryptionService } from '@/lib/services/encryption-service';

async function migratePasswords() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Assumindo que senhas antigas estão em texto plano
    const hashedPassword = await EncryptionService.hashPassword(user.password);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
  }
}
```

#### Atualizar Auth
```typescript
// Modificar src/lib/utils/auth-helpers.ts
export async function validateCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) return null;
  
  // Usar bcrypt em vez de comparação direta
  const isValid = await EncryptionService.comparePassword(password, user.password);
  
  return isValid ? user : null;
}
```

---

### 1.3 Atomicidade Total ⏱️ 12h

#### Auditoria de Operações
```bash
# Procurar todas operações sem $transaction
grep -r "prisma\." src/lib/services/ | grep -v "\$transaction"
```

#### Refatorar Operações
```typescript
// Exemplo: Refatorar createInstallments
static async createInstallments(options: CreateInstallmentsOptions) {
  // ❌ ANTES: Sem $transaction
  for (let i = 0; i < totalInstallments; i++) {
    await prisma.transaction.create({ ... });
  }
  
  // ✅ DEPOIS: Com $transaction
  return await prisma.$transaction(async (tx) => {
    const transactions = [];
    
    for (let i = 0; i < totalInstallments; i++) {
      const transaction = await tx.transaction.create({ ... });
      transactions.push(transaction);
    }
    
    return transactions;
  });
}
```

#### Checklist de Operações
- [ ] createTransaction
- [ ] updateTransaction
- [ ] deleteTransaction
- [ ] createTransfer
- [ ] createInstallments
- [ ] payInvoice
- [ ] createSharedExpense
- [ ] settleDebt
- [ ] reconcileAccount

---

### 1.4 Categoria Obrigatória ⏱️ 4h

#### Schema Change
```prisma
model Transaction {
  categoryId String @map("category_id") // Remover "?"
}
```

#### Migração com Dados
```typescript
// scripts/make-category-required.ts
async function makeCategoryRequired() {
  // 1. Criar categoria padrão se não existir
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    let defaultCategory = await prisma.category.findFirst({
      where: { userId: user.id, name: 'Sem Categoria' }
    });
    
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: 'Sem Categoria',
          type: 'DESPESA',
          isDefault: true
        }
      });
    }
    
    // 2. Atualizar transações sem categoria
    await prisma.transaction.updateMany({
      where: { userId: user.id, categoryId: null },
      data: { categoryId: defaultCategory.id }
    });
  }
  
  // 3. Executar migração do schema
  console.log('Execute: npx prisma migrate dev --name make-category-required');
}
```

#### Validação no Código
```typescript
// Adicionar em ValidationService
static validateCategory(transaction: TransactionInput) {
  if (!transaction.categoryId) {
    throw new Error('Categoria é obrigatória');
  }
}
```

---

### 1.5 Refresh Token JWT ⏱️ 4h

#### Schema
```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("refresh_tokens")
}

model User {
  // ... campos existentes
  refreshTokens RefreshToken[]
}
```

#### Serviço
```typescript
// src/lib/services/auth-service.ts
export class AuthService {
  static async generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: '15m'
    });
    
    const refreshToken = crypto.randomUUID();
    
    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      }
    });
    
    return { accessToken, refreshToken };
  }
  
  static async refreshAccessToken(refreshToken: string) {
    const token = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });
    
    if (!token || token.expiresAt < new Date()) {
      throw new Error('Refresh token inválido ou expirado');
    }
    
    const accessToken = jwt.sign(
      { userId: token.userId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    
    return { accessToken };
  }
}
```

---

## 🟡 FASE 2: IMPORTANTE (1 mês)

### 2.1 Faturas Automáticas ⏱️ 16h

#### Schema
```prisma
model Invoice {
  // ... campos existentes
  nextInvoiceId String? @map("next_invoice_id") // Link para próxima fatura
  
  nextInvoice Invoice? @relation("InvoiceChain", fields: [nextInvoiceId], references: [id])
  previousInvoice Invoice? @relation("InvoiceChain")
}
```

#### Serviço
```typescript
// src/lib/services/invoice-service.ts
export class InvoiceService {
  static async payInvoice(invoiceId: string, accountId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { creditCard: true }
      });
      
      if (!invoice) throw new Error('Fatura não encontrada');
      
      // 1. Criar transação de pagamento
      const payment = await tx.transaction.create({
        data: {
          userId,
          accountId,
          amount: -Number(invoice.totalAmount),
          type: 'DESPESA',
          description: `Pagamento Fatura ${invoice.creditCard.name}`,
          date: new Date(),
          status: 'cleared',
          invoiceId
        }
      });
      
      // 2. Criar lançamentos contábeis
      await DoubleEntryService.createJournalEntries(tx, payment);
      
      // 3. Marcar fatura como paga
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAt: new Date()
        }
      });
      
      // 4. ✅ CRIAR PRÓXIMA FATURA AUTOMATICAMENTE
      const nextInvoice = await this.createNextInvoice(tx, invoice);
      
      // 5. Vincular faturas
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { nextInvoiceId: nextInvoice.id }
      });
      
      return { payment, nextInvoice };
    });
  }
  
  private static async createNextInvoice(tx: any, currentInvoice: any) {
    const nextClosingDate = this.calculateNextClosingDate(
      currentInvoice.closingDate,
      currentInvoice.creditCard.closingDay
    );
    
    const nextDueDate = this.calculateNextDueDate(
      nextClosingDate,
      currentInvoice.creditCard.dueDay
    );
    
    return await tx.invoice.create({
      data: {
        userId: currentInvoice.userId,
        creditCardId: currentInvoice.creditCardId,
        closingDate: nextClosingDate,
        dueDate: nextDueDate,
        totalAmount: 0,
        status: 'open'
      }
    });
  }
}
```

---

### 2.2 Transferências Completas ⏱️ 8h

#### Implementação
```typescript
// Modificar financial-operations-service.ts
static async createTransfer(options: CreateTransferOptions) {
  const { fromAccountId, toAccountId, amount, description, date, userId } = options;
  
  const transactionGroupId = crypto.randomUUID();
  
  return await prisma.$transaction(async (tx) => {
    // 1. Validar saldo
    await ValidationService.validateAccountBalance(fromAccountId, amount);
    
    // 2. Criar débito (saída)
    const debit = await tx.transaction.create({
      data: {
        userId,
        accountId: fromAccountId,
        amount: -amount,
        type: 'TRANSFERENCIA',
        description: `Transferência para ${toAccountId}: ${description}`,
        date,
        status: 'cleared',
        isTransfer: true,
        transactionGroupId, // ✅ NOVO: Agrupa transações
        operationUuid: IdempotencyService.generateUuid()
      }
    });
    
    // 3. Criar crédito (entrada)
    const credit = await tx.transaction.create({
      data: {
        userId,
        accountId: toAccountId,
        amount: amount,
        type: 'TRANSFERENCIA',
        description: `Transferência de ${fromAccountId}: ${description}`,
        date,
        status: 'cleared',
        isTransfer: true,
        transferId: debit.id, // Link reverso
        transactionGroupId, // ✅ NOVO: Mesmo grupo
        operationUuid: IdempotencyService.generateUuid()
      }
    });
    
    // 4. Atualizar link no débito
    await tx.transaction.update({
      where: { id: debit.id },
      data: { transferId: credit.id }
    });
    
    // 5. Criar lançamentos contábeis
    await DoubleEntryService.createJournalEntries(tx, debit);
    await DoubleEntryService.createJournalEntries(tx, credit);
    
    // 6. Atualizar saldos
    await this.updateAccountBalance(tx, fromAccountId);
    await this.updateAccountBalance(tx, toAccountId);
    
    return { debit, credit, transactionGroupId };
  });
}
```

---

### 2.3 Controle de Fechamento ⏱️ 16h

#### Schema
```prisma
model PeriodClosure {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  period      String   // "2025-01" formato YYYY-MM
  closedAt    DateTime @map("closed_at")
  closedBy    String   @map("closed_by")
  reopenedAt  DateTime? @map("reopened_at")
  reopenedBy  String?   @map("reopened_by")
  reason      String?   // Motivo da reabertura
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, period])
  @@map("period_closures")
}

model User {
  // ... campos existentes
  periodClosures PeriodClosure[]
}
```

#### Serviço
```typescript
// src/lib/services/period-closure-service.ts
export class PeriodClosureService {
  static async closePeriod(userId: string, period: string, closedBy: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Verificar se já está fechado
      const existing = await tx.periodClosure.findUnique({
        where: { userId_period: { userId, period } }
      });
      
      if (existing && !existing.reopenedAt) {
        throw new Error('Período já está fechado');
      }
      
      // 2. Marcar todas transações do período
      const [year, month] = period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      
      await tx.transaction.updateMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
          deletedAt: null
        },
        data: { closedPeriod: true }
      });
      
      // 3. Criar registro de fechamento
      return await tx.periodClosure.create({
        data: {
          userId,
          period,
          closedAt: new Date(),
          closedBy
        }
      });
    });
  }
  
  static async reopenPeriod(
    userId: string,
    period: string,
    reopenedBy: string,
    reason: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar fechamento
      const closure = await tx.periodClosure.findUnique({
        where: { userId_period: { userId, period } }
      });
      
      if (!closure) {
        throw new Error('Período não está fechado');
      }
      
      // 2. Desmarcar transações
      const [year, month] = period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      
      await tx.transaction.updateMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        data: { closedPeriod: false }
      });
      
      // 3. Registrar reabertura
      return await tx.periodClosure.update({
        where: { id: closure.id },
        data: {
          reopenedAt: new Date(),
          reopenedBy,
          reason
        }
      });
    });
  }
  
  static async validatePeriodOpen(userId: string, date: Date) {
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const closure = await prisma.periodClosure.findUnique({
      where: { userId_period: { userId, period } }
    });
    
    if (closure && !closure.reopenedAt) {
      throw new Error(`Período ${period} está fechado. Não é possível criar/editar transações.`);
    }
  }
}
```

#### Integração
```typescript
// Modificar financial-operations-service.ts
static async createTransaction(options: CreateTransactionOptions) {
  // ... validações existentes
  
  // ✅ NOVO: Validar período fechado
  await PeriodClosureService.validatePeriodOpen(
    validatedTransaction.userId,
    validatedTransaction.date
  );
  
  // ... resto do código
}
```

---

## 🟢 FASE 3: MELHORIAS (2 meses)

### 3.1 Fluxo de Caixa ⏱️ 20h

#### Serviço
```typescript
// src/lib/services/cash-flow-service.ts
export class CashFlowService {
  static async calculateProjectedBalance(
    userId: string,
    accountId: string,
    futureDate: Date
  ): Promise<number> {
    // 1. Saldo atual
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });
    
    let balance = Number(account!.balance);
    
    // 2. Parcelas futuras
    const futureInstallments = await prisma.transaction.findMany({
      where: {
        userId,
        accountId,
        date: { lte: futureDate, gte: new Date() },
        isInstallment: true,
        status: 'pending',
        deletedAt: null
      }
    });
    
    balance += futureInstallments.reduce((sum, t) => sum + Number(t.amount), 0);
    
    // 3. Transações recorrentes
    const recurring = await this.projectRecurringTransactions(
      userId,
      accountId,
      futureDate
    );
    
    balance += recurring.reduce((sum, t) => sum + t.amount, 0);
    
    // 4. Faturas abertas
    const openInvoices = await this.getOpenInvoices(userId, futureDate);
    balance -= openInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    
    return balance;
  }
  
  static async getMonthlyFlow(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
        deletedAt: null
      }
    });
    
    const income = transactions
      .filter(t => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const expenses = transactions
      .filter(t => Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    
    return {
      income,
      expenses,
      balance: income - expenses,
      transactions: transactions.length
    };
  }
}
```

---

### 3.2 Validações Temporais ⏱️ 8h

#### Serviço
```typescript
// src/lib/services/temporal-validation-service.ts
export class TemporalValidationService {
  static async validateTransactionDate(
    userId: string,
    date: Date,
    accountId?: string
  ) {
    // 1. Não pode ser anterior à criação da conta
    if (accountId) {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });
      
      if (account && date < account.createdAt) {
        throw new Error(
          `Data não pode ser anterior à criação da conta (${account.createdAt.toLocaleDateString()})`
        );
      }
    }
    
    // 2. Não pode ser muito no futuro (ex: mais de 5 anos)
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 5);
    
    if (date > maxFutureDate) {
      throw new Error('Data não pode ser superior a 5 anos no futuro');
    }
    
    // 3. Validar período fechado
    await PeriodClosureService.validatePeriodOpen(userId, date);
  }
}
```

---

### 3.3 Histórico de Saldos ⏱️ 12h

#### Schema
```prisma
model AccountHistory {
  id          String   @id @default(cuid())
  accountId   String   @map("account_id")
  date        DateTime
  balance     Decimal
  change      Decimal  // Mudança em relação ao dia anterior
  description String?  // Descrição da mudança
  createdAt   DateTime @default(now()) @map("created_at")
  
  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  @@index([accountId, date])
  @@map("account_history")
}

model Account {
  // ... campos existentes
  history AccountHistory[]
}
```

#### Serviço
```typescript
// src/lib/services/account-history-service.ts
export class AccountHistoryService {
  static async recordBalanceChange(
    accountId: string,
    date: Date,
    newBalance: number,
    description: string
  ) {
    const previousHistory = await prisma.accountHistory.findFirst({
      where: { accountId },
      orderBy: { date: 'desc' }
    });
    
    const previousBalance = previousHistory ? Number(previousHistory.balance) : 0;
    const change = newBalance - previousBalance;
    
    return await prisma.accountHistory.create({
      data: {
        accountId,
        date,
        balance: newBalance,
        change,
        description
      }
    });
  }
  
  static async getBalanceAtDate(accountId: string, date: Date): Promise<number> {
    const history = await prisma.accountHistory.findFirst({
      where: {
        accountId,
        date: { lte: date }
      },
      orderBy: { date: 'desc' }
    });
    
    if (!history) {
      // Calcular a partir das transações
      const transactions = await prisma.transaction.findMany({
        where: {
          accountId,
          date: { lte: date },
          deletedAt: null
        }
      });
      
      return transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    }
    
    return Number(history.balance);
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Crítico
- [ ] 1.1 Idempotência (operation_uuid)
- [ ] 1.2 Segurança (bcrypt + AES-256)
- [ ] 1.3 Atomicidade Total
- [ ] 1.4 Categoria Obrigatória
- [ ] 1.5 Refresh Token JWT

### Fase 2: Importante
- [ ] 2.1 Faturas Automáticas
- [ ] 2.2 Transferências Completas
- [ ] 2.3 Controle de Fechamento

### Fase 3: Melhorias
- [ ] 3.1 Fluxo de Caixa
- [ ] 3.2 Validações Temporais
- [ ] 3.3 Histórico de Saldos
- [ ] 3.4 Eventos Derivados
- [ ] 3.5 Conciliação Bancária
- [ ] 3.6 Importação de Extratos
- [ ] 3.7 Relatórios Contábeis
- [ ] 3.8 Event Sourcing
- [ ] 3.9 Cache de Saldos
- [ ] 3.10 Logs Exportáveis

---

## 🎯 RESULTADO ESPERADO

### Após Fase 1 (2 semanas)
**Nota**: 48.5 → 65/100  
**Status**: Sistema seguro e sem duplicações

### Após Fase 2 (1 mês)
**Nota**: 65 → 80/100  
**Status**: Sistema completo para uso pessoal

### Após Fase 3 (2 meses)
**Nota**: 80 → 95/100  
**Status**: Sistema profissional/empresarial

---

## 📚 PRÓXIMOS PASSOS

1. **Revisar este plano** e priorizar funcionalidades
2. **Começar pela Fase 1** (crítico)
3. **Testar cada implementação** antes de prosseguir
4. **Documentar mudanças** conforme implementa
5. **Criar testes automatizados** para cada funcionalidade

---

**Tempo total estimado**: 120 horas (3-4 meses)  
**Complexidade**: Alta  
**Recomendação**: Implementar gradualmente, testando cada fase

🚀 **Boa sorte com a implementação!**
