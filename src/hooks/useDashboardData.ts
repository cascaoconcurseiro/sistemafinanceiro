/**
 * 🔒 HOOK WRAPPER - useDashboardData
 * 
 * REGRA: Este hook é apenas um wrapper fino para useUnified.
 * PROIBIDO: Qualquer cálculo direto de valores financeiros.
 * OBRIGATÓRIO: Todos os dados devem vir do useUnified.
 */

import { useMemo } from 'react';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';

export interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  goalsProgress: number;
  recentTransactions: any[];
  accountsSummary: any[];
  expensesByCategory: Record<string, { amount: number; percentage: number; color: string }>;
  incomeVsExpenses: {
    labels: string[];
    income: number[];
    expenses: number[];
  };
  netWorthTrend: {
    labels: string[];
    values: number[];
  };
}

export const useDashboardData = (): DashboardData => {
  const { accounts, transactions, goals, balances, isLoading, error } = useUnifiedFinancial();

  return useMemo(() => {
    // 🔒 TRATAMENTO DE ERROS
    if (error) {
      console.error('Erro no useDashboardData:', error);
      // Retornar dados padrão em caso de erro
      return {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyBalance: 0,
        goalsProgress: 0,
        recentTransactions: [],
        accountsSummary: [],
        expensesByCategory: {},
        incomeVsExpenses: { labels: [], income: [], expenses: [] },
        netWorthTrend: { labels: [], values: [] }
      };
    }

    // 🔒 USAR DADOS PRÉ-CALCULADOS DO USEUNIFIED
    const totalBalance = balances?.totalBalance || 0;
    const monthlyIncome = balances?.monthlyIncome || 0;
    const monthlyExpenses = balances?.monthlyExpenses || 0;
    const monthlyBalance = balances?.monthlyBalance || 0;

    // 🔒 USAR DADOS PRÉ-CALCULADOS PARA METAS
    const goalsProgress = balances?.goalsProgress || 0;

    // 🔒 TRANSAÇÕES RECENTES (SEM CÁLCULOS)
    const recentTransactions = transactions
      ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10) || [];

    // 🔒 RESUMO DE CONTAS (USANDO BALANCES DO USEUNIFIED)
    const accountsSummary = accounts?.map(account => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: balances?.accountBalances?.[account.id] || account.balance || 0,
      color: '#3B82F6'
    })) || [];

    // 🔒 CONVERTER DADOS PRÉ-CALCULADOS PARA FORMATO ESPERADO
    const expensesByCategory: Record<string, { amount: number; percentage: number; color: string }> = {};
    
    if (balances?.topExpenseCategories) {
      balances.topExpenseCategories.forEach(category => {
        expensesByCategory[category.category] = {
          amount: category.amount,
          percentage: category.percentage,
          color: category.color
        };
      });
    }

    // 🔒 USAR DADOS PRÉ-CALCULADOS PARA TENDÊNCIAS
    const incomeVsExpenses = balances?.incomeVsExpenses || {
      labels: [],
      income: [],
      expenses: []
    };

    const netWorthTrend = balances?.netWorthTrend || {
      labels: [],
      values: []
    };

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance,
      goalsProgress,
      recentTransactions,
      accountsSummary,
      expensesByCategory,
      incomeVsExpenses,
      netWorthTrend
    };
  }, [accounts, transactions, goals, balances, error]);
};

/**
 * 🔒 HOOK WRAPPER - useFinancialSummary
 * 
 * REGRA: Este hook é apenas um wrapper fino para useUnified.
 * PROIBIDO: Qualquer cálculo direto de valores financeiros.
 * OBRIGATÓRIO: Todos os dados devem vir do useUnified.
 */
export const useFinancialSummary = () => {
  const { accounts, transactions, balances, error } = useUnifiedFinancial();

  return useMemo(() => {
    // 🔒 TRATAMENTO DE ERROS
    if (error) {
      console.error('Erro no useFinancialSummary:', error);
      return {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyBalance: 0,
        incomeGrowth: 0,
        expenseGrowth: 0,
        balanceGrowth: 0,
        incomeGrowthPercent: 0,
        expenseGrowthPercent: 0,
        accountsCount: 0,
        transactionsCount: 0
      };
    }

    // 🔒 USAR DADOS PRÉ-CALCULADOS DO USEUNIFIED
    const totalBalance = balances?.totalBalance || 0;
    const monthlyIncome = balances?.monthlyIncome || 0;
    const monthlyExpenses = balances?.monthlyExpenses || 0;
    const monthlyBalance = balances?.monthlyBalance || 0;
    
    // 🔒 DADOS DE CRESCIMENTO (por enquanto zerados - podem ser implementados no Finance Engine)
    const incomeGrowth = 0;
    const expenseGrowth = 0;
    const balanceGrowth = 0;
    const incomeGrowthPercent = 0;
    const expenseGrowthPercent = 0;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance,
      incomeGrowth,
      expenseGrowth,
      balanceGrowth,
      incomeGrowthPercent,
      expenseGrowthPercent,
      accountsCount: accounts?.length || 0,
      transactionsCount: transactions?.length || 0
    };
  }, [accounts, transactions, balances, error]);
};

/**
 * 🔒 HOOK WRAPPER - useCashFlowProjection
 * 
 * REGRA: Este hook é apenas um wrapper fino para useUnified.
 * PROIBIDO: Qualquer cálculo direto de valores financeiros.
 * OBRIGATÓRIO: Todos os dados devem vir do useUnified.
 */
export const useCashFlowProjection = (months: number = 12) => {
  const { balances, error } = useUnifiedFinancial();

  return useMemo(() => {
    // 🔒 TRATAMENTO DE ERROS
    if (error) {
      console.error('Erro no useCashFlowProjection:', error);
      return [];
    }

    // 🔒 USAR DADOS PRÉ-CALCULADOS DO USEUNIFIED
    return balances?.cashFlowProjection || [];
  }, [balances, error]);
};

/**
 * 🔒 HOOK WRAPPER - useTopExpenseCategories
 * 
 * REGRA: Este hook é apenas um wrapper fino para useUnified.
 * PROIBIDO: Qualquer cálculo direto de valores financeiros.
 * OBRIGATÓRIO: Todos os dados devem vir do useUnified.
 */
export const useTopExpenseCategories = (limit: number = 5) => {
  const { balances, error } = useUnifiedFinancial();

  return useMemo(() => {
    // 🔒 TRATAMENTO DE ERROS
    if (error) {
      console.error('Erro no useTopExpenseCategories:', error);
      return [];
    }

    // 🔒 USAR DADOS PRÉ-CALCULADOS DO USEUNIFIED
    const topCategories = balances?.topExpenseCategories || [];
    return topCategories.slice(0, limit);
  }, [balances, limit, error]);
};
