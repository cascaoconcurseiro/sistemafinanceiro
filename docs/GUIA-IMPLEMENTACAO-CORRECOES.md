# 🔧 GUIA DE IMPLEMENTAÇÃO - CORREÇÕES CRÍTICAS

**Sistema**: SuaGrana  
**Data**: 01/11/2025  
**Prazo**: 6 semanas  
**Prioridade**: CRÍTICA

---

## 📋 ÍNDICE

1. [Semana 1: Partidas Dobradas](#semana-1)
2. [Semana 2: Validações](#semana-2)
3. [Semana 3: Cascade e Proteção](#semana-3)
4. [Semana 4-5: Atomicidade](#semana-4-5)
5. [Semana 6: Reconciliação](#semana-6)

---

<a name="semana-1"></a>
## 🗓️ SEMANA 1: PARTIDAS DOBRADAS

### Objetivo
Implementar sistema de lançamentos contábeis (JournalEntry) para TODAS as transações.

### Passo 1: Criar Serviço de Partidas Dobradas

**Arquivo**: `src/lib/services/double-entry-service.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class DoubleEntryService {
  /**
   * Criar lançamentos contábeis para uma transação
   */
  static async createJournalEntries(
    tx: Prisma.TransactionClient,
    transaction: any
  ) {
    const amount = Math.abs(Number(transaction.amount));
    
    // ✅ REGRA: Não criar lançamentos para cartões de crédito
    // Cartões têm sistema de faturamento próprio
    if (transaction.creditCardId) {
      console.log('ℹ️ Pulando lançamentos para cartão de crédito');
      return;
    }
    
    // ✅ REGRA: Se é compartilhada, usar myShare
    const amountToUse = transaction.isShared && transaction.myShare
      ? Math.abs(Number(transaction.myShare))
      : amount;
    
    if (transaction.type === 'RECEITA') {
      // DÉBITO: Conta (aumenta ativo)
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: transaction.accountId,
          entryType: 'DEBITO',
          amount: amountToUse,
          description: `${transaction.description} (Entrada)`
        }
      });
      
      // CRÉDITO: Receita (aumenta receita)
      const revenueAccountId = await this.getOrCreateRevenueAccount(
        tx,
        transaction.userId,
        transaction.categoryId
      );
      
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: revenueAccountId,
          entryType: 'CREDITO',
          amount: amountToUse,
          description: `${transaction.description} (Receita)`
        }
      });
    }
    
    if (transaction.type === 'DESPESA') {
      // DÉBITO: Despesa (aumenta despesa)
      const expenseAccountId = await this.getOrCreateExpenseAccount(
        tx,
        transaction.userId,
        transaction.categoryId
      );
      
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: expenseAccountId,
          entryType: 'DEBITO',
          amount: amountToUse,
          description: `${transaction.description} (Despesa)`
        }
      });
      
      // CRÉDITO: Conta (diminui ativo)
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: transaction.accountId,
          entryType: 'CREDITO',
          amount: amountToUse,
          description: `${transaction.description} (Saída)`
        }
      });
      
      // ✅ Se é compartilhada, criar lançamento de "Valores a Receber"
      if (transaction.isShared && transaction.myShare) {
        const totalPaid = Math.abs(Number(transaction.amount));
        const toReceive = totalPaid - amountToUse;
        
        if (toReceive > 0.01) {
          const receivableAccountId = await this.getOrCreateReceivableAccount(
            tx,
            transaction.userId
          );
          
          // DÉBITO: Valores a Receber (aumenta ativo)
          await tx.journalEntry.create({
            data: {
              transactionId: transaction.id,
              accountId: receivableAccountId,
              entryType: 'DEBITO',
              amount: toReceive,
              description: `${transaction.description} (A receber)`
            }
          });
        }
      }
    }
    
    // ✅ VALIDAR BALANCEAMENTO
    await this.validateBalance(tx, transaction.id);
  }
  
  /**
   * Validar se débitos = créditos
   */
  static async validateBalance(
    tx: Prisma.TransactionClient,
    transactionId: string
  ) {
    const entries = await tx.journalEntry.findMany({
      where: { transactionId }
    });
    
    const debits = entries
      .filter(e => e.entryType === 'DEBITO')
      .reduce((sum, e) => sum + Number(e.amount), 0);
      
    const credits = entries
      .filter(e => e.entryType === 'CREDITO')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    if (Math.abs(debits - credits) > 0.01) {
      throw new Error(
        `❌ Partidas não balanceadas!\n` +
        `Débitos: R$ ${debits}\n` +
        `Créditos: R$ ${credits}\n` +
        `Diferença: R$ ${Math.abs(debits - credits)}`
      );
    }
  }
  
  /**
   * Buscar ou criar conta de receita
   */
  private static async getOrCreateRevenueAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    categoryId?: string
  ): Promise<string> {
    const name = categoryId ? `Receita - ${categoryId}` : 'Receitas Gerais';
    
    let account = await tx.account.findFirst({
      where: { userId, type: 'RECEITA', name }
    });
    
    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          name,
          type: 'RECEITA',
          balance: 0,
          currency: 'BRL',
          isActive: true
        }
      });
    }
    
    return account.id;
  }
  
  /**
   * Buscar ou criar conta de despesa
   */
  private static async getOrCreateExpenseAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    categoryId?: string
  ): Promise<string> {
    const name = categoryId ? `Despesa - ${categoryId}` : 'Despesas Gerais';
    
    let account = await tx.account.findFirst({
      where: { userId, type: 'DESPESA', name }
    });
    
    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          name,
          type: 'DESPESA',
          balance: 0,
          currency: 'BRL',
          isActive: true
        }
      });
    }
    
    return account.id;
  }
  
  /**
   * Buscar ou criar conta de valores a receber
   */
  private static async getOrCreateReceivableAccount(
    tx: Prisma.TransactionClient,
    userId: string
  ): Promise<string> {
    let account = await tx.account.findFirst({
      where: { userId, type: 'ATIVO', name: 'Valores a Receber - Compartilhado' }
    });
    
    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          name: 'Valores a Receber - Compartilhado',
          type: 'ATIVO',
          balance: 0,
          currency: 'BRL',
          isActive: true
        }
      });
    }
    
    return account.id;
  }
}
```



### Passo 2: Integrar no FinancialOperationsService

**Arquivo**: `src/lib/services/financial-operations-service.ts`

```typescript
import { DoubleEntryService } from './double-entry-service';

// Modificar método createTransaction
static async createTransaction(options: CreateTransactionOptions) {
  return await prisma.$transaction(async (tx) => {
    // 1. Criar transação
    const transaction = await tx.transaction.create({ ... });
    
    // 2. ✅ NOVO: Criar lançamentos contábeis
    await DoubleEntryService.createJournalEntries(tx, transaction);
    
    // 3. Atualizar saldos
    await this.updateAccountBalance(tx, transaction.accountId);
    
    return transaction;
  });
}

// Modificar método updateTransaction
static async updateTransaction(id: string, updates: any, userId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar original
    const original = await tx.transaction.findFirst({ where: { id, userId } });
    
    // 2. ✅ NOVO: Deletar lançamentos antigos
    await tx.journalEntry.deleteMany({ where: { transactionId: id } });
    
    // 3. Atualizar transação
    const updated = await tx.transaction.update({ where: { id }, data: updates });
    
    // 4. ✅ NOVO: Criar novos lançamentos
    await DoubleEntryService.createJournalEntries(tx, updated);
    
    // 5. Atualizar saldos
    await this.updateAccountBalance(tx, updated.accountId);
    
    return updated;
  });
}

// Modificar método deleteTransaction
static async deleteTransaction(id: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Soft delete da transação
    await tx.transaction.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    
    // 2. ✅ NOVO: Deletar lançamentos contábeis
    await tx.journalEntry.deleteMany({ where: { transactionId: id } });
    
    // 3. Recalcular saldos
    await this.updateAccountBalance(tx, accountId);
  });
}
```

### Passo 3: Testar

```bash
# Criar transação de teste
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "conta-teste",
    "amount": -100,
    "description": "Teste",
    "type": "DESPESA",
    "categoryId": "alimentacao",
    "date": "2025-11-01"
  }'

# Verificar lançamentos criados
SELECT * FROM journal_entries WHERE transaction_id = 'tx-id';

# Deve retornar 2 lançamentos:
# - DÉBITO: Despesa - Alimentação (R$ 100)
# - CRÉDITO: Conta Teste (R$ 100)
```

### Passo 4: Migrar Transações Existentes

**Script**: `scripts/migrate-journal-entries.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { DoubleEntryService } from '@/lib/services/double-entry-service';

async function migrateJournalEntries() {
  console.log('🔄 Migrando lançamentos contábeis...\n');
  
  // Buscar todas as transações sem lançamentos
  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      journalEntries: { none: {} }
    }
  });
  
  console.log(`📊 Encontradas ${transactions.length} transações sem lançamentos\n`);
  
  let migrated = 0;
  let errors = 0;
  
  for (const transaction of transactions) {
    try {
      await prisma.$transaction(async (tx) => {
        await DoubleEntryService.createJournalEntries(tx, transaction);
      });
      
      migrated++;
      
      if (migrated % 100 === 0) {
        console.log(`✅ Migradas: ${migrated}/${transactions.length}`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Erro na transação ${transaction.id}:`, error.message);
    }
  }
  
  console.log(`\n✅ Migração concluída!`);
  console.log(`   Migradas: ${migrated}`);
  console.log(`   Erros: ${errors}`);
}

migrateJournalEntries();
```

**Executar**:
```bash
npx tsx scripts/migrate-journal-entries.ts
```

---

<a name="semana-2"></a>
## 🗓️ SEMANA 2: VALIDAÇÕES

### Objetivo
Adicionar validações de saldo, limite e categoria obrigatória.

### Passo 1: Criar Serviço de Validações

**Arquivo**: `src/lib/services/validation-service.ts`

```typescript
import { prisma } from '@/lib/prisma';

export class ValidationService {
  /**
   * Validar saldo da conta antes de criar despesa
   */
  static async validateAccountBalance(accountId: string, amount: number) {
    const account = await prisma.account.findUnique({ 
      where: { id: accountId } 
    });
    
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    
    // Validar saldo normal
    if (!account.allowNegativeBalance && Number(account.balance) < amount) {
      throw new Error(
        `❌ Saldo insuficiente!\n\n` +
        `Disponível: R$ ${Number(account.balance).toFixed(2)}\n` +
        `Necessário: R$ ${amount.toFixed(2)}\n` +
        `Faltam: R$ ${(amount - Number(account.balance)).toFixed(2)}`
      );
    }
    
    // Validar limite de cheque especial
    if (account.allowNegativeBalance) {
      const availableLimit = Number(account.balance) + Number(account.overdraftLimit);
      
      if (availableLimit < amount) {
        throw new Error(
          `❌ Limite de cheque especial excedido!\n\n` +
          `Saldo: R$ ${Number(account.balance).toFixed(2)}\n` +
          `Limite: R$ ${Number(account.overdraftLimit).toFixed(2)}\n` +
          `Disponível: R$ ${availableLimit.toFixed(2)}\n` +
          `Necessário: R$ ${amount.toFixed(2)}`
        );
      }
    }
  }
  
  /**
   * Validar limite do cartão antes de criar despesa
   */
  static async validateCreditCardLimit(cardId: string, amount: number) {
    const card = await prisma.creditCard.findUnique({ 
      where: { id: cardId } 
    });
    
    if (!card) {
      throw new Error('Cartão não encontrado');
    }
    
    const availableLimit = Number(card.limit) - Number(card.currentBalance);
    
    // Validar limite normal
    if (!card.allowOverLimit && availableLimit < amount) {
      throw new Error(
        `❌ Limite insuficiente!\n\n` +
        `Limite total: R$ ${Number(card.limit).toFixed(2)}\n` +
        `Já usado: R$ ${Number(card.currentBalance).toFixed(2)}\n` +
        `Disponível: R$ ${availableLimit.toFixed(2)}\n` +
        `Necessário: R$ ${amount.toFixed(2)}\n` +
        `Faltam: R$ ${(amount - availableLimit).toFixed(2)}`
      );
    }
    
    // Validar limite estendido
    if (card.allowOverLimit) {
      const maxOverLimit = Number(card.limit) * (1 + card.overLimitPercent / 100);
      const totalAvailable = maxOverLimit - Number(card.currentBalance);
      
      if (totalAvailable < amount) {
        throw new Error(
          `❌ Limite máximo excedido!\n\n` +
          `Limite normal: R$ ${Number(card.limit).toFixed(2)}\n` +
          `Limite estendido: R$ ${maxOverLimit.toFixed(2)}\n` +
          `Disponível: R$ ${totalAvailable.toFixed(2)}\n` +
          `Necessário: R$ ${amount.toFixed(2)}`
        );
      }
      
      // Avisar que está usando limite estendido
      if (Number(card.currentBalance) + amount > Number(card.limit)) {
        console.warn(
          `⚠️ ATENÇÃO: Usando limite estendido!\n` +
          `Isso pode gerar juros adicionais.`
        );
      }
    }
  }
  
  /**
   * Validar categoria obrigatória
   */
  static async validateCategory(categoryId: string | undefined, userId: string) {
    if (!categoryId) {
      throw new Error(
        `❌ Categoria obrigatória!\n\n` +
        `Toda transação deve ter uma categoria para facilitar o controle financeiro.`
      );
    }
    
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId }
    });
    
    if (!category) {
      throw new Error('Categoria não encontrada');
    }
    
    return category;
  }
  
  /**
   * Validar tipo de categoria compatível
   */
  static validateCategoryType(transactionType: string, categoryType: string) {
    if (transactionType === 'TRANSFERENCIA') {
      return; // Transferência não precisa validar tipo
    }
    
    if (transactionType !== categoryType) {
      throw new Error(
        `❌ Tipo de categoria incompatível!\n\n` +
        `Transação tipo: ${transactionType}\n` +
        `Categoria tipo: ${categoryType}\n\n` +
        `Use uma categoria do tipo ${transactionType}.`
      );
    }
  }
}
```

### Passo 2: Integrar Validações

**Arquivo**: `src/lib/services/financial-operations-service.ts`

```typescript
import { ValidationService } from './validation-service';

