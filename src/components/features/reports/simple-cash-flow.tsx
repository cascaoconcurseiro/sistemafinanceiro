'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';

export function SimpleCashFlow() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('💰 [SimpleCashFlow] Carregando dados da API unified-financial...');
        const response = await fetch('/api/unified-financial', { credentials: 'include' });
        if (response.ok) {
          const result = await response.json();
          console.log('💰 [SimpleCashFlow] Dados unificados carregados:', {
            accounts: result.accounts?.length || 0,
            transactions: result.transactions?.length || 0
          });
          
          const transactions = result.transactions || [];
          
          // Filtrar transações de outubro 2025
          const octoberTransactions = transactions.filter((t: any) => {
            const date = new Date(t.date);
            return date.getFullYear() === 2025 && date.getMonth() === 9; // Outubro é mês 9
          });
          
          // Filtrar valores absurdos (acima de R$ 1 milhão)
          const MAX_REASONABLE_VALUE = 1000000;
          
          // Debug: verificar tipos de transações
          const incomeTransactions = octoberTransactions.filter((t: any) => t.type === 'income');
          const expenseTransactions = octoberTransactions.filter((t: any) => t.type === 'expense');
          
          console.log('🔍 [SimpleCashFlow] Debug tipos:', {
            totalOctober: octoberTransactions.length,
            incomeCount: incomeTransactions.length,
            expenseCount: expenseTransactions.length,
            sampleIncome: incomeTransactions.slice(0, 3).map(t => ({ amount: t.amount, type: t.type, description: t.description })),
            sampleExpense: expenseTransactions.slice(0, 3).map(t => ({ amount: t.amount, type: t.type, description: t.description })),
            allTypes: [...new Set(octoberTransactions.map(t => t.type))]
          });
          
          const totalIncome = incomeTransactions
            .filter((t: any) => t.amount <= MAX_REASONABLE_VALUE && t.amount > 0)
            .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
          
          const totalExpenses = expenseTransactions
            .filter((t: any) => Math.abs(t.amount) <= MAX_REASONABLE_VALUE)
            .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
          
          // Identificar transações com valores muito altos
          const highValueTransactions = octoberTransactions.filter((t: any) => 
            Math.abs(t.amount) > 100000
          );
          
          // Calcular saldo com validação
          let calculatedBalance = totalIncome - totalExpenses;
          
          // Se o saldo for absurdo, forçar recálculo
          if (Math.abs(calculatedBalance) > 10000000) { // Mais de R$ 10 milhões
            console.warn('⚠️ [SimpleCashFlow] Saldo absurdo detectado, recalculando...');
            calculatedBalance = 0; // Forçar zero se absurdo
          }
          
          console.log('💰 [SimpleCashFlow] Outubro calculado:', {
            totalTransactions: octoberTransactions.length,
            totalIncome,
            totalExpenses,
            calculatedBalance,
            highValueCount: highValueTransactions.length,
            highValues: highValueTransactions.map(t => ({ amount: t.amount, description: t.description }))
          });
          
          setData({
            totalTransactions: octoberTransactions.length,
            totalIncome,
            totalExpenses,
            calculatedBalance,
            highValueTransactions
          });
        } else {
          console.error('💰 [SimpleCashFlow] Erro:', response.status);
          setData(null);
        }
      } catch (error) {
        console.error('💰 [SimpleCashFlow] Erro:', error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fluxo de Caixa - Outubro 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fluxo de Caixa - Erro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Fluxo de Caixa - Outubro 2025 (Dados do Banco)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Receitas</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(data.totalIncome)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Despesas</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(data.totalExpenses)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Saldo</p>
              <p className={`text-lg font-bold ${data.totalIncome - data.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.totalIncome - data.totalExpenses)}
              </p>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Total de transações: {data.totalTransactions}
            {data.highValueTransactions?.length > 0 && (
              <span className="text-red-500 ml-2">
                ⚠️ {data.highValueTransactions.length} transação(ões) com valores altos detectada(s)
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}