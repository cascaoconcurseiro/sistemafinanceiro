'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Target, PieChart } from 'lucide-react';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { usePeriod } from '@/contexts/period-context';
import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils/format-currency';
import { SimpleCashFlow } from '../simple-cash-flow';
import { CategoryAnalysisCard } from './category-analysis-card';

// ✅ Helper para calcular o valor correto de uma transação
// Se EU paguei uma despesa compartilhada, mostrar o valor TOTAL
// Se OUTRO pagou, mostrar apenas minha parte (myShare)
const getTransactionAmount = (transaction: any): number => {
  const amount = Math.abs(transaction.amount);
  
  // Se não é compartilhada, retornar o valor total
  if (!transaction.isShared) {
    return amount;
  }
  
  // Se é compartilhada e tem myShare
  if (transaction.myShare !== undefined && transaction.myShare !== null) {
    const myShare = Math.abs(Number(transaction.myShare));
    
    // Se myShare é igual ao amount, significa que EU paguei tudo
    // Retornar o valor total
    if (myShare === amount) {
      return amount;
    }
    
    // Se myShare é menor que amount, significa que foi dividido
    // Verificar se EU paguei ou OUTRO pagou
    const paidBy = transaction.paidBy;
    const isPaidByOther = paidBy && paidBy !== 'current_user'; // TODO: comparar com ID real
    
    // Se outro pagou, retornar apenas minha parte
    if (isPaidByOther) {
      return myShare;
    }
    
    // Se EU paguei, retornar o valor total
    return amount;
  }
  
  // Fallback: retornar o valor total
  return amount;
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
  // Usar contexto unificado em vez de chamadas diretas à API
  const { transactions, loading: isLoading } = useUnifiedFinancial();
  const { selectedMonth, selectedYear } = usePeriod();

  // Log apenas quando os dados mudarem de fato
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      console.log('💰 [CashFlow] Dados carregados do contexto:', {
        transactions: transactions.length
      });
    }
  }, [transactions?.length]);

  // ✅ CORREÇÃO: Calcular dados APENAS para o período selecionado
  const cashFlowData = useMemo(() => {
    console.log('💰 [CashFlow] Calculando dados com', transactions.length, 'transações');
    console.log('💰 [CashFlow] Período selecionado:', { selectedMonth, selectedYear });
    
    // ✅ CORREÇÃO: Filtrar transações APENAS do mês/ano selecionado
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const isInSelectedPeriod = transactionDate.getFullYear() === selectedYear && 
                                 transactionDate.getMonth() === selectedMonth;
      const isValid = t.status !== 'cancelled' && !t.deletedAt;
      return isInSelectedPeriod && isValid;
    });
    
    console.log('💰 [CashFlow] Transações no período:', periodTransactions.length);
    
    // Gerar dados para 12 meses de 2025 (para o gráfico)
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const monthlyData = months.map((month, index) => {
      const monthNumber = (index + 1).toString().padStart(2, '0');
      const monthKey = `2025-${monthNumber}`;
      
      // Filtrar transações do mês específico
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const transactionMonth = transactionDate.getFullYear() === 2025 && 
                                transactionDate.getMonth() === index;
        const isValid = t.status !== 'cancelled' && !t.deletedAt;
        return transactionMonth && isValid;
      });

      // ✅ CORREÇÃO: Aceitar ambos os formatos (maiúsculo e minúsculo)
      const incomeTransactions = monthTransactions.filter(t => t.type === 'income' || t.type === 'RECEITA');
      const expenseTransactions = monthTransactions.filter(t => t.type === 'expense' || t.type === 'DESPESA');

      // Filtrar valores absurdos (acima de R$ 1 milhão)
      const MAX_REASONABLE_VALUE = 1000000;
      
      const income = incomeTransactions
        .filter(t => t.amount > 0 && t.amount <= MAX_REASONABLE_VALUE)
        .reduce((sum, t) => sum + getTransactionAmount(t), 0);
      
      const expenses = expenseTransactions
        .filter(t => Math.abs(t.amount) <= MAX_REASONABLE_VALUE)
        .reduce((sum, t) => sum + getTransactionAmount(t), 0);

      // Debug para outubro (mês 10)
      if (index === 9) { // Outubro é índice 9
        console.log('🔍 [CashFlow] Debug Outubro:', {
          monthKey,
          totalTransactions: monthTransactions.length,
          incomeTransactions: incomeTransactions.length,
          expenseTransactions: expenseTransactions.length,
          income,
          expenses,
          sampleIncomes: incomeTransactions.slice(0, 3).map(t => ({ amount: t.amount, description: t.description })),
          sampleExpenses: expenseTransactions.slice(0, 3).map(t => ({ amount: t.amount, description: t.description }))
        });
      }

      const netFlow = income - expenses;

      return {
        month,
        income,
        expenses,
        netFlow
      };
    });

    // ✅ CORREÇÃO: Calcular totais APENAS do período selecionado
    const totalIncome = periodTransactions
      .filter(t => t.type === 'income' || t.type === 'RECEITA')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalExpenses = periodTransactions
      .filter(t => t.type === 'expense' || t.type === 'DESPESA')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    console.log('💰 [CashFlow] Totais do período selecionado:', {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionsCount: periodTransactions.length
    });
    
    return {
      monthlyData,
      totalIncome,
      totalExpenses
    };
  }, [transactions, selectedMonth, selectedYear]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fluxo de Caixa - 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-12 gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cashFlowData || !cashFlowData.monthlyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fluxo de Caixa - 2025
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
  const finalAccumulatedBalance = monthlyReports.length > 0 ? monthlyReports[monthlyReports.length - 1].netFlow : 0;

  const maxValor = Math.max(
    ...monthlyReports.map((m) => Math.max(m?.income || 0, m?.expenses || 0))
  );

  const formatMonth = (month: string) => month;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Fluxo de Caixa - 2025 (12 Meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-2">
            {monthlyReports.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-xs font-medium mb-2">{formatMonth(item.month)}</div>
                <div className="space-y-1">
                  <div
                    className="bg-green-500 rounded-t"
                    style={{
                      height: `${maxValor > 0 ? ((item?.income || 0) / maxValor) * 60 : 4}px`,
                      minHeight: '4px',
                    }}
                  ></div>
                  <div
                    className="bg-red-500 rounded-b"
                    style={{
                      height: `${maxValor > 0 ? ((item?.expenses || 0) / maxValor) * 60 : 4}px`,
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
              <div className={`text-lg font-bold ${(totalIncome - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(totalIncome - totalExpenses) >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpenses)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalsProgressCard() {
  const { data, isLoading } = useUnifiedFinancial();
  const { goals = [] } = data || {};

  if (isLoading) {
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
  const { data, isLoading } = useUnifiedFinancial();
  const { transactions = [] } = data || {};
  const { selectedMonth, selectedYear } = usePeriod();

  // Calcular gastos por categoria do mês selecionado
  // ✅ CORREÇÃO: Aceitar ambos os formatos (minúsculo e maiúsculo)
  const expenseTransactions = Array.isArray(transactions) ? transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const isExpense = t.type === 'expense' || t.type === 'DESPESA';
    return isExpense && 
           transactionDate.getMonth() === selectedMonth &&
           transactionDate.getFullYear() === selectedYear;
  }) : [];
  
  // ✅ CORREÇÃO: Não usar fallback - mostrar apenas o período selecionado
  const showingFallback = false;
  
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  console.log('📊 [CategoryBudget] Debug categorias:', {
    totalTransactions: transactions.length,
    selectedPeriod: `${monthNames[selectedMonth]} ${selectedYear}`,
    selectedMonth,
    selectedYear,
    expenseTransactionsInPeriod: expenseTransactions.length,
    sampleExpensesInPeriod: expenseTransactions.slice(0, 5).map(t => ({
      category: t.category,
      amount: t.amount,
      date: t.date,
      description: t.description
    })),
    categoriesInPeriod: [...new Set(expenseTransactions.map(t => t.category || 'Outros'))],
    // Todas as despesas para comparação
    totalExpenses: transactions.filter(t => t.type === 'expense').length,
    allMonthsWithExpenses: [...new Set(transactions.filter(t => t.type === 'expense').map(t => {
      const date = new Date(t.date);
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }))]
  });
  
  // Agrupar por categoria
  const expensesByCategory: Record<string, { total: number; count: number }> = {};
  let totalExpenses = 0;
  
  expenseTransactions.forEach(t => {
    // Usar a categoria como estava funcionando antes
    const category = t.category || 'Outros';
    const amount = Math.abs(t.amount);
    
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = { total: 0, count: 0 };
    }
    
    expensesByCategory[category].total += amount;
    expensesByCategory[category].count += 1;
    totalExpenses += amount;
  });
  
  // Converter para array e adicionar percentuais
  const categoryData = Object.entries(expensesByCategory).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count,
    percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0
  }));

  // Ordenar por valor decrescente
  categoryData.sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Gastos por Categoria
          {showingFallback && (
            <Badge variant="secondary" className="text-xs">
              Últimos 30 dias
            </Badge>
          )}
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
                {showingFallback 
                  ? "Não há despesas nos últimos 30 dias"
                  : "Adicione transações para ver os gastos por categoria"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente principal que agrupa todas as seções
export function DashboardSections() {
  return (
    <div className="space-y-6">
      {/* Fluxo de Caixa - Largura completa */}
      <div className="w-full">
        <CashFlowCard />
      </div>
      
      {/* Metas e Gastos por Categoria - Layout lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalsProgressCard />
        <CategoryAnalysisCard />
      </div>
    </div>
  );
}
