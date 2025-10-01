'use client';

import {
  useTransactions,
  useAccounts,
  useGoals,
} from '@/contexts/unified-context-simple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSmartNotifications } from '@/lib/notifications/smart-notifications';

export default function TestDebugPage() {
  // Hooks devem ser chamados no topo, sempre na mesma ordem
  const {
    transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useTransactions();
  
  const {
    accounts,
    isLoading: accountsLoading,
    error: accountsError,
  } = useAccounts();
  
  const { goals, isLoading: goalsLoading, error: goalsError } = useGoals();
  
  const { notifications, isLoading: notificationsLoading } = useSmartNotifications();

  // Verificar se há algum erro e mostrar interface de erro se necessário
  const hasError = transactionsError || accountsError || goalsError;
  if (hasError) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">Erro Detectado!</h1>
        <div className="mt-4 space-y-2">
          {transactionsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800">Transactions Error: {transactionsError}</p>
            </div>
          )}
          {accountsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800">Accounts Error: {accountsError}</p>
            </div>
          )}
          {goalsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800">Goals Error: {goalsError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">
        Debug Page - Status dos Contextos
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Loading: {transactionsLoading ? 'Sim' : 'Não'}</p>
              <p>Error: {transactionsError || 'Nenhum'}</p>
              <p>Count: {transactions?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Loading: {accountsLoading ? 'Sim' : 'Não'}</p>
              <p>Error: {accountsError || 'Nenhum'}</p>
              <p>Count: {accounts?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Loading: {goalsLoading ? 'Sim' : 'Não'}</p>
              <p>Error: {goalsError || 'Nenhum'}</p>
              <p>Count: {goals?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Loading: {notificationsLoading ? 'Sim' : 'Não'}</p>
              <p>Count: {notifications?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de transações para debug */}
      <Card>
        <CardHeader>
          <CardTitle>Transações (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-40 overflow-y-auto">
            {transactions?.slice(0, 5).map((transaction, index) => (
              <div key={index} className="text-sm p-2 border-b">
                <p>ID: {transaction.id}</p>
                <p>Tipo: {transaction.type}</p>
                <p>Valor: R$ {transaction.amount}</p>
                <p>Data: {transaction.date}</p>
                <p>Categoria: {transaction.category}</p>
              </div>
            )) || <p>Nenhuma transação encontrada</p>}
          </div>
        </CardContent>
      </Card>

      {/* Notificações para debug */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {notifications?.slice(0, 3).map((notification, index) => (
              <div key={index} className="text-sm p-2 border rounded">
                <p className="font-semibold">{notification.title}</p>
                <p className="text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-500">
                  Tipo: {notification.type} | Prioridade:{' '}
                  {notification.priority}
                </p>
              </div>
            )) || <p>Nenhuma notificação encontrada</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