static async createTransaction(options: CreateTransactionOptions) {
  const { transaction } = options;
  
  // ✅ VALIDAÇÕES ANTES DE CRIAR
  
  // 1. Validar categoria
  const category = await ValidationService.validateCategory(
    transaction.categoryId,
    transaction.userId
  );
  
  // 2. Validar tipo de categoria
  ValidationService.validateCategoryType(transaction.type, category.type);
  
  // 3. Validar saldo (se for despesa em conta)
  if (transaction.type === 'DESPESA' && transaction.accountId) {
    await ValidationService.validateAccountBalance(
      transaction.accountId,
      Math.abs(Number(transaction.amount))
    );
  }
  
  // 4. Validar limite (se for despesa em cartão)
  if (transaction.type === 'DESPESA' && transaction.creditCardId) {
    await ValidationService.validateCreditCardLimit(
      transaction.creditCardId,
      Math.abs(Number(transaction.amount))
    );
  }
  
  // ✅ CRIAR TRANSAÇÃO (só se passou nas validações)
  return await prisma.$transaction(async (tx) => {
    // ... resto do código
  });
}
```

### Passo 3: Atualizar Schema

**Arquivo**: `prisma/schema.prisma`

```prisma
model Transaction {
  // ✅ TORNAR OBRIGATÓRIO
  categoryId String // Remover "?"
  
  // ✅ ADICIONAR CONSTRAINT
  categoryRef Category @relation(
    fields: [categoryId],
    references: [id],
    onDelete: Restrict // Impede deletar categoria em uso
  )
}
```

**Executar migração**:
```bash
npx prisma migrate dev --name make-category-required
```



---

<a name="semana-3"></a>
## 🗓️ SEMANA 3: CASCADE E PROTEÇÃO

### Objetivo
Proteger histórico de dados e implementar inativação em vez de deleção.

### Passo 1: Atualizar Schema Prisma

**Arquivo**: `prisma/schema.prisma`

```prisma
model Transaction {
  // ✅ MUDAR CASCADE PARA RESTRICT
  account Account? @relation(
    fields: [accountId],
    references: [id],
    onDelete: Restrict // ❌ Era: Cascade
  )
  
  categoryRef Category? @relation(
    fields: [categoryId],
    references: [id],
    onDelete: Restrict // ❌ Era: sem onDelete
  )
}
```

**Executar migração**:
```bash
npx prisma migrate dev --name fix-cascade-constraints
```

### Passo 2: Implementar Inativação de Contas

**Arquivo**: `src/lib/services/account-service.ts`

```typescript
import { prisma } from '@/lib/prisma';

export class AccountService {
  /**
   * Deletar conta (com validação)
   */
  static async deleteAccount(id: string, userId: string) {
    // 1. Verificar se tem transações
    const transactionCount = await prisma.transaction.count({
      where: { 
        accountId: id,
        deletedAt: null
      }
    });
    
    if (transactionCount > 0) {
      throw new Error(
        `❌ Não é possível deletar conta com transações!\n\n` +
        `Esta conta tem ${transactionCount} transações.\n\n` +
        `Opções:\n` +
        `1. Use "Inativar Conta" para manter o histórico\n` +
        `2. Reclassifique as transações para outra conta\n` +
        `3. Exporte os dados antes de deletar`
      );
    }
    
    // 2. Se não tem transações, pode deletar (soft delete)
    return await prisma.account.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    });
  }
  
  /**
   * Inativar conta (recomendado)
   */
  static async inactivateAccount(id: string, userId: string) {
    const account = await prisma.account.findFirst({
      where: { id, userId }
    });
    
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    
    if (!account.isActive) {
      throw new Error('Conta já está inativa');
    }
    
    return await prisma.account.update({
      where: { id },
      data: { isActive: false }
    });
  }
  
  /**
   * Reativar conta
   */
  static async reactivateAccount(id: string, userId: string) {
    const account = await prisma.account.findFirst({
      where: { id, userId }
    });
    
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    
    if (account.isActive) {
      throw new Error('Conta já está ativa');
    }
    
    return await prisma.account.update({
      where: { id },
      data: { 
        isActive: true,
        deletedAt: null // Limpar soft delete se existir
      }
    });
  }
  
  /**
   * Reclassificar transações para outra conta
   */
  static async reclassifyTransactions(
    fromAccountId: string,
    toAccountId: string,
    userId: string
  ) {
    // Validar contas
    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({ where: { id: fromAccountId, userId } }),
      prisma.account.findFirst({ where: { id: toAccountId, userId } })
    ]);
    
    if (!fromAccount || !toAccount) {
      throw new Error('Conta não encontrada');
    }
    
    return await prisma.$transaction(async (tx) => {
      // 1. Atualizar transações
      const result = await tx.transaction.updateMany({
        where: {
          accountId: fromAccountId,
          deletedAt: null
        },
        data: {
          accountId: toAccountId
        }
      });
      
      // 2. Recalcular saldos
      await this.recalculateBalance(tx, fromAccountId);
      await this.recalculateBalance(tx, toAccountId);
      
      return result;
    });
  }
  
  /**
   * Recalcular saldo da conta
   */
  private static async recalculateBalance(
    tx: any,
    accountId: string
  ) {
    const entries = await tx.journalEntry.findMany({
      where: {
        accountId,
        transaction: { deletedAt: null }
      }
    });
    
    const balance = entries.reduce((sum: number, entry: any) => {
      return entry.entryType === 'DEBITO'
        ? sum + Number(entry.amount)
        : sum - Number(entry.amount);
    }, 0);
    
    await tx.account.update({
      where: { id: accountId },
      data: { balance }
    });
  }
}
```

### Passo 3: Implementar Proteção de Categorias

**Arquivo**: `src/lib/services/category-service.ts`

```typescript
import { prisma } from '@/lib/prisma';

