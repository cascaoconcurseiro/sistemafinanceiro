'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { usePeriod } from '@/contexts/period-context';

import { useMemo, memo } from 'react';
import { formatCurrency } from '@/lib/utils/format-currency';

// ✅ Helper para calcular o valor correto de uma transação
// Se EU paguei uma despesa compartilhada, mostrar o valor TOTAL
// Se OUTRO pagou, mostrar apenas minha parte (myShare)
const getTransactionAmount = (transaction: any): number => {
  const amount = Math.abs(transaction.amount);
  
  console.log('💰 [getTransactionAmount] Calculando valor:', {
    id: transaction.id,
    description: transaction.description,
    amount: transaction.amount,
    isShared: transaction.isShared,
    myShare: transaction.myShare,
    status: transaction.status
  });
  
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

// Card de Saldo Total
export const TotalBalanceCard = memo(function TotalBalanceCard() {
  const { data, isLoading } = useUnifiedFinancial();
  const { accounts, transactions, balances } = data || {};

  // Extract accounts and transactions data from the query structure
  const accountsData = accounts || [];
  const transactionsData = transactions || [];

  // Use balances from API (calculated server-side)
  const totalBalance = balances?.totalBalance || 0;

  if (isLoading) {
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
        <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {totalBalance >= 0 ? '+' : ''}{formatCurrency(totalBalance)}
        </div>
        {totalBalance < 0 && (
          <div className="text-xs text-red-600 mt-2 font-semibold">
            ⚠️ Patrimônio negativo
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-2">
          {accountsData.filter(a => a.type === 'ATIVO' || a.type === 'PASSIVO').length} conta(s) ativa(s)
        </div>
      </CardContent>
    </Card>
  );
});

// Card de Resultado Mensal (Saldo do Mês)
export const MonthlyResultCard = memo(function MonthlyResultCard() {
  const { data, isLoading } = useUnifiedFinancial();
  const { transactions } = data || {};

  // Extract transactions data from the query structure
  const transactionsData = transactions || [];

  // Os dados são atualizados automaticamente pelo contexto unificado

  const monthlyResult = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyTransactions = transactionsData.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getMonth() === currentMonth && 
             transDate.getFullYear() === currentYear;
    });
    
    // ✅ CORREÇÃO: Usar helper que considera quem pagou
    const income = monthlyTransactions
      .filter(t => t.type === 'income' || t.type === 'RECEITA')
      .reduce((sum, t) => sum + getTransactionAmount(t), 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense' || t.type === 'DESPESA')
      .reduce((sum, t) => sum + getTransactionAmount(t), 0);
    
    return income - expenses;
  }, [transactionsData]);

  if (isLoading) {
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
});



// Card de Receitas do Mês
export const MonthlyIncomeCard = memo(function MonthlyIncomeCard() {
  const { data, isLoading } = useUnifiedFinancial();
  const { transactions } = data || {};
  const { selectedMonth, selectedYear, getMonthName } = usePeriod();

  // Extract transactions data from the query structure
  const transactionsData = transactions || [];

  const monthlyIncome = useMemo(() => {
    console.log('💰 [MonthlyIncome] Calculando receitas:', {
      totalTransactions: transactionsData.length,
      selectedMonth,
      selectedYear
    });
    
    return transactionsData
      .filter(t => {
        const transDate = new Date(t.date);
        // ✅ CORREÇÃO: Aceitar ambos os formatos
        return (t.type === 'income' || t.type === 'RECEITA') && 
               transDate.getMonth() === selectedMonth && 
               transDate.getFullYear() === selectedYear;
      })
      .reduce((sum, t) => sum + getTransactionAmount(t), 0);
  }, [transactionsData, selectedMonth, selectedYear]);

  if (isLoading) {
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

  const monthName = getMonthName();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Receitas de {monthName}</CardTitle>
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
});

// Card de Despesas do Mês
export const MonthlyExpensesCard = memo(function MonthlyExpensesCard() {
  const { data, isLoading } = useUnifiedFinancial();
  const { transactions } = data || {};
  const { selectedMonth, selectedYear, getMonthName } = usePeriod();

  // Extract transactions data from the query structure
  const transactionsData = transactions || [];

  const monthlyExpenses = useMemo(() => {
    const filtered = transactionsData
      .filter(t => {
        const transDate = new Date(t.date);
        // ✅ CORREÇÃO: Aceitar ambos os formatos
        const isExpense = t.type === 'expense' || t.type === 'DESPESA';
        const isInPeriod = transDate.getMonth() === selectedMonth && 
                          transDate.getFullYear() === selectedYear;
        
        // Debug: Log transações de despesa
        if (isExpense && isInPeriod) {
          console.log('💰 [MonthlyExpenses] Transação encontrada:', {
            id: t.id,
            description: t.description,
            amount: t.amount,
            type: t.type,
            status: t.status,
            date: t.date
          });
        }
        
        return isExpense && isInPeriod;
      });
    
    const total = filtered.reduce((sum, t) => sum + getTransactionAmount(t), 0);
    
    console.log('💰 [MonthlyExpenses] Total calculado:', {
      totalTransactions: transactionsData.length,
      filteredCount: filtered.length,
      total
    });
    
    return total;
  }, [transactionsData, selectedMonth, selectedYear]);

  if (isLoading) {
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

  const monthName = getMonthName();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Despesas de {monthName}</CardTitle>
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
});

// Card de Taxa de Poupança
export const SavingsRateCard = memo(function SavingsRateCard() {
  const { data, isLoading } = useUnifiedFinancial();
  const { transactions } = data || {};
  const { selectedMonth, selectedYear } = usePeriod();

  // Extract transactions data from the query structure
  const transactionsData = transactions || [];

  const savingsRate = useMemo(() => {
    const monthlyTransactions = transactionsData.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getMonth() === selectedMonth && 
             transDate.getFullYear() === selectedYear;
    });
    
    // ✅ CORREÇÃO: Aceitar ambos os formatos
    const income = monthlyTransactions
      .filter(t => t.type === 'income' || t.type === 'RECEITA')
      .reduce((sum, t) => {
        // ✅ CORREÇÃO: Usar myShare para transações compartilhadas
        const amount = (t.isShared && t.myShare) ? Math.abs(Number(t.myShare)) : Math.abs(t.amount);
        return sum + amount;
      }, 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense' || t.type === 'DESPESA')
      .reduce((sum, t) => {
        // ✅ CORREÇÃO: Usar myShare para transações compartilhadas
        const amount = (t.isShared && t.myShare) ? Math.abs(Number(t.myShare)) : Math.abs(t.amount);
        return sum + amount;
      }, 0);
    
    return income > 0 ? ((income - expenses) / income) * 100 : 0;
  }, [transactionsData, selectedMonth, selectedYear]);

  if (isLoading) {
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
});

// Card de Valor de Investimentos
export const InvestmentValueCard = memo(function InvestmentValueCard() {
  const { data, isLoading } = useUnifiedFinancial();
  const { accounts } = data || {};
  
  const accountsData = accounts || [];

  const investmentValue = useMemo(() => {
    return accountsData
      .filter(a => a.type === 'investment')
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accountsData]);

  if (isLoading) {
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
});

// Componente principal que agrupa todos os cards granulares
export function GranularCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <TotalBalanceCard />
      <MonthlyIncomeCard />
      <MonthlyExpensesCard />
      <SavingsRateCard />
    </div>
  );
}
