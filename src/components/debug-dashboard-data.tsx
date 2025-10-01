'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function DebugDashboardData() {
  const [accountsData, setAccountsData] = useState<any>(null);
  const [transactionsData, setTransactionsData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      try {
        // Testar API de contas
        try {
          const accountsResponse = await fetch('/api/accounts/summary');
          const accountsResult = await accountsResponse.json();
          setAccountsData(accountsResult);
        } catch (error) {
          setErrors((prev: any) => ({ ...prev, accounts: error }));
        }

        // Testar API de transações
        try {
          const transactionsResponse = await fetch('/api/transactions');
          const transactionsResult = await transactionsResponse.json();
          setTransactionsData(transactionsResult);
        } catch (error) {
          setErrors((prev: any) => ({ ...prev, transactions: error }));
        }

        // Testar API de resumo de transações
        try {
          const summaryResponse = await fetch(`/api/transactions/summary?year=${year}&month=${month}`);
          const summaryResult = await summaryResponse.json();
          setSummaryData(summaryResult);
        } catch (error) {
          setErrors((prev: any) => ({ ...prev, summary: error }));
        }

        // Testar API de cash-flow
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 6);
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          // Usar dados locais baseados em transações ao invés de API externa
          setCashFlowData({ message: 'Usando dados locais baseados em transações' });
        } catch (error) {
          setErrors((prev: any) => ({ ...prev, cashFlow: error }));
        }

        // Testar API de receitas do mês
        try {
          const incomeResponse = await fetch(`/api/transactions/summary?year=${year}&month=${month}&type=income`);
          const incomeResult = await incomeResponse.json();
          setIncomeData(incomeResult);
        } catch (error) {
          setErrors((prev: any) => ({ ...prev, income: error }));
        }

        // Testar API de despesas do mês
        try {
          const expenseResponse = await fetch(`/api/transactions/summary?year=${year}&month=${month}&type=expense`);
          const expenseResult = await expenseResponse.json();
          setExpenseData(expenseResult);
        } catch (error) {
          setErrors((prev: any) => ({ ...prev, expense: error }));
        }

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Debug Dashboard - Carregando...</h2>
        <div>Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Debug Dashboard Data</h2>
      
      {/* Info da data atual */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800">Informações de Data</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p><strong>Data atual:</strong> {new Date().toISOString()}</p>
          <p><strong>Data local:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
          <p><strong>Ano atual:</strong> {new Date().getFullYear()}</p>
          <p><strong>Mês atual:</strong> {new Date().getMonth() + 1} (setembro = 9)</p>
          <p><strong>Timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contas */}
        <Card>
          <CardHeader>
            <CardTitle>API /accounts/summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p><strong>Status:</strong> {accountsData?.success ? 'OK' : 'ERRO'}</p>
              {errors.accounts && (
                <p className="text-red-500">Erro: {errors.accounts.message}</p>
              )}
              <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                {JSON.stringify(accountsData, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Transações */}
        <Card>
          <CardHeader>
            <CardTitle>API /transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p><strong>Status:</strong> {transactionsData?.success ? 'OK' : 'ERRO'}</p>
              {errors.transactions && (
                <p className="text-red-500">Erro: {errors.transactions.message}</p>
              )}
              <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto max-h-60">
                {JSON.stringify(transactionsData, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>API /transactions/summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p><strong>Status:</strong> {summaryData?.success ? 'OK' : 'ERRO'}</p>
              {errors.summary && (
                <p className="text-red-500">Erro: {errors.summary.message}</p>
              )}
              <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                {JSON.stringify(summaryData, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Segunda linha de cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash Flow */}
          <Card>
            <CardHeader>
              <CardTitle>API /reports/cash-flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p><strong>Status:</strong> {cashFlowData?.success ? 'OK' : 'ERRO'}</p>
                {errors.cashFlow && (
                  <p className="text-red-500">Erro: {errors.cashFlow.message}</p>
                )}
                <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto max-h-60">
                  {JSON.stringify(cashFlowData, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Receitas */}
          <Card>
            <CardHeader>
              <CardTitle>API /transactions/summary?type=income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p><strong>Status:</strong> {incomeData?.success ? 'OK' : 'ERRO'}</p>
                {errors.income && (
                  <p className="text-red-500">Erro: {errors.income.message}</p>
                )}
                <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                  {JSON.stringify(incomeData, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Despesas */}
          <Card>
            <CardHeader>
              <CardTitle>API /transactions/summary?type=expense</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p><strong>Status:</strong> {expenseData?.success ? 'OK' : 'ERRO'}</p>
                {errors.expense && (
                  <p className="text-red-500">Erro: {errors.expense.message}</p>
                )}
                <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                  {JSON.stringify(expenseData, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