export class CategoryService {
  /**
   * Deletar categoria (com validação)
   */
  static async deleteCategory(id: string, userId: string) {
    // 1. Verificar se está em uso
    const transactionCount = await prisma.transaction.count({
      where: {
        categoryId: id,
        deletedAt: null
      }
    });
    
    if (transactionCount > 0) {
      throw new Error(
        `❌ Não é possível deletar categoria em uso!\n\n` +
        `Esta categoria tem ${transactionCount} transações.\n\n` +
        `Opções:\n` +
        `1. Reclassifique as transações para outra categoria\n` +
        `2. Inative a categoria (ela não aparecerá mais na lista)`
      );
    }
    
    // 2. Se não está em uso, pode deletar
    return await prisma.category.delete({
      where: { id }
    });
  }
  
  /**
   * Inativar categoria
   */
  static async inactivateCategory(id: string, userId: string) {
    return await prisma.category.update({
      where: { id },
      data: { isActive: false }
    });
  }
  
  /**
   * Reclassificar transações
   */
  static async reclassifyTransactions(
    fromCategoryId: string,
    toCategoryId: string,
    userId: string
  ) {
    // Validar categorias
    const [fromCategory, toCategory] = await Promise.all([
      prisma.category.findFirst({ where: { id: fromCategoryId, userId } }),
      prisma.category.findFirst({ where: { id: toCategoryId, userId } })
    ]);
    
    if (!fromCategory || !toCategory) {
      throw new Error('Categoria não encontrada');
    }
    
    // Validar tipo compatível
    if (fromCategory.type !== toCategory.type) {
      throw new Error(
        `Categorias devem ser do mesmo tipo!\n` +
        `Origem: ${fromCategory.type}\n` +
        `Destino: ${toCategory.type}`
      );
    }
    
    // Atualizar transações
    return await prisma.transaction.updateMany({
      where: {
        categoryId: fromCategoryId,
        deletedAt: null
      },
      data: {
        categoryId: toCategoryId
      }
    });
  }
}
```

### Passo 4: Atualizar APIs

**Arquivo**: `src/app/api/accounts/[id]/route.ts`

```typescript
import { AccountService } from '@/lib/services/account-service';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // ✅ USAR SERVIÇO COM VALIDAÇÃO
    await AccountService.deleteAccount(params.id, auth.userId);
    
    return NextResponse.json({
      success: true,
      message: 'Conta deletada com sucesso'
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao deletar conta' },
      { status: 500 }
    );
  }
}
```

**Criar nova rota para inativar**:

**Arquivo**: `src/app/api/accounts/[id]/inactivate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AccountService } from '@/lib/services/account-service';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    await AccountService.inactivateAccount(params.id, auth.userId);
    
    return NextResponse.json({
      success: true,
      message: 'Conta inativada com sucesso'
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Erro ao inativar conta' },
      { status: 500 }
    );
  }
}
```

---

<a name="semana-4-5"></a>
## 🗓️ SEMANA 4-5: ATOMICIDADE TOTAL

### Objetivo
Garantir que TODAS as operações usem transações atômicas.

### Passo 1: Refatorar Transferências

**Arquivo**: `src/lib/services/financial-operations-service.ts`

```typescript
/**
 * Criar transferência com atomicidade GARANTIDA
 */
static async createTransfer(options: CreateTransferOptions) {
  const { fromAccountId, toAccountId, amount, description, date, userId } = options;
  
  // Validações
  if (fromAccountId === toAccountId) {
    throw new Error('Conta de origem e destino não podem ser iguais');
  }
  
  if (amount <= 0) {
    throw new Error('Valor deve ser maior que zero');
  }
  
  // ✅ Validar saldo da conta origem
  await ValidationService.validateAccountBalance(fromAccountId, amount);
  
  const transferId = `transfer_${Date.now()}`;
  
  // ✅ TUDO EM UMA TRANSAÇÃO ATÔMICA
  return await prisma.$transaction(async (tx) => {
    // 1. Criar débito (saída)
    const debitTransaction = await tx.transaction.create({
      data: {
        userId,
        accountId: fromAccountId,
        amount: -Math.abs(amount),
        description: `${description} (Transferência para)`,
        type: 'DESPESA',
        date,
        status: 'cleared',
        isTransfer: true,
        transferId,
        transferType: 'debit',
        categoryId: 'transferencia' // Categoria especial
      }
    });
    
    // 2. Criar crédito (entrada)
    const creditTransaction = await tx.transaction.create({
      data: {
        userId,
        accountId: toAccountId,
        amount: Math.abs(amount),
        description: `${description} (Transferência de)`,
        type: 'RECEITA',
        date,
        status: 'cleared',
        isTransfer: true,
        transferId,
        transferType: 'credit',
        categoryId: 'transferencia'
      }
    });
    
    // 3. Criar lançamentos contábeis
    await DoubleEntryService.createJournalEntries(tx, debitTransaction);
    await DoubleEntryService.createJournalEntries(tx, creditTransaction);
    
    // 4. Atualizar saldos
    await this.updateAccountBalance(tx, fromAccountId);
    await this.updateAccountBalance(tx, toAccountId);
    
    // ✅ Se QUALQUER operação falhar, ROLLBACK automático
    return {
      debitTransaction,
      creditTransaction,
      transferId
    };
  });
}
```

### Passo 2: Refatorar Parcelamentos

```typescript
/**
 * Criar parcelamento com atomicidade GARANTIDA
 */
