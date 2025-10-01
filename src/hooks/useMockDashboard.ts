'use client';

import { useState, useEffect } from 'react';
import { useUnified } from '@/contexts/unified-context-simple';
import { useFinancialMetrics } from '@/hooks/use-reports';

// Categorias básicas para o sistema
const basicCategories = [
  { id: '1', name: 'Alimentação', type: 'expense' as const, color: '#FF6B6B' },
  { id: '2', name: 'Transporte', type: 'expense' as const, color: '#4ECDC4' },
  { id: '3', name: 'Moradia', type: 'expense' as const, color: '#45B7D1' },
  { id: '4', name: 'Saúde', type: 'expense' as const, color: '#96CEB4' },
  { id: '5', name: 'Educação', type: 'expense' as const, color: '#FFEAA7' },
  { id: '6', name: 'Lazer', type: 'expense' as const, color: '#DDA0DD' },
  { id: '7', name: 'Salário', type: 'income' as const, color: '#98D8C8' },
  { id: '8', name: 'Freelance', type: 'income' as const, color: '#F7DC6F' },
  { id: '9', name: 'Investimentos', type: 'income' as const, color: '#BB8FCE' },
  { id: '10', name: 'Outros', type: 'both' as const, color: '#85C1E9' }
];

// Funções utilitárias básicas
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
};

const getTopExpenseCategories = (transactions: any[], limit = 5) => {
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

  return Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([category, amount]) => ({ category, amount }));
};

// Hook principal para dados do dashboard - agora usando useUnified
export const useMockDashboard = () => {
  const { transactions, accounts, balances, loading, error } = useUnified();
  const financialMetrics = useFinancialMetrics();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento para manter compatibilidade
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 🔒 TRATAMENTO DE ERROS
  if (error) {
    console.error('Erro no useMockDashboard:', error);
    return {
      data: {
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
      },
      isLoading: false,
      error
    };
  }

  // 🔒 USAR DADOS PRÉ-CALCULADOS DO useUnified
  const totalBalance = balances?.totalBalance || 0;
  const monthlyIncome = balances?.monthlyIncome || 0;
  const monthlyExpenses = balances?.monthlyExpenses || 0;
  const monthlyBalance = balances?.monthlyBalance || (monthlyIncome - monthlyExpenses);
  const goalsProgress = balances?.goalsProgress || 0;
  const recentTransactions = transactions?.slice(-10) || []; // Últimas 10 transações
  
  // Mapear dados para o formato esperado pelo dashboard
  const data = {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyBalance,
    goalsProgress,
    recentTransactions,
    accountsSummary: accounts?.map(account => ({
      ...account,
      balance: balances?.accountBalances?.[account.id] || 0
    })) || [],
    expensesByCategory: balances?.expensesByCategory || {},
    incomeVsExpenses: balances?.incomeVsExpenses || {
      labels: [],
      income: [],
      expenses: []
    },
    netWorthTrend: balances?.netWorthTrend || {
      labels: [],
      values: []
    }
  };

  return {
    data,
    isLoading: loading || isLoading,
    error
  };
};

// Hook para métricas de patrimônio - usando useUnified
export const usePatrimonio = () => {
  const { accounts, balances } = useUnified();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const totalBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0);

  const data = {
    totalBalance,
    totalAccounts: accounts.length,
    netWorth: totalBalance
  };

  return {
    data,
    isLoading,
    error: null
  };
};

// Hook para fluxo de caixa - usando useUnified
export const useFluxoCaixa = () => {
  const { balances, error } = useUnified();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // 🔒 TRATAMENTO DE ERROS
  if (error) {
    console.error('Erro no useFluxoCaixa:', error);
    return {
      data: {
        currentMonth: { income: 0, expenses: 0, balance: 0 },
        projection: [],
        incomeVsExpenses: { labels: [], income: [], expenses: [] }
      },
      isLoading: false,
      error
    };
  }

  // 🔒 USAR DADOS PRÉ-CALCULADOS DO useUnified
  const data = {
    currentMonth: {
      income: balances?.monthlyIncome || 0,
      expenses: balances?.monthlyExpenses || 0,
      balance: balances?.monthlyBalance || 0
    },
    projection: balances?.cashFlowProjection || [],
    incomeVsExpenses: balances?.incomeVsExpenses || {
      labels: [],
      income: [],
      expenses: []
    }
  };

  return {
    data,
    isLoading,
    error: null
  };
};

