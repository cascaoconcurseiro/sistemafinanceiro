# 📚 SISTEMA DE DESPESAS COMPARTILHADAS E VIAGENS - DOCUMENTAÇÃO COMPLETA

## 🎯 VISÃO GERAL

Este documento explica todo o fluxo do sistema de despesas compartilhadas e viagens, desde a criação até o pagamento.

---

## 📋 ÍNDICE

1. [Formulário de Nova Transação](#1-formulário-de-nova-transação)
2. [Módulo de Viagens](#2-módulo-de-viagens)
3. [Módulo de Despesas Compartilhadas](#3-módulo-de-despesas-compartilhadas)
4. [API e Backend](#4-api-e-backend)
5. [Fluxo Completo](#5-fluxo-completo)

---

## 1. FORMULÁRIO DE NOVA TRANSAÇÃO

### 📍 Localização
`src/components/modals/transactions/add-transaction-modal.tsx`

### 🎯 Função
Modal principal para criar transações. Suporta:
- Transações normais (receita/despesa)
- Transações compartilhadas
- Transações de viagem
- Parcelamentos

### 🔑 Campos Principais

```typescript
interface TransactionFormData {
  // Campos básicos
  description: string;
  amount: number;
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
  date: string;
  
  // Conta/Cartão
  accountId?: string;
  creditCardId?: string;
  
  // Categoria
  categoryId: string;
  
  // Compartilhamento
  isShared: boolean;
  sharedWith?: string[];  // IDs dos participantes
  
  // Viagem
  tripId?: string;
  
  // Parcelamento
  installments?: number;
  
  // Quem pagou (para despesas pagas por outros)
  paidBy?: string;
}
```

### 🔗 Conexões

1. **Com API de Transações**: Envia dados para `POST /api/transactions`
2. **Com Viagens**: Campo `tripId` vincula à viagem
3. **Com Despesas Compartilhadas**: Campo `sharedWith` cria as divisões
4. **Com Categorias**: Campo `categoryId` categoriza a despesa

---


## 2. MÓDULO DE VIAGENS

### 📍 Arquivos Principais

#### A) Página de Viagens
**Localização**: `src/app/trips/page.tsx`

**Função**: Lista todas as viagens e permite criar novas

**Código Simplificado**:
```typescript
export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Buscar viagens
  useEffect(() => {
    fetch('/api/trips')
      .then(res => res.json())
      .then(data => setTrips(data.trips));
  }, []);

  return (
    <div>
      <Button onClick={() => setShowCreateModal(true)}>
        Nova Viagem
      </Button>
      
      {trips.map(trip => (
        <TripCard key={trip.id} trip={trip} />
      ))}
      
      {showCreateModal && (
        <CreateTripModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
```

**Conexões**:
- API: `GET /api/trips` - Lista viagens
- API: `POST /api/trips` - Cria viagem
- Componente: `TripCard` - Exibe cada viagem
- Modal: `CreateTripModal` - Formulário de criação

---

#### B) Visão Geral da Viagem
**Localização**: `src/components/features/trips/trip-overview.tsx`

**Função**: Exibe detalhes de uma viagem específica com:
- Resumo financeiro (orçamento vs gasto)
- Lista de despesas
- Despesas compartilhadas
- Participantes

**Estrutura**:
```typescript
interface TripOverviewProps {
  tripId: string;
}

export function TripOverview({ tripId }: TripOverviewProps) {
  const [trip, setTrip] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [sharedExpenses, setSharedExpenses] = useState([]);

  // Buscar dados da viagem
  useEffect(() => {
    Promise.all([
      fetch(`/api/trips/${tripId}`),
      fetch(`/api/transactions?tripId=${tripId}`),
      fetch(`/api/shared-expenses?tripId=${tripId}`)
    ]).then(([tripRes, transRes, sharedRes]) => {
      // Processar respostas
    });
  }, [tripId]);

  return (
    <div>
      {/* Cabeçalho com resumo */}
      <TripHeader trip={trip} />
      
      {/* Botão para adicionar despesa */}
      <Button onClick={() => setShowAddExpense(true)}>
        Adicionar Despesa
      </Button>
      
      {/* Lista de transações */}
      <TransactionsList transactions={transactions} />
      
      {/* Despesas compartilhadas */}
      <SharedExpensesList expenses={sharedExpenses} />
    </div>
  );
}
```

**Conexões**:
- API: `GET /api/trips/:id` - Dados da viagem
- API: `GET /api/transactions?tripId=X` - Despesas da viagem
- API: `GET /api/shared-expenses?tripId=X` - Despesas compartilhadas
- Modal: `AddTransactionModal` - Adicionar despesa (com tripId pré-preenchido)

---

#### C) API de Viagens
**Localização**: `src/app/api/trips/route.ts`

**Endpoints**:

1. **GET /api/trips** - Lista viagens
```typescript
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  
  const trips = await prisma.trip.findMany({
    where: { userId },
    include: {
      _count: {
        select: { transactions: true }
      }
    }
  });
  
  return NextResponse.json({ trips });
}
```

2. **POST /api/trips** - Cria viagem
```typescript
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  const body = await request.json();
  
  const trip = await prisma.trip.create({
    data: {
      userId,
      name: body.name,
      destination: body.destination,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      budget: body.budget,
      participants: body.participants, // Array de IDs
    }
  });
  
  return NextResponse.json({ trip });
}
```

---


## 3. MÓDULO DE DESPESAS COMPARTILHADAS

### 📍 Arquivos Principais

#### A) Componente Principal de Despesas Compartilhadas
**Localização**: `src/components/features/shared-expenses/shared-expenses.tsx`

**Função**: Gerencia todas as despesas compartilhadas

**Estrutura**:
```typescript
export function SharedExpenses() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pendingDebts, setPendingDebts] = useState([]);
  const [paidDebts, setPaidDebts] = useState([]);

  // Buscar dívidas pendentes e pagas
  useEffect(() => {
    fetch('/api/debts')
      .then(res => res.json())
      .then(data => {
        setPendingDebts(data.debts.filter(d => d.status === 'active'));
        setPaidDebts(data.debts.filter(d => d.status === 'paid'));
      });
  }, []);

  return (
    <div>
      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({pendingDebts.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Histórico
          </TabsTrigger>
        </TabsList>
        
        {/* Conteúdo das abas */}
        <TabsContent value="pending">
          <PendingDebtsList debts={pendingDebts} />
        </TabsContent>
        
        <TabsContent value="history">
          <PaidDebtsList debts={paidDebts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Conexões**:
- API: `GET /api/debts` - Lista todas as dívidas
- Componente: `PendingDebtsList` - Lista dívidas pendentes
- Componente: `SharedExpensesBilling` - Fatura consolidada

---

#### B) Lista de Dívidas Pendentes
**Localização**: `src/components/features/shared-expenses/pending-debts-list.tsx`

**Função**: Exibe dívidas pendentes agrupadas por pessoa

**Estrutura**:
```typescript
interface PendingDebtsListProps {
  debts: SharedDebt[];
}

export function PendingDebtsList({ debts }: PendingDebtsListProps) {
  // Agrupar dívidas por credor
  const debtsByCreditor = debts.reduce((acc, debt) => {
    const creditorId = debt.creditorId;
    if (!acc[creditorId]) {
      acc[creditorId] = {
        creditorName: debt.creditorName,
        debts: [],
        total: 0
      };
    }
    acc[creditorId].debts.push(debt);
    acc[creditorId].total += debt.currentAmount;
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(debtsByCreditor).map(([creditorId, data]) => (
        <div key={creditorId}>
          <h3>Você deve para {data.creditorName}</h3>
          <p>Total: R$ {data.total.toFixed(2)}</p>
          
          {/* Lista de dívidas individuais */}
          {data.debts.map(debt => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
          
          {/* Botão para pagar tudo */}
          <Button onClick={() => openBillingModal(creditorId)}>
            Pagar Tudo
          </Button>
        </div>
      ))}
    </div>
  );
}
```

**Conexões**:
- Componente: `DebtCard` - Exibe cada dívida
- Modal: `SharedExpensesBilling` - Fatura consolidada para pagamento

---

#### C) Fatura Consolidada (Billing)
**Localização**: `src/components/features/shared-expenses/shared-expenses-billing.tsx`

**Função**: Permite pagar múltiplas dívidas de uma vez

**Estrutura Completa**:
```typescript
interface BillingItem {
  id: string;
  transactionId: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  selected: boolean;
}

interface SharedExpensesBillingProps {
  creditorId: string;
  creditorName: string;
  debts: SharedDebt[];
  onClose: () => void;
}

export function SharedExpensesBilling({
  creditorId,
  creditorName,
  debts,
  onClose
}: SharedExpensesBillingProps) {
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Converter dívidas em itens de fatura
  useEffect(() => {
    const items = debts.map(debt => ({
      id: `${debt.transactionId}-${creditorId}`,
      transactionId: debt.transactionId,
      description: debt.description,
      amount: debt.currentAmount,
      date: debt.createdAt,
      category: extractCategoryFromDescription(debt.description),
      selected: true // Todos selecionados por padrão
    }));
    setBillingItems(items);
  }, [debts]);

  // Calcular total selecionado
  const totalSelected = billingItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.amount, 0);

  // Alternar seleção de item
  const toggleItem = (itemId: string) => {
    setBillingItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  // Processar pagamento
  const handlePayment = async () => {
    const selectedItems = billingItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      toast.error('Selecione pelo menos um item');
      return;
    }

    if (!selectedAccount) {
      toast.error('Selecione uma conta');
      return;
    }

    try {
      // Para cada item selecionado, criar uma transação de pagamento
      for (const item of selectedItems) {
        const transactionData = {
          description: `💰 Recebimento - ${creditorName}`,
          amount: item.amount,
          type: 'RECEITA',
          accountId: selectedAccount,
          date: `${paymentDate}T12:00:00.000Z`,
          notes: `Recebimento de despesa compartilhada`,
          status: 'cleared',
          metadata: JSON.stringify({
            type: 'shared_expense_payment',
            originalTransactionId: item.transactionId,
            billingItemId: item.id,
            paidBy: creditorName
          }),
          categoryId: await getCategoryIdByName('Reembolsos')
        };

        // Criar transação
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
          throw new Error('Erro ao criar transação');
        }

        // Marcar dívida como paga
        await fetch(`/api/debts/${item.transactionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'paid' })
        });
      }

      toast.success('Pagamento registrado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Fatura Consolidada - {creditorName}
          </DialogTitle>
        </DialogHeader>

        {/* Lista de itens */}
        <div className="space-y-2">
          {billingItems.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <Checkbox
                checked={item.selected}
                onCheckedChange={() => toggleItem(item.id)}
              />
              <div className="flex-1">
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-muted-foreground">
                  {item.category} • {formatDate(item.date)}
                </p>
              </div>
              <p className="font-bold">
                R$ {item.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total a Pagar:</span>
            <span>R$ {totalSelected.toFixed(2)}</span>
          </div>
        </div>

        {/* Formulário de pagamento */}
        <div className="space-y-4">
          <div>
            <Label>Conta para Recebimento</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
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
        </div>

        {/* Botões */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handlePayment}>
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Conexões**:
- API: `POST /api/transactions` - Cria transação de recebimento
- API: `PATCH /api/debts/:id` - Marca dívida como paga
- Componente: `PendingDebtsList` - Abre este modal

---


## 4. API E BACKEND

### 📍 Arquivos Principais

#### A) API de Transações
**Localização**: `src/app/api/transactions/route.ts`

**Função**: Gerencia criação e listagem de transações

**POST /api/transactions** - Criar Transação:
```typescript
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  const body = await request.json();

  // 1. PREPARAR DADOS
  const isShared = body.sharedWith?.length > 0;
  let sharedFields = {};

  if (isShared) {
    const totalParticipants = body.sharedWith.length + 1;
    const amount = Math.abs(Number(body.amount));
    sharedFields = {
      isShared: true,
      myShare: amount / totalParticipants,
      totalSharedAmount: amount,
    };
  }

  const transactionData = {
    ...body,
    userId,
    type: body.type, // RECEITA, DESPESA, TRANSFERENCIA
    date: new Date(body.date),
    amount: Math.abs(Number(body.amount)),
    ...sharedFields,
  };

  // 2. VALIDAR COM ZOD
  validateOrThrow(TransactionSchema, transactionData);

  // 3. CRIAR TRANSAÇÃO
  const transaction = await FinancialOperationsService.createTransaction({
    transaction: transactionData,
    createJournalEntries: true,
    linkToInvoice: !!body.creditCardId,
  });

  // 4. SE FOR COMPARTILHADA, CRIAR DÍVIDAS
  if (isShared && body.sharedWith) {
    for (const participantId of body.sharedWith) {
      await prisma.sharedDebt.create({
        data: {
          userId,
          creditorId: userId, // Eu sou o credor
          debtorId: participantId, // Participante é o devedor
          originalAmount: transactionData.myShare,
          currentAmount: transactionData.myShare,
          description: transaction.description,
          transactionId: transaction.id,
          status: 'active',
        }
      });
    }
  }

  return NextResponse.json({ success: true, transaction });
}
```

**Fluxo de Criação**:
1. Recebe dados do formulário
2. Calcula campos de compartilhamento (se aplicável)
3. Valida com Zod
4. Cria transação no banco
5. Cria dívidas para cada participante (se compartilhada)
6. Retorna sucesso

---

#### B) API de Dívidas
**Localização**: `src/app/api/debts/route.ts`

**GET /api/debts** - Listar Dívidas:
```typescript
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);

  // Buscar dívidas onde eu sou o devedor
  const myDebts = await prisma.sharedDebt.findMany({
    where: {
      debtorId: userId,
      status: 'active'
    },
    include: {
      creditor: { select: { name: true } },
      transaction: {
        select: {
          description: true,
          date: true,
          categoryRef: { select: { name: true } }
        }
      }
    }
  });

  // Buscar dívidas onde eu sou o credor
  const debtsOwedToMe = await prisma.sharedDebt.findMany({
    where: {
      creditorId: userId,
      status: 'active'
    },
    include: {
      debtor: { select: { name: true } }
    }
  });

  return NextResponse.json({
    myDebts,
    debtsOwedToMe,
    summary: {
      totalOwed: myDebts.reduce((sum, d) => sum + d.currentAmount, 0),
      totalToReceive: debtsOwedToMe.reduce((sum, d) => sum + d.currentAmount, 0)
    }
  });
}
```

**PATCH /api/debts/:id** - Marcar como Paga:
```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId(request);
  const body = await request.json();

  const debt = await prisma.sharedDebt.update({
    where: {
      id: params.id,
      debtorId: userId // Só o devedor pode marcar como paga
    },
    data: {
      status: body.status,
      paidAt: body.status === 'paid' ? new Date() : null,
      paidAmount: body.status === 'paid' ? debt.currentAmount : 0
    }
  });

  return NextResponse.json({ success: true, debt });
}
```

---

#### C) Serviço de Operações Financeiras
**Localização**: `src/lib/services/financial-operations-service.ts`

**Função**: Lógica de negócio para transações

**createTransaction** - Criar Transação com Partidas Dobradas:
```typescript
static async createTransaction({
  transaction,
  createJournalEntries = true,
  linkToInvoice = false
}: {
  transaction: TransactionInput;
  createJournalEntries?: boolean;
  linkToInvoice?: boolean;
}) {
  const { prisma } = await import('@/lib/prisma');

  return await prisma.$transaction(async (tx) => {
    // 1. CRIAR TRANSAÇÃO
    const newTransaction = await tx.transaction.create({
      data: transaction
    });

    // 2. ATUALIZAR SALDO DA CONTA
    if (transaction.accountId) {
      const account = await tx.account.findUnique({
        where: { id: transaction.accountId }
      });

      const balanceChange = transaction.type === 'RECEITA'
        ? transaction.amount
        : -transaction.amount;

      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: account.balance + balanceChange }
      });
    }

    // 3. CRIAR PARTIDAS DOBRADAS
    if (createJournalEntries) {
      await this.createJournalEntries(tx, newTransaction);
    }

    // 4. VINCULAR A FATURA (se cartão de crédito)
    if (linkToInvoice && transaction.creditCardId) {
      await this.linkToInvoice(tx, newTransaction);
    }

    return newTransaction;
  });
}
```

**createJournalEntries** - Criar Partidas Dobradas:
```typescript
static async createJournalEntries(tx: any, transaction: Transaction) {
  // Lógica de partidas dobradas
  if (transaction.type === 'DESPESA') {
    // DÉBITO: Conta de Despesa (aumenta despesa)
    await tx.journalEntry.create({
      data: {
        transactionId: transaction.id,
        accountId: transaction.categoryId, // Categoria como conta
        entryType: 'DEBITO',
        amount: transaction.amount,
        description: transaction.description
      }
    });

    // CRÉDITO: Conta Bancária (diminui ativo)
    await tx.journalEntry.create({
      data: {
        transactionId: transaction.id,
        accountId: transaction.accountId,
        entryType: 'CREDITO',
        amount: transaction.amount,
        description: transaction.description
      }
    });
  }
  // ... outras lógicas para RECEITA e TRANSFERENCIA
}
```

---

