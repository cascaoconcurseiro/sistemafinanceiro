'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useUnified } from '@/contexts/unified-financial-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinancialAnalysisDashboard() {
  const { transactions, accounts, loading, dashboardData } = useUnified();
  const [selectedPeriod, setSelectedPeriod] = useState('12months');

  // Dados de análise financeira
  const analysisData = {
    cashFlow: [
      { month: 'Jul', inflow: 4500, outflow: 3200, net: 1300 },
      { month: 'Ago', inflow: 4800, outflow: 3500, net: 1300 },
      { month: 'Set', inflow: 5200, outflow: 3800, net: 1400 },
      { month: 'Out', inflow: 4900, outflow: 3600, net: 1300 },
      { month: 'Nov', inflow: 5100, outflow: 3900, net: 1200 },
      { month: 'Dez', inflow: 5500, outflow: 4200, net: 1300 },
    ],
    ratios: {
      liquidityRatio: 2.5,
      savingsRate: 25,
      debtToIncome: 15,
      expenseRatio: 75,
    },
    categories: [
      { name: 'Habitação', budget: 2000, spent: 1850, percentage: 92.5 },
      { name: 'Alimentação', budget: 800, spent: 920, percentage: 115 },
      { name: 'Transporte', budget: 600, spent: 580, percentage: 96.7 },
      { name: 'Lazer', budget: 400, spent: 320, percentage: 80 },
      { name: 'Saúde', budget: 300, spent: 280, percentage: 93.3 },
    ],
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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

  const getRatioColor = (ratio: number, type: string) => {
    switch (type) {
      case 'liquidity':
        return ratio >= 2 ? 'text-green-600' : ratio >= 1.5 ? 'text-yellow-600' : 'text-red-600';
      case 'savings':
        return ratio >= 20 ? 'text-green-600' : ratio >= 10 ? 'text-yellow-600' : 'text-red-600';
      case 'debt':
        return ratio <= 20 ? 'text-green-600' : ratio <= 40 ? 'text-yellow-600' : 'text-red-600';
      case 'expense':
        return ratio <= 80 ? 'text-green-600' : ratio <= 90 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Índice de Liquidez</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatioColor(analysisData.ratios.liquidityRatio, 'liquidity')}`}>
              {analysisData.ratios.liquidityRatio.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Capacidade de pagamento
            </p>
            <Badge variant={analysisData.ratios.liquidityRatio >= 2 ? 'default' : 'destructive'} className="mt-2">
              {analysisData.ratios.liquidityRatio >= 2 ? 'Saudável' : 'Atenção'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatioColor(analysisData.ratios.savingsRate, 'savings')}`}>
              {analysisData.ratios.savingsRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Da renda total
            </p>
            <Progress value={analysisData.ratios.savingsRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endividamento</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatioColor(analysisData.ratios.debtToIncome, 'debt')}`}>
              {analysisData.ratios.debtToIncome}%
            </div>
            <p className="text-xs text-muted-foreground">
              Da renda comprometida
            </p>
            <Progress value={analysisData.ratios.debtToIncome} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatioColor(analysisData.ratios.expenseRatio, 'expense')}`}>
              {analysisData.ratios.expenseRatio}%
            </div>
            <p className="text-xs text-muted-foreground">
              Da renda gasta
            </p>
            <Progress value={analysisData.ratios.expenseRatio} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Análises Detalhadas */}
      <Tabs defaultValue="cashflow" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="budget">Análise Orçamentária</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Análise de Fluxo de Caixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analysisData.cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    stackId="1"
                    stroke="#00C49F"
                    fill="#00C49F"
                    fillOpacity={0.6}
                    name="Entradas"
                  />
                  <Area
                    type="monotone"
                    dataKey="outflow"
                    stackId="2"
                    stroke="#FF8042"
                    fill="#FF8042"
                    fillOpacity={0.6}
                    name="Saídas"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#0088FE"
                    strokeWidth={3}
                    name="Saldo Líquido"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Performance Orçamentária por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.categories.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          R$ {category.spent} / R$ {category.budget}
                        </span>
                        {category.percentage <= 100 ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={Math.min(category.percentage, 100)} 
                        className="flex-1"
                      />
                      <Badge 
                        variant={category.percentage <= 100 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {category.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Análise de Tendências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analysisData.cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="inflow"
                    stroke="#00C49F"
                    strokeWidth={2}
                    name="Receitas"
                  />
                  <Line
                    type="monotone"
                    dataKey="outflow"
                    stroke="#FF8042"
                    strokeWidth={2}
                    name="Despesas"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#0088FE"
                    strokeWidth={3}
                    name="Saldo Líquido"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recomendações */}
      <Card className="border-t-4 border-t-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Recomendações de Melhoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">
                ⚠️ Atenção: Gastos com Alimentação
              </h4>
              <p className="text-sm text-orange-700">
                Você ultrapassou o orçamento de alimentação em 15%. 
                Considere revisar seus hábitos alimentares.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                ✅ Parabéns: Taxa de Poupança
              </h4>
              <p className="text-sm text-green-700">
                Sua taxa de poupança de 25% está excelente! 
                Continue mantendo esse ritmo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