// Hook para metas - usando contexto unificado
export const useMetas = () => {
  const { balances, error } = useUnified();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  // 🔒 TRATAMENTO DE ERROS
  if (error) {
    console.error('Erro no useMetas:', error);
    return {
      data: {
        goals: [],
        totalGoals: 0,
        activeGoals: 0,
        progress: 0,
        totalSaved: 0,
        totalTarget: 0
      },
      isLoading: false,
      error
    };
  }

  // 🔒 USAR DADOS PRÉ-CALCULADOS DO useUnified
  const data = {
    goals: balances?.goals || [],
    totalGoals: balances?.totalGoals || 0,
    activeGoals: balances?.activeGoals || 0,
    progress: balances?.goalsProgress || 0,
    totalSaved: balances?.totalGoalsProgress || 0,
    totalTarget: balances?.totalGoalsTarget || 0
  };

  return {
    data,
    isLoading,
    error: null
  };
};

// Hook para investimentos - usando contexto unificado
export const useInvestimentos = () => {
  const { balances, error } = useUnified();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // 🔒 TRATAMENTO DE ERROS
  if (error) {
    console.error('Erro no useInvestimentos:', error);
    return {
      data: {
        investments: [],
        totalValue: 0,
        performance: [],
        totalInvestments: 0,
        monthlyReturn: 0
      },
      isLoading: false,
      error
    };
  }

  // 🔒 USAR DADOS PRÉ-CALCULADOS DO useUnified
  const data = {
    investments: balances?.investments || [],
    totalValue: balances?.totalInvestments || 0,
    performance: balances?.investmentPerformance || [],
    totalInvestments: balances?.totalInvestmentsCount || 0,
    monthlyReturn: balances?.monthlyInvestmentReturn || 0
  };

  return {
    data,
    isLoading,
    error: null
  };
};

// Hook para contas - usando contexto unificado
export const useContas = () => {
  const { balances, error } = useUnified();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // 🔒 TRATAMENTO DE ERROS
  if (error) {
    console.error('Erro no useContas:', error);
    return {
      data: {
        accounts: [],
        totalBalance: 0,
        accountsByType: {},
        activeAccounts: 0
      },
      isLoading: false,
      error
    };
  }

  // 🔒 USAR DADOS PRÉ-CALCULADOS DO useUnified
  const data = {
    accounts: balances?.accounts || [],
    totalBalance: balances?.totalBalance || 0,
    accountsByType: balances?.accountsByType || {},
    activeAccounts: balances?.activeAccounts || 0
  };

  return {
    data,
    isLoading,
    error: null
  };
};

// Hook para categorias
// Hook para categorias - usando contexto unificado
export const useCategorias = () => {
  const { balances, error } = useUnified();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 280);

    return () => clearTimeout(timer);
  }, []);

  // 🔒 TRATAMENTO DE ERROS
  if (error) {
    console.error('Erro no useCategorias:', error);
    return {
      data: {
        categories: [],
        topExpenses: [],
        totalCategories: 0,
        expensesByCategory: []
      },
      isLoading: false,
      error
    };
  }

  // 🔒 USAR DADOS PRÉ-CALCULADOS DO useUnified
  const data = {
    categories: balances?.categories || [],
    topExpenses: balances?.topExpenseCategories || [],
    totalCategories: balances?.totalCategories || 0,
    expensesByCategory: balances?.expensesByCategory || []
  };

  return {
    data,
    isLoading,
    error: null
  };
};

// Hook para transações - usando contexto unificado
export const useTransacoes = () => {
  const { balances, error } = useUnified();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 320);

    return () => clearTimeout(timer);
  }, []);

  // 🔒 TRATAMENTO DE ERROS
  if (error) {
    console.error('Erro no useTransacoes:', error);
    return {
      data: {
        transactions: [],
        recentTransactions: [],
        monthlyTransactions: [],
        totalTransactions: 0
      },
      isLoading: false,
      error
    };
  }

  // 🔒 USAR DADOS PRÉ-CALCULADOS DO useUnified
  const data = {
    transactions: balances?.transactions || [],
    recentTransactions: balances?.recentTransactions || [],
    monthlyTransactions: balances?.monthlyTransactions || [],
    totalTransactions: balances?.totalTransactions || 0
  };

  return {
    data,
    isLoading,
    error: null
  };
};

// Hook principal que retorna todos os hooks específicos
export const useDashboard = () => {
  return {
    useFluxoCaixa,
    usePatrimonio,
    useMetas,
    useInvestimentos,
    useContas,
    useCategorias,
    useTransacoes,
    useDashboardData: useMockDashboard
  };
};

// Utilitários
export const useFormatters = () => {
  return {
    formatCurrency,
    formatDate,
    formatPercentage: (value: number) => `${value.toFixed(1)}%`
  };
};
