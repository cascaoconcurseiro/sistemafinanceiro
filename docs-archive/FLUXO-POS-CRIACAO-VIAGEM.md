# 🚀 FLUXO COMPLETO APÓS CRIAÇÃO DA VIAGEM

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [API de Criação de Viagem](#api-de-criação-de-viagem)
3. [Visualização da Viagem](#visualização-da-viagem)
4. [Adicionar Despesa na Viagem](#adicionar-despesa-na-viagem)
5. [Despesa Compartilhada na Viagem](#despesa-compartilhada-na-viagem)
6. [Visualizar Fatura da Viagem](#visualizar-fatura-da-viagem)
7. [Pagar Fatura da Viagem](#pagar-fatura-da-viagem)

---

## VISÃO GERAL

### Fluxo Completo

```
1. CRIAR VIAGEM
   └─> POST /api/trips
       └─> Viagem criada no banco

2. VISUALIZAR VIAGEM
   └─> GET /api/trips/:id
       └─> Carrega detalhes
       └─> Carrega transações
       └─> Calcula gastos

3. ADICIONAR DESPESA
   └─> Abre formulário com tripId
       └─> POST /api/transactions
           └─> Cria transação vinculada
           └─> Se compartilhada: cria dívidas
           └─> Atualiza spent da viagem

4. VISUALIZAR FATURA
   └─> Abre shared-expenses-billing
       └─> Filtra por tripId
       └─> Agrupa por pessoa
       └─> Mostra débitos e créditos

5. PAGAR FATURA
   └─> Seleciona itens
       └─> POST /api/transactions (recebimento)
       └─> PATCH /api/debts/:id (marca como pago)
       └─> Atualiza UI
```

---


## 1. API DE CRIAÇÃO DE VIAGEM

### 📍 Localização
`src/app/api/trips/route.ts`

### Código Completo

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/trips
 * Cria uma nova viagem
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 [API Trips POST] Dados recebidos:', body);

    // Validações
    if (!body.name || !body.destination) {
      return NextResponse.json(
        { error: 'Nome e destino são obrigatórios' },
        { status: 400 }
      );
    }

    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Datas são obrigatórias' },
        { status: 400 }
      );
    }

    // Criar viagem
    const trip = await prisma.trip.create({
      data: {
        userId: auth.userId,
        name: body.name,
        destination: body.destination,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        budget: Number(body.budget) || 0,
        spent: 0, // Inicialmente zero
        currency: body.currency || 'BRL',
        description: body.description || '',
        status: body.status || 'planned',
        participants: body.participants || ['Você'],
      },
    });

    console.log('✅ [API Trips POST] Viagem criada:', trip.id);

    return NextResponse.json({
      success: true,
      trip: {
        ...trip,
        budget: Number(trip.budget),
        spent: Number(trip.spent),
      },
    });
  } catch (error) {
    console.error('❌ [API Trips POST] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao criar viagem' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trips
 * Lista todas as viagens do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const trips = await prisma.trip.findMany({
      where: {
        userId: auth.userId,
        deletedAt: null,
      },
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    // Calcular spent para cada viagem
    const tripsWithSpent = await Promise.all(
      trips.map(async (trip) => {
        // Buscar transações da viagem
        const transactions = await prisma.transaction.findMany({
          where: {
            tripId: trip.id,
            deletedAt: null,
          },
        });

        // Calcular spent (considerar myShare para compartilhadas)
        const spent = transactions.reduce((sum, t) => {
          const amount = Math.abs(Number(t.amount));
          const isIncome = t.type === 'RECEITA';

          // Para compartilhadas, usar myShare
          const value = t.isShared && t.myShare !== null
            ? Math.abs(Number(t.myShare))
            : amount;

          // RECEITA subtrai (reembolso), DESPESA soma
          return isIncome ? sum - value : sum + value;
        }, 0);

        return {
          ...trip,
          budget: Number(trip.budget),
          spent: Number(spent),
        };
      })
    );

    return NextResponse.json({
      success: true,
      trips: tripsWithSpent,
    });
  } catch (error) {
    console.error('❌ [API Trips GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar viagens' },
      { status: 500 }
    );
  }
}
```

### Resultado da Criação

```json
{
  "success": true,
  "trip": {
    "id": "cmhgainqb000113kq9l0y01gm",
    "userId": "cmhe3pmt20000y0hdyajad36s",
    "name": "Viagem Paris",
    "destination": "Paris, França",
    "startDate": "2024-12-01T00:00:00.000Z",
    "endDate": "2024-12-10T00:00:00.000Z",
    "budget": 5000,
    "spent": 0,
    "currency": "EUR",
    "description": "Férias de fim de ano",
    "status": "planned",
    "participants": ["Você", "Maria", "João"],
    "createdAt": "2024-11-18T12:00:00.000Z"
  }
}
```

---

## 2. VISUALIZAÇÃO DA VIAGEM

### 📍 Componente
`src/components/features/trips/trip-overview.tsx`

### Código de Carregamento de Dados

```typescript
const loadTripData = async () => {
  // 1. BUSCAR TRANSAÇÕES DA VIAGEM
  const tripExpenses = transactions.filter(
    (t) => (t as any).tripId === trip.id
  );

  console.log(`📊 [TripOverview] Encontradas ${tripExpenses.length} transações`);

  // 2. CALCULAR GASTO TOTAL (INDIVIDUAL)
  const totalExpenses = tripExpenses.reduce((sum, t) => {
    const amount = Math.abs(t.amount);
    const isIncome = t.type === 'RECEITA' || t.type === 'income';

    // Para compartilhadas, usar myShare (minha parte)
    const value = (t as any).isShared && (t as any).myShare !== null
      ? Math.abs(Number((t as any).myShare))
      : amount;

    // RECEITA subtrai (reembolso), DESPESA soma
    return isIncome ? sum - value : sum + value;
  }, 0);

  console.log('💰 [TripOverview] Total calculado:', {
    transactionsCount: tripExpenses.length,
    totalExpenses,
    breakdown: tripExpenses.map(t => ({
      description: t.description,
      type: t.type,
      amount: t.amount,
      myShare: (t as any).myShare,
      isShared: (t as any).isShared
    }))
  });

  setExpenses(totalExpenses);

  // 3. CARREGAR ITINERÁRIO (se houver)
  try {
    const response = await fetch(`/api/itinerary?tripId=${trip.id}`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const itineraryData = await response.json();
      setItineraryCount(itineraryData.length);
    }
  } catch (error) {
    console.error('Erro ao carregar itinerário:', error);
    setItineraryCount(0);
  }
};
```

### Renderização do Resumo

```typescript
return (
  <div className="space-y-6">
    {/* Header da Viagem */}
    <Card className="bg-gradient-to-br from-blue-600 to-blue-800">
      <CardHeader>
        <CardTitle className="text-2xl text-white">
          <Plane className="w-8 h-8 inline mr-3" />
          {trip.name}
        </CardTitle>
        <div className="flex items-center gap-4 mt-3">
          <Badge className="bg-white/20 text-white">
            {getStatusText(trip.status)}
          </Badge>
          <div className="text-white/90">
            <MapPin className="w-4 h-4 inline mr-1" />
            {trip.destination}
          </div>
          <div className="text-white/90">
            <Clock className="w-4 h-4 inline mr-1" />
            {getTripDuration()} dias
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Período */}
          <div className="text-white">
            <Calendar className="w-5 h-5 inline mr-2" />
            <div className="font-semibold">Período</div>
            <div className="text-sm">
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </div>
          </div>

          {/* Participantes */}
          <div className="text-white">
            <Users className="w-5 h-5 inline mr-2" />
            <div className="font-semibold">Participantes</div>
            <div className="text-sm">
              {trip.participants.length} pessoa{trip.participants.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Orçamento */}
          <div className="text-white">
            <DollarSign className="w-5 h-5 inline mr-2" />
            <div className="font-semibold">Orçamento</div>
            <div className="text-sm">
              {trip.currency} {trip.budget.toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Estatísticas */}
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">Meu Gasto</p>
          <p className="text-xl font-bold text-red-600">
            {trip.currency} {expenses.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">Individual</p>
        </CardContent>
      </Card>
      {/* ... outros cards ... */}
    </div>

    {/* Progresso do Orçamento */}
    <Card>
      <CardHeader>
        <CardTitle>Controle de Orçamento</CardTitle>
        <p className="text-sm text-gray-600">
          Valores baseados na sua parte individual dos gastos
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Progresso dos Gastos (Individual)</span>
            <span>
              {trip.currency} {expenses.toFixed(2)} / {trip.budget.toFixed(2)}
            </span>
          </div>
          <Progress value={getBudgetProgress()} className="h-3" />
          <div className="flex justify-between text-sm">
            <span>{getBudgetProgress().toFixed(1)}% utilizado</span>
            <span className={expenses > trip.budget ? 'text-red-600' : 'text-green-600'}>
              {expenses <= trip.budget
                ? `Falta: ${trip.currency} ${(trip.budget - expenses).toFixed(2)}`
                : `Excedeu em ${trip.currency} ${(expenses - trip.budget).toFixed(2)}`
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
```

---

## 3. ADICIONAR DESPESA NA VIAGEM

### 📍 Formulário
`src/components/modals/transactions/add-transaction-modal.tsx`

### Código de Inicialização com TripId

```typescript
// Quando o modal é aberto com tripId, auto-preenche
useEffect(() => {
  if (tripId && !editingTransaction) {
    const selectedTrip = trips.find((trip: Trip) => trip.id === tripId);
    
    setFormData((prev) => ({
      ...prev,
      tripId,
      isLinkedToTrip: true,
      originalCurrency: selectedTrip?.currency || 'BRL',
    }));

    console.log('🔗 [Modal] Auto-vinculado à viagem:', {
      tripId,
      tripName: selectedTrip?.name,
      currency: selectedTrip?.currency
    });
  }
}, [tripId, trips]);
```

### Código de Submit com Viagem

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // ... validações ...

    const transactionData: any = {
      description: formData.description,
      amount: parseNumber(formData.amount),
      type: formData.type === 'income' ? 'RECEITA' : 'DESPESA',
      date: convertBRDateToISO(formData.date),
      categoryId: formData.category,
      accountId: formData.account,
      status: 'cleared',
    };

    // ✅ VINCULAR À VIAGEM
    if (formData.isLinkedToTrip && formData.tripId) {
      transactionData.tripId = formData.tripId;
      console.log('🔗 [Modal] Vinculando à viagem:', formData.tripId);
    }

    // ✅ COMPARTILHAMENTO
    if (formData.isShared && formData.selectedContacts.length > 0) {
      transactionData.isShared = true;
      transactionData.sharedWith = formData.selectedContacts;
      
      console.log('🤝 [Modal] Compartilhando com:', {
        participants: formData.selectedContacts.length + 1,
        contacts: formData.selectedContacts
      });
    }

    // Enviar para API
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
    console.log('✅ [Modal] Transação criada:', result);

    toast.success('Despesa adicionada à viagem!');
    
    // Disparar evento para atualizar viagem
    window.dispatchEvent(new CustomEvent('transactionCreated', {
      detail: result.transaction
    }));

    onOpenChange(false);
  } catch (error) {
    console.error('❌ [Modal] Erro:', error);
    toast.error(error instanceof Error ? error.message : 'Erro ao criar transação');
  } finally {
    setIsLoading(false);
  }
};
```

### Exemplo de Transação Criada

```json
{
  "success": true,
  "transaction": {
    "id": "cmhhn36ea001n3hkgpnb5hmsj",
    "userId": "cmhe3pmt20000y0hdyajad36s",
    "description": "Jantar no restaurante",
    "amount": 300,
    "type": "DESPESA",
    "date": "2024-12-05T12:00:00.000Z",
    "accountId": "cmhe4eiqb0003ze10ipjd43yr",
    "categoryId": "cmhe46m5q003zxv7aln1ot8ql",
    "tripId": "cmhgainqb000113kq9l0y01gm",
    "isShared": true,
    "myShare": 100,
    "totalSharedAmount": 300,
    "sharedWith": ["maria-id", "joao-id"],
    "status": "cleared",
    "createdAt": "2024-11-18T12:00:00.000Z"
  }
}
```

---


## 4. DESPESA COMPARTILHADA NA VIAGEM

### Processamento pela API

```typescript
// src/app/api/transactions/route.ts - POST

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const body = await request.json();

    // 1. CALCULAR COMPARTILHAMENTO
    const isShared = body.sharedWith && Array.isArray(body.sharedWith) && body.sharedWith.length > 0;
    let sharedFields = {};

    if (isShared) {
      const totalParticipants = body.sharedWith.length + 1; // +1 para você
      const amount = Math.abs(Number(body.amount));
      const myShare = amount / totalParticipants;
      const totalSharedAmount = amount;

      console.log(`🤝 [API] Transação compartilhada:`, {
        totalParticipants,
        amount,
        myShare,
        sharedWith: body.sharedWith,
        tripId: body.tripId
      });

      sharedFields = {
        isShared: true,
        myShare,
        totalSharedAmount,
      };
    }

    // 2. CRIAR TRANSAÇÃO
    const transactionData = {
      ...body,
      userId: auth.userId,
      type: body.type === 'expense' ? 'DESPESA' : 'RECEITA',
      date: new Date(body.date),
      amount: Math.abs(Number(body.amount)),
      ...sharedFields,
    };

    const transaction = await FinancialOperationsService.createTransaction({
      transaction: transactionData,
      createJournalEntries: true,
      linkToInvoice: false,
    });

    // 3. CRIAR DÍVIDAS PARA CADA PARTICIPANTE
    if (isShared && body.sharedWith) {
      const { prisma } = await import('@/lib/prisma');

      for (const participantId of body.sharedWith) {
        await prisma.sharedDebt.create({
          data: {
            userId: auth.userId,
            creditorId: auth.userId, // Você é o credor (pagou)
            debtorId: participantId, // Participante é o devedor
            originalAmount: transactionData.myShare,
            currentAmount: transactionData.myShare,
            description: transaction.description,
            transactionId: transaction.id,
            tripId: body.tripId, // ✅ VINCULAR À VIAGEM
            status: 'active',
          },
        });

        console.log(`💰 [API] Dívida criada: ${participantId} deve R$ ${transactionData.myShare}`);
      }
    }

    // 4. ATUALIZAR SPENT DA VIAGEM
    if (body.tripId) {
      const { prisma } = await import('@/lib/prisma');
      
      // Recalcular spent da viagem
      const tripTransactions = await prisma.transaction.findMany({
        where: {
          tripId: body.tripId,
          deletedAt: null,
        },
      });

      const spent = tripTransactions.reduce((sum, t) => {
        const amount = Math.abs(Number(t.amount));
        const isIncome = t.type === 'RECEITA';
        const value = t.isShared && t.myShare !== null
          ? Math.abs(Number(t.myShare))
          : amount;
        return isIncome ? sum - value : sum + value;
      }, 0);

      await prisma.trip.update({
        where: { id: body.tripId },
        data: { spent: spent },
      });

      console.log(`📊 [API] Viagem atualizada: spent = R$ ${spent}`);
    }

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
    return NextResponse.json(
      { error: 'Erro ao criar transação' },
      { status: 500 }
    );
  }
}
```

### Resultado no Banco

```sql
-- TRANSACTION
INSERT INTO transactions (
  id, userId, description, amount, type, date,
  accountId, categoryId, tripId,
  isShared, myShare, totalSharedAmount, sharedWith,
  status, createdAt
) VALUES (
  'trans-123',
  'user-1',
  'Jantar no restaurante',
  300.00,
  'DESPESA',
  '2024-12-05',
  'account-1',
  'category-food',
  'trip-paris',
  true,
  100.00,
  300.00,
  '["maria-id", "joao-id"]',
  'cleared',
  NOW()
);

-- SHARED_DEBT (Maria)
INSERT INTO shared_debts (
  id, userId, creditorId, debtorId,
  originalAmount, currentAmount,
  description, transactionId, tripId,
  status, createdAt
) VALUES (
  'debt-maria',
  'user-1',
  'user-1',
  'maria-id',
  100.00,
  100.00,
  'Jantar no restaurante',
  'trans-123',
  'trip-paris',
  'active',
  NOW()
);

-- SHARED_DEBT (João)
INSERT INTO shared_debts (
  id, userId, creditorId, debtorId,
  originalAmount, currentAmount,
  description, transactionId, tripId,
  status, createdAt
) VALUES (
  'debt-joao',
  'user-1',
  'user-1',
  'joao-id',
  100.00,
  100.00,
  'Jantar no restaurante',
  'trans-123',
  'trip-paris',
  'active',
  NOW()
);

-- TRIP (atualizar spent)
UPDATE trips
SET spent = 100.00
WHERE id = 'trip-paris';
```

---

## 5. VISUALIZAR FATURA DA VIAGEM

### 📍 Componente
`src/components/features/shared-expenses/shared-expenses-billing.tsx`

### Código de Carregamento (Modo Trip)

```typescript
useEffect(() => {
  const loadSharedTransactions = async () => {
    try {
      console.log(`🔧 [Billing-${mode}] Carregando dados...`);

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

      // 3. FILTRAR POR MODO (TRIP)
      const sharedTransactions = transactionsData.filter((t: any) => {
        const hasSharedWith = t.sharedWith && 
          (Array.isArray(t.sharedWith) ? t.sharedWith.length > 0 : false);

        if (!hasSharedWith) return false;

        // ✅ FILTRAR POR VIAGEM
        if (mode === 'trip') return t.tripId;
        return !t.tripId;
      });

      console.log(`✅ [Billing-${mode}] Transações filtradas: ${sharedTransactions.length}`);

      // 4. CONVERTER EM ITENS DE FATURA
      const allItems: BillingItem[] = [];

      sharedTransactions.forEach((transaction: any) => {
        let sharedWith: string[] = [];

        if (Array.isArray(transaction.sharedWith)) {
          sharedWith = transaction.sharedWith;
        } else if (typeof transaction.sharedWith === 'string') {
          try {
            sharedWith = JSON.parse(transaction.sharedWith);
          } catch (e) {
            sharedWith = [];
          }
        }

        if (sharedWith.length === 0) return;

        const totalParticipants = sharedWith.length + 1;
        const amountPerPerson = Math.abs(transaction.amount) / totalParticipants;

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
              tripId: transaction.tripId, // ✅ INCLUIR TRIP ID
              type: 'CREDIT',
              paidBy: transaction.accountId,
            });

            console.log(`🟢 [Billing-${mode}] ${member.name} me deve R$ ${amountPerPerson.toFixed(2)}`);
          }
        });
      });

      // 5. PROCESSAR DÍVIDAS DA VIAGEM
      debts.forEach((debt: any) => {
        if (debt.status === 'cancelled') return;
        if (Number(debt.currentAmount) === 0) return;

        // ✅ FILTRAR POR VIAGEM
        if (mode === 'trip' && !debt.tripId) return;
        if (mode === 'regular' && debt.tripId) return;

        const loggedUserId = transactionsData.length > 0 ? transactionsData[0].userId : null;
        if (!loggedUserId) return;

        const isIAmCreditor = debt.creditorId === loggedUserId;

        if (isIAmCreditor) {
          // ALGUÉM ME DEVE
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
              tripId: debt.tripId, // ✅ INCLUIR TRIP ID
              type: 'CREDIT',
              paidBy: debtor.id,
            });

            console.log(`🟢 [Billing-${mode}] ${debtor.name} me deve R$ ${debt.currentAmount} (dívida)`);
          }
        }
      });

      console.log(`📋 [Billing-${mode}] Total de itens: ${allItems.length}`);
      setBillingItems(allItems);
    } catch (error) {
      console.error(`❌ [Billing-${mode}] Erro:`, error);
      setBillingItems([]);
    }
  };

  loadSharedTransactions();
}, [mode, activeContacts]);
```

### Renderização da Fatura

```typescript
const getBillingByUser = () => {
  const filtered = billingItems.filter(item => item.tripId); // Apenas da viagem
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

return (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">
        <Plane className="inline mr-2" />
        Faturas de Viagens
      </h2>
    </div>

    {Object.entries(getBillingByUser()).map(([userEmail, items]) => {
      const contact = getContactByEmail(userEmail);
      const contactName = contact?.name || userEmail;
      
      const totalPending = items
        .filter(item => !item.isPaid)
        .reduce((sum, item) => sum + item.amount, 0);

      return (
        <Card key={userEmail}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  <Users className="inline mr-2" />
                  {contactName}
                </CardTitle>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  Te deve: R$ {totalPending.toFixed(2)}
                </p>
              </div>
              {totalPending > 0 && (
                <Button onClick={() => handleMarkAsPaid(items[0])}>
                  Receber Tudo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex justify-between p-3 rounded-lg ${
                    item.isPaid ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <div className="text-sm text-gray-600">
                      {item.category} • {formatDate(item.date)}
                      <Plane className="inline ml-2 h-3 w-3" />
                      <span className="ml-1">Viagem</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      R$ {item.amount.toFixed(2)}
                    </p>
                    {item.isPaid ? (
                      <Badge className="mt-1 bg-green-100">
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
  </div>
);
```

---


## 6. PAGAR FATURA DA VIAGEM

### Código de Pagamento

```typescript
const confirmPayment = async () => {
  if (!selectedItem || !selectedAccount) {
    alert('Selecione uma conta para receber o pagamento');
    return;
  }

  setIsProcessing(true);
  try {
    const contact = getContactByEmail(selectedItem.userEmail);
    const contactName = contact?.name || selectedItem.userEmail;

    console.log('💳 [Billing] Processando pagamento:', {
      item: selectedItem.description,
      amount: selectedItem.amount,
      from: contactName,
      account: selectedAccount,
      tripId: selectedItem.tripId
    });

    // 1. BUSCAR CATEGORIA DA TRANSAÇÃO ORIGINAL
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

    // 2. CRIAR TRANSAÇÃO DE RECEBIMENTO
    const paymentTransaction = {
      description: `💰 Recebimento - ${selectedItem.description} (${contactName})`,
      amount: selectedItem.amount,
      type: 'RECEITA',
      accountId: selectedAccount,
      categoryId: categoryId,
      date: `${paymentDate}T12:00:00.000Z`,
      status: 'cleared',
      notes: `Recebimento de despesa compartilhada da viagem`,
      tripId: selectedItem.tripId, // ✅ VINCULAR À VIAGEM
      metadata: JSON.stringify({
        type: 'shared_expense_payment',
        originalTransactionId: selectedItem.transactionId,
        billingItemId: selectedItem.id,
        paidBy: contactName,
        tripId: selectedItem.tripId
      }),
    };

    console.log('📤 [Billing] Criando transação de recebimento:', paymentTransaction);

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

    const result = await response.json();
    console.log('✅ [Billing] Transação criada:', result.transaction.id);

    // 3. MARCAR DÍVIDA COMO PAGA (se for dívida)
    if (selectedItem.id.startsWith('credit-')) {
      const debtId = selectedItem.id.replace('credit-', '');
      
      const debtResponse = await fetch(`/api/debts/${debtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: 'paid',
          paidAt: new Date().toISOString(),
        }),
      });

      if (debtResponse.ok) {
        console.log('✅ [Billing] Dívida marcada como paga:', debtId);
      }
    }

    toast.success('✅ Pagamento registrado com sucesso!');
    
    // 4. ATUALIZAR UI
    setPaymentModalOpen(false);
    setSelectedItem(null);
    
    // Recarregar dados
    window.location.reload();
  } catch (error) {
    console.error('❌ [Billing] Erro ao processar pagamento:', error);
    toast.error(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  } finally {
    setIsProcessing(false);
  }
};
```

### Resultado no Banco

```sql
-- TRANSACTION (Recebimento)
INSERT INTO transactions (
  id, userId, description, amount, type, date,
  accountId, categoryId, tripId,
  status, metadata, createdAt
) VALUES (
  'trans-payment-123',
  'user-1',
  '💰 Recebimento - Jantar no restaurante (Maria)',
  100.00,
  'RECEITA',
  '2024-12-10',
  'account-1',
  'category-reembolsos',
  'trip-paris',
  'cleared',
  '{"type":"shared_expense_payment","originalTransactionId":"trans-123","billingItemId":"credit-debt-maria","paidBy":"Maria","tripId":"trip-paris"}',
  NOW()
);

-- SHARED_DEBT (Atualizar)
UPDATE shared_debts
SET 
  status = 'paid',
  paidAt = NOW(),
  paidAmount = 100.00
WHERE id = 'debt-maria';

-- ACCOUNT (Atualizar saldo)
UPDATE accounts
SET balance = balance + 100.00
WHERE id = 'account-1';

-- TRIP (Recalcular spent - opcional)
-- O spent pode ser recalculado considerando os reembolsos
UPDATE trips
SET spent = (
  SELECT SUM(
    CASE 
      WHEN t.type = 'RECEITA' THEN -COALESCE(t.myShare, t.amount)
      ELSE COALESCE(t.myShare, t.amount)
    END
  )
  FROM transactions t
  WHERE t.tripId = 'trip-paris'
    AND t.deletedAt IS NULL
)
WHERE id = 'trip-paris';
```

---

## 7. FLUXO COMPLETO VISUAL

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CRIAR VIAGEM                                                 │
│    POST /api/trips                                              │
│    {                                                            │
│      name: "Paris 2024",                                        │
│      destination: "Paris, França",                              │
│      budget: 5000,                                              │
│      participants: ["Você", "Maria", "João"]                    │
│    }                                                            │
│                                                                 │
│    Resultado:                                                   │
│    ✅ Viagem criada com ID: trip-paris                          │
│    ✅ Spent inicial: 0                                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. VISUALIZAR VIAGEM                                            │
│    GET /api/trips/trip-paris                                    │
│    Componente: trip-overview.tsx                                │
│                                                                 │
│    Exibe:                                                       │
│    • Nome: Paris 2024                                           │
│    • Orçamento: €5.000                                          │
│    • Gasto: €0 (0%)                                             │
│    • Participantes: 3 pessoas                                   │
│    • Botão: "Adicionar Despesa"                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. ADICIONAR DESPESA COMPARTILHADA                              │
│    Abre: add-transaction-modal.tsx (com tripId)                 │
│    POST /api/transactions                                       │
│    {                                                            │
│      description: "Jantar no restaurante",                      │
│      amount: 300,                                               │
│      type: "DESPESA",                                           │
│      tripId: "trip-paris",                                      │
│      isShared: true,                                            │
│      sharedWith: ["maria-id", "joao-id"]                        │
│    }                                                            │
│                                                                 │
│    Processamento:                                               │
│    1. Cria Transaction (amount: 300, myShare: 100)              │
│    2. Cria SharedDebt para Maria (100)                          │
│    3. Cria SharedDebt para João (100)                           │
│    4. Atualiza Trip.spent = 100                                 │
│                                                                 │
│    Resultado:                                                   │
│    ✅ Transação criada                                          │
│    ✅ 2 dívidas criadas                                         │
│    ✅ Viagem atualizada (spent: 100)                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. VISUALIZAR VIAGEM ATUALIZADA                                 │
│    Componente: trip-overview.tsx                                │
│                                                                 │
│    Exibe:                                                       │
│    • Orçamento: €5.000                                          │
│    • Meu Gasto: €100 (2%)                                       │
│    • Disponível: €4.900                                         │
│    • Transações: 1 (Jantar - €300)                              │
│                                                                 │
│    Cálculo:                                                     │
│    • Total da despesa: €300                                     │
│    • Minha parte (myShare): €100                                │
│    • Maria deve: €100                                           │
│    • João deve: €100                                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. VISUALIZAR FATURA DA VIAGEM                                  │
│    Componente: shared-expenses-billing.tsx (mode: 'trip')       │
│    GET /api/debts?status=all                                    │
│                                                                 │
│    Exibe:                                                       │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ MARIA                                                   │ │
│    │ Te deve: €100                                           │ │
│    │                                                         │ │
│    │ ☐ Jantar no restaurante - €100                         │ │
│    │   Alimentação • 05/12/2024 • ✈️ Viagem                 │ │
│    │                                                         │ │
│    │ [Receber Tudo]                                          │ │
│    └─────────────────────────────────────────────────────────┘ │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ JOÃO                                                    │ │
│    │ Te deve: €100                                           │ │
│    │                                                         │ │
│    │ ☐ Jantar no restaurante - €100                         │ │
│    │   Alimentação • 05/12/2024 • ✈️ Viagem                 │ │
│    │                                                         │ │
│    │ [Receber Tudo]                                          │ │
│    └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. MARIA PAGA SUA PARTE                                         │
│    Clica: "Receber Tudo" (Maria)                                │
│    Modal: Confirmar Pagamento                                   │
│    {                                                            │
│      conta: "Conta Corrente",                                   │
│      data: "10/12/2024",                                        │
│      valor: €100                                                │
│    }                                                            │
│                                                                 │
│    Processamento:                                               │
│    1. POST /api/transactions (RECEITA)                          │
│       {                                                         │
│         description: "💰 Recebimento - Jantar (Maria)",         │
│         amount: 100,                                            │
│         type: "RECEITA",                                        │
│         tripId: "trip-paris",                                   │
│         metadata: {                                             │
│           type: "shared_expense_payment",                       │
│           originalTransactionId: "trans-123",                   │
│           paidBy: "Maria"                                       │
│         }                                                       │
│       }                                                         │
│                                                                 │
│    2. PATCH /api/debts/debt-maria                               │
│       { status: "paid", paidAt: "2024-12-10" }                  │
│                                                                 │
│    3. Atualiza saldo da conta (+€100)                           │
│                                                                 │
│    Resultado:                                                   │
│    ✅ Transação de recebimento criada                           │
│    ✅ Dívida marcada como paga                                  │
│    ✅ Saldo atualizado                                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. VISUALIZAR FATURA ATUALIZADA                                 │
│    Componente: shared-expenses-billing.tsx                      │
│                                                                 │
│    Exibe:                                                       │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ MARIA                                                   │ │
│    │ Te deve: €0                                             │ │
│    │ Pago: €100                                              │ │
│    │                                                         │ │
│    │ ✅ Jantar no restaurante - €100 [PAGO]                 │ │
│    │    Alimentação • 05/12/2024 • ✈️ Viagem                │ │
│    └─────────────────────────────────────────────────────────┘ │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ JOÃO                                                    │ │
│    │ Te deve: €100                                           │ │
│    │                                                         │ │
│    │ ☐ Jantar no restaurante - €100 [PENDENTE]              │ │
│    │   Alimentação • 05/12/2024 • ✈️ Viagem                 │ │
│    │                                                         │ │
│    │ [Receber Tudo]                                          │ │
│    └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. VISUALIZAR VIAGEM FINAL                                      │
│    Componente: trip-overview.tsx                                │
│                                                                 │
│    Exibe:                                                       │
│    • Orçamento: €5.000                                          │
│    • Meu Gasto: €100 (2%)                                       │
│    • Recebido: €100 (de Maria)                                  │
│    • Gasto Líquido: €0                                          │
│    • Aguardando: €100 (de João)                                 │
│    • Disponível: €5.000                                         │
│                                                                 │
│    Transações:                                                  │
│    1. Jantar no restaurante - €300 (compartilhada)              │
│       Minha parte: €100                                         │
│    2. Recebimento - Maria - €100 (receita)                      │
│       Gasto líquido: €0                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. RESUMO DOS ARQUIVOS ENVOLVIDOS

### Criação e Visualização
- `src/app/api/trips/route.ts` - API de viagens
- `src/app/trips/page.tsx` - Lista de viagens
- `src/components/features/trips/trip-overview.tsx` - Detalhes da viagem

### Despesas
- `src/components/modals/transactions/add-transaction-modal.tsx` - Formulário
- `src/app/api/transactions/route.ts` - API de transações
- `src/lib/services/financial-operations-service.ts` - Lógica de negócio

### Fatura e Pagamento
- `src/components/features/shared-expenses/shared-expenses-billing.tsx` - Fatura
- `src/app/api/debts/route.ts` - API de dívidas

---

## 9. CHECKLIST DE IMPLEMENTAÇÃO

### Para Criar Nova Viagem
- [ ] Preencher formulário de viagem
- [ ] Definir orçamento e moeda
- [ ] Adicionar participantes
- [ ] Salvar viagem

### Para Adicionar Despesa
- [ ] Abrir viagem
- [ ] Clicar "Adicionar Despesa"
- [ ] Preencher formulário (já vem com tripId)
- [ ] Marcar como compartilhada (se aplicável)
- [ ] Selecionar participantes
- [ ] Salvar transação

### Para Visualizar Fatura
- [ ] Ir em "Despesas Compartilhadas"
- [ ] Selecionar aba "Viagens"
- [ ] Ver itens agrupados por pessoa
- [ ] Verificar valores pendentes

### Para Pagar Fatura
- [ ] Clicar "Receber Tudo"
- [ ] Selecionar conta
- [ ] Definir data
- [ ] Confirmar pagamento
- [ ] Verificar atualização

---

**Documento criado em:** 18/11/2024  
**Última atualização:** 18/11/2024  
**Versão:** 1.0