static async createInstallments(options: CreateInstallmentsOptions) {
  const { baseTransaction, totalInstallments, firstDueDate, frequency } = options;
  
  // Validações
  if (totalInstallments < 2) {
    throw new Error('Parcelamento deve ter pelo menos 2 parcelas');
  }
  
  if (totalInstallments > 120) {
    throw new Error('Máximo de 120 parcelas');
  }
  
  const installmentGroupId = `inst_${Date.now()}`;
  const totalAmount = Math.abs(Number(baseTransaction.amount));
  const amountPerInstallment = totalAmount / totalInstallments;
  
  // ✅ TUDO EM UMA TRANSAÇÃO ATÔMICA
  return await prisma.$transaction(async (tx) => {
    const installments = [];
    const installmentTransactions = [];
    
    // Criar TODAS as parcelas
    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = this.calculateDueDate(firstDueDate, i - 1, frequency);
      const isPaid = i === 1; // Primeira parcela já venceu
      
      // Transação da parcela
      const installmentTransaction = await tx.transaction.create({
        data: {
          ...baseTransaction,
          amount: -amountPerInstallment,
          date: dueDate,
          description: baseTransaction.description,
          notes: `Parcela ${i}/${totalInstallments} • Total: R$ ${totalAmount.toFixed(2)}`,
          isInstallment: true,
          installmentNumber: i,
          totalInstallments,
          installmentGroupId,
          status: isPaid ? 'cleared' : 'pending'
        }
      });
      
      installmentTransactions.push(installmentTransaction);
      
      // Registro de controle
      const installment = await tx.installment.create({
        data: {
          transactionId: installmentTransaction.id,
          userId: baseTransaction.userId,
          installmentNumber: i,
          totalInstallments,
          amount: amountPerInstallment,
          dueDate,
          status: isPaid ? 'paid' : 'pending',
          paidAt: isPaid ? new Date() : null,
          description: `${baseTransaction.description} - ${i}/${totalInstallments}`
        }
      });
      
      installments.push(installment);
      
      // Criar lançamentos apenas para primeira parcela
      if (isPaid) {
        await DoubleEntryService.createJournalEntries(tx, installmentTransaction);
      }
    }
    
    // Atualizar saldo (se não for cartão)
    if (!baseTransaction.creditCardId && installmentTransactions[0]?.accountId) {
      await this.updateAccountBalance(tx, installmentTransactions[0].accountId);
    }
    
    // ✅ Se QUALQUER parcela falhar, ROLLBACK de todas
    return {
      parentTransaction: installmentTransactions[0],
      installmentTransactions,
      installments,
      totalAmount
    };
  });
}
```

### Passo 3: Refatorar Despesas Compartilhadas

```typescript
/**
 * Criar despesa compartilhada com atomicidade GARANTIDA
 */
