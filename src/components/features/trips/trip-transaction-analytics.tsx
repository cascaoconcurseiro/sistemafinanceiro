'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Target,
  Clock,
  MapPin,
  CreditCard,
  Wallet,
  ArrowUpDown,
  Filter,
  Download,
  Eye,
  Plus
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { LinkTransactionsToTrip } from './link-transactions-to-trip';

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  status: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  account: {
    name: string;
    type: string;
  };
}

interface TripAnalytics {
  trip: Trip;
  transactions: Transaction[];
  summary: {
    totalTransactions: number;
    totalExpenses: number;
    totalIncome: number;
    netSpending: number;
    remainingBudget: number;
    budgetUtilization: number;
    averageDailySpending: number;
    projectedTotal: number;
    projectedOverBudget: boolean;
    tripDays: number;
    expensesCount: number;
    incomeCount: number;
  };
  analytics: {
    expensesByCategory: Array<{
      category: string;
      total: number;
      count: number;
      transactions: Transaction[];
    }>;
    expensesByDay: Array<{
      date: string;
      total: number;
      count: number;
      transactions: Transaction[];
    }>;
    topExpenseCategories: Array<{
      category: string;
      total: number;
      count: number;
    }>;
    recentTransactions: Transaction[];
  };
}

interface TripTransactionAnalyticsProps {
  tripId: string;
  onAddTransaction?: () => void;
}

