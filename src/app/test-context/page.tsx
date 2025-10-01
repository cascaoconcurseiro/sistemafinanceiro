'use client';

import React from 'react';
import {
  useTransactions,
  useAccounts,
  useGoals,
} from '@/contexts/unified-context-simple';

export default function TestContextPage() {
  // Hooks devem sempre ser chamados no topo, não condicionalmente
  const transactionsResult = useTransactions();
  const accountsResult = useAccounts();
  const goalsResult = useGoals();

  // Se houver erro, mostrar na interface
  const hasError = transactionsResult.error || accountsResult.error || goalsResult.error;

  if (hasError) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">
          Error in Test Context Page
        </h1>
        <div className="mt-4 space-y-2">
          {transactionsResult.error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
              Transactions Error: {transactionsResult.error}
            </div>
          )}
          {accountsResult.error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
              Accounts Error: {accountsResult.error}
            </div>
          )}
          {goalsResult.error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
              Goals Error: {goalsResult.error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Test Context Page</h1>
      <div className="mt-4 space-y-4">
        <div>
          <h2 className="font-semibold">Transactions:</h2>
          <p>Count: {transactionsResult.transactions?.length || 0}</p>
          <p>Loading: {transactionsResult.isLoading ? 'Yes' : 'No'}</p>
          <p>Error: {transactionsResult.error || 'None'}</p>
        </div>

        <div>
          <h2 className="font-semibold">Accounts:</h2>
          <p>Count: {accountsResult.accounts?.length || 0}</p>
          <p>Loading: {accountsResult.isLoading ? 'Yes' : 'No'}</p>
          <p>Error: {accountsResult.error || 'None'}</p>
        </div>

        <div>
          <h2 className="font-semibold">Goals:</h2>
          <p>Count: {goalsResult.goals?.length || 0}</p>
          <p>Loading: {goalsResult.isLoading ? 'Yes' : 'No'}</p>
          <p>Error: {goalsResult.error || 'None'}</p>
        </div>
      </div>
    </div>
  );
}