static async createSharedExpense(options: CreateSharedExpenseOptions) {
  const { transaction, sharedWith, splitType, splits } = options;
  
  // Validações
  if (!sharedWith || sharedWith.length === 0) {
    throw new Error('Deve compartilhar com pelo menos uma pessoa');
  }
  
  const totalAmount = Math.abs(Number(transaction.amount));
  const splitAmounts = this.calculateSplits(totalAmount, sharedWith, splitType, splits);
  
  // ✅ TUDO EM UMA TRANSAÇÃO ATÔMICA
  return await prisma.$transaction(async (tx) => {
    // 1. Criar transação principal
    const createdTransaction = await tx.transaction.create({
      data: {
        ...transaction,
        isShared: true,
        sharedWith: JSON.stringify(sharedWith),
        totalSharedAmount: totalAmount,
        myShare: splitAmounts[transaction.userId] || 0
      }
    });
    
    // 2. Criar lançamentos contábeis (com valores a receber)
    await DoubleEntryService.createJournalEntries(tx, createdTransaction);
    
    // 3. Criar dívidas para cada participante
    const debts = [];
    for (const [participantId, amount] of Object.entries(splitAmounts)) {
      if (participantId !== transaction.userId && amount > 0) {
        const debt = await tx.sharedDebt.create({
          data: {
            userId: transaction.userId,
            creditorId: transaction.userId,
            debtorId: participantId,
            originalAmount: amount,
            currentAmount: amount,
            paidAmount: 0,
            description: createdTransaction.description,
            status: 'active',
            transactionId: createdTransaction.id
          }
        });
        debts.push(debt);
      }
    }
    
    // 4. Atualizar saldo
    if (createdTransaction.accountId) {
      await this.updateAccountBalance(tx, createdTransaction.accountId);
    }
    
    // ✅ Se QUALQUER operação falhar, ROLLBACK completo
    return {
      transaction: createdTransaction,
      debts
    };
  });
}
```



---

<a name="semana-6"></a>
## 🗓️ SEMANA 6: RECONCILIAÇÃO

### Objetivo
Implementar sistema de reconciliação para detectar e corrigir discrepâncias.

### Passo 1: Criar Serviço de Reconciliação

**Arquivo**: `src/lib/services/reconciliation-service.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class ReconciliationService {
  /**
   * Reconciliar conta com saldo real
   */
  static async reconcileAccount(
    accountId: string,
    realBalance: number,
    userId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar conta
      const account = await tx.account.findFirst({
        where: { id: accountId, userId }
      });
      
      if (!account) {
        throw new Error('Conta não encontrada');
      }
      
      // 2. Calcular diferença
      const calculatedBalance = Number(account.balance);
      const difference = realBalance - calculatedBalance;
      
      console.log(`📊 Reconciliação da conta ${account.name}:`);
      console.log(`   Saldo calculado: R$ ${calculatedBalance.toFixed(2)}`);
      console.log(`   Saldo real: R$ ${realBalance.toFixed(2)}`);
      console.log(`   Diferença: R$ ${difference.toFixed(2)}`);
      
      // 3. Se há diferença, criar ajuste
      if (Math.abs(difference) > 0.01) {
        // Buscar ou criar categoria de reconciliação
        let category = await tx.category.findFirst({
          where: {
            userId,
            name: 'Ajuste de Reconciliação',
            type: difference > 0 ? 'RECEITA' : 'DESPESA'
          }
        });
        
        if (!category) {
          category = await tx.category.create({
            data: {
              userId,
              name: 'Ajuste de Reconciliação',
              type: difference > 0 ? 'RECEITA' : 'DESPESA',
              description: 'Ajustes automáticos de reconciliação',
              isDefault: true,
              isActive: true
            }
          });
        }
        
        // Criar transação de ajuste
        const adjustment = await tx.transaction.create({
          data: {
            userId,
            accountId,
            amount: difference,
            type: difference > 0 ? 'RECEITA' : 'DESPESA',
            description: 'Ajuste de reconciliação',
            categoryId: category.id,
            date: new Date(),
            status: 'cleared',
            isReconciled: true,
            reconciledAt: new Date(),
            notes: `Ajuste automático: diferença de R$ ${Math.abs(difference).toFixed(2)}`
          }
        });
        
        // Criar lançamentos contábeis
        const { DoubleEntryService } = await import('./double-entry-service');
        await DoubleEntryService.createJournalEntries(tx, adjustment);
        
        console.log(`✅ Ajuste criado: R$ ${difference.toFixed(2)}`);
      } else {
        console.log(`✅ Conta já está balanceada`);
      }
      
      // 4. Marcar transações como reconciliadas
      const reconciled = await tx.transaction.updateMany({
        where: {
          accountId,
          isReconciled: false,
          date: { lte: new Date() },
          deletedAt: null
        },
        data: {
          isReconciled: true,
          reconciledAt: new Date()
        }
      });
      
      console.log(`✅ ${reconciled.count} transações marcadas como reconciliadas`);
      
      // 5. Atualizar saldo reconciliado
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: realBalance,
          reconciledBalance: realBalance
        }
      });
      
      return {
        difference,
        adjusted: Math.abs(difference) > 0.01,
        reconciledTransactions: reconciled.count
      };
    });
  }
  
  /**
   * Verificar integridade de todas as contas
   */
  static async verifyAllAccounts(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true, deletedAt: null }
    });
    
    const results = [];
    
    for (const account of accounts) {
      // Calcular saldo por JournalEntry
      const entries = await prisma.journalEntry.findMany({
        where: {
          accountId: account.id,
          transaction: { deletedAt: null }
        }
      });
      
      const calculatedBalance = entries.reduce((sum, entry) => {
        return entry.entryType === 'DEBITO'
          ? sum + Number(entry.amount)
          : sum - Number(entry.amount);
      }, 0);
      
      const storedBalance = Number(account.balance);
      const difference = Math.abs(calculatedBalance - storedBalance);
      
      results.push({
        accountId: account.id,
        accountName: account.name,
        storedBalance,
        calculatedBalance,
        difference,
        isCorrect: difference < 0.01
      });
    }
    
    return {
      totalAccounts: results.length,
      correctAccounts: results.filter(r => r.isCorrect).length,
      incorrectAccounts: results.filter(r => !r.isCorrect).length,
      results
    };
  }
  
  /**
   * Corrigir todas as contas com discrepância
   */
  static async fixAllAccounts(userId: string) {
    const verification = await this.verifyAllAccounts(userId);
    
    const fixed = [];
    const errors = [];
    
    for (const result of verification.results) {
      if (!result.isCorrect) {
        try {
          await this.reconcileAccount(
            result.accountId,
            result.calculatedBalance,
            userId
          );
          fixed.push(result.accountName);
        } catch (error) {
          errors.push({
            account: result.accountName,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }
    }
    
    return {
      fixed: fixed.length,
      errors: errors.length,
      fixedAccounts: fixed,
      errorDetails: errors
    };
  }
}
```

### Passo 2: Criar API de Reconciliação

**Arquivo**: `src/app/api/accounts/[id]/reconcile/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ReconciliationService } from '@/lib/services/reconciliation-service';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    const body = await request.json();
    const { realBalance } = body;
    
    if (typeof realBalance !== 'number') {
      return NextResponse.json(
        { error: 'Saldo real é obrigatório' },
        { status: 400 }
      );
    }
    
    const result = await ReconciliationService.reconcileAccount(
      params.id,
      realBalance,
      auth.userId
    );
    
    return NextResponse.json({
      success: true,
      ...result,
      message: result.adjusted
        ? `Conta reconciliada com ajuste de R$ ${Math.abs(result.difference).toFixed(2)}`
        : 'Conta já estava balanceada'
    });
  } catch (error) {
    console.error('Erro ao reconciliar conta:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Erro ao reconciliar conta' },
      { status: 500 }
    );
  }
}
```

**Arquivo**: `src/app/api/accounts/verify-integrity/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ReconciliationService } from '@/lib/services/reconciliation-service';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    const result = await ReconciliationService.verifyAllAccounts(auth.userId);
    
    return NextResponse.json({
      success: true,
      ...result,
      hasIssues: result.incorrectAccounts > 0
    });
  } catch (error) {
    console.error('Erro ao verificar integridade:', error);
    
    return NextResponse.json(
      { error: 'Erro ao verificar integridade' },
      { status: 500 }
    );
  }
}
```

### Passo 3: Criar Interface de Reconciliação

**Arquivo**: `src/components/features/accounts/reconciliation-modal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ReconciliationModalProps {
  account: {
    id: string;
    name: string;
    balance: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReconciliationModal({
  account,
  isOpen,
  onClose,
  onSuccess
}: ReconciliationModalProps) {
  const [realBalance, setRealBalance] = useState(account.balance.toString());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const difference = parseFloat(realBalance) - account.balance;
  
  const handleReconcile = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/accounts/${account.id}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realBalance: parseFloat(realBalance) })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao reconciliar');
      }
      
      const data = await response.json();
      setResult(data);
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erro:', error);
      alert(error instanceof Error ? error.message : 'Erro ao reconciliar');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reconciliar Conta: {account.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Saldo no Sistema</label>
            <p className="text-2xl font-bold">
              R$ {account.balance.toFixed(2)}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium">Saldo Real (Extrato)</label>
            <Input
              type="number"
              step="0.01"
              value={realBalance}
              onChange={(e) => setRealBalance(e.target.value)}
              placeholder="0.00"
            />
          </div>
          
          {Math.abs(difference) > 0.01 && (
            <div className={`p-4 rounded ${difference > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm font-medium">Diferença</p>
              <p className={`text-xl font-bold ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {difference > 0 ? '+' : ''}R$ {difference.toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {difference > 0
                  ? 'Será criado um ajuste de RECEITA'
                  : 'Será criado um ajuste de DESPESA'}
              </p>
            </div>
          )}
          
          {result && (
            <div className="p-4 bg-green-50 rounded">
              <p className="text-green-600 font-medium">✅ {result.message}</p>
              <p className="text-sm text-gray-600 mt-1">
                {result.reconciledTransactions} transações reconciliadas
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={handleReconcile}
              disabled={loading || Math.abs(difference) < 0.01}
              className="flex-1"
            >
              {loading ? 'Reconciliando...' : 'Reconciliar'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📊 CRONOGRAMA COMPLETO

| Semana | Tarefa | Prioridade | Tempo Estimado |
|--------|--------|------------|----------------|
| 1 | Partidas Dobradas | 🔴 CRÍTICA | 40h |
| 2 | Validações | 🔴 CRÍTICA | 30h |
| 3 | Cascade e Proteção | 🟡 ALTA | 20h |
| 4-5 | Atomicidade Total | 🟡 ALTA | 40h |
| 6 | Reconciliação | 🟢 MÉDIA | 20h |
| **TOTAL** | **6 semanas** | - | **150h** |

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Semana 1: Partidas Dobradas
- [ ] Criar `double-entry-service.ts`
- [ ] Integrar no `financial-operations-service.ts`
- [ ] Testar criação de lançamentos
- [ ] Migrar transações existentes
- [ ] Validar balanceamento

### Semana 2: Validações
- [ ] Criar `validation-service.ts`
- [ ] Validar saldo antes de despesa
- [ ] Validar limite de cartão
- [ ] Tornar categoria obrigatória
- [ ] Atualizar schema Prisma

### Semana 3: Cascade e Proteção
- [ ] Atualizar constraints no schema
- [ ] Criar `account-service.ts`
- [ ] Criar `category-service.ts`
- [ ] Implementar inativação
- [ ] Criar APIs de reclassificação

### Semana 4-5: Atomicidade
- [ ] Refatorar transferências
- [ ] Refatorar parcelamentos
- [ ] Refatorar despesas compartilhadas
- [ ] Testar rollback
- [ ] Validar integridade

### Semana 6: Reconciliação
- [ ] Criar `reconciliation-service.ts`
- [ ] Criar APIs de reconciliação
- [ ] Criar interface de reconciliação
- [ ] Testar ajustes automáticos
- [ ] Documentar processo

---

## 🧪 TESTES RECOMENDADOS

### Após Semana 1
```bash
# Testar partidas dobradas
npm run test:journal-entries

# Verificar balanceamento
npm run validate:balance
```

### Após Semana 2
```bash
# Testar validações
npm run test:validations

# Tentar criar despesa sem saldo
npm run test:insufficient-balance
```

### Após Semana 3
```bash
# Tentar deletar conta com transações
npm run test:delete-protection

# Testar inativação
npm run test:inactivation
```

### Após Semana 4-5
```bash
# Testar atomicidade
npm run test:atomicity

# Simular falhas
npm run test:rollback
```

### Após Semana 6
```bash
# Testar reconciliação
npm run test:reconciliation

# Verificar integridade
npm run verify:integrity
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **AUDITORIA-CRITICA-SISTEMA-FINANCEIRO.md** - Análise completa
- **EXEMPLOS-PROBLEMAS-REAIS.md** - Casos práticos
- **CHECKLIST-VALIDACAO-SISTEMA.md** - Testes de validação
- **RESUMO-EXECUTIVO-AUDITORIA.md** - Resumo executivo

---

**Desenvolvido com ❤️ para SuaGrana**  
**Prazo**: 6 semanas  
**Resultado**: Sistema 100% confiável