export function TripTransactionAnalytics({ tripId, onAddTransaction }: TripTransactionAnalyticsProps) {
  const [data, setData] = useState<TripAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadTripAnalytics();
  }, [tripId, selectedCategory, selectedType]);

  const loadTripAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedType !== 'all') params.append('type', selectedType);

      const response = await fetch(`/api/trips/${tripId}/transactions?${params}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Erro ao carregar dados da viagem');
      }

      const result = await response.json();

      // ✅ AUTO-VINCULAR: Se não houver transações, tentar vincular automaticamente
      if (result.summary.totalTransactions === 0) {
                await autoLinkTransactions();
        // Recarregar após vincular
        const retryResponse = await fetch(`/api/trips/${tripId}/transactions?${params}`, { credentials: 'include' });
        if (retryResponse.ok) {
          const retryResult = await retryResponse.json();
          setData(retryResult);
        } else {
          setData(result);
        }
      } else {
        setData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const autoLinkTransactions = async () => {
    try {
      
      // Buscar a viagem para pegar as datas
      const tripResponse = await fetch(`/api/trips/${tripId}`, { credentials: 'include' });
      if (!tripResponse.ok) return;

      const tripData = await tripResponse.json();
      const trip = tripData.data || tripData;

      // Buscar todas as transações
      const transactionsResponse = await fetch('/api/transactions', { credentials: 'include' });
      if (!transactionsResponse.ok) return;

      const transactionsData = await transactionsResponse.json();
      const allTransactions = transactionsData.transactions || [];

      // Filtrar transações sem tripId no período da viagem
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);

      const toLink = allTransactions
        .filter((t: any) => {
          const transDate = new Date(t.date);
          return (
            !t.tripId &&
            t.type === 'DESPESA' &&
            transDate >= startDate &&
            transDate <= endDate
          );
        })
        .map((t: any) => t.id);

      if (toLink.length > 0) {
        console.log(`🔗 [TripAnalytics] Vinculando ${toLink.length} transações automaticamente...`);

        const linkResponse = await fetch(`/api/trips/${tripId}/link-transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ transactionIds: toLink }),
        });

        if (linkResponse.ok) {
          const result = await linkResponse.json();
          console.log(`✅ [TripAnalytics] ${result.linkedCount} transações vinculadas automaticamente!`);
        }
      } else {
        console.log('ℹ️ [TripAnalytics] Nenhuma transação encontrada para vincular');
      }
    } catch (error) {
      console.error('❌ [TripAnalytics] Erro ao vincular automaticamente:', error);
    }
  };

  const getBudgetStatus = () => {
    if (!data) return { color: 'gray', text: 'Carregando...' };

    const utilization = data.summary.budgetUtilization;
    if (utilization <= 50) return { color: 'green', text: 'Dentro do orçamento' };
    if (utilization <= 80) return { color: 'yellow', text: 'Atenção ao orçamento' };
    if (utilization <= 100) return { color: 'orange', text: 'Próximo do limite' };
    return { color: 'red', text: 'Orçamento excedido' };
  };

  const getTripStatus = () => {
    if (!data) return 'unknown';

    const today = new Date();
    const startDate = new Date(data.trip.startDate);
    const endDate = new Date(data.trip.endDate);

    if (today < startDate) return 'planned';
    if (today >= startDate && today <= endDate) return 'active';
    return 'completed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando análises da viagem...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</h3>
        <p className="text-gray-600 mb-4">{error || 'Dados não encontrados'}</p>
        <Button onClick={loadTripAnalytics} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  const budgetStatus = getBudgetStatus();
  const tripStatus = getTripStatus();

  return (
    <div className="space-y-6">
      {/* Header da Viagem */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{data.trip.name}</h1>
            <div className="flex items-center gap-4 text-blue-100">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {data.trip.destination}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(data.trip.startDate).toLocaleDateString('pt-BR')} - {new Date(data.trip.endDate).toLocaleDateString('pt-BR')}
              </div>
              <Badge variant={tripStatus === 'active' ? 'default' : tripStatus === 'completed' ? 'secondary' : 'outline'}>
                {tripStatus === 'active' ? 'Em andamento' : tripStatus === 'completed' ? 'Concluída' : 'Planejada'}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Orçamento Total</p>
            <p className="text-2xl font-bold">{formatCurrency(data.trip.budget)}</p>
          </div>
        </div>

        {/* Progress do Orçamento */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Utilização do Orçamento</span>
            <span>{data.summary.budgetUtilization.toFixed(1)}%</span>
          </div>
          <Progress
            value={Math.min(data.summary.budgetUtilization, 100)}
            className="h-2"
          />
          <div className="flex justify-between text-xs text-blue-100">
            <span>Gasto: {formatCurrency(data.summary.totalExpenses)}</span>
            <span>Restante: {formatCurrency(data.summary.remainingBudget)}</span>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(data.summary.totalExpenses)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receitas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Média Diária</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.summary.averageDailySpending)}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Projeção Total</p>
                <p className={`text-2xl font-bold ${data.summary.projectedOverBudget ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatCurrency(data.summary.projectedTotal)}
                </p>
              </div>
              <Target className={`h-8 w-8 ${data.summary.projectedOverBudget ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">Todas as categorias</option>
            {data.analytics.expensesByCategory.map((cat) => (
              <option key={cat.category} value={cat.category}>{cat.category}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">Todos os tipos</option>
            <option value="expense">Despesas</option>
            <option value="income">Receitas</option>
          </select>

          <LinkTransactionsToTrip
            tripId={data.trip.id}
            tripName={data.trip.name}
            tripStartDate={data.trip.startDate}
            tripEndDate={data.trip.endDate}
            onLinked={loadTripAnalytics}
          />
        </div>

        <div className="flex gap-2">
          {onAddTransaction && (
            <Button onClick={onAddTransaction} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs de Análises */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status do Orçamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Status do Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg bg-${budgetStatus.color}-50 border border-${budgetStatus.color}-200`}>
                    <div className="flex items-center gap-2">
                      {budgetStatus.color === 'green' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      )}
                      <span className={`font-medium text-${budgetStatus.color}-800`}>
                        {budgetStatus.text}
                      </span>
                    </div>
                  </div>

                  {data.summary.projectedOverBudget && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-red-800 text-sm">
                        ⚠️ Projeção indica que o orçamento pode ser excedido em {formatCurrency(data.summary.projectedTotal - data.trip.budget)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Categorias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Principais Categorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.analytics.topExpenseCategories.slice(0, 5).map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-blue-${(index + 1) * 100}`}></div>
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(category.total)}</p>
                        <p className="text-xs text-gray-500">{category.count} transações</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.analytics.expensesByCategory.map((category) => (
              <Card key={category.category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-2xl font-bold">{formatCurrency(category.total)}</span>
                      <Badge variant="secondary">{category.count} transações</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {((category.total / data.summary.totalExpenses) * 100).toFixed(1)}% do total gasto
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Gastos por Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.analytics.expensesByDay.map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
                      <p className="text-sm text-gray-600">{day.count} transações</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(day.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Todas as Transações ({data.summary.totalTransactions})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${transaction.type === 'expense' ? 'bg-red-100' : 'bg-green-100'}`}>
                        {transaction.type === 'expense' ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.category} • {transaction.account?.name || 'Conta não informada'} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
