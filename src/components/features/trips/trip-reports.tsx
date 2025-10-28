'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  DollarSign,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  MapPin,
  Users,
  Download,
  AlertCircle,
  Target,
  CreditCard,
  Wallet,
  Receipt,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { type Trip, type Transaction } from '@/lib/data-layer/types';
import {
  useAccounts,
  useTransactions,
  useGoals,
  useContacts,
} from '@/contexts/unified-financial-context';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface TripReportsProps {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

interface ExpenseCategory {
  name: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

interface DailyExpense {
  date: string;
  amount: number;
  transactions: number;
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF7C7C',
];

const CATEGORY_COLORS: Record<string, string> = {
  Transporte: '#0088FE',
  Hospedagem: '#00C49F',
  Alimentação: '#FFBB28',
  Entretenimento: '#FF8042',
  Compras: '#8884D8',
  Saúde: '#82CA9D',
  Outros: '#FFC658',
};

export function TripReports({ trip, onUpdate }: TripReportsProps) {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const loadExpenses = async () => {
    try {
      setLoading(true);
      console.log('🔍 [TripReports] Carregando transações para viagem:', trip.id);
      const response = await fetch(`/api/transactions?tripId=${trip.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const transactions = data.transactions || [];
        console.log('✅ [TripReports] Transações carregadas:', transactions.length);
        console.log('📊 [TripReports] Primeira transação:', transactions[0]);
        // Usar todas as transações da viagem (não filtrar por sinal)
        setExpenses(transactions);
      } else {
        console.error('❌ [TripReports] Erro na resposta:', response.status);
        setExpenses([]);
      }
    } catch (error) {
      console.error('❌ [TripReports] Erro ao carregar transações:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trip.id) {
      loadExpenses();
    }
  }, [trip.id]);

  const getExpensesByCategory = (): ExpenseCategory[] => {
    const categoryMap = new Map<string, { amount: number; count: number }>();

    expenses.forEach((expense) => {
      const current = categoryMap.get(expense.category) || {
        amount: 0,
        count: 0,
      };
      categoryMap.set(expense.category, {
        amount: current.amount + Math.abs(expense.amount),
        count: current.count + 1,
      });
    });

    const total = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.amount,
      0
    );

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        color:
          CATEGORY_COLORS[name] ||
          COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getDailyExpenses = (): DailyExpense[] => {
    const dayMap = new Map<string, { amount: number; transactions: number }>();

    expenses.forEach((expense) => {
      const date = new Date(expense.date).toLocaleDateString('pt-BR');
      const current = dayMap.get(date) || { amount: 0, transactions: 0 };
      dayMap.set(date, {
        amount: current.amount + Math.abs(expense.amount),
        transactions: current.transactions + 1,
      });
    });

    return Array.from(dayMap.entries())
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        transactions: data.transactions,
      }))
      .sort(
        (a, b) =>
          new Date(a.date.split('/').reverse().join('-')).getTime() -
          new Date(b.date.split('/').reverse().join('-')).getTime()
      );
  };

  const getExpenseStats = () => {
    // ✅ CORRIGIDO: Calcular apenas DESPESAS (type === 'DESPESA' ou amount < 0)
    // e considerar myShare para despesas compartilhadas
    
    let despesasCount = 0;
    let receitasCount = 0;
    
    const totalExpenses = expenses.reduce((sum, expense) => {
      // Ignorar receitas (type pode ser 'RECEITA', 'income' ou amount > 0)
      const isIncome = expense.type === 'RECEITA' || 
                       expense.type === 'income' || 
                       expense.amount > 0;
      
      if (isIncome) {
        receitasCount++;
        return sum;
      }
      
      despesasCount++;
      
      // Se for compartilhada, usar myShare, senão usar amount total
      const expenseAmount = expense.isShared && expense.myShare 
        ? Math.abs(Number(expense.myShare))
        : Math.abs(Number(expense.amount));
      
      return sum + expenseAmount;
    }, 0);
    
    const totalIncome = expenses.reduce((sum, expense) => {
      // Apenas receitas (type pode ser 'RECEITA', 'income' ou amount > 0)
      const isIncome = expense.type === 'RECEITA' || 
                       expense.type === 'income' || 
                       expense.amount > 0;
      
      if (isIncome) {
        return sum + Math.abs(Number(expense.amount));
      }
      return sum;
    }, 0);
    
    console.log('📊 [TripReports] Stats:', {
      totalTransactions: expenses.length,
      despesas: despesasCount,
      receitas: receitasCount,
      totalExpenses,
      totalIncome
    });
    
    const averageDaily =
      expenses.length > 0 ? totalExpenses / getDailyExpenses().length : 0;
    const budgetUsed = trip.budget && trip.budget > 0 
      ? (totalExpenses / trip.budget) * 100 
      : 0;
    const remainingBudget = trip.budget - totalExpenses;

    return {
      totalExpenses,
      totalIncome,
      averageDaily,
      budgetUsed,
      remainingBudget,
      transactionCount: expenses.length,
    };
  };

  const generateDetailedReport = () => {
    const stats = getExpenseStats();
    const categories = getExpensesByCategory();
    const dailyExpenses = getDailyExpenses();

    const report = {
      trip: {
        name: trip.name,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget,
        participants: trip.participants,
      },
      summary: stats,
      categories,
      dailyExpenses,
      transactions: expenses.map((expense) => ({
        date: new Date(expense.date).toLocaleDateString('pt-BR'),
        description: expense.description,
        category: expense.category,
        amount: Math.abs(expense.amount),
        paymentMethod: expense.account,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-viagem-${trip.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = getExpenseStats();
  const categories = getExpensesByCategory();
  const dailyExpenses = getDailyExpenses();

  console.log('📊 [TripReports] Renderizando relatório');
  console.log('  - Expenses:', expenses.length);
  console.log('  - Stats:', stats);
  console.log('  - Categories:', categories.length);

  // Se não houver gastos, mostrar mensagem
  if (expenses.length === 0 && !loading) {
    return (
      <div className="space-y-6 p-6">
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-500 shadow-xl">
          <CardContent className="p-12 text-center">
            <FileText className="w-20 h-20 text-white mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-3">
              Nenhum gasto registrado
            </h3>
            <p className="text-white/90 text-lg mb-8">
              Adicione transações à viagem para visualizar relatórios detalhados
            </p>
            <div className="flex flex-col gap-4 max-w-lg mx-auto">
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <p className="text-white font-medium">
                  💡 Dica: Vá para a aba "Gastos" para adicionar suas despesas de viagem
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                  <DollarSign className="w-8 h-8 text-white mx-auto mb-2" />
                  <p className="text-white text-sm">Registre gastos</p>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                  <BarChart3 className="w-8 h-8 text-white mx-auto mb-2" />
                  <p className="text-white text-sm">Veja análises</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Relatórios de Gastos</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Análise completa dos gastos da viagem
          </p>
        </div>
        <Button
          onClick={generateDetailedReport}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total Gasto
              </p>
              <p className="text-2xl font-bold text-red-600">
                R${' '}
                {stats.totalExpenses.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Receitas
              </p>
              <p className="text-2xl font-bold text-green-600">
                R${' '}
                {stats.totalIncome.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Orçamento Usado
              </p>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {stats.budgetUsed.toFixed(1)}%
                </p>
                <Progress
                  value={Math.min(stats.budgetUsed, 100)}
                  className="h-2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Média Diária
              </p>
              <p className="text-2xl font-bold">
                R${' '}
                {stats.averageDaily.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Saldo Restante
              </p>
              <p
                className={`text-2xl font-bold ${
                  stats.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                R${' '}
                {stats.remainingBudget.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Orçamento */}
      {stats.budgetUsed >= 80 && (
        <Card
          className={`border-l-4 ${
            stats.budgetUsed >= 100
              ? 'border-l-red-500 bg-red-50'
              : 'border-l-yellow-500 bg-yellow-50'
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle
                className={`w-5 h-5 ${
                  stats.budgetUsed >= 100 ? 'text-red-500' : 'text-yellow-500'
                }`}
              />
              <p className="font-medium">
                {stats.budgetUsed >= 100
                  ? `Orçamento excedido em ${(stats.budgetUsed - 100).toFixed(1)}%`
                  : `Atenção: ${stats.budgetUsed.toFixed(1)}% do orçamento utilizado`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="analysis">Análise Detalhada</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) =>
                        `${name}: ${percentage.toFixed(1)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        'Valor',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lista de Categorias */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category, index) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.count} transação
                            {category.count !== 1 ? 'ões' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          R${' '}
                          {category.amount.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {category.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value: number) => `R$ ${value}`} />
                  <Tooltip
                    formatter={(value: number) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Gastos',
                    ]}
                  />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma transação encontrada para esta viagem.
                  </p>
                ) : (
                  expenses.map((expense, index) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(expense.date).toLocaleDateString('pt-BR')}
                            <Badge variant="outline">{expense.category}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          R${' '}
                          {Math.abs(expense.amount).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {expense.account}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Controle de Orçamento</span>
                    <Badge
                      variant={
                        stats.budgetUsed <= 100 ? 'default' : 'destructive'
                      }
                    >
                      {stats.budgetUsed <= 100
                        ? 'Dentro do orçamento'
                        : 'Acima do orçamento'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Frequência de Gastos</span>
                    <span>
                      {(stats.transactionCount / dailyExpenses.length).toFixed(
                        1
                      )}{' '}
                      transações/dia
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categoria Dominante</span>
                    <span>{categories[0]?.name || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.budgetUsed > 100 && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-700">
                          Orçamento Excedido
                        </p>
                        <p className="text-sm text-red-600">
                          Considere revisar os gastos futuros
                        </p>
                      </div>
                    </div>
                  )}
                  {categories[0] && categories[0].percentage > 50 && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-700">
                          Concentração Alta
                        </p>
                        <p className="text-sm text-yellow-600">
                          {categories[0].percentage.toFixed(1)}% dos gastos em{' '}
                          {categories[0].name}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-700">
                        Controle Financeiro
                      </p>
                      <p className="text-sm text-blue-600">
                        Mantenha o registro detalhado de todas as despesas
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
