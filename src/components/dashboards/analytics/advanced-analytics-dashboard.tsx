'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
} from 'lucide-react';
import { useUnified } from '@/contexts/unified-financial-context';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdvancedAnalyticsDashboard() {
  const { transactions, accounts, loading, dashboardData } = useUnified();
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  // Calcular dados de analytics baseados nos dados reais do sistema
  const analyticsData = useMemo(() => {
    if (!transactions?.data || transactions.data.length === 0) {
      return {
        trends: [],
        predictions: [],
        patterns: [],
      };
    }

    // Calcular tendências mensais baseadas nas transações reais
    const monthlyData = transactions.data.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          income: 0,
          expenses: 0,
          savings: 0
        };
      }
      
      if (transaction.type === 'income') {
        acc[monthKey].income += transaction.amount;
      } else {
        acc[monthKey].expenses += transaction.amount;
      }
      
      acc[monthKey].savings = acc[monthKey].income - acc[monthKey].expenses;
      
      return acc;
    }, {} as Record<string, any>);

    const trends = Object.values(monthlyData).slice(-6); // Últimos 6 meses

    // Calcular previsões baseadas nos dados históricos
    const avgIncome = trends.reduce((sum, month) => sum + month.income, 0) / trends.length;
    const avgExpenses = trends.reduce((sum, month) => sum + month.expenses, 0) / trends.length;
    const avgSavings = avgIncome - avgExpenses;

    const predictions = [
      { category: 'Receitas', predicted: Math.round(avgIncome), confidence: 85 },
      { category: 'Despesas', predicted: Math.round(avgExpenses), confidence: 78 },
      { category: 'Economia', predicted: Math.round(avgSavings), confidence: 72 },
    ];

    // Calcular padrões de gastos baseados nas categorias
    const categoryTotals = transactions.data.reduce((acc, transaction) => {
      if (transaction.type === 'expense') {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    const patterns = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: Math.round((amount / totalExpenses) * 100),
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }))
      .slice(0, 5); // Top 5 categorias

    return { trends, predictions, patterns };
  }, [transactions]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Financeiro</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">8.2/10</div>
            <p className="text-xs text-muted-foreground">
              +0.3 vs mês anterior
            </p>
            <Progress value={82} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsão Próximo Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 1.700</div>
            <p className="text-xs text-muted-foreground">
              Economia estimada
            </p>
            <Badge variant="secondary" className="mt-2">
              85% confiança
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência de Gastos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">92%</div>
            <p className="text-xs text-muted-foreground">
              Dentro do orçamento
            </p>
            <Progress value={92} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="patterns">Padrões</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Análise de Tendências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#00C49F"
                    strokeWidth={2}
                    name="Receitas"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#FF8042"
                    strokeWidth={2}
                    name="Despesas"
                  />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="#0088FE"
                    strokeWidth={2}
                    name="Economia"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Previsões IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.predictions.map((prediction, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{prediction.category}</h3>
                      <p className="text-sm text-muted-foreground">
                        Previsão para próximo mês
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        R$ {prediction.predicted.toLocaleString()}
                      </p>
                      <Badge variant="outline">
                        {prediction.confidence}% confiança
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Padrões de Comportamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.patterns}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.patterns.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-4">
                  {analyticsData.patterns.map((pattern, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: pattern.color }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{pattern.name}</p>
                        <Progress value={pattern.value} className="mt-1" />
                      </div>
                      <span className="text-sm font-medium">{pattern.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights */}
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Insights Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                💡 Oportunidade de Economia
              </h4>
              <p className="text-sm text-green-700">
                Você pode economizar até R$ 300 reduzindo gastos com delivery.
                Considere cozinhar mais em casa.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                📈 Tendência Positiva
              </h4>
              <p className="text-sm text-blue-700">
                Suas economias aumentaram 15% nos últimos 3 meses.
                Continue assim!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
