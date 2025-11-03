/**
 * Exemplo de Dashboard Otimizado
 * 
 * Demonstra o uso do sistema de estado otimizado com Zustand,
 * cache inteligente e atualizações em tempo real.
 */

'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  useOptimizedAccounts, 
  useOptimizedTransactions, 
  useFinancialSummary,
  useFinancialOperations,
  usePerformanceMonitor 
} from '@/hooks/use-optimized-financial-data';
import { useRealTimeSync } from '@/lib/store/real-time-updates';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Activity,
  RefreshCw,
  Zap,
  Clock
} from 'lucide-react';

// Componente de resumo financeiro memoizado
const FinancialSummaryCard = memo(function FinancialSummaryCard() {
  const currentMonth = {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  };

  const summary = useFinancialSummary(currentMonth);

  if (summary.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Carregando resumo...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(summary.statistics.income)}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            {summary.trends.income.percentage > 0 ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            )}
            {Math.abs(summary.trends.income.percentage).toFixed(1)}% vs mês anterior
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(summary.statistics.expenses)}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            {summary.trends.expenses.percentage > 0 ? (
              <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
            )}
            {Math.abs(summary.trends.expenses.percentage).toFixed(1)}% vs mês anterior
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(summary.totalBalance)}
          </div>
          <div className="text-xs text-muted-foreground">
            {summary.accounts} contas ativas
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resultado</CardTitle>
          <Activity className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            summary.statistics.balance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(summary.statistics.balance)}
          </div>
          <div className="text-xs text-muted-foreground">
            {summary.statistics.count} transações
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Componente de contas memoizado
const AccountsOverview = memo(function AccountsOverview() {
  const { accounts, totalBalance, isLoading, recentUpdates } = useOptimizedAccounts();
  const { accounts: accountOperations } = useFinancialOperations();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Carregando contas...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Minhas Contas
            {recentUpdates.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {recentUpdates.length} atualizações
              </Badge>
            )}
          </CardTitle>
          <div className="text-2xl font-bold text-blue-600">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(totalBalance)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{account.name}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {account.type.replace('_', ' ')}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: account.currency
                  }).format(account.balance)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {account.currency}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

// Componente de transações recentes memoizado
const RecentTransactions = memo(function RecentTransactions() {
  const { transactions, isLoading, recentUpdates } = useOptimizedTransactions({
    limit: 5,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Carregando transações...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Transações Recentes
          {recentUpdates.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recentUpdates.length} novas
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{transaction.description}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(Math.abs(transaction.amount))}
                </div>
                <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                  {transaction.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

// Componente de status de sincronização
const SyncStatusCard = memo(function SyncStatusCard() {
  const { syncStatus, syncAll, isOnline, isSyncing, lastSync } = useRealTimeSync();
  const performanceStats = usePerformanceMonitor();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Status do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status de Conexão */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Conexão</span>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Status de Sincronização */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Sincronização</span>
          <div className="flex items-center gap-2">
            {isSyncing && <RefreshCw className="h-3 w-3 animate-spin" />}
            <Badge variant={isSyncing ? 'secondary' : 'default'}>
              {isSyncing ? 'Sincronizando...' : 'Atualizado'}
            </Badge>
          </div>
        </div>

        {/* Última Sincronização */}
        {lastSync && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Última Sync</span>
            <span className="text-xs text-muted-foreground">
              {new Date(lastSync).toLocaleTimeString('pt-BR')}
            </span>
          </div>
        )}

        {/* Performance Stats */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Renders</span>
            <span className="text-xs text-muted-foreground">
              {performanceStats.renderCount}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Atualizações</span>
            <span className="text-xs text-muted-foreground">
              {performanceStats.recentUpdates.length}
            </span>
          </div>
        </div>

        {/* Botão de Sincronização Manual */}
        <Button 
          onClick={syncAll} 
          disabled={isSyncing || !isOnline}
          size="sm" 
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Sincronizar Agora
        </Button>

        {/* Erros de Sincronização */}
        {syncStatus.errors.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-sm font-medium text-red-600 mb-2">Erros:</div>
            {syncStatus.errors.map((error, index) => (
              <div key={index} className="text-xs text-red-500 mb-1">
                {error}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Dashboard principal
export function OptimizedDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
        <Badge variant="outline" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Otimizado
        </Badge>
      </div>

      {/* Resumo Financeiro */}
      <FinancialSummaryCard />

      {/* Grid Principal */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Contas */}
        <div className="lg:col-span-2">
          <AccountsOverview />
        </div>

        {/* Status do Sistema */}
        <SyncStatusCard />
      </div>

      {/* Transações Recentes */}
      <RecentTransactions />

      {/* Debug Info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Debug - Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div>Componentes memoizados para prevenir re-renders desnecessários</div>
            <div>Cache inteligente com invalidação automática</div>
            <div>Atualizações em tempo real com optimistic updates</div>
            <div>Estado persistente com migração automática</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default OptimizedDashboard;