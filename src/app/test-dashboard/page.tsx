'use client';

import { CashFlowCard, GoalsProgressCard, CategoryBudgetCard } from '@/components/cards/dashboard-sections';
import { TotalBalanceCard } from '@/components/cards/granular-cards';
import { SyncStatus } from '@/components/sync-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnified } from '@/contexts/unified-context-simple';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';


export default function TestDashboardPage() {
  const { accounts, goals, loading } = useUnified();

  const { status, isEnabled } = useRealTimeSync();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Teste do Dashboard</h1>
        <p className="text-muted-foreground">
          Página para testar os componentes do dashboard implementados
        </p>
      </div>

      {/* Status da Sincronização em Tempo Real */}
      <SyncStatus showDetails={true} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TotalBalanceCard />
        
        <Card>
          <CardHeader>
            <CardTitle>Status dos Hooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Loading: {loading ? 'Sim' : 'Não'}</div>
              <div>Contas carregadas: {accounts ? 'Sim' : 'Não'}</div>
              <div>Goals carregadas: {goals ? 'Sim' : 'Não'}</div>
              <div>Sync habilitado: {isEnabled ? 'Sim' : 'Não'}</div>
              <div>Sync conectado: {status.isConnected ? 'Sim' : 'Não'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowCard />
        <GoalsProgressCard />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <CategoryBudgetCard />
      </div>
    </div>
  );
}
