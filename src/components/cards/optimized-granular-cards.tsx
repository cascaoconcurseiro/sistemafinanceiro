'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
} from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { formatCurrency } from '@/lib/utils/format-currency';

// Componente de card individual memoizado
const MetricCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'blue'
}: {
  title: string;
  value: string;
  icon: any;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && trendValue && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

// Componente principal otimizado
export const OptimizedGranularCards = memo(() => {
  const { metrics, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Saldo Total"
        value={formatCurrency(metrics.totalBalance)}
        icon={Wallet}
        color="blue"
      />
      
      <MetricCard
        title="Receitas do Mês"
        value={formatCurrency(metrics.monthlyIncome)}
        icon={TrendingUp}
        trend="up"
        trendValue={`${metrics.transactionsCount} transações`}
        color="green"
      />
      
      <MetricCard
        title="Despesas do Mês"
        value={formatCurrency(metrics.monthlyExpenses)}
        icon={TrendingDown}
        trend="down"
        trendValue={`${metrics.transactionsCount} transações`}
        color="red"
      />
      
      <MetricCard
        title="Saldo do Mês"
        value={formatCurrency(metrics.monthlyBalance)}
        icon={DollarSign}
        trend={metrics.monthlyBalance >= 0 ? 'up' : 'down'}
        trendValue={metrics.monthlyBalance >= 0 ? 'Positivo' : 'Negativo'}
        color={metrics.monthlyBalance >= 0 ? 'green' : 'red'}
      />
    </div>
  );
});

OptimizedGranularCards.displayName = 'OptimizedGranularCards';
