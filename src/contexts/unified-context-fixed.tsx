'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { eventBus } from '@/lib/events/event-bus';
import { Transaction, Account, Goal, Contact, Trip, Investment, SharedDebt } from '@/types';
import { getRelatorioMensal, getResumoCategorias } from '@/core/finance-engine';

// Tipos básicos
interface UnifiedState {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  contacts: Contact[];
  trips: Trip[];
  investments: Investment[];
  sharedDebts: SharedDebt[];
  isLoading: boolean;
  errors: Record<string, string>;
  resourceLoading: Record<string, boolean>;
  isOnline: boolean;
}

// Estado inicial
const initialState: UnifiedState = {
  transactions: [],
  accounts: [],
  goals: [],
  contacts: [],
  trips: [],
  investments: [],
  sharedDebts: [],
  isLoading: false,
  errors: {},
  resourceLoading: {},
  isOnline: true,
};

// Action types
type UnifiedAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { resource: string; error: string } }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: string }
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'SET_TRIPS'; payload: Trip[] }
  | { type: 'SET_INVESTMENTS'; payload: Investment[] }
  | { type: 'SET_SHARED_DEBTS'; payload: SharedDebt[] }
  | { type: 'CLEAR_ERROR'; payload: string };

// Reducer simples
function unifiedReducer(state: UnifiedState, action: UnifiedAction): UnifiedState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_TRANSACTIONS':
      console.log('🔍 REDUCER SET_TRANSACTIONS - Payload recebido:', action.payload);
      console.log('🔍 REDUCER SET_TRANSACTIONS - Quantidade:', action.payload?.length || 0);
      return { ...state, transactions: action.payload || [] };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload || [] };
    case 'SET_GOALS':
      return { ...state, goals: action.payload || [] };
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload || [] };
    case 'SET_TRIPS':
      return { ...state, trips: action.payload || [] };
    case 'SET_INVESTMENTS':
      return { ...state, investments: action.payload || [] };
    case 'SET_SHARED_DEBTS':
      return { ...state, sharedDebts: action.payload || [] };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
      };
    case 'REMOVE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload)
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.resource]: action.payload.error }
      };
    case 'CLEAR_ERROR':
      const { [action.payload]: _, ...remainingErrors } = state.errors;
      return { ...state, errors: remainingErrors };
    default:
      return state;
  }
}

// Context
interface UnifiedContextType {
  state: UnifiedState;
  dispatch: React.Dispatch<UnifiedAction>;
  dashboardData: any;
  dashboardLoading: boolean;
  actions: {
    refreshData: () => Promise<void>;
    addTransaction: (transactionData: any) => Promise<any>;
    updateTransaction: (id: string, updateData: any) => Promise<any>;
    removeTransaction: (id: string) => Promise<void>;
  };
}

const UnifiedContext = createContext<UnifiedContextType | undefined>(undefined);

