'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  PieChart,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { useAccounts, useUnified } from '../../contexts/unified-context-simple';
import { useGoals } from '../../hooks/use-goals';
import { useTransactionStats } from '@/hooks/use-optimized-transactions';
import { useMemo } from 'react';
import { useEventListener } from '@/hooks/use-real-time-events';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Card de Saldo Total
export function TotalBalanceCard() {
  const { accounts = [], transactions = [], loading, actions, dashboardData } = useUnified();

  // Use dashboard data instead of direct calculation
  const totalBalance = dashboardData?.totalBalance || 0;

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Patrimônio Total
          </CardTitle>
          <PieChart className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
        <PieChart className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-600">
          {formatCurrency(totalBalance)}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {accounts.length} conta(s) ativa(s)
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Resultado Mensal (Saldo do Mês)
export function MonthlyResultCard() {
  const { transactions = [], loading } = useUnified();

  // Escutar eventos de transações para recalcular resultado mensal
  useEventListener(['transaction_created', 'transaction_updated', 'transaction_deleted'], () => {
    // Transaction changed, component will re-render automatically
  });

  const monthlyResult = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTransactions = transactions.filter(t => 
      t.date.startsWith(currentMonth)
    );
    
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return income - expenses;
  }, [transactions]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Resultado do Mês
          </CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Resultado do Mês</CardTitle>
        <Activity
          className={`h-4 w-4 ${monthlyResult >= 0 ? 'text-green-600' : 'text-red-600'}`}
        />
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${monthlyResult >= 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {monthlyResult >= 0 ? '+' : ''}
          {formatCurrency(monthlyResult)}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {monthlyResult >= 0 ? 'Superávit' : 'Déficit'} mensal
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Metas Ativas
export function ActiveGoalsCard() {
  const { goals = [], isLoading } = useGoals();

  const goalsStats = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const averageProgress = goals.length > 0 
      ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length 
      : 0;
    
    return { activeGoals, completedGoals, averageProgress };
  }, [goals]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
        <Target className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-600">{goalsStats.activeGoals}</div>
        <div className="text-xs text-muted-foreground mt-2">
          {goalsStats.completedGoals} concluídas • {goalsStats.averageProgress.toFixed(0)}% progresso médio
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Receitas do Mês
export function MonthlyIncomeCard() {
  const { transactions = [], loading } = useUnified();

  const monthlyIncome = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return transactions
      .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
        <TrendingUp className="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          +{formatCurrency(monthlyIncome)}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Receitas acumuladas no mês
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Despesas do Mês
export function MonthlyExpensesCard() {
  const { transactions = [], loading } = useUnified();

  const monthlyExpenses = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
        <TrendingDown className="h-4 w-4 text-red-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-600">
          -{formatCurrency(monthlyExpenses)}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Despesas acumuladas no mês
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Taxa de Poupança
export function SavingsRateCard() {
  const { transactions = [], loading } = useUnified();

  const savingsRate = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTransactions = transactions.filter(t => 
      t.date.startsWith(currentMonth)
    );
    
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return income > 0 ? ((income - expenses) / income) * 100 : 0;
  }, [transactions]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
          <Wallet className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
        <Wallet className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-600">
          {savingsRate.toFixed(1)}%
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Do total de receitas
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Valor de Investimentos
export function InvestmentValueCard() {
  const { accounts = [], loading } = useUnified();

  const investmentValue = useMemo(() => {
    return accounts
      .filter(a => a.type === 'investment')
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
          <CreditCard className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
        <CreditCard className="h-4 w-4 text-purple-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-purple-600">
          {formatCurrency(investmentValue)}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Valor total investido
        </div>
      </CardContent>
    </Card>
  );
}
