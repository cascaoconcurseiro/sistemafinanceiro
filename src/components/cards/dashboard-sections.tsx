'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Target, PieChart } from 'lucide-react';
import { useUnified } from '@/contexts/unified-context-simple';
import { useState, useEffect } from 'react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getProgressColor = (percentage: number) => {
  if (percentage <= 50) return 'bg-green-500';
  if (percentage <= 80) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getCategoryAlert = (percentage: number) => {
  if (percentage <= 50) return 'text-green-600';
  if (percentage <= 80) return 'text-yellow-600';
  return 'text-red-600';
};

export function CashFlowCard() {
  const { loading } = useUnified();
  const [cashFlowData, setCashFlowData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCashFlowData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/reports/cash-flow?period=6m');
        if (!response.ok) throw new Error('Erro ao buscar dados de fluxo de caixa');
        const result = await response.json();
        setCashFlowData(result.data);
      } catch (error) {
        console.error('Erro ao carregar fluxo de caixa:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCashFlowData();
  }, []);

  if (isLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fluxo de Caixa - Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!cashFlowData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fluxo de Caixa - Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    );
  }

  const monthlyReports = cashFlowData.monthlyData || [];
  const totalIncome = cashFlowData.totalIncome || 0;
  const totalExpenses = cashFlowData.totalExpenses || 0;
  // O saldo líquido deve ser o saldo acumulado do último mês
  const finalAccumulatedBalance = monthlyReports.length > 0 ? monthlyReports[monthlyReports.length - 1].netFlow : 0;

  const maxValor = Math.max(
    ...monthlyReports.map((m) => Math.max(m?.income || 0, m?.expenses || 0))
  );

  // Converter mês YYYY-MM para formato abreviado em português
  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Fluxo de Caixa - Últimos 6 Meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-4">
            {monthlyReports.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium mb-2">{formatMonth(item.month)}</div>
                <div className="space-y-1">
                  <div
                    className="bg-green-500 rounded-t"
                    style={{
                      height: `${maxValor > 0 ? ((item?.income || 0) / maxValor) * 100 : 4}px`,
                      minHeight: '4px',
                    }}
                  ></div>
                  <div
                    className="bg-red-500 rounded-b"
                    style={{
                      height: `${maxValor > 0 ? ((item?.expenses || 0) / maxValor) * 100 : 4}px`,
                      minHeight: '4px',
                    }}
                  ></div>
                </div>
                <div
                  className={`text-xs mt-1 ${(item?.netFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {(item?.netFlow || 0) >= 0 ? '+' : ''}
                  {formatCurrency(item?.netFlow || 0)}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Total Receitas
              </div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Total Despesas
              </div>
              <div className="text-lg font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Saldo Líquido</div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(finalAccumulatedBalance)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalsProgressCard() {
  const { goals, loading } = useUnified();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Financeiras
            <Badge variant="secondary">Carregando...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = Array.isArray(goals) ? goals.filter((goal) => goal.status === 'active') : [];
  const completedGoals = Array.isArray(goals) ? goals.filter((goal) => goal.status === 'completed') : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas Financeiras
          <Badge variant="secondary">
            {completedGoals.length} de {Array.isArray(goals) ? goals.length : 0} concluídas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeGoals.slice(0, 6).map((goal) => {
            const progress =
              (Number(goal.currentAmount || 0) /
                Number(goal.targetAmount || 1)) *
              100;
            const daysLeft = goal.deadline
              ? Math.ceil(
                  (new Date(goal.deadline).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{goal.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(Number(goal.currentAmount || 0))} de{' '}
                      {formatCurrency(Number(goal.targetAmount || 0))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {Math.min(progress, 100).toFixed(1)}%
                    </div>
                    {daysLeft > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {daysLeft} dias
                      </div>
                    )}
                  </div>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
              </div>
            );
          })}

          {activeGoals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma meta ativa encontrada</p>
              <p className="text-sm">Crie suas primeiras metas financeiras!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryBudgetCard() {
  const { transactions, loading, dashboardData } = useUnified();

  // Usar dados da API em vez de calcular no frontend
  const categoryBreakdown = dashboardData?.categoryBreakdown || {};
  
  // Filtrar transações de despesa do mês atual (mesmo filtro da API)
  const currentDate = new Date();
  const startDate = new Date();
  startDate.setDate(1); // Primeiro dia do mês atual
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1, 0); // Último dia do mês atual
  endDate.setHours(23, 59, 59, 999);
  
  const expenseTransactions = Array.isArray(transactions) ? transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return t.type === 'expense' && 
           transactionDate >= startDate && 
           transactionDate <= endDate;
  }) : [];
  
  // Converter o objeto categoryBreakdown em array para exibição
  const categoryData = Object.entries(categoryBreakdown).map(([category, total]) => ({
    category,
    total: total as number,
    count: expenseTransactions.filter(t => (t.category || 'Outros') === category).length,
    percentage: dashboardData?.totalExpenses > 0 ? ((total as number) / dashboardData.totalExpenses) * 100 : 0
  }));

  // Ordenar por valor decrescente
  categoryData.sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Gastos por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoryData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{item.category}</span>
                <span className="text-sm text-gray-600">
                  {formatCurrency(item.total)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{item.count} transações</span>
                <span>{item.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
          {categoryData.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">
                Nenhuma categoria com gastos encontrada
              </p>
              <p className="text-sm text-gray-400">
                Adicione transações para ver os gastos por categoria
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