// Provider
export function UnifiedProvider({ children }: { children: ReactNode }) {
  console.log('🔍 UNIFIED PROVIDER INICIANDO - Antes do useReducer');
  
  const [state, dispatch] = useReducer(unifiedReducer, initialState);
  
  console.log('🔍 UNIFIED PROVIDER RENDERIZADO - Estado atual:', {
    transactionsLength: state.transactions?.length || 0,
    accountsLength: state.accounts?.length || 0,
    isLoading: state.isLoading
  });

  console.log('🔍 ANTES DOS USEEFFECTS - Prestes a definir useEffects');

  // useEffect simples para teste
  useEffect(() => {
    console.log('🔍 TESTE SIMPLES - useEffect executado!');
  }, []);

  console.log('🔍 APÓS PRIMEIRO USEEFFECT - useEffect simples definido');

  // useEffect de inicialização
  useEffect(() => {
    console.log('🔍 USE EFFECT EXECUTADO - typeof window:', typeof window);
    
    if (typeof window === 'undefined') {
      console.log('🔍 SKIPPING INIT - Server side rendering');
      return;
    }
    
    console.log('🔍 INICIANDO CARREGAMENTO DE DADOS...');
    
    const initializeData = async () => {
      try {
        console.log('🔍 DENTRO DA FUNÇÃO initializeData');
        dispatch({ type: 'SET_LOADING', payload: true });

        console.log('🔄 Inicializando dados via API...');

        // Load transactions
        const transactionsResponse = await fetch('/api/transactions');
        const transactions = transactionsResponse.ok ? await transactionsResponse.json() : [];
        console.log('💰 TRANSACTIONS CARREGADAS:', transactions);

        // Load accounts
        const accountsResponse = await fetch('/api/accounts');
        const accounts = accountsResponse.ok ? await accountsResponse.json() : [];
        console.log('📊 ACCOUNTS CARREGADAS:', accounts);

        // Load goals
        const goalsResponse = await fetch('/api/goals');
        const goals = goalsResponse.ok ? await goalsResponse.json() : [];
        console.log('🎯 GOALS CARREGADAS:', goals);

        // Dispatch data
        console.log('🔍 ANTES DO DISPATCH - Transações a serem enviadas:', transactions);
        dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
        dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
        dispatch({ type: 'SET_GOALS', payload: goals });
        dispatch({ type: 'SET_CONTACTS', payload: [] });
        dispatch({ type: 'SET_TRIPS', payload: [] });
        dispatch({ type: 'SET_INVESTMENTS', payload: [] });
        dispatch({ type: 'SET_SHARED_DEBTS', payload: [] });

        console.log('✅ Dados carregados via API:', {
          accounts: accounts.length,
          transactions: transactions.length,
          goals: goals.length
        });

      } catch (error) {
        console.error('❌ Error initializing data:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: { resource: 'initialization', error: error instanceof Error ? error.message : 'Unknown error' },
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    console.log('🔍 CHAMANDO initializeData()...');
    initializeData().catch(error => {
      console.error('❌ ERRO FATAL na initializeData:', error);
    });
  }, []);

  console.log('🔍 APÓS SEGUNDO USEEFFECT - useEffect de inicialização definido');

  // Estados para dados do dashboard
  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = React.useState(false);

  // Carregar dados do dashboard da API
  const loadDashboardData = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      setDashboardLoading(true);
      console.log('🔄 CARREGANDO DADOS DO DASHBOARD DA API...');
      
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error(`Dashboard API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ DADOS DO DASHBOARD CARREGADOS COM SUCESSO:', data);
      console.log('✅ categoryBreakdown:', data.categoryBreakdown);
      console.log('✅ totalExpenses:', data.totalExpenses);
      setDashboardData(data);
    } catch (error) {
      console.error('❌ ERRO AO CARREGAR DASHBOARD:', error);
      // Fallback para cálculos locais em caso de erro
      setDashboardData(null);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Actions
  const actions = useMemo(() => ({
    refreshData: async () => {
      console.log('🔄 Refreshing data...');
      // Recarregar dados do dashboard
      await loadDashboardData();
    },
    addTransaction: async (transactionData: any) => {
      console.log('➕ Adding transaction:', transactionData);
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to create transaction');
        }
        
        const newTransaction = await response.json();
        dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
        
        // Recarregar dados do dashboard após adicionar transação
        console.log('🔄 Recarregando dashboard após adicionar transação');
        await loadDashboardData();
        
        return newTransaction;
      } catch (error) {
        console.error('❌ Error adding transaction:', error);
        throw error;
      }
    },
    updateTransaction: async (id: string, updateData: any) => {
      console.log('✏️ Updating transaction:', id, updateData);
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to update transaction');
        }
        
        const updatedTransaction = await response.json();
        dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
        
        // Recarregar dados do dashboard após atualizar transação
        console.log('🔄 Recarregando dashboard após atualizar transação');
        await loadDashboardData();
        
        return updatedTransaction;
      } catch (error) {
        console.error('❌ Error updating transaction:', error);
        throw error;
      }
    },
    removeTransaction: async (id: string) => {
      console.log('🗑️ Removing transaction:', id);
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete transaction');
        }
        
        dispatch({ type: 'REMOVE_TRANSACTION', payload: id });
        
        // Recarregar dados do dashboard após remover transação
        console.log('🔄 Recarregando dashboard após remover transação');
        await loadDashboardData();
        
        return { success: true };
      } catch (error) {
        console.error('❌ Error removing transaction:', error);
        throw error;
      }
    }
  }), [loadDashboardData]);

  // Carregar dados do dashboard após inicialização e quando necessário
  useEffect(() => {
    // Carregar dados do dashboard sempre que o componente for montado
    // ou quando as transações mudarem
    loadDashboardData();
  }, [loadDashboardData]);

  // Recarregar dashboard quando transações mudarem
  useEffect(() => {
    if (state.transactions.length > 0) {
      console.log('🔄 Transações mudaram, recarregando dashboard...');
      loadDashboardData();
    }
  }, [state.transactions.length, loadDashboardData]);

  const contextValue = useMemo(() => {
    console.log('🔍 CRIANDO CONTEXT VALUE:');
    console.log('  - state.transactions.length:', state.transactions.length);
    console.log('  - dashboardData:', dashboardData);
    console.log('  - dashboardLoading:', dashboardLoading);
    
    return {
      state,
      dispatch,
      actions,
      dashboardData,
      dashboardLoading
    };
  }, [state, actions, dashboardData, dashboardLoading]);

  console.log('🔍 ANTES DO RETURN - Prestes a retornar JSX');

  return (
    <UnifiedContext.Provider value={contextValue}>
      {children}
    </UnifiedContext.Provider>
  );
}

// Hook
export function useUnified() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useUnified must be used within a UnifiedProvider');
  }
  
  // Utilitários de data
  const dateUtils = {
    getCurrentMonth: () => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    },
    getPreviousMonth: () => {
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    },
    formatMonth: (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  };



  // Dados derivados - usar API quando disponível, senão calcular localmente
  const balances = useMemo(() => {
    console.log('🔍 CALCULANDO BALANCES - Dashboard API:', !!context.dashboardData);
    
    // Se temos dados da API do dashboard, usar eles
    if (context.dashboardData) {
      console.log('✅ USANDO DADOS DA API DO DASHBOARD');
      return {
        totalBalance: context.dashboardData.totalBalance || 0,
        totalIncome: context.dashboardData.totalIncome || 0,
        totalExpenses: context.dashboardData.totalExpenses || 0,
        netIncome: context.dashboardData.netIncome || 0,
        accountBalances: context.dashboardData.accountBalances || {},
        categoryBreakdown: context.dashboardData.categoryBreakdown || {},
        monthlyTrends: context.dashboardData.trends || [],
        recentTransactions: context.dashboardData.recentTransactions || [],
        categoryAnalysis: context.dashboardData.categoryBreakdown ? 
          Object.entries(context.dashboardData.categoryBreakdown).map(([name, amount]) => ({
            name,
            amount: amount as number,
            percentage: context.dashboardData.totalExpenses > 0 ? 
              ((amount as number) / context.dashboardData.totalExpenses) * 100 : 0
          })) : [],
        monthlyMetrics: {
          current: {
            income: context.dashboardData.totalIncome,
            expenses: context.dashboardData.totalExpenses,
            balance: context.dashboardData.netIncome
          },
          categories: context.dashboardData.categoryBreakdown
        },
        accountMetrics: {},
        categoryMetrics: context.dashboardData.categoryBreakdown || {},
        transfers: [],
        installments: [],
        creditCardBills: []
      };
    }

    // Fallback para cálculos locais
    console.log('⚠️ USANDO CÁLCULOS LOCAIS - Transações:', context.state.transactions?.length || 0);
    
    if (!context.state.transactions || !Array.isArray(context.state.transactions)) {
      console.log('⚠️ BALANCES - Transações inválidas ou vazias');
      return {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        accountBalances: {},
        categoryBreakdown: {},
        monthlyTrends: [],
        recentTransactions: [],
        categoryAnalysis: [],
        monthlyMetrics: { current: null, categories: null },
        accountMetrics: {},
        categoryMetrics: {},
        transfers: [],
        installments: [],
        creditCardBills: []
      };
    }

    const transactions = Array.isArray(context.state.transactions) ? context.state.transactions : [];
    const accounts = Array.isArray(context.state.accounts) ? context.state.accounts : [];
    
    console.log('🔍 CALCULANDO BALANCES LOCALMENTE - Dados válidos:', {
      transactionsCount: transactions.length,
      accountsCount: accounts.length,
      transactionsIsArray: Array.isArray(transactions),
      accountsIsArray: Array.isArray(accounts)
    });

    // Calcular métricas globais diretamente
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Obter relatório do mês atual - calcular diretamente
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Definir relatorioMensal e resumoCategorias antes de usar
    const relatorioMensal = getRelatorioMensal(currentMonth, transactions, accounts);
    const resumoCategorias = getResumoCategorias(transactions);
    
    const currentMonthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === now.getFullYear() && 
             tDate.getMonth() === now.getMonth();
    });
    
    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calcular saldos por conta
    const accountBalances: { [accountId: string]: number } = {};
    accounts.forEach(account => {
      accountBalances[account.id] = account.balance || 0;
    });

    // Calcular breakdown por categoria
    const categoryBreakdown: { [category: string]: number } = {};
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const category = transaction.category || 'Outros';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(transaction.amount);
      }
    });

    // Calcular tendências mensais (últimos 6 meses)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === date.getFullYear() && tDate.getMonth() === date.getMonth();
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      monthlyTrends.push({
        month: monthKey,
        income,
        expenses,
        balance: income - expenses
      });
    }

    // Transações recentes (últimas 10)
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Calcular métricas por conta
    const accountMetrics: { [accountId: string]: any } = {};
    accounts.forEach(account => {
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      const income = accountTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const expenses = accountTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      accountMetrics[account.id] = {
        balance: account.balance || 0,
        income,
        expenses,
        transactionCount: accountTransactions.length
      };
    });

    // Calcular métricas por categoria
    const categoryMetrics: { [category: string]: any } = {};
    Object.keys(categoryBreakdown).forEach(category => {
      const categoryTransactions = transactions.filter(t => t.category === category);
      categoryMetrics[category] = {
        total: categoryBreakdown[category],
        transactionCount: categoryTransactions.length,
        averageAmount: categoryTransactions.length > 0 
          ? categoryBreakdown[category] / categoryTransactions.length 
          : 0
      };
    });

    console.log('✅ BALANCES CALCULADOS LOCALMENTE:', {
      totalBalance: totalBalance,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      netIncome: totalIncome - totalExpenses,
      categoriesCount: Object.keys(categoryBreakdown).length,
      trendsCount: monthlyTrends.length,
      recentCount: recentTransactions.length
    });

    return {
      // Métricas principais
      totalBalance: totalBalance,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      netIncome: totalIncome - totalExpenses,
      
      // Saldos por conta
      accountBalances,
      
      // Breakdown por categoria
      categoryBreakdown,
      
      // Tendências mensais
      monthlyTrends,
      
      // Análise por categoria
      categoryAnalysis: transactions.filter(t => {
        const tDate = new Date(t.date);
        const now = new Date();
        return tDate.getFullYear() === now.getFullYear() && 
               tDate.getMonth() === now.getMonth();
      }).reduce((acc, t) => {
        if (t.type === 'expense' && t.category) {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
        }
        return acc;
      }, {} as { [key: string]: number }),
      
      // Transações recentes
      recentTransactions,
      
      // Tendências mensais
      monthlyTrends,
      
      // Métricas mensais detalhadas
      monthlyMetrics: {
        current: relatorioMensal,
        categories: resumoCategorias
      },
      
      // Métricas por conta
      accountMetrics,
      
      // Métricas por categoria
      categoryMetrics,
      
      // Transferências (vazio por enquanto)
      transfers: [],
      
      // Parcelamentos (vazio por enquanto)
      installments: [],
      
      // Faturas de cartão (vazio por enquanto)
      creditCardBills: []
    };
  }, [context.state.transactions, context.state.accounts, context.dashboardData]);

  // Função para obter resumo de período
  const getPeriodSummary = useCallback((startDateOrPeriod: string, endDate?: string, accountId?: string) => {
    console.log('🔍 OBTENDO RESUMO DE PERÍODO:', { startDateOrPeriod, endDate, accountId });
    
    const transactions = context.state.transactions || [];
    if (!Array.isArray(transactions) || transactions.length === 0) {
      console.log('⚠️ RESUMO DE PERÍODO - Transações inválidas ou vazias');
      return {
        income: 0,
        expenses: 0,
        balance: 0,
        transactionCount: 0,
        transactions: []
      };
    }

    let startDate: Date;
    let finalEndDate: Date;

    // Se endDate é fornecido, usar startDate e endDate como datas específicas
    if (endDate) {
      startDate = new Date(startDateOrPeriod);
      finalEndDate = new Date(endDate);
    } else {
      // Usar o formato antigo com período
      const now = new Date();
      startDate = new Date();
      finalEndDate = now;
      
      switch (startDateOrPeriod) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }
    }

    // Filtrar transações por período e conta (se especificada)
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const isInPeriod = transactionDate >= startDate && transactionDate <= finalEndDate;
      const isFromAccount = !accountId || transaction.accountId === accountId;
      return isInPeriod && isFromAccount;
    });

    // Calcular totais
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const result = {
      income,
      expenses,
      balance: income - expenses,
      transactionCount: filteredTransactions.length,
      transactions: filteredTransactions
    };

    console.log('✅ RESUMO DE PERÍODO CALCULADO:', result);
    return result;
  }, [context.state.transactions]);

  // Função para calcular dados derivados
  const calculateDerivedData = useCallback(() => {
    console.log('🔍 CALCULANDO DADOS DERIVADOS');
    
    if (!context.state.transactions || !Array.isArray(context.state.transactions)) {
      console.log('⚠️ DADOS DERIVADOS - Transações inválidas ou vazias');
      return {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        accountBalances: {},
        categoryBreakdown: {},
        monthlyTrends: [],
        recentTransactions: [],
        categoryAnalysis: [],
        monthlyMetrics: { current: null, categories: null },
        accountMetrics: {},
        categoryMetrics: {},
        transfers: [],
        installments: [],
        creditCardBills: []
      };
    }

    const transactions = context.state.transactions;
    const accounts = context.state.accounts || [];
    
    console.log('🔍 CALCULANDO DADOS DERIVADOS - Dados válidos:', {
      transactionsCount: transactions.length,
      accountsCount: accounts.length
    });

    // Obter relatório do mês atual
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const relatorioMensal = getRelatorioMensal(currentMonth, transactions, accounts);
    
    // Obter resumo de categorias
    const resumoCategorias = getResumoCategorias(transactions);
    
    // Calcular métricas globais
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calcular saldos por conta
    const accountBalances: { [accountId: string]: number } = {};
    accounts.forEach(account => {
      accountBalances[account.id] = account.balance || 0;
    });

    // Calcular breakdown por categoria
    const categoryBreakdown: { [category: string]: number } = {};
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const category = transaction.category || 'Outros';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(transaction.amount);
      }
    });

    // Calcular tendências mensais (últimos 6 meses)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === date.getFullYear() && tDate.getMonth() === date.getMonth();
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      monthlyTrends.push({
        month: monthKey,
        income,
        expenses,
        balance: income - expenses
      });
    }

    // Transações recentes (últimas 10)
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Calcular métricas por conta
    const accountMetrics: { [accountId: string]: any } = {};
    accounts.forEach(account => {
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      const income = accountTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const expenses = accountTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      accountMetrics[account.id] = {
        balance: account.balance || 0,
        income,
        expenses,
        transactionCount: accountTransactions.length
      };
    });

    // Calcular métricas por categoria
    const categoryMetrics: { [category: string]: any } = {};
    Object.keys(categoryBreakdown).forEach(category => {
      const categoryTransactions = transactions.filter(t => t.category === category);
      categoryMetrics[category] = {
        total: categoryBreakdown[category],
        transactionCount: categoryTransactions.length,
        averageAmount: categoryTransactions.length > 0 
          ? categoryBreakdown[category] / categoryTransactions.length 
          : 0
      };
    });

    console.log('✅ DADOS DERIVADOS CALCULADOS:', {
      totalBalance: totalBalance,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      netIncome: totalIncome - totalExpenses,
      categoriesCount: Object.keys(categoryBreakdown).length,
      trendsCount: monthlyTrends.length,
      recentCount: recentTransactions.length
    });

    return {
      // Métricas principais
      totalBalance: totalBalance,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      netIncome: totalIncome - totalExpenses,
      
      // Saldos por conta
      accountBalances,
      
      // Breakdown por categoria
      categoryBreakdown,
      
      // Tendências mensais
      monthlyTrends,
      
      // Análise por categoria
      categoryAnalysis: transactions.filter(t => {
        const tDate = new Date(t.date);
        const now = new Date();
        return tDate.getFullYear() === now.getFullYear() && 
               tDate.getMonth() === now.getMonth();
      }).reduce((acc, t) => {
        if (t.type === 'expense' && t.category) {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
        }
        return acc;
      }, {} as { [key: string]: number }),
      
      // Transações recentes
      recentTransactions,
      
      // Métricas mensais detalhadas
      monthlyMetrics: {
        current: relatorioMensal,
        categories: resumoCategorias
      },
      
      // Métricas por conta
      accountMetrics,
      
      // Métricas por categoria
      categoryMetrics,
      
      // Transferências (vazio por enquanto)
      transfers: [],
      
      // Parcelamentos (vazio por enquanto)
      installments: [],
      
      // Faturas de cartão (vazio por enquanto)
      creditCardBills: []
    };
  }, [context.state.transactions, context.state.accounts]);

  // Calcular dados derivados usando useMemo
  const derivedData = useMemo(() => {
    // Se temos dados da API do dashboard, usar eles
    if (context.dashboardData) {
      return {
        dashboardMetrics: {
          totalBalance: context.dashboardData.totalBalance,
          monthlyIncome: context.dashboardData.totalIncome,
          monthlyExpenses: context.dashboardData.totalExpenses,
          monthlyBalance: context.dashboardData.netIncome,
          transactionCount: context.dashboardData.transactionCount || 0
        }
      };
    }
    
    // Fallback para cálculos locais
    return calculateDerivedData();
  }, [calculateDerivedData, context.dashboardData]);

  // Função para calcular saldo corrente de uma transação
  const getRunningBalance = useCallback((accountId: string, transactionId: string): number => {
    const transaction = context.state.transactions.find(t => t.id === transactionId);
    if (!transaction || !accountId) return 0;
    
    // Ordenar TODAS as transações da conta por data
    const sortedTransactions = context.state.transactions
      .filter(t => t.accountId === accountId || t.toAccountId === accountId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calcular saldo até a transação específica, começando do zero
    let runningBalance = 0;
    for (const t of sortedTransactions) {
      if (t.accountId === accountId) {
        // Transação de saída/entrada da conta
        if (t.type === 'income') {
          runningBalance += t.amount;
        } else if (t.type === 'expense' || (t.type === 'shared' && t.amount < 0)) {
          // Despesas e transações compartilhadas negativas diminuem o saldo
          runningBalance -= Math.abs(t.amount);
        } else if (t.type === 'shared' && t.amount > 0) {
          // Transações compartilhadas positivas aumentam o saldo
          runningBalance += t.amount;
        } else if (t.type === 'transfer') {
          // Transferências de saída diminuem o saldo
          runningBalance -= t.amount;
        }
      } else if (t.toAccountId === accountId && t.type === 'transfer') {
        // Transferência de entrada na conta aumenta o saldo
        runningBalance += t.amount;
      }
      
      if (t.id === transactionId) break;
    }
    
    return runningBalance;
  }, [context.state.transactions]);

  return {
    ...context.state,
    ...context.actions,
    ...balances,
    ...derivedData,
    getPeriodSummary,
    getRunningBalance,
    loading: context.state.isLoading || context.dashboardLoading,
    refreshDashboard: context.actions.refreshData
  };
}

// Hook para trips
export function useTrips() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useTrips must be used within a UnifiedProvider');
  }
  
  return {
    create: async (tripData: any) => {
      console.log('➕ Creating trip:', tripData);
      
      try {
        // Criar viagem usando a API
        const response = await fetch('/api/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tripData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar viagem');
        }

        const newTrip = await response.json();
        console.log('✅ Trip created successfully:', newTrip);
        
        return newTrip;
      } catch (error) {
        console.error('❌ Error creating trip:', error);
        throw error;
      }
    },
    update: async (id: string, updateData: any) => {
      console.log('✏️ Updating trip:', id, updateData);
      
      try {
        // Atualizar viagem usando a API
        const response = await fetch('/api/trips', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id,
            ...updateData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar viagem');
        }

        const updatedTrip = await response.json();
        console.log('✅ Trip updated successfully:', updatedTrip);
        
        return updatedTrip;
      } catch (error) {
        console.error('❌ Error updating trip:', error);
        throw error;
      }
    }
  };
}

// Hook para accounts
export function useAccounts() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within a UnifiedProvider');
  }
  
  const { state, dispatch } = context;
  
  return {
    accounts: state.accounts,
    isLoading: state.resourceLoading.accounts || false,
    error: state.errors.accounts,
    
    create: async (data: any) => {
      console.log('➕ Creating account:', data);
      // Implementar criação de conta
      return { success: true };
    },
    update: async (id: string, data: any) => {
      console.log('✏️ Updating account:', id, data);
      // Implementar atualização de conta
      return { success: true };
    },
    delete: async (id: string) => {
      console.log('🗑️ Deleting account:', id);
      // Implementar exclusão de conta
      return { success: true };
    },
    refresh: async () => {
      console.log('🔄 Refreshing accounts');
      // Implementar refresh de contas
      return { success: true };
    }
  };
}

export function useAccountMetrics(accountId?: string) {
  const { state } = useUnified();
  
  return useMemo(() => {
    // Add null safety checks for SSR
    if (!state || !state.accounts) {
      return accountId ? null : [];
    }
    
    const transactions = state.transactions || [];
    const accounts = state.accounts || [];
    
    // Calcular métricas por conta
    const accountMetrics: { [accountId: string]: any } = {};
    accounts.forEach(account => {
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      const income = accountTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const expenses = accountTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      accountMetrics[account.id] = {
        balance: account.balance || 0,
        income,
        expenses,
        transactionCount: accountTransactions.length,
        lastTransaction: accountTransactions.length > 0 
          ? accountTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
          : null
      };
    });
    
    if (accountId) {
      // Retornar métricas de uma conta específica
      const accountMetric = accountMetrics[accountId];
      const account = accounts.find(a => a.id === accountId);
      
      if (!accountMetric || !account) {
        return null;
      }
      
      return {
        account,
        balance: accountMetric.balance,
        income: accountMetric.income,
        expenses: accountMetric.expenses,
        transactionCount: accountMetric.transactionCount,
        lastTransaction: accountMetric.lastTransaction,
        
        // Métricas calculadas
        netFlow: accountMetric.income - accountMetric.expenses,
        averageTransaction: accountMetric.transactionCount > 0 
          ? (accountMetric.income + accountMetric.expenses) / accountMetric.transactionCount 
          : 0
      };
    } else {
      // Retornar métricas de todas as contas
      return accounts.map(account => {
        const accountMetric = accountMetrics[account.id];
        
        return {
          account,
          balance: accountMetric?.balance || 0,
          income: accountMetric?.income || 0,
          expenses: accountMetric?.expenses || 0,
          transactionCount: accountMetric?.transactionCount || 0,
          lastTransaction: accountMetric?.lastTransaction,
          
          // Métricas calculadas
          netFlow: (accountMetric?.income || 0) - (accountMetric?.expenses || 0),
          averageTransaction: (accountMetric?.transactionCount || 0) > 0 
            ? ((accountMetric?.income || 0) + (accountMetric?.expenses || 0)) / (accountMetric?.transactionCount || 0)
            : 0
        };
      });
    }
  }, [state?.accounts, state?.transactions, accountId]);

  // Funções CRUD para transações
  const { create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();

  // Return principal do hook useUnified
  return {
    // Estado do contexto
    state: context.state,
    dispatch: context.dispatch,
    
    // Dados básicos
    accounts: context.state.accounts,
    transactions: context.state.transactions,
    categories: context.state.categories,
    goals: context.state.goals,
    investments: context.state.investments,
    
    // Estados de loading
    isLoading: context.state.isLoading,
    resourceLoading: context.state.resourceLoading,
    errors: context.state.errors,
    
    // Dados do dashboard
    dashboardData: context.dashboardData,
    
    // Métricas calculadas
    ...derivedData,
    
    // Funções CRUD
    createTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Utilitários
    dateUtils,
    
    // Hooks especializados (para compatibilidade)
    useAccounts: () => useAccounts(),
    useTransactions: () => useTransactions(),
    useGoals: () => useGoals(),
    useContacts: () => useContacts(),
    useInvestments: () => useInvestments(),
  };
}

// Hook para transações
export function useTransactions() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a UnifiedProvider');
  }
  const { state, dispatch } = context;
  
  const createTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTransaction: Transaction = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('transaction:created', newTransaction);
      
      return newTransaction;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }, [dispatch]);

  const updateTransaction = useCallback(async (id: string, data: Partial<Transaction>) => {
    try {
      const existingTransaction = state.transactions.find(t => t.id === id);
      if (!existingTransaction) {
        throw new Error('Transação não encontrada');
      }

      const updatedTransaction: Transaction = {
        ...existingTransaction,
        ...data,
        updatedAt: new Date(),
      };

      dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('transaction:updated', updatedTransaction);
      
      return updatedTransaction;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  }, [state.transactions, dispatch]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const existingTransaction = state.transactions.find(t => t.id === id);
      if (!existingTransaction) {
        throw new Error('Transação não encontrada');
      }

      dispatch({ type: 'REMOVE_TRANSACTION', payload: id });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('transaction:deleted', { id });
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      throw error;
    }
  }, [state.transactions, dispatch]);

  return {
    transactions: state.transactions,
    isLoading: state.isLoading,
    error: state.errors.transactions,
    create: createTransaction,
    update: updateTransaction,
    delete: deleteTransaction,
  };
}

// Hook para metas
export function useGoals() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a UnifiedProvider');
  }
  const { state, dispatch } = context;
  
  const createGoal = useCallback(async (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newGoal: Goal = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      dispatch({ type: 'SET_GOALS', payload: [...state.goals, newGoal] });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('goal:created', newGoal);
      
      return newGoal;
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      throw error;
    }
  }, [state.goals, dispatch]);

  const updateGoal = useCallback(async (id: string, data: Partial<Goal>) => {
    try {
      const existingGoal = state.goals.find(g => g.id === id);
      if (!existingGoal) {
        throw new Error('Meta não encontrada');
      }

      const updatedGoal: Goal = {
        ...existingGoal,
        ...data,
        updatedAt: new Date(),
      };

      const updatedGoals = state.goals.map(g => g.id === id ? updatedGoal : g);
      dispatch({ type: 'SET_GOALS', payload: updatedGoals });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('goal:updated', updatedGoal);
      
      return updatedGoal;
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      throw error;
    }
  }, [state.goals, dispatch]);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      const existingGoal = state.goals.find(g => g.id === id);
      if (!existingGoal) {
        throw new Error('Meta não encontrada');
      }

      const updatedGoals = state.goals.filter(g => g.id !== id);
      dispatch({ type: 'SET_GOALS', payload: updatedGoals });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('goal:deleted', { id });
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      throw error;
    }
  }, [state.goals, dispatch]);

  return {
    goals: state.goals,
    isLoading: state.resourceLoading.goals || false,
    error: state.errors.goals || null,
    create: createGoal,
    update: updateGoal,
    delete: deleteGoal,
    refresh: () => Promise.resolve(),
  };
}

// Hook para contatos
export function useContacts() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a UnifiedProvider');
  }
  const { state, dispatch } = context;
  
  const createContact = useCallback(async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newContact: Contact = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      dispatch({ type: 'SET_CONTACTS', payload: [...state.contacts, newContact] });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('contact:created', newContact);
      
      return newContact;
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      throw error;
    }
  }, [state.contacts, dispatch]);

  const updateContact = useCallback(async (id: string, data: Partial<Contact>) => {
    try {
      const existingContact = state.contacts.find(c => c.id === id);
      if (!existingContact) {
        throw new Error('Contato não encontrado');
      }

      const updatedContact: Contact = {
        ...existingContact,
        ...data,
        updatedAt: new Date(),
      };

      const updatedContacts = state.contacts.map(c => c.id === id ? updatedContact : c);
      dispatch({ type: 'SET_CONTACTS', payload: updatedContacts });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('contact:updated', updatedContact);
      
      return updatedContact;
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      throw error;
    }
  }, [state.contacts, dispatch]);

  const deleteContact = useCallback(async (id: string) => {
    try {
      const existingContact = state.contacts.find(c => c.id === id);
      if (!existingContact) {
        throw new Error('Contato não encontrado');
      }

      const updatedContacts = state.contacts.filter(c => c.id !== id);
      dispatch({ type: 'SET_CONTACTS', payload: updatedContacts });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('contact:deleted', { id });
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      throw error;
    }
  }, [state.contacts, dispatch]);

  return {
    contacts: state.contacts,
    isLoading: state.resourceLoading.contacts || false,
    error: state.errors.contacts || null,
    create: createContact,
    update: updateContact,
    delete: deleteContact,
    refresh: () => Promise.resolve(),
  };
}

// Hook para investimentos
export function useInvestments() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useInvestments must be used within a UnifiedProvider');
  }
  const { state, dispatch } = context;
  
  const createInvestment = useCallback(async (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newInvestment: Investment = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      dispatch({ type: 'SET_INVESTMENTS', payload: [...state.investments, newInvestment] });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('investment:created', newInvestment);
      
      return newInvestment;
    } catch (error) {
      console.error('Erro ao criar investimento:', error);
      throw error;
    }
  }, [state.investments, dispatch]);

  const updateInvestment = useCallback(async (id: string, data: Partial<Investment>) => {
    try {
      const existingInvestment = state.investments.find(i => i.id === id);
      if (!existingInvestment) {
        throw new Error('Investimento não encontrado');
      }

      const updatedInvestment: Investment = {
        ...existingInvestment,
        ...data,
        updatedAt: new Date(),
      };

      const updatedInvestments = state.investments.map(i => i.id === id ? updatedInvestment : i);
      dispatch({ type: 'SET_INVESTMENTS', payload: updatedInvestments });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('investment:updated', updatedInvestment);
      
      return updatedInvestment;
    } catch (error) {
      console.error('Erro ao atualizar investimento:', error);
      throw error;
    }
  }, [state.investments, dispatch]);

  const deleteInvestment = useCallback(async (id: string) => {
    try {
      const existingInvestment = state.investments.find(i => i.id === id);
      if (!existingInvestment) {
        throw new Error('Investimento não encontrado');
      }

      const updatedInvestments = state.investments.filter(i => i.id !== id);
      dispatch({ type: 'SET_INVESTMENTS', payload: updatedInvestments });
      
      // Emitir evento para atualização em tempo real
      eventBus.emit('investment:deleted', { id });
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir investimento:', error);
      throw error;
    }
  }, [state.investments, dispatch]);

  return {
    investments: state.investments,
    isLoading: state.resourceLoading.investments || false,
    error: state.errors.investments || null,
    create: createInvestment,
    update: updateInvestment,
    delete: deleteInvestment,
    refresh: () => Promise.resolve(),
  };
}
