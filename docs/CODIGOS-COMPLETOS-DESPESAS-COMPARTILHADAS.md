# 📦 CÓDIGOS COMPLETOS - SISTEMA DE DESPESAS COMPARTILHADAS E VIAGENS

## 📋 ÍNDICE

1. [Formulário de Nova Transação](#1-formulário-de-nova-transação)
2. [Página de Viagens](#2-página-de-viagens)
3. [Visão Geral da Viagem](#3-visão-geral-da-viagem)
4. [Despesas Compartilhadas](#4-despesas-compartilhadas)
5. [Lista de Dívidas Pendentes](#5-lista-de-dívidas-pendentes)
6. [Fatura Consolidada](#6-fatura-consolidada)
7. [API de Transações](#7-api-de-transações)
8. [API de Dívidas](#8-api-de-dívidas)
9. [Fluxo Completo](#9-fluxo-completo)

---

## 1. FORMULÁRIO DE NOVA TRANSAÇÃO

### 📍 Localização
`src/components/modals/transactions/add-transaction-modal.tsx`

### 🎯 Função
Modal principal para criar transações. Este é o ponto de entrada para todas as transações do sistema.

### 🔗 Conexões
- **API**: `POST /api/transactions` - Cria a transação
- **Contexto**: `useUnifiedFinancial()` - Busca contas, categorias, viagens
- **Componentes**: `FamilySelector` - Seleciona participantes para compartilhamento

### 📝 Campos Principais

```typescript
interface FormData {
  // Básicos
  description: string;        // Descrição da transação
  amount: string;            // Valor (formato: "100,50")
  type: 'income' | 'expense'; // Tipo
  date: string;              // Data (formato: "dd/mm/aaaa")
  
  // Conta/Cartão
  account: string;           // ID da conta
  creditCard: string;        // ID do cartão (se aplicável)
  
  // Categoria
  category: string;          // ID da categoria
  
  // Compartilhamento
  isShared: boolean;         // Se é compartilhada
  selectedContacts: string[]; // IDs dos participantes
  sharedWith: string[];      // IDs para enviar à API
  divisionMethod: 'equal' | 'percentage' | 'amount';
  sharedPercentages: Record<string, number>; // % de cada um
  
  // Viagem
  tripId: string;            // ID da viagem
  isLinkedToTrip: boolean;   // Se está vinculada
  
  // Parcelamento
  installments: number;      // Número de parcelas
  
  // Pago por outro
  isPaidBy: boolean;         // Se foi pago por outra pessoa
  paidByPerson: string;      // ID de quem pagou
}
```

### 🔄 Fluxo de Criação

```
1. Usuário preenche formulário
   ↓
2. Valida dados (conta, valor, data)
   ↓
3. Se compartilhada: calcula divisão
   ↓
4. Envia para API POST /api/transactions
   ↓
5. API cria transação + dívidas
   ↓
6. Atualiza contexto
   ↓
7. Fecha modal
```

### 💡 Exemplo de Uso

**Despesa Compartilhada em Viagem:**
```typescript
{
  description: "Jantar no restaurante",
  amount: "200,00",
  type: "expense",
  account: "conta-corrente-id",
  category: "alimentacao-id",
  date: "15/11/2024",
  
  // Compartilhamento
  isShared: true,
  selectedContacts: ["maria-id", "joao-id"],
  divisionMethod: "equal",
  
  // Viagem
  tripId: "viagem-paris-id",
  isLinkedToTrip: true
}
```

**Resultado:**
- Cria 1 transação de R$ 200,00
- Calcula: R$ 66,67 para cada um (3 pessoas)
- Cria 2 dívidas:
  - Maria deve R$ 66,67
  - João deve R$ 66,67
- Vincula à viagem Paris

---


## 7. API DE TRANSAÇÕES (CÓDIGO COMPLETO)

### 📍 Localização
`src/app/api/transactions/route.ts`

### 🎯 Função
API REST para gerenciar transações. Endpoints:
- `GET /api/transactions` - Lista transações
- `POST /api/transactions` - Cria transação

### 📝 CÓDIGO COMPLETO

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { TransactionSchema, validateOrThrow } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/transactions
 * Lista todas as transações do usuário com filtros opcionais
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');
    const goalId = searchParams.get('goalId');
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = { 
      userId: auth.userId, 
      deletedAt: null,
      paidBy: null, // Excluir transações pagas por outros
    };
    if (tripId) where.tripId = tripId;
    if (goalId) where.goalId = goalId;
    if (accountId) where.accountId = accountId;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const { prisma } = await import('@/lib/prisma');
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          description: true,
          amount: true,
          date: true,
          type: true,
          status: true,
          accountId: true,
          categoryId: true,
          creditCardId: true,
          isShared: true,
          myShare: true,
          totalSharedAmount: true,
          isInstallment: true,
          installmentNumber: true,
          totalInstallments: true,
          tripId: true,
          goalId: true,
          createdAt: true,
          paidBy: true,
          metadata: true,
          sharedWith: true,
          account: { select: { id: true, name: true, type: true } },
          categoryRef: { select: { id: true, name: true, type: true } },
          creditCard: { select: { id: true, name: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      transactions: transactions.map(t => ({
        ...t,
        amount: Number(t.amount),
        myShare: t.myShare ? Number(t.myShare) : null,
        totalSharedAmount: t.totalSharedAmount ? Number(t.totalSharedAmount) : null,
        category: t.categoryRef?.name || 'Sem Categoria',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + transactions.length < total,
      },
    });
  } catch (error) {
    console.error('❌ [API Transactions GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Cria uma nova transação com validação completa
 * 
 * FLUXO:
 * 1. Autentica usuário
 * 2. Prepara dados (converte tipos, calcula compartilhamento)
 * 3. Valida com Zod
 * 4. Cria transação no banco
 * 5. Se compartilhada, cria dívidas
 * 6. Retorna sucesso
 */
export async function POST(request: NextRequest) {
  try {
    // 1. AUTENTICAÇÃO
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 [API] Dados recebidos:', body);

    // 2. PREPARAR DADOS
    const typeMap: Record<string, string> = {
      'income': 'RECEITA',
      'expense': 'DESPESA',
      'transfer': 'TRANSFERENCIA',
    };

    const installments = body.installments || body.totalInstallments;
    const dateWithTime = body.date.includes('T') ? body.date : `${body.date}T12:00:00`;
    
    // 2.1 CALCULAR COMPARTILHAMENTO
    const isShared = body.sharedWith && Array.isArray(body.sharedWith) && body.sharedWith.length > 0;
    let sharedFields = {};

    if (isShared) {
      const totalParticipants = body.sharedWith.length + 1;
      const amount = Math.abs(Number(body.amount));
      const myShare = amount / totalParticipants;
      const totalSharedAmount = amount;

      console.log(`🤝 [API] Compartilhada com ${totalParticipants} pessoas`);

      sharedFields = {
        isShared: true,
        myShare,
        totalSharedAmount,
      };
    }

    // 2.2 MONTAR OBJETO FINAL
    const transactionData = {
      ...body,
      userId: auth.userId,
      type: typeMap[body.type] || body.type,
      date: new Date(dateWithTime),
      amount: Math.abs(Number(body.amount)),
      ...sharedFields, // ✅ Só adiciona se existir
      ...(installments && installments > 1 ? {
        isInstallment: true,
        installmentNumber: body.installmentNumber || 1,
        totalInstallments: installments,
      } : {}),
    };

    // 2.3 CASO ESPECIAL: PAGO POR OUTRA PESSOA
    if (body.paidBy && body.paidBy !== auth.userId) {
      console.log('👤 [API] Pago por outra pessoa - criando dívida');
      
      const { prisma } = await import('@/lib/prisma');
      
      let categoryName = 'Sem categoria';
      if (body.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: body.categoryId },
          select: { name: true },
        });
        categoryName = category?.name || 'Sem categoria';
      }
      
      const debt = await prisma.sharedDebt.create({
        data: {
          userId: auth.userId,
          creditorId: body.paidBy,
          debtorId: auth.userId,
          originalAmount: body.myShare || body.amount,
          currentAmount: body.myShare || body.amount,
          description: `${body.description} (${categoryName})`,
          status: 'active',
        },
      });
      
      return NextResponse.json({
        success: true,
        debt,
        message: 'Dívida registrada (não debitado da sua conta)',
      });
    }

    // 3. VALIDAÇÃO COM ZOD
    try {
      console.log('🔍 [API] Validando dados...');
      validateOrThrow(TransactionSchema, transactionData);
      console.log('✅ [API] Validação OK!');
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ [API] Erro de validação:', error.errors);
        return NextResponse.json(
          {
            error: 'Dados inválidos',
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 4. CRIAR TRANSAÇÃO
    if (installments && installments > 1) {
      // 4.1 PARCELADO
      console.log(`📦 [API] Criando ${installments} parcelas`);

      const result = await FinancialOperationsService.createInstallments({
        baseTransaction: transactionData,
        totalInstallments: installments,
        firstDueDate: transactionData.date,
        frequency: 'monthly',
      });

      return NextResponse.json({
        success: true,
        message: `${result.installments.length} parcelas criadas`,
        parentTransaction: result.parentTransaction,
        installments: result.installments,
      });
    }

    // 4.2 TRANSAÇÃO ÚNICA
    const transaction = await FinancialOperationsService.createTransaction({
      transaction: transactionData,
      createJournalEntries: true,
      linkToInvoice: !!body.creditCardId,
    });

    return NextResponse.json({
      success: true,
      transaction: {
        ...transaction,
        amount: Number(transaction.amount),
        myShare: transaction.myShare ? Number(transaction.myShare) : null,
        totalSharedAmount: transaction.totalSharedAmount ? Number(transaction.totalSharedAmount) : null,
      },
    });
  } catch (error) {
    console.error('❌ [API] Erro:', error);

    if (error instanceof Error) {
      if (error.message.includes('Saldo insuficiente')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('Limite insuficiente')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(
        {
          error: `Erro ao criar transação: ${error.message}`,
          details: process.env.NODE_ENV === 'development' ? error.stack : error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar transação', details: String(error) },
      { status: 500 }
    );
  }
}
```

### 🔄 Fluxo Detalhado do POST

```
┌─────────────────────────────────────────────────────────────┐
│ 1. RECEBE REQUISIÇÃO                                        │
│    - Autentica usuário                                      │
│    - Parse do body JSON                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PREPARA DADOS                                            │
│    - Converte tipo (income → RECEITA)                       │
│    - Adiciona horário à data                                │
│    - Calcula compartilhamento (se aplicável)                │
│      * totalParticipants = sharedWith.length + 1            │
│      * myShare = amount / totalParticipants                 │
│      * totalSharedAmount = amount                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CASO ESPECIAL: PAGO POR OUTRO?                           │
│    SIM → Cria SharedDebt e retorna                          │
│    NÃO → Continua                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. VALIDAÇÃO ZOD                                            │
│    - Valida todos os campos                                 │
│    - Se erro: retorna 400 com detalhes                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CRIAR TRANSAÇÃO                                          │
│    PARCELADO?                                               │
│    SIM → createInstallments()                               │
│    NÃO → createTransaction()                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. RETORNA SUCESSO                                          │
│    - transaction: objeto criado                             │
│    - success: true                                          │
└─────────────────────────────────────────────────────────────┘
```

### 💡 Exemplos de Requisição

**Exemplo 1: Despesa Simples**
```json
POST /api/transactions
{
  "description": "Almoço",
  "amount": 50,
  "type": "expense",
  "accountId": "conta-123",
  "categoryId": "alimentacao-456",
  "date": "2024-11-18T12:00:00"
}
```

**Exemplo 2: Despesa Compartilhada**
```json
POST /api/transactions
{
  "description": "Jantar",
  "amount": 150,
  "type": "expense",
  "accountId": "conta-123",
  "categoryId": "alimentacao-456",
  "date": "2024-11-18T12:00:00",
  "isShared": true,
  "sharedWith": ["maria-id", "joao-id"]
}
```
**Resultado:**
- Cria transação de R$ 150
- myShare = R$ 50 (150 / 3)
- Cria 2 dívidas de R$ 50 cada

**Exemplo 3: Pago por Outro**
```json
POST /api/transactions
{
  "description": "Uber",
  "amount": 30,
  "type": "expense",
  "categoryId": "transporte-789",
  "date": "2024-11-18T12:00:00",
  "paidBy": "maria-id",
  "myShare": 15
}
```
**Resultado:**
- NÃO cria transação
- Cria SharedDebt de R$ 15
- Você deve R$ 15 para Maria

---


## 8. API DE DÍVIDAS (CÓDIGO COMPLETO)

### 📍 Localização
`src/app/api/debts/route.ts`

### 🎯 Função
Gerencia dívidas entre usuários (SharedDebt)

### 📝 CÓDIGO COMPLETO

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema de validação
const createDebtSchema = z.object({
  creditorId: z.string().min(1, 'Credor é obrigatório'),
  debtorId: z.string().min(1, 'Devedor é obrigatório'),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  transactionId: z.string().optional().nullable(),
});

/**
 * GET /api/debts
 * Lista dívidas onde o usuário é devedor OU credor
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = auth.userId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    // Buscar dívidas onde o usuário é devedor OU credor
    const debts = await prisma.sharedDebt.findMany({
      where: {
        OR: [
          { debtorId: userId },  // Eu devo
          { creditorId: userId }, // Me devem
        ],
        ...(status !== 'all' && { status: status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      debts: debts.map(d => ({
        id: d.id,
        creditorId: d.creditorId,
        debtorId: d.debtorId,
        originalAmount: Number(d.originalAmount),
        currentAmount: Number(d.currentAmount),
        paidAmount: Number(d.paidAmount),
        description: d.description,
        status: d.status,
        transactionId: d.transactionId,
        tripId: d.tripId,
        paidAt: d.paidAt,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    });
  } catch (error) {
    console.error('❌ [Debts API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/debts
 * Cria uma nova dívida
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await request.json();

    // Validar dados
    const validation = createDebtSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Criar dívida
    const debt = await prisma.sharedDebt.create({
      data: {
        userId: userId,
        creditorId: data.creditorId,
        debtorId: data.debtorId,
        originalAmount: data.amount,
        currentAmount: data.amount,
        paidAmount: 0,
        description: data.description,
        status: 'active',
        transactionId: data.transactionId,
      },
    });

    return NextResponse.json({
      success: true,
      debt: {
        id: debt.id,
        creditorId: debt.creditorId,
        debtorId: debt.debtorId,
        originalAmount: Number(debt.originalAmount),
        currentAmount: Number(debt.currentAmount),
        paidAmount: Number(debt.paidAmount),
        description: debt.description,
        status: debt.status,
        createdAt: debt.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ [Debts API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

### 🔄 Fluxo de Dívidas

```
CRIAÇÃO DE DÍVIDA (quando transação compartilhada é criada):

1. Usuário cria transação compartilhada
   ↓
2. API de transações cria a transação
   ↓
3. Para cada participante em sharedWith:
   ↓
4. Cria SharedDebt:
   - creditorId: quem pagou (userId)
   - debtorId: participante
   - amount: myShare
   - status: 'active'
   ↓
5. Dívida aparece em "Pendentes"


PAGAMENTO DE DÍVIDA:

1. Usuário clica em "Pagar Tudo"
   ↓
2. Abre modal de fatura consolidada
   ↓
3. Seleciona conta e data
   ↓
4. Para cada dívida selecionada:
   ↓
5. Cria transação de RECEITA (recebimento)
   ↓
6. Marca dívida como paga (status: 'paid')
   ↓
7. Atualiza lista de dívidas
```

---

## 9. FLUXO COMPLETO DO SISTEMA

### 🎯 Cenário: Despesa Compartilhada em Viagem

**Situação:**
- Viagem: "Paris 2024"
- Participantes: Você, Maria, João
- Despesa: Jantar de R$ 300,00
- Você pagou

### 📝 Passo a Passo

#### 1. CRIAR TRANSAÇÃO

**Usuário preenche formulário:**
```typescript
{
  description: "Jantar no restaurante",
  amount: "300,00",
  type: "expense",
  account: "conta-corrente-id",
  category: "alimentacao-id",
  date: "18/11/2024",
  isShared: true,
  selectedContacts: ["maria-id", "joao-id"],
  tripId: "paris-2024-id"
}
```

#### 2. API PROCESSA

**POST /api/transactions:**
```typescript
// 1. Calcula compartilhamento
totalParticipants = 3 (você + 2)
myShare = 300 / 3 = 100
totalSharedAmount = 300

// 2. Cria transação
Transaction {
  id: "trans-123",
  description: "Jantar no restaurante",
  amount: 300,
  type: "DESPESA",
  accountId: "conta-corrente-id",
  categoryId: "alimentacao-id",
  date: "2024-11-18T12:00:00",
  isShared: true,
  myShare: 100,
  totalSharedAmount: 300,
  tripId: "paris-2024-id",
  userId: "seu-id"
}

// 3. Atualiza saldo da conta
Conta Corrente: R$ 5.000 → R$ 4.700

// 4. Cria partidas dobradas
JournalEntry {
  DÉBITO: Alimentação +300
  CRÉDITO: Conta Corrente -300
}

// 5. Cria dívidas
SharedDebt {
  id: "debt-maria",
  creditorId: "seu-id",
  debtorId: "maria-id",
  amount: 100,
  description: "Jantar no restaurante",
  status: "active",
  transactionId: "trans-123"
}

SharedDebt {
  id: "debt-joao",
  creditorId: "seu-id",
  debtorId: "joao-id",
  amount: 100,
  description: "Jantar no restaurante",
  status: "active",
  transactionId: "trans-123"
}
```

#### 3. VISUALIZAÇÃO

**Página de Viagens:**
- Viagem "Paris 2024"
- Gasto: R$ 100 (sua parte)
- Orçamento: R$ 2.000
- Progresso: 5%

**Despesas Compartilhadas:**
```
┌─────────────────────────────────────┐
│ PENDENTES                           │
├─────────────────────────────────────┤
│ Maria te deve:                      │
│ • Jantar no restaurante - R$ 100   │
│                                     │
│ João te deve:                       │
│ • Jantar no restaurante - R$ 100   │
│                                     │
│ Total a receber: R$ 200             │
└─────────────────────────────────────┘
```

#### 4. PAGAMENTO

**Maria clica em "Pagar Tudo":**

**Fatura Consolidada:**
```
┌─────────────────────────────────────┐
│ FATURA - Maria                      │
├─────────────────────────────────────┤
│ ☑ Jantar no restaurante - R$ 100   │
│                                     │
│ Total: R$ 100                       │
│                                     │
│ Conta: Conta Corrente               │
│ Data: 18/11/2024                    │
│                                     │
│ [Cancelar] [Confirmar Pagamento]    │
└─────────────────────────────────────┘
```

**Ao confirmar:**
```typescript
// 1. Cria transação de RECEITA
Transaction {
  description: "💰 Recebimento - Maria",
  amount: 100,
  type: "RECEITA",
  accountId: "conta-corrente-id",
  date: "2024-11-18T12:00:00",
  status: "cleared",
  metadata: {
    type: "shared_expense_payment",
    originalTransactionId: "trans-123",
    billingItemId: "debt-maria",
    paidBy: "Maria"
  }
}

// 2. Atualiza saldo
Conta Corrente: R$ 4.700 → R$ 4.800

// 3. Marca dívida como paga
SharedDebt {
  id: "debt-maria",
  status: "paid",
  paidAt: "2024-11-18T12:00:00"
}
```

#### 5. RESULTADO FINAL

**Sua Conta:**
- Saldo inicial: R$ 5.000
- Pagou jantar: -R$ 300
- Recebeu de Maria: +R$ 100
- Saldo atual: R$ 4.800
- Aguardando João: R$ 100

**Viagem Paris:**
- Seu gasto: R$ 100 (sua parte do jantar)
- Orçamento: R$ 2.000
- Disponível: R$ 1.900

**Despesas Compartilhadas:**
```
PENDENTES:
- João te deve: R$ 100

HISTÓRICO:
- Maria pagou: R$ 100 ✓
```

---

## 10. RESUMO DOS ARQUIVOS

### 📁 Estrutura de Arquivos

```
src/
├── app/
│   ├── api/
│   │   ├── transactions/
│   │   │   └── route.ts          # API de transações
│   │   ├── debts/
│   │   │   └── route.ts          # API de dívidas
│   │   └── trips/
│   │       └── route.ts          # API de viagens
│   └── trips/
│       └── page.tsx              # Página de viagens
│
├── components/
│   ├── modals/
│   │   └── transactions/
│   │       └── add-transaction-modal.tsx  # Formulário principal
│   └── features/
│       ├── trips/
│       │   └── trip-overview.tsx          # Visão da viagem
│       └── shared-expenses/
│           ├── shared-expenses.tsx        # Página principal
│           ├── pending-debts-list.tsx     # Lista de dívidas
│           └── shared-expenses-billing.tsx # Fatura consolidada
│
└── lib/
    ├── services/
    │   └── financial-operations-service.ts # Lógica de negócio
    └── validation/
        └── schemas.ts                      # Validação Zod
```

### 🔗 Conexões Entre Arquivos

```
add-transaction-modal.tsx
    ↓ (envia dados)
POST /api/transactions
    ↓ (valida)
TransactionSchema (schemas.ts)
    ↓ (cria)
FinancialOperationsService
    ↓ (salva no banco)
prisma.transaction.create()
    ↓ (se compartilhada)
prisma.sharedDebt.create()
    ↓ (aparece em)
shared-expenses.tsx
    ↓ (lista)
pending-debts-list.tsx
    ↓ (paga via)
shared-expenses-billing.tsx
    ↓ (cria recebimento)
POST /api/transactions
```

### 📊 Fluxo de Dados

```
FORMULÁRIO → API → VALIDAÇÃO → SERVIÇO → BANCO → CONTEXTO → UI

1. Usuário preenche formulário
2. Envia para API
3. API valida com Zod
4. Serviço processa lógica
5. Salva no banco (Prisma)
6. Contexto atualiza estado
7. UI reflete mudanças
```

---

## 11. PONTOS IMPORTANTES

### ✅ Boas Práticas Implementadas

1. **Validação em Camadas**
   - Frontend: validação básica
   - API: validação com Zod
   - Banco: constraints do Prisma

2. **Atomicidade**
   - Transações do Prisma garantem consistência
   - Se falhar, rollback automático

3. **Separação de Responsabilidades**
   - UI: apenas apresentação
   - API: validação e orquestração
   - Serviço: lógica de negócio
   - Prisma: acesso ao banco

4. **Tratamento de Erros**
   - Try/catch em todos os níveis
   - Mensagens claras para o usuário
   - Logs detalhados para debug

5. **Performance**
   - Paginação nas listagens
   - Queries otimizadas
   - Memoização no frontend

### ⚠️ Pontos de Atenção

1. **Campos Opcionais no Zod**
   - `.optional()` significa que o campo pode ser omitido
   - NÃO aceita `null` - use `.nullable()` se necessário
   - Solução: não enviar o campo se for null

2. **Datas e Timezone**
   - Sempre adicionar horário (T12:00:00)
   - Evita problemas de timezone
   - Garante data correta

3. **Compartilhamento**
   - Calcular `myShare` e `totalSharedAmount`
   - Criar dívidas para cada participante
   - Não duplicar lançamentos

4. **Pagamento de Fatura**
   - Criar transação de RECEITA
   - Marcar dívida como paga
   - Atualizar saldo da conta

---

## 12. COMO USAR ESTE DOCUMENTO

### Para Desenvolvedores

1. **Entender o Fluxo**
   - Leia a seção 9 (Fluxo Completo)
   - Veja o exemplo prático
   - Entenda cada etapa

2. **Implementar Funcionalidade**
   - Use os códigos das seções 7 e 8
   - Adapte conforme necessário
   - Mantenha a estrutura

3. **Debugar Problemas**
   - Verifique os logs em cada camada
   - Use os exemplos de requisição
   - Confira a validação Zod

### Para Manutenção

1. **Adicionar Novo Campo**
   - Atualizar schema Zod
   - Modificar formulário
   - Ajustar API
   - Atualizar banco

2. **Corrigir Bug**
   - Identificar camada do problema
   - Verificar logs
   - Testar isoladamente
   - Validar integração

3. **Otimizar Performance**
   - Adicionar índices no banco
   - Implementar cache
   - Otimizar queries
   - Usar paginação

---

## 📚 REFERÊNCIAS

- **Zod**: https://zod.dev/
- **Prisma**: https://www.prisma.io/
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction
- **React Context**: https://react.dev/reference/react/useContext

---

**Documento criado em:** 18/11/2024  
**Última atualização:** 18/11/2024  
**Versão:** 1.0



---

## 13. COMPONENTES REACT - CÓDIGOS PRINCIPAIS

### 📍 A) Formulário de Nova Transação (Trechos Principais)

**Localização:** `src/components/modals/transactions/add-transaction-modal.tsx`

**Tamanho:** 2691 linhas

#### Interface de Dados

```typescript
interface FormData {
  // Campos básicos
  description: string;
  amount: string;
  type: 'income' | 'expense';
  date: string; // Formato: dd/mm/aaaa
  notes: string;
  
  // Conta/Cartão
  account: string;
  creditCard: string;
  
  // Categoria
  category: string;
  subcategory: string;
  
  // Compartilhamento
  isShared: boolean;
  selectedContacts: string[]; // IDs dos participantes
  sharedWith: string[]; // Para enviar à API
  sharedPercentages: Record<string, number>;
  divisionMethod: 'equal' | 'percentage' | 'amount';
  
  // Viagem
  tripId: string;
  isLinkedToTrip: boolean;
  
  // Parcelamento
  installments: number;
  
  // Recorrência
  recurring: boolean;
  recurringFrequency: 'weekly' | 'monthly' | 'yearly';
  recurringType: 'indefinite' | 'specific';
  recurringEndDate: string;
  recurringOccurrences: string;
  
  // Moeda
  originalCurrency: string;
  exchangeRate: number;
  convertedAmount: string;
  
  // Pago por outro
  isPaidBy: boolean;
  paidByPerson: string;
}
```

#### Lógica de Compartilhamento

```typescript
// Calcular percentagens quando contatos são selecionados
useEffect(() => {
  if (formData.isShared && formData.selectedContacts.length > 0) {
    const newPercentages = { ...formData.sharedPercentages };
    const totalParticipants = formData.selectedContacts.length + 1; // +1 para você

    if (formData.divisionMethod === 'equal') {
      const equalPercentage = Math.floor(100 / totalParticipants);
      const remainder = 100 - equalPercentage * totalParticipants;

      // Dar o resto para o usuário
      newPercentages['user'] = equalPercentage + remainder;
      
      formData.selectedContacts.forEach((contactId) => {
        newPercentages[contactId] = equalPercentage;
      });
    }

    setFormData((prev) => ({ ...prev, sharedPercentages: newPercentages }));
  }
}, [formData.selectedContacts, formData.isShared]);
```

#### Função de Submit

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // 1. VALIDAÇÕES
    if (safeAccounts.length === 0) {
      toast.error('Cadastre uma conta primeiro');
      return;
    }

    if (!validateBRDate(formData.date)) {
      toast.error('Data inválida (use dd/mm/aaaa)');
      return;
    }

    const amount = parseNumber(formData.amount);
    if (!isValidNumber(formData.amount) || amount <= 0) {
      toast.error('Valor inválido (use vírgula: 100,50)');
      return;
    }

    if (!formData.isPaidBy && !formData.account) {
      toast.error('Selecione uma conta');
      return;
    }

    // 2. PREPARAR DADOS
    const transactionData: any = {
      description: formData.description,
      amount: amount,
      type: formData.type === 'income' ? 'RECEITA' : 'DESPESA',
      date: convertBRDateToISO(formData.date),
      categoryId: formData.category,
      status: 'cleared',
      notes: formData.notes,
    };

    // 2.1 Conta ou Cartão
    if (formData.isPaidBy) {
      transactionData.paidBy = formData.paidByPerson;
      if (formData.isShared) {
        transactionData.myShare = amount / (formData.selectedContacts.length + 1);
      }
    } else {
      if (formData.creditCard) {
        transactionData.creditCardId = formData.creditCard;
      } else {
        transactionData.accountId = formData.account;
      }
    }

    // 2.2 Compartilhamento
    if (formData.isShared && formData.selectedContacts.length > 0) {
      transactionData.isShared = true;
      transactionData.sharedWith = formData.selectedContacts;
    }

    // 2.3 Viagem
    if (formData.isLinkedToTrip && formData.tripId) {
      transactionData.tripId = formData.tripId;
    }

    // 2.4 Parcelamento
    if (formData.installments > 1) {
      transactionData.installments = formData.installments;
    }

    // 3. ENVIAR PARA API
    console.log('📤 Enviando transação:', transactionData);

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar transação');
    }

    const result = await response.json();
    console.log('✅ Transação criada:', result);

    // 4. SUCESSO
    toast.success('Transação criada com sucesso!');
    
    // Disparar evento para atualizar outras partes do sistema
    window.dispatchEvent(new CustomEvent('transactionCreated', { 
      detail: result.transaction 
    }));

    // Atualizar contexto
    if (actions?.refreshTransactions) {
      await actions.refreshTransactions();
    }

    // Fechar modal
    resetForm();
    onOpenChange(false);
    
    if (onSave) {
      onSave();
    }

  } catch (error) {
    console.error('❌ Erro ao criar transação:', error);
    toast.error(error instanceof Error ? error.message : 'Erro ao criar transação');
  } finally {
    setIsLoading(false);
  }
};
```

#### Renderização do Formulário (Estrutura)

```typescript
return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Transação */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant={formData.type === 'expense' ? 'default' : 'outline'}
            onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
          >
            <TrendingDown className="mr-2 h-4 w-4" />
            Despesa
          </Button>
          <Button
            type="button"
            variant={formData.type === 'income' ? 'default' : 'outline'}
            onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Receita
          </Button>
        </div>

        {/* Descrição */}
        <div>
          <Label>Descrição *</Label>
          <Input
            value={formData.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Ex: Almoço no restaurante"
            required
          />
        </div>

        {/* Valor */}
        <div>
          <Label>Valor *</Label>
          <Input
            value={formData.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="Ex: 100,50"
            required
          />
        </div>

        {/* Data */}
        <div>
          <Label>Data *</Label>
          <Input
            type="text"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            placeholder="dd/mm/aaaa"
            required
          />
        </div>

        {/* Categoria */}
        <div>
          <Label>Categoria *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {loadedCategories
                .filter(cat => cat.type === (formData.type === 'income' ? 'RECEITA' : 'DESPESA'))
                .map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conta */}
        {!formData.isPaidBy && (
          <div>
            <Label>Conta *</Label>
            <Select
              value={formData.account}
              onValueChange={(value) => setFormData(prev => ({ ...prev, account: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {renderAccountOptions()}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Compartilhamento */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isShared}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isShared: checked }))
              }
            />
            <Label>Despesa Compartilhada</Label>
          </div>

          {formData.isShared && (
            <div className="space-y-4 p-4 border rounded-lg">
              <Label>Compartilhar com:</Label>
              <FamilySelector
                selectedMembers={formData.selectedContacts}
                onSelectionChange={handleContactSelectionChange}
              />

              {formData.selectedContacts.length > 0 && (
                <div className="space-y-2">
                  <Label>Divisão:</Label>
                  <RadioGroup
                    value={formData.divisionMethod}
                    onValueChange={handleDivisionMethodChange}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="equal" id="equal" />
                      <Label htmlFor="equal">Dividir Igualmente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <Label htmlFor="percentage">Por Porcentagem</Label>
                    </div>
                  </RadioGroup>

                  {/* Mostrar divisão */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between p-2 bg-blue-50 rounded">
                      <span>Você:</span>
                      <span className="font-bold">
                        {formData.sharedPercentages['user'] || 0}% 
                        (R$ {getMyAmount.toFixed(2)})
                      </span>
                    </div>
                    {formData.selectedContacts.map(contactId => {
                      const contact = contacts.find(c => c.id === contactId);
                      const percentage = formData.sharedPercentages[contactId] || 0;
                      const amount = (parseNumber(formData.amount) * percentage) / 100;
                      
                      return (
                        <div key={contactId} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{contact?.name || contactId}:</span>
                          <span>{percentage}% (R$ {amount.toFixed(2)})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Viagem */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isLinkedToTrip}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isLinkedToTrip: checked }))
              }
            />
            <Label>Vincular a Viagem</Label>
          </div>

          {formData.isLinkedToTrip && (
            <Select
              value={formData.tripId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, tripId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a viagem" />
              </SelectTrigger>
              <SelectContent>
                {trips.map(trip => (
                  <SelectItem key={trip.id} value={trip.id}>
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      {trip.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Parcelamento */}
        {formData.type === 'expense' && (
          <div>
            <Label>Parcelar em:</Label>
            <Input
              type="number"
              min="1"
              max="48"
              value={formData.installments}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                installments: parseInt(e.target.value) || 1 
              }))}
            />
          </div>
        )}

        {/* Pago por Outro */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isPaidBy}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isPaidBy: checked }))
              }
            />
            <Label>Pago por Outra Pessoa</Label>
          </div>

          {formData.isPaidBy && (
            <Select
              value={formData.paidByPerson}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paidByPerson: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Quem pagou?" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Transação'}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);
```

---

### 📍 B) Lista de Dívidas Pendentes (Código Simplificado)

**Localização:** `src/components/features/shared-expenses/pending-debts-list.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Calendar } from 'lucide-react';
import { SharedExpensesBilling } from './shared-expenses-billing';

interface Debt {
  id: string;
  creditorId: string;
  debtorId: string;
  currentAmount: number;
  description: string;
  status: 'active' | 'paid';
  createdAt: string;
}

interface PendingDebtsListProps {
  debts: Debt[];
  onUpdate?: () => void;
}

export function PendingDebtsList({ debts, onUpdate }: PendingDebtsListProps) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedCreditor, setSelectedCreditor] = useState<string | null>(null);

  // Carregar contatos
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await fetch('/api/family', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setContacts(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar contatos:', error);
      }
    };

    loadContacts();
  }, []);

  // Agrupar dívidas por credor
  const debtsByCreditor = debts.reduce((acc, debt) => {
    const creditorId = debt.creditorId;
    if (!acc[creditorId]) {
      const creditor = contacts.find(c => c.id === creditorId);
      acc[creditorId] = {
        creditorId,
        creditorName: creditor?.name || 'Desconhecido',
        debts: [],
        total: 0
      };
    }
    acc[creditorId].debts.push(debt);
    acc[creditorId].total += debt.currentAmount;
    return acc;
  }, {} as Record<string, any>);

  const handleOpenBilling = (creditorId: string) => {
    setSelectedCreditor(creditorId);
    setShowBillingModal(true);
  };

  const handleCloseBilling = () => {
    setShowBillingModal(false);
    setSelectedCreditor(null);
    if (onUpdate) {
      onUpdate();
    }
  };

  if (Object.keys(debtsByCreditor).length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma dívida pendente
          </h3>
          <p className="text-gray-600">
            Você não tem dívidas pendentes no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {Object.entries(debtsByCreditor).map(([creditorId, data]) => (
          <Card key={creditorId}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Você deve para {data.creditorName}
                  </CardTitle>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    R$ {data.total.toFixed(2)}
                  </p>
                </div>
                <Button onClick={() => handleOpenBilling(creditorId)}>
                  Pagar Tudo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.debts.map((debt: Debt) => (
                  <div
                    key={debt.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{debt.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(debt.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        R$ {debt.currentAmount.toFixed(2)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {debt.status === 'active' ? 'Pendente' : 'Pago'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Fatura Consolidada */}
      {showBillingModal && selectedCreditor && (
        <SharedExpensesBilling
          mode="regular"
          creditorId={selectedCreditor}
          onClose={handleCloseBilling}
        />
      )}
    </>
  );
}
```

---



### 📍 C) Fatura Consolidada (Lógica Principal)

**Localização:** `src/components/features/shared-expenses/shared-expenses-billing.tsx`

**Tamanho:** 1647 linhas

#### Interface de Dados

```typescript
interface BillingItem {
  id: string;
  transactionId: string;
  userEmail: string; // ID do usuário (usado para agrupar)
  amount: number;
  description: string;
  date: string;
  category: string;
  isPaid: boolean;
  dueDate?: string;
  tripId?: string;
  type: 'CREDIT' | 'DEBIT'; // Crédito (me devem) ou Débito (eu devo)
  paidBy?: string; // ID de quem pagou
}
```

#### Lógica de Carregamento

```typescript
useEffect(() => {
  const loadSharedTransactions = async () => {
    try {
      // 1. BUSCAR TRANSAÇÕES
      const transactionsResponse = await fetch('/api/unified-financial', {
        credentials: 'include',
        cache: 'no-cache',
      });

      const transactionsResult = await transactionsResponse.json();
      const transactionsData = transactionsResult.transactions || [];

      // 2. BUSCAR DÍVIDAS
      const debtsResponse = await fetch('/api/debts?status=all', {
        credentials: 'include',
        cache: 'no-cache',
      });

      let debts: any[] = [];
      if (debtsResponse.ok) {
        const debtsResult = await debtsResponse.json();
        debts = debtsResult.debts || [];
      }

      // 3. FILTRAR TRANSAÇÕES COMPARTILHADAS
      const sharedTransactions = transactionsData.filter((t: any) => {
        const hasSharedWith = t.sharedWith && 
          (Array.isArray(t.sharedWith) ? t.sharedWith.length > 0 : 
           typeof t.sharedWith === 'string' && t.sharedWith.length > 0);

        if (!hasSharedWith) return false;

        // Filtrar por modo (trip vs regular)
        if (mode === 'trip') return t.tripId;
        return !t.tripId;
      });

      // 4. CONVERTER EM ITENS DE FATURA
      const allItems: BillingItem[] = [];

      // 4.1 PROCESSAR TRANSAÇÕES COMPARTILHADAS
      sharedTransactions.forEach((transaction: any) => {
        let sharedWith: string[] = [];

        // Parse sharedWith
        if (Array.isArray(transaction.sharedWith)) {
          sharedWith = transaction.sharedWith;
        } else if (typeof transaction.sharedWith === 'string') {
          try {
            const parsed = JSON.parse(transaction.sharedWith);
            sharedWith = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            sharedWith = [];
          }
        }

        if (sharedWith.length === 0) return;

        const totalParticipants = sharedWith.length + 1;
        const amountPerPerson = Math.abs(transaction.amount) / totalParticipants;

        const paidBy = transaction.paidBy;
        const isPaidByOther = !!paidBy;

        if (isPaidByOther) {
          // OUTRA PESSOA PAGOU → EU DEVO (DÉBITO)
          const payer = activeContacts.find((c: any) => c.id === paidBy);
          if (payer) {
            allItems.push({
              id: `${transaction.id}-debit`,
              transactionId: transaction.id,
              userEmail: payer.id,
              amount: Number(amountPerPerson.toFixed(2)),
              description: transaction.description,
              date: transaction.date,
              category: transaction.category || 'Compartilhado',
              isPaid: false,
              dueDate: createSafeDueDate(transaction.date),
              tripId: transaction.tripId,
              type: 'DEBIT',
              paidBy: payer.id,
            });
          }
        } else {
          // EU PAGUEI → OUTROS ME DEVEM (CRÉDITO)
          sharedWith.forEach((memberId: string) => {
            const member = activeContacts.find((c: any) => c.id === memberId);
            if (member) {
              allItems.push({
                id: `${transaction.id}-${memberId}`,
                transactionId: transaction.id,
                userEmail: member.id,
                amount: Number(amountPerPerson.toFixed(2)),
                description: transaction.description,
                date: transaction.date,
                category: transaction.category || 'Compartilhado',
                isPaid: false,
                dueDate: createSafeDueDate(transaction.date),
                tripId: transaction.tripId,
                type: 'CREDIT',
                paidBy: transaction.accountId,
              });
            }
          });
        }
      });

      // 4.2 PROCESSAR DÍVIDAS
      debts.forEach((debt: any) => {
        if (debt.status === 'cancelled') return;
        if (Number(debt.currentAmount) === 0) return;

        // Filtrar por modo
        if (mode === 'trip' && !debt.tripId) return;
        if (mode === 'regular' && debt.tripId) return;

        const loggedUserId = transactionsData.length > 0 ? transactionsData[0].userId : null;
        if (!loggedUserId) return;

        const isIAmDebtor = debt.debtorId === loggedUserId;
        const isIAmCreditor = debt.creditorId === loggedUserId;

        if (isIAmDebtor) {
          // EU DEVO
          const creditor = activeContacts.find((c: any) => c.id === debt.creditorId);
          if (creditor) {
            allItems.push({
              id: `debt-${debt.id}`,
              transactionId: debt.id,
              userEmail: creditor.id,
              amount: Number(debt.currentAmount),
              description: debt.description,
              date: debt.createdAt,
              category: 'Dívida',
              isPaid: debt.status === 'paid',
              dueDate: createSafeDueDate(debt.createdAt),
              type: 'DEBIT',
              paidBy: creditor.id,
            });
          }
        } else if (isIAmCreditor) {
          // ME DEVEM
          const debtor = activeContacts.find((c: any) => c.id === debt.debtorId);
          if (debtor) {
            allItems.push({
              id: `credit-${debt.id}`,
              transactionId: debt.id,
              userEmail: debtor.id,
              amount: Number(debt.currentAmount),
              description: debt.description,
              date: debt.createdAt,
              category: 'Crédito',
              isPaid: debt.status === 'paid',
              dueDate: createSafeDueDate(debt.createdAt),
              type: 'CREDIT',
              paidBy: debtor.id,
            });
          }
        }
      });

      // 5. ATUALIZAR ESTADO DE PAGAMENTO
      // Buscar transações de pagamento para marcar itens como pagos
      const paymentResponse = await fetch('/api/transactions', {
        credentials: 'include',
        cache: 'no-cache',
      });

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        const allTransactions = Array.isArray(paymentData) ? 
          paymentData : (paymentData.transactions || []);
        
        const paymentTransactions = allTransactions.filter((tx: any) =>
          (tx.description?.includes('Recebimento -') || 
           tx.description?.includes('Pagamento -')) &&
          tx.metadata
        );

        const paidTransactionsMap = new Map<string, boolean>();

        paymentTransactions.forEach((tx: any) => {
          try {
            const metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
            if (metadata.type === 'shared_expense_payment' && metadata.billingItemId) {
              paidTransactionsMap.set(metadata.billingItemId, true);
            }
          } catch (e) {
            // Ignorar erros de parse
          }
        });

        // Atualizar isPaid para transações compartilhadas
        allItems.forEach(item => {
          const isDebt = item.id.startsWith('debt-') || item.id.startsWith('credit-');
          
          if (!isDebt && paidTransactionsMap.has(item.id)) {
            item.isPaid = true;
          }
        });
      }

      setBillingItems(allItems);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setBillingItems([]);
    }
  };

  loadSharedTransactions();
}, [mode, activeContacts]);
```

#### Lógica de Agrupamento

```typescript
const getBillingByUser = () => {
  const filtered = getFilteredBillingItems();
  const grouped: Record<string, BillingItem[]> = {};

  filtered.forEach((item) => {
    const userEmail = item.userEmail || '';
    if (!grouped[userEmail]) {
      grouped[userEmail] = [];
    }
    grouped[userEmail]?.push(item);
  });

  return grouped;
};
```

#### Função de Pagamento

```typescript
const confirmPayment = async () => {
  if (!selectedItem || !selectedAccount) {
    alert('Selecione uma conta para receber o pagamento');
    return;
  }

  setIsProcessing(true);
  try {
    const contact = getContactByEmail(selectedItem.userEmail);
    const isDebt = selectedItem.id.startsWith('debt-') || selectedItem.id.startsWith('credit-');
    const debtId = isDebt ? selectedItem.id.replace('debt-', '').replace('credit-', '') : null;

    if (isDebt && debtId && selectedItem.type === 'DEBIT') {
      // PAGAR DÍVIDA VIA API DE DÍVIDAS
      const response = await fetch('/api/debts/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          debtId: debtId,
          accountId: selectedAccount,
          amount: selectedItem.amount,
          paymentDate: paymentDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao pagar dívida');
      }

      alert('✅ Dívida paga com sucesso!');
    } else {
      // PAGAR TRANSAÇÃO COMPARTILHADA
      const transactionType = selectedItem.type === 'CREDIT' ? 'RECEITA' : 'DESPESA';
      const contactName = contact?.name || selectedItem.userEmail || 'Desconhecido';
      const transactionDescription = selectedItem.type === 'CREDIT'
        ? `💰 Recebimento - ${selectedItem.description} (${contactName})`
        : `💸 Pagamento - ${selectedItem.description} (para ${contactName})`;

      // Buscar categoria da transação original
      let categoryId = null;
      if (selectedItem.transactionId) {
        const originalTransaction = transactions.find((t: any) => 
          t.id === selectedItem.transactionId
        );
        if (originalTransaction?.categoryId) {
          categoryId = originalTransaction.categoryId;
        }
      }

      // Se não encontrou, usar categoria padrão
      if (!categoryId) {
        const defaultCategory = categories.find((c: any) => 
          c.name === 'Reembolsos' || c.name === 'Outros'
        );
        categoryId = defaultCategory?.id || categories[0]?.id;
      }

      // Criar transação de pagamento
      const paymentTransaction = {
        description: transactionDescription,
        amount: selectedItem.amount,
        type: transactionType,
        accountId: selectedAccount,
        categoryId: categoryId,
        date: `${paymentDate}T12:00:00.000Z`,
        status: 'cleared',
        notes: `Pagamento de despesa compartilhada`,
        metadata: JSON.stringify({
          type: 'shared_expense_payment',
          originalTransactionId: selectedItem.transactionId,
          billingItemId: selectedItem.id,
          paidBy: contactName,
        }),
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(paymentTransaction),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar transação de pagamento');
      }

      alert('✅ Pagamento registrado com sucesso!');
    }

    // Fechar modal e atualizar
    setPaymentModalOpen(false);
    setSelectedItem(null);
    
    // Recarregar dados
    window.location.reload();
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  } finally {
    setIsProcessing(false);
  }
};
```

#### Renderização

```typescript
return (
  <div className="space-y-6">
    {/* Cabeçalho */}
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">
        {mode === 'trip' ? 'Faturas de Viagens' : 'Faturas Regulares'}
      </h2>
      <Button onClick={handleExportBilling}>
        <Download className="mr-2 h-4 w-4" />
        Exportar CSV
      </Button>
    </div>

    {/* Lista de Faturas por Usuário */}
    {Object.entries(getBillingByUser()).map(([userEmail, items]) => {
      const contact = getContactByEmail(userEmail);
      const contactName = contact?.name || userEmail;
      
      const totalPending = items
        .filter(item => !item.isPaid)
        .reduce((sum, item) => sum + item.amount, 0);
      
      const totalPaid = items
        .filter(item => item.isPaid)
        .reduce((sum, item) => sum + item.amount, 0);

      return (
        <Card key={userEmail}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {contactName}
                </CardTitle>
                <div className="flex gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-600">Pendente:</p>
                    <p className="text-xl font-bold text-red-600">
                      R$ {totalPending.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pago:</p>
                    <p className="text-xl font-bold text-green-600">
                      R$ {totalPaid.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              {totalPending > 0 && (
                <Button onClick={() => handleMarkAsPaid(items[0])}>
                  Pagar Tudo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    item.isPaid ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.description}</p>
                      {item.type === 'CREDIT' ? (
                        <Badge variant="outline" className="bg-green-100">
                          Te deve
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100">
                          Você deve
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                      {item.tripId && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Plane className="h-3 w-3" />
                            <span>Viagem</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      item.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      R$ {item.amount.toFixed(2)}
                    </p>
                    {item.isPaid ? (
                      <Badge variant="outline" className="mt-1 bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Pago
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-1">
                        Pendente
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    })}

    {/* Modal de Pagamento */}
    {paymentModalOpen && selectedItem && (
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Conta para {selectedItem.type === 'CREDIT' ? 'Recebimento' : 'Pagamento'}</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {availableAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Valor:</p>
              <p className="text-2xl font-bold">R$ {selectedItem.amount.toFixed(2)}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button onClick={confirmPayment} disabled={isProcessing}>
              {isProcessing ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
  </div>
);
```

---

## 14. DIAGRAMA DE SEQUÊNCIA COMPLETO

```
USUÁRIO                FORMULÁRIO              API                 BANCO               CONTEXTO
  │                        │                    │                    │                    │
  │  1. Preenche dados     │                    │                    │                    │
  │───────────────────────>│                    │                    │                    │
  │                        │                    │                    │                    │
  │  2. Clica "Salvar"     │                    │                    │                    │
  │───────────────────────>│                    │                    │                    │
  │                        │                    │                    │                    │
  │                        │  3. POST /api/transactions              │                    │
  │                        │───────────────────>│                    │                    │
  │                        │                    │                    │                    │
  │                        │                    │  4. Valida Zod     │                    │
  │                        │                    │────────┐           │                    │
  │                        │                    │        │           │                    │
  │                        │                    │<───────┘           │                    │
  │                        │                    │                    │                    │
  │                        │                    │  5. Cria Transaction                    │
  │                        │                    │───────────────────>│                    │
  │                        │                    │                    │                    │
  │                        │                    │  6. Atualiza Saldo │                    │
  │                        │                    │───────────────────>│                    │
  │                        │                    │                    │                    │
  │                        │                    │  7. Cria JournalEntry                   │
  │                        │                    │───────────────────>│                    │
  │                        │                    │                    │                    │
  │                        │                    │  8. Cria SharedDebts (se compartilhada) │
  │                        │                    │───────────────────>│                    │
  │                        │                    │                    │                    │
  │                        │  9. Retorna sucesso│                    │                    │
  │                        │<───────────────────│                    │                    │
  │                        │                    │                    │                    │
  │                        │  10. Dispara evento                     │                    │
  │                        │────────────────────────────────────────────────────────────>│
  │                        │                    │                    │                    │
  │                        │  11. Atualiza UI   │                    │                    │
  │<───────────────────────│                    │                    │                    │
  │                        │                    │                    │                    │
  │  12. Vê transação      │                    │                    │                    │
  │  criada com sucesso    │                    │                    │                    │
  │                        │                    │                    │                    │
```

---

## 15. CHECKLIST DE IMPLEMENTAÇÃO

### Para Criar Nova Funcionalidade Similar

- [ ] **1. Definir Schema Zod**
  - Criar interface TypeScript
  - Definir validações
  - Adicionar em `schemas.ts`

- [ ] **2. Criar API Route**
  - GET para listar
  - POST para criar
  - PATCH/PUT para atualizar
  - DELETE para remover

- [ ] **3. Criar Serviço**
  - Lógica de negócio
  - Validações adicionais
  - Transações do Prisma

- [ ] **4. Criar Componente UI**
  - Formulário
  - Lista
  - Modais
  - Estados

- [ ] **5. Integrar com Contexto**
  - Adicionar ao UnifiedFinancialContext
  - Criar hooks personalizados
  - Gerenciar estado global

- [ ] **6. Testar**
  - Casos de sucesso
  - Casos de erro
  - Validações
  - Performance

- [ ] **7. Documentar**
  - Comentários no código
  - README
  - Exemplos de uso

---

**FIM DA DOCUMENTAÇÃO COMPLETA**

