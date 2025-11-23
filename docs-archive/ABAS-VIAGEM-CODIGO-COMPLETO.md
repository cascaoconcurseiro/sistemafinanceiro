# 🗂️ CÓDIGO COMPLETO - TODAS AS ABAS DA VIAGEM

## 📋 ÍNDICE

1. [Estrutura Visual das Abas](#estrutura-visual-das-abas)
2. [Aba: Visão Geral](#aba-visão-geral)
3. [Aba: Despesas](#aba-despesas)
4. [Aba: Compartilhadas](#aba-compartilhadas)
5. [Aba: Participantes](#aba-participantes)
6. [Aba: Documentos](#aba-documentos)
7. [Aba: Roteiro](#aba-roteiro)
8. [Componente Principal](#componente-principal)

---

## ESTRUTURA VISUAL DAS ABAS

### 📱 Interface Completa

```
┌─────────────────────────────────────────────────────────────┐
│ PARIS 2024                                    [Editar]      │
│ Paris, França • 10 dias                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                             │
│ [Visão Geral] [Despesas] [Compartilhadas] [Participantes]  │
│ [Documentos] [Roteiro]                                      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CONTEÚDO DA ABA SELECIONADA                             │ │
│ │                                                         │ │
│ │ (Muda conforme a aba clicada)                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Organização dos Arquivos

```
src/components/features/trips/
├── trip-overview.tsx          # Componente principal (container)
├── tabs/
│   ├── overview-tab.tsx       # Aba: Visão Geral
│   ├── expenses-tab.tsx       # Aba: Despesas
│   ├── shared-tab.tsx         # Aba: Compartilhadas
│   ├── participants-tab.tsx   # Aba: Participantes
│   ├── documents-tab.tsx      # Aba: Documentos
│   └── itinerary-tab.tsx      # Aba: Roteiro
└── modals/
    ├── edit-trip-modal.tsx    # Modal de edição
    └── add-expense-modal.tsx  # Modal de despesa
```

---

## ABA: VISÃO GERAL

### 📊 O que Mostra

- Resumo financeiro (orçamento vs gasto)
- Estatísticas rápidas
- Progresso do orçamento
- Alertas importantes
- Botão para adicionar despesa

### 💻 Código Completo

```typescript
// src/components/features/trips/tabs/overview-tab.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Calendar,
  Users,
} from 'lucide-react';

interface OverviewTabProps {
  trip: {
    id: string;
    name: string;
    budget: number;
    spent: number;
    currency: string;
    startDate: string;
    endDate: string;
    participants: string[];
  };
  onAddExpense: () => void;
}

export function OverviewTab({ trip, onAddExpense }: OverviewTabProps) {
  // Cálculos
  const budgetProgress = trip.budget > 0 
    ? Math.min((trip.spent / trip.budget) * 100, 100) 
    : 0;
  
  const available = trip.budget - trip.spent;
  const isOverBudget = trip.spent > trip.budget;
  
  const daysTotal = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) 
    / (1000 * 60 * 60 * 24)
  ) + 1;
  
  const daysRemaining = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date().getTime()) 
    / (1000 * 60 * 60 * 24)
  );
  
  const dailyAverage = daysTotal > 0 ? trip.spent / daysTotal : 0;
  const dailyBudget = daysTotal > 0 ? trip.budget / daysTotal : 0;

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Orçamento */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Orçamento Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {trip.currency} {trip.budget.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gasto */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meu Gasto</p>
                <p className="text-2xl font-bold text-red-600">
                  {trip.currency} {trip.spent.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Individual</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disponível */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isOverBudget ? 'Excedeu' : 'Disponível'}
                </p>
                <p className={`text-2xl font-bold ${
                  isOverBudget ? 'text-red-600' : 'text-green-600'
                }`}>
                  {trip.currency} {Math.abs(available).toFixed(2)}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                isOverBudget ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <TrendingUp className={`h-6 w-6 ${
                  isOverBudget ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso do Orçamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Controle de Orçamento
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Valores baseados na sua parte individual dos gastos
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Progresso dos Gastos</span>
            <span className="text-sm text-gray-600">
              {trip.currency} {trip.spent.toFixed(2)} / {trip.budget.toFixed(2)}
            </span>
          </div>
          
          <Progress 
            value={budgetProgress} 
            className={`h-3 ${
              budgetProgress > 100 ? 'bg-red-200' : 
              budgetProgress > 80 ? 'bg-yellow-200' : 
              'bg-green-200'
            }`}
          />
          
          <div className="flex justify-between text-sm">
            <span className={
              budgetProgress > 100 ? 'text-red-600' : 
              budgetProgress > 80 ? 'text-yellow-600' : 
              'text-gray-600'
            }>
              {budgetProgress.toFixed(1)}% utilizado
            </span>
            <span className={isOverBudget ? 'text-red-600' : 'text-green-600'}>
              {isOverBudget
                ? `Excedeu em ${trip.currency} ${Math.abs(available).toFixed(2)}`
                : `Falta: ${trip.currency} ${available.toFixed(2)}`
              }
            </span>
          </div>

          {/* Alerta de Orçamento */}
          {budgetProgress > 80 && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              budgetProgress > 100 ? 'bg-red-50' : 'bg-yellow-50'
            }`}>
              <AlertCircle className={`h-5 w-5 ${
                budgetProgress > 100 ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <span className={
                budgetProgress > 100 ? 'text-red-800' : 'text-yellow-800'
              }>
                {budgetProgress > 100
                  ? 'Atenção: Orçamento excedido!'
                  : 'Atenção: Você já usou mais de 80% do orçamento!'
                }
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Média Diária */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Média Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gasto médio por dia</span>
                <span className="font-bold">
                  {trip.currency} {dailyAverage.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Orçamento por dia</span>
                <span className="font-bold">
                  {trip.currency} {dailyBudget.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Diferença</span>
                <span className={`font-bold ${
                  dailyAverage > dailyBudget ? 'text-red-600' : 'text-green-600'
                }`}>
                  {trip.currency} {Math.abs(dailyBudget - dailyAverage).toFixed(2)}
                  {dailyAverage > dailyBudget ? ' acima' : ' abaixo'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Viagem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm">
                  {daysTotal} dias de viagem
                </span>
              </div>
              {daysRemaining > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">
                    {daysRemaining} dias restantes
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm">
                  {trip.participants.length} participante{trip.participants.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Ação */}
      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={onAddExpense}
          className="w-full md:w-auto"
        >
          <Plus className="h-5 w-5 mr-2" />
          Adicionar Despesa
        </Button>
      </div>
    </div>
  );
}
```

---



## ABA: DESPESAS

### 📝 O que Mostra

- Lista de todas as despesas da viagem
- Filtros por tipo (todas, minhas, compartilhadas)
- Ordenação por data/valor
- Detalhes de cada despesa
- Botão para adicionar nova despesa

### 💻 Código Completo

```typescript
// src/components/features/trips/tabs/expenses-tab.tsx

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
} from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  isShared: boolean;
  myShare: number | null;
  totalSharedAmount: number | null;
  sharedWith: string[];
  type: 'RECEITA' | 'DESPESA';
}

interface ExpensesTabProps {
  tripId: string;
  transactions: Transaction[];
  currency: string;
  onAddExpense: () => void;
  onEditExpense: (transaction: Transaction) => void;
  onDeleteExpense: (transactionId: string) => void;
}

export function ExpensesTab({
  tripId,
  transactions,
  currency,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: ExpensesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mine' | 'shared'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // Filtrar e ordenar transações
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterType === 'mine') {
      filtered = filtered.filter(t => !t.isShared);
    } else if (filterType === 'shared') {
      filtered = filtered.filter(t => t.isShared);
    }

    // Ordenação
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        const amountA = a.isShared ? (a.myShare || 0) : a.amount;
        const amountB = b.isShared ? (b.myShare || 0) : b.amount;
        return amountB - amountA;
      }
    });

    return filtered;
  }, [transactions, searchTerm, filterType, sortBy]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = transactions.reduce((sum, t) => {
      const value = t.isShared ? (t.myShare || 0) : t.amount;
      return t.type === 'RECEITA' ? sum - value : sum + value;
    }, 0);

    const shared = transactions.filter(t => t.isShared).length;
    const individual = transactions.filter(t => !t.isShared).length;

    return { total, shared, individual, count: transactions.length };
  }, [transactions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return `${currency} ${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total de Despesas</p>
            <p className="text-2xl font-bold">{stats.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Individuais</p>
            <p className="text-2xl font-bold text-blue-600">{stats.individual}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Compartilhadas</p>
            <p className="text-2xl font-bold text-purple-600">{stats.shared}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Gasto</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.total)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar despesas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por Tipo */}
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="mine">Só Minhas</SelectItem>
                <SelectItem value="shared">Compartilhadas</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Por Data</SelectItem>
                <SelectItem value="amount">Por Valor</SelectItem>
              </SelectContent>
            </Select>

            {/* Botão Adicionar */}
            <Button onClick={onAddExpense}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Despesas */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma despesa encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando sua primeira despesa da viagem'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Button onClick={onAddExpense}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Despesa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => {
            const displayAmount = transaction.isShared
              ? (transaction.myShare || 0)
              : transaction.amount;

            return (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    {/* Informações Principais */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {transaction.description}
                        </h3>
                        {transaction.isShared && (
                          <Badge variant="outline" className="bg-purple-50">
                            <Users className="h-3 w-3 mr-1" />
                            Compartilhada
                          </Badge>
                        )}
                        {transaction.type === 'RECEITA' && (
                          <Badge variant="outline" className="bg-green-50">
                            Reembolso
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(transaction.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Receipt className="h-4 w-4" />
                          {transaction.category}
                        </div>
                      </div>

                      {/* Detalhes de Compartilhamento */}
                      {transaction.isShared && (
                        <div className="mt-2 p-2 bg-purple-50 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total da despesa:</span>
                            <span className="font-medium">
                              {formatCurrency(transaction.totalSharedAmount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Minha parte:</span>
                            <span className="font-bold text-purple-600">
                              {formatCurrency(transaction.myShare || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Compartilhada com:</span>
                            <span className="font-medium">
                              {transaction.sharedWith.length} pessoa{transaction.sharedWith.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Valor e Ações */}
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className={`text-2xl font-bold ${
                        transaction.type === 'RECEITA' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'RECEITA' ? '+' : '-'}
                        {formatCurrency(displayAmount)}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditExpense(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteExpense(transaction.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
```

---



## ABA: COMPARTILHADAS

### 💰 O que Mostra

- Fatura consolidada da viagem
- Quem te deve (créditos)
- Quem você deve (débitos)
- Botão para receber/pagar
- Histórico de pagamentos

### 💻 Código Completo

```typescript
// src/components/features/trips/tabs/shared-tab.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { SharedExpensesBilling } from '@/components/features/shared-expenses/shared-expenses-billing';

interface BillingItem {
  id: string;
  transactionId: string;
  userEmail: string;
  userName: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  isPaid: boolean;
  type: 'CREDIT' | 'DEBIT';
}

interface SharedTabProps {
  tripId: string;
  currency: string;
}

export function SharedTab({ tripId, currency }: SharedTabProps) {
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Carregar dados
  useEffect(() => {
    loadBillingData();
  }, [tripId]);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Buscar transações compartilhadas da viagem
      const transactionsResponse = await fetch('/api/unified-financial', {
        credentials: 'include',
      });
      const transactionsData = await transactionsResponse.json();
      
      // Buscar dívidas da viagem
      const debtsResponse = await fetch('/api/debts?status=all', {
        credentials: 'include',
      });
      const debtsData = await debtsResponse.json();

      // Processar e filtrar por viagem
      const items: BillingItem[] = [];

      // Processar transações compartilhadas
      transactionsData.transactions
        ?.filter((t: any) => t.tripId === tripId && t.isShared)
        .forEach((transaction: any) => {
          const sharedWith = Array.isArray(transaction.sharedWith)
            ? transaction.sharedWith
            : JSON.parse(transaction.sharedWith || '[]');

          const totalParticipants = sharedWith.length + 1;
          const amountPerPerson = Math.abs(transaction.amount) / totalParticipants;

          sharedWith.forEach((memberId: string) => {
            items.push({
              id: `${transaction.id}-${memberId}`,
              transactionId: transaction.id,
              userEmail: memberId,
              userName: memberId, // Será substituído pelo nome real
              amount: amountPerPerson,
              description: transaction.description,
              date: transaction.date,
              category: transaction.category || 'Compartilhado',
              isPaid: false,
              type: 'CREDIT', // Eles te devem
            });
          });
        });

      // Processar dívidas
      debtsData.debts
        ?.filter((d: any) => d.tripId === tripId)
        .forEach((debt: any) => {
          items.push({
            id: `debt-${debt.id}`,
            transactionId: debt.id,
            userEmail: debt.creditorId,
            userName: debt.creditorId,
            amount: debt.currentAmount,
            description: debt.description,
            date: debt.createdAt,
            category: 'Dívida',
            isPaid: debt.status === 'paid',
            type: debt.creditorId === 'você' ? 'CREDIT' : 'DEBIT',
          });
        });

      setBillingItems(items);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por usuário
  const groupedByUser = billingItems.reduce((acc, item) => {
    if (!acc[item.userEmail]) {
      acc[item.userEmail] = {
        userName: item.userName,
        items: [],
        totalPending: 0,
        totalPaid: 0,
      };
    }
    acc[item.userEmail].items.push(item);
    if (item.isPaid) {
      acc[item.userEmail].totalPaid += item.amount;
    } else {
      acc[item.userEmail].totalPending += item.amount;
    }
    return acc;
  }, {} as Record<string, any>);

  // Separar créditos e débitos
  const credits = Object.entries(groupedByUser).filter(([_, data]) =>
    data.items.some((i: BillingItem) => i.type === 'CREDIT')
  );

  const debits = Object.entries(groupedByUser).filter(([_, data]) =>
    data.items.some((i: BillingItem) => i.type === 'DEBIT')
  );

  // Totais
  const totalToReceive = credits.reduce((sum, [_, data]) => sum + data.totalPending, 0);
  const totalToPay = debits.reduce((sum, [_, data]) => sum + data.totalPending, 0);
  const totalReceived = credits.reduce((sum, [_, data]) => sum + data.totalPaid, 0);
  const totalPaid = debits.reduce((sum, [_, data]) => sum + data.totalPaid, 0);

  const formatCurrency = (value: number) => {
    return `${currency} ${value.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">A Receber</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalToReceive)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">A Pagar</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalToPay)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recebido</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalReceived)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pago</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas: Pendentes / Histórico */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-2" />
            Pendentes ({credits.length + debits.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <CheckCircle className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Aba Pendentes */}
        <TabsContent value="pending" className="space-y-4">
          {/* Créditos (Te devem) */}
          {credits.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Te Devem
              </h3>
              {credits.map(([userEmail, data]) => (
                <Card key={userEmail}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {data.userName}
                        </CardTitle>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                          {formatCurrency(data.totalPending)}
                        </p>
                      </div>
                      {data.totalPending > 0 && (
                        <Button
                          onClick={() => {
                            setSelectedUser(userEmail);
                            setShowBillingModal(true);
                          }}
                        >
                          Receber Tudo
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.items
                        .filter((item: BillingItem) => !item.isPaid)
                        .map((item: BillingItem) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{item.description}</p>
                              <div className="text-sm text-gray-600">
                                {item.category} • {formatDate(item.date)}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {formatCurrency(item.amount)}
                              </p>
                              <Badge variant="outline">Pendente</Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Débitos (Você deve) */}
          {debits.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Você Deve
              </h3>
              {debits.map(([userEmail, data]) => (
                <Card key={userEmail}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {data.userName}
                        </CardTitle>
                        <p className="text-2xl font-bold text-red-600 mt-2">
                          {formatCurrency(data.totalPending)}
                        </p>
                      </div>
                      {data.totalPending > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(userEmail);
                            setShowBillingModal(true);
                          }}
                        >
                          Pagar Tudo
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.items
                        .filter((item: BillingItem) => !item.isPaid)
                        .map((item: BillingItem) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{item.description}</p>
                              <div className="text-sm text-gray-600">
                                {item.category} • {formatDate(item.date)}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-600">
                                {formatCurrency(item.amount)}
                              </p>
                              <Badge variant="outline">Pendente</Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Vazio */}
          {credits.length === 0 && debits.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma pendência
                </h3>
                <p className="text-gray-600">
                  Todas as despesas compartilhadas estão quitadas!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Histórico */}
        <TabsContent value="history" className="space-y-4">
          {/* Implementar histórico de pagamentos */}
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Histórico de Pagamentos
              </h3>
              <p className="text-gray-600">
                Aqui aparecerão todas as despesas já pagas
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Fatura */}
      {showBillingModal && (
        <SharedExpensesBilling
          mode="trip"
          onClose={() => {
            setShowBillingModal(false);
            setSelectedUser(null);
            loadBillingData();
          }}
        />
      )}
    </div>
  );
}
```

---



## ABA: PARTICIPANTES

### 👥 O que Mostra

- Lista de todos os participantes
- Botão para adicionar/remover
- Estatísticas de cada um
- Quem é o organizador

### 💻 Código Completo

```typescript
// src/components/features/trips/tabs/participants-tab.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  UserPlus,
  Crown,
  DollarSign,
  X,
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  email?: string;
  isOrganizer: boolean;
}

interface ParticipantsTabProps {
  tripId: string;
  participants: string[];
  currency: string;
  onUpdate: (participants: string[]) => void;
}

export function ParticipantsTab({
  tripId,
  participants,
  currency,
  onUpdate,
}: ParticipantsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar contatos disponíveis
  const loadContacts = async () => {
    try {
      const response = await fetch('/api/family', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAvailableContacts(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  const handleOpenAddModal = () => {
    loadContacts();
    setSelectedContacts(participants.filter(p => p !== 'Você'));
    setShowAddModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedParticipants = ['Você', ...selectedContacts];
      
      // Atualizar via API
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ participants: updatedParticipants }),
      });

      if (response.ok) {
        onUpdate(updatedParticipants);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Erro ao atualizar participantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Participantes da Viagem</h2>
          <p className="text-gray-600 mt-1">
            {participants.length} pessoa{participants.length > 1 ? 's' : ''} nesta viagem
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <UserPlus className="h-4 w-4 mr-2" />
          Gerenciar
        </Button>
      </div>

      {/* Lista de Participantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants.map((participant, index) => {
          const isOrganizer = participant === 'Você';
          
          return (
            <Card key={`${participant}-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className={
                      isOrganizer ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }>
                      {isOrganizer ? 'EU' : getInitials(participant)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{participant}</h3>
                      {isOrganizer && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    {isOrganizer ? (
                      <Badge variant="outline" className="mt-1">
                        Organizador
                      </Badge>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">
                        Participante
                      </p>
                    )}
                  </div>
                </div>

                {/* Estatísticas (opcional) */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Despesas:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Total gasto:</span>
                    <span className="font-medium">{currency} 0.00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de Gerenciamento */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Participantes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Você (sempre incluído) */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  EU
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">Você</p>
                <p className="text-xs text-gray-600">Organizador da viagem</p>
              </div>
              <Badge>Incluído</Badge>
            </div>

            {/* Contatos */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availableContacts.length > 0 ? (
                availableContacts.map((contact) => {
                  const isSelected = selectedContacts.includes(contact.name);
                  
                  return (
                    <div
                      key={contact.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedContacts(prev => prev.filter(p => p !== contact.name));
                        } else {
                          setSelectedContacts(prev => [...prev, contact.name]);
                        }
                      }}
                    >
                      <Checkbox checked={isSelected} />
                      <Avatar>
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-xs text-gray-600">Membro da família</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Nenhum contato cadastrado</p>
                  <p className="text-sm text-gray-500">
                    Cadastre membros na página <strong>Família</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## ABA: DOCUMENTOS

### 📄 O que Mostra

- Checklist de documentos necessários
- Upload de arquivos
- Status de cada documento

### 💻 Código Simplificado

```typescript
// src/components/features/trips/tabs/documents-tab.tsx

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export function DocumentsTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Documentos da Viagem
        </h3>
        <p className="text-gray-600">
          Funcionalidade em desenvolvimento
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## ABA: ROTEIRO

### 🗺️ O que Mostra

- Itinerário dia a dia
- Atividades planejadas
- Horários e locais

### 💻 Código Simplificado

```typescript
// src/components/features/trips/tabs/itinerary-tab.tsx

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Route } from 'lucide-react';

export function ItineraryTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Roteiro da Viagem
        </h3>
        <p className="text-gray-600">
          Funcionalidade em desenvolvimento
        </p>
      </CardContent>
    </Card>
  );
}
```

---



## COMPONENTE PRINCIPAL

### 🎯 Integração de Todas as Abas

Este é o componente que une tudo e gerencia o estado das abas.

### 💻 Código Completo

```typescript
// src/components/features/trips/trip-detail-page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Edit,
  ArrowLeft,
  BarChart3,
  Receipt,
  Share2,
  FileText,
  Route,
} from 'lucide-react';
import { OverviewTab } from './tabs/overview-tab';
import { ExpensesTab } from './tabs/expenses-tab';
import { SharedTab } from './tabs/shared-tab';
import { ParticipantsTab } from './tabs/participants-tab';
import { DocumentsTab } from './tabs/documents-tab';
import { ItineraryTab } from './tabs/itinerary-tab';
import { AddTransactionModal } from '@/components/modals/transactions/add-transaction-modal';
import { toast } from 'sonner';

interface TripDetailPageProps {
  tripId: string;
}

export function TripDetailPage({ tripId }: TripDetailPageProps) {
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Carregar dados da viagem
  useEffect(() => {
    loadTripData();
  }, [tripId]);

  const loadTripData = async () => {
    try {
      setLoading(true);

      // Buscar viagem
      const tripResponse = await fetch(`/api/trips/${tripId}`, {
        credentials: 'include',
      });
      
      if (!tripResponse.ok) {
        throw new Error('Viagem não encontrada');
      }

      const tripData = await tripResponse.json();
      setTrip(tripData.trip);

      // Buscar transações da viagem
      const transactionsResponse = await fetch(
        `/api/transactions?tripId=${tripId}`,
        { credentials: 'include' }
      );

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar viagem:', error);
      toast.error('Erro ao carregar viagem');
      router.push('/trips');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTrip = async (updates: any) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await loadTripData();
        toast.success('Viagem atualizada!');
      }
    } catch (error) {
      console.error('Erro ao atualizar viagem:', error);
      toast.error('Erro ao atualizar viagem');
    }
  };

  const handleDeleteExpense = async (transactionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await loadTripData();
        toast.success('Despesa excluída!');
      }
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      toast.error('Erro ao excluir despesa');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planejada';
      case 'active':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      default:
        return status;
    }
  };

  const getTripDuration = () => {
    if (!trip) return 0;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando viagem...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Viagem não encontrada
          </h3>
          <Button onClick={() => router.push('/trips')}>
            Voltar para Viagens
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header da Viagem */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Botão Voltar */}
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => router.push('/trips')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {/* Informações Principais */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Plane className="h-8 w-8" />
                <h1 className="text-3xl font-bold">{trip.name}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <Badge className={getStatusColor(trip.status)}>
                  {getStatusText(trip.status)}
                </Badge>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {trip.destination}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(trip.startDate).toLocaleDateString('pt-BR')} -{' '}
                  {new Date(trip.endDate).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {getTripDuration()} dias
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {trip.participants?.length || 1} pessoa{(trip.participants?.length || 1) > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => {/* Abrir modal de edição */}}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>

          {/* Resumo Financeiro Rápido */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/80 text-sm">Orçamento</p>
              <p className="text-2xl font-bold">
                {trip.currency} {trip.budget.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/80 text-sm">Meu Gasto</p>
              <p className="text-2xl font-bold">
                {trip.currency} {trip.spent.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/80 text-sm">Disponível</p>
              <p className="text-2xl font-bold">
                {trip.currency} {(trip.budget - trip.spent).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo com Abas */}
      <div className="container mx-auto px-4 -mt-6">
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="expenses">
                  <Receipt className="h-4 w-4 mr-2" />
                  Despesas
                </TabsTrigger>
                <TabsTrigger value="shared">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhadas
                </TabsTrigger>
                <TabsTrigger value="participants">
                  <Users className="h-4 w-4 mr-2" />
                  Participantes
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentos
                </TabsTrigger>
                <TabsTrigger value="itinerary">
                  <Route className="h-4 w-4 mr-2" />
                  Roteiro
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="overview">
                  <OverviewTab
                    trip={trip}
                    onAddExpense={() => setShowAddExpense(true)}
                  />
                </TabsContent>

                <TabsContent value="expenses">
                  <ExpensesTab
                    tripId={tripId}
                    transactions={transactions}
                    currency={trip.currency}
                    onAddExpense={() => setShowAddExpense(true)}
                    onEditExpense={(transaction) => {/* Editar */}}
                    onDeleteExpense={handleDeleteExpense}
                  />
                </TabsContent>

                <TabsContent value="shared">
                  <SharedTab
                    tripId={tripId}
                    currency={trip.currency}
                  />
                </TabsContent>

                <TabsContent value="participants">
                  <ParticipantsTab
                    tripId={tripId}
                    participants={trip.participants || ['Você']}
                    currency={trip.currency}
                    onUpdate={(participants) => handleUpdateTrip({ participants })}
                  />
                </TabsContent>

                <TabsContent value="documents">
                  <DocumentsTab />
                </TabsContent>

                <TabsContent value="itinerary">
                  <ItineraryTab />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Adicionar Despesa */}
      {showAddExpense && (
        <AddTransactionModal
          open={showAddExpense}
          onOpenChange={setShowAddExpense}
          tripId={tripId}
          onSave={() => {
            loadTripData();
            setShowAddExpense(false);
          }}
        />
      )}
    </div>
  );
}
```

---

## RESUMO DA ESTRUTURA

### 📁 Organização Final

```
src/components/features/trips/
├── trip-detail-page.tsx       # ← COMPONENTE PRINCIPAL
│   ├── Header (azul com resumo)
│   ├── Tabs (6 abas)
│   └── Modals
│
└── tabs/
    ├── overview-tab.tsx       # Visão Geral
    ├── expenses-tab.tsx       # Despesas
    ├── shared-tab.tsx         # Compartilhadas
    ├── participants-tab.tsx   # Participantes
    ├── documents-tab.tsx      # Documentos
    └── itinerary-tab.tsx      # Roteiro
```

### 🔄 Fluxo de Dados

```
TripDetailPage (Principal)
    │
    ├─> Carrega trip (GET /api/trips/:id)
    ├─> Carrega transactions (GET /api/transactions?tripId=X)
    │
    └─> Passa dados para as abas:
        │
        ├─> OverviewTab (trip)
        ├─> ExpensesTab (transactions, trip.currency)
        ├─> SharedTab (tripId, trip.currency)
        ├─> ParticipantsTab (trip.participants)
        ├─> DocumentsTab ()
        └─> ItineraryTab ()
```

### 🎯 Eventos e Callbacks

```
Usuário clica "Adicionar Despesa"
    └─> setShowAddExpense(true)
        └─> Abre AddTransactionModal com tripId
            └─> Usuário preenche e salva
                └─> POST /api/transactions
                    └─> onSave() callback
                        └─> loadTripData()
                            └─> Atualiza todas as abas
```

---

**Documento criado em:** 18/11/2024  
**Última atualização:** 18/11/2024  
**Versão:** 1.0

