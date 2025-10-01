'use client';

import * as React from 'react';
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';

import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '@/lib/events/event-bus';

// Interfaces locais para compatibilidade
interface Transaction {
  id: string;
  accountId: string;
  toAccountId?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  description?: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  transferId?: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Goal {
  id: string;
  name: string;
  description?: string;
  current: number;
  target: number;
  targetDate: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  targetAmount: number;
  currentAmount: number;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: 'planning' | 'active' | 'completed';
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'friend' | 'family' | 'business';
}

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  purchaseDate: string;
}

interface SharedDebt {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  participants: string[];
  createdAt: string;
}

// Estado unificado - DADOS DIRETOS DA API
interface UnifiedState {
  // DADOS PRIMÁRIOS (da API)
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  trips: Trip[];
  contacts: Contact[];
  investments: Investment[];
  sharedDebts: SharedDebt[];
  
  // DADOS DO DASHBOARD (da API)
  dashboardData: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    totalBalance: number;
    categoryBreakdown: Record<string, number>;
    goals: Goal[];
    trendAnalysis: {
      incomeChange: number;
      expenseChange: number;
    };
    period: string;
    dateRange: {
      start: string;
      end: string;
    };
  } | null;
  
  // ESTADOS DE CARREGAMENTO
  loadingStates: {
    transactions: boolean;
    accounts: boolean;
    goals: boolean;
    trips: boolean;
    contacts: boolean;
    investments: boolean;
    sharedDebts: boolean;
    dashboard: boolean;
  };
  
  // ESTADOS DE ERRO
  errorStates: {
    transactions: string | null;
    accounts: string | null;
    goals: string | null;
    trips: string | null;
    contacts: string | null;
    investments: string | null;
    sharedDebts: string | null;
    dashboard: string | null;
  };
}

// Ações do reducer
type UnifiedAction =
  | { type: 'SET_LOADING'; entity: keyof UnifiedState['loadingStates']; loading: boolean }
  | { type: 'SET_ERROR'; entity: keyof UnifiedState['errorStates']; error: string | null }
  | { type: 'SET_DATA'; entity: keyof Omit<UnifiedState, 'loadingStates' | 'errorStates'>; data: any }
  | { type: 'ADD_ITEM'; entity: keyof Omit<UnifiedState, 'loadingStates' | 'errorStates' | 'dashboardData'>; item: any }
  | { type: 'UPDATE_ITEM'; entity: keyof Omit<UnifiedState, 'loadingStates' | 'errorStates' | 'dashboardData'>; id: string; updates: any }
  | { type: 'DELETE_ITEM'; entity: keyof Omit<UnifiedState, 'loadingStates' | 'errorStates' | 'dashboardData'>; id: string };

// Estado inicial
const initialState: UnifiedState = {
  transactions: [],
  accounts: [],
  goals: [],
  trips: [],
  contacts: [],
  investments: [],
  sharedDebts: [],
  dashboardData: null,
  loadingStates: {
    transactions: false,
    accounts: false,
    goals: false,
    trips: false,
    contacts: false,
    investments: false,
    sharedDebts: false,
    dashboard: false,
  },
  errorStates: {
    transactions: null,
    accounts: null,
    goals: null,
    trips: null,
    contacts: null,
    investments: null,
    sharedDebts: null,
    dashboard: null,
  },
};

// Reducer
function unifiedReducer(state: UnifiedState, action: UnifiedAction): UnifiedState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.entity]: action.loading,
        },
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        errorStates: {
          ...state.errorStates,
          [action.entity]: action.error,
        },
      };
    
    case 'SET_DATA':
      return {
        ...state,
        [action.entity]: action.data,
      };
    
    case 'ADD_ITEM':
      return {
        ...state,
        [action.entity]: [...(state[action.entity] as any[]), action.item],
      };
    
    case 'UPDATE_ITEM':
      return {
        ...state,
        [action.entity]: (state[action.entity] as any[]).map(item =>
          item.id === action.id ? { ...item, ...action.updates } : item
        ),
      };
    
    case 'DELETE_ITEM':
      return {
        ...state,
        [action.entity]: (state[action.entity] as any[]).filter(item => item.id !== action.id),
      };
    
    default:
      return state;
  }
}

// Context
interface UnifiedContextType {
  state: UnifiedState;
  dispatch: React.Dispatch<UnifiedAction>;
  
  // Funções de carregamento de dados
  loadTransactions: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  loadGoals: () => Promise<void>;
  loadTrips: () => Promise<void>;
  loadContacts: () => Promise<void>;
  loadInvestments: () => Promise<void>;
  loadSharedDebts: () => Promise<void>;
  loadDashboard: () => Promise<void>;
  
  // Funções CRUD
  createTransaction: (data: Omit<Transaction, 'id'>) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  createAccount: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Account>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

const UnifiedContext = createContext<UnifiedContextType | undefined>(undefined);

// Provider
export function UnifiedProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(unifiedReducer, initialState);

  // Funções de API
  const apiCall = useCallback(async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(`http://localhost:3000/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }, []);

  // Funções de carregamento
  const loadTransactions = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', entity: 'transactions', loading: true });
    dispatch({ type: 'SET_ERROR', entity: 'transactions', error: null });
    
    try {
      const data = await apiCall('/transactions');
      dispatch({ type: 'SET_DATA', entity: 'transactions', data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', entity: 'transactions', error: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', entity: 'transactions', loading: false });
    }
  }, [apiCall]);

  const loadAccounts = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', entity: 'accounts', loading: true });
    dispatch({ type: 'SET_ERROR', entity: 'accounts', error: null });
    
    try {
      const data = await apiCall('/accounts');
      dispatch({ type: 'SET_DATA', entity: 'accounts', data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', entity: 'accounts', error: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', entity: 'accounts', loading: false });
    }
  }, [apiCall]);

  const loadDashboard = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', entity: 'dashboard', loading: true });
    dispatch({ type: 'SET_ERROR', entity: 'dashboard', error: null });
    
    try {
      const data = await apiCall('/dashboard');
      dispatch({ type: 'SET_DATA', entity: 'dashboardData', data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', entity: 'dashboard', error: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', entity: 'dashboard', loading: false });
    }
  }, [apiCall]);

  // Implementações básicas para outras entidades
  const loadGoals = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', entity: 'goals', loading: true });
    try {
      // Usar dados do dashboard se disponível
      if (state.dashboardData?.goals) {
        dispatch({ type: 'SET_DATA', entity: 'goals', data: state.dashboardData.goals });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', entity: 'goals', error: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', entity: 'goals', loading: false });
    }
  }, [state]);

  const loadTrips = useCallback(async () => {
    dispatch({ type: 'SET_DATA', entity: 'trips', data: [] });
  }, []);

  const loadContacts = useCallback(async () => {
    dispatch({ type: 'SET_DATA', entity: 'contacts', data: [] });
  }, []);

  const loadInvestments = useCallback(async () => {
    dispatch({ type: 'SET_DATA', entity: 'investments', data: [] });
  }, []);

  const loadSharedDebts = useCallback(async () => {
    dispatch({ type: 'SET_DATA', entity: 'sharedDebts', data: [] });
  }, []);

  // Funções CRUD
  const createTransaction = useCallback(async (data: Omit<Transaction, 'id'>) => {
    const response = await apiCall('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    dispatch({ type: 'ADD_ITEM', entity: 'transactions', item: response });
    
    // Recarregar dashboard após criar transação
    await loadDashboard();
    await loadAccounts();
    
    return response;
  }, [apiCall, loadDashboard, loadAccounts]);

  const updateTransaction = useCallback(async (id: string, data: Partial<Transaction>) => {
    await apiCall(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    dispatch({ type: 'UPDATE_ITEM', entity: 'transactions', id, updates: data });
    
    // Recarregar dashboard após atualizar transação
    await loadDashboard();
    await loadAccounts();
  }, [apiCall, loadDashboard, loadAccounts]);

  const deleteTransaction = useCallback(async (id: string) => {
    await apiCall(`/transactions/${id}`, {
      method: 'DELETE',
    });
    
    dispatch({ type: 'DELETE_ITEM', entity: 'transactions', id });
    
    // Recarregar dashboard após deletar transação
    await loadDashboard();
    await loadAccounts();
  }, [apiCall, loadDashboard, loadAccounts]);

  const createAccount = useCallback(async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiCall('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    dispatch({ type: 'ADD_ITEM', entity: 'accounts', item: response });
    return response;
  }, [apiCall]);

  const updateAccount = useCallback(async (id: string, data: Partial<Account>) => {
    await apiCall(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    dispatch({ type: 'UPDATE_ITEM', entity: 'accounts', id, updates: data });
  }, [apiCall]);

  const deleteAccount = useCallback(async (id: string) => {
    await apiCall(`/accounts/${id}`, {
      method: 'DELETE',
    });
    
    dispatch({ type: 'DELETE_ITEM', entity: 'accounts', id });
  }, [apiCall]);

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboard();
    loadAccounts();
    loadTransactions();
    loadGoals();
  }, [loadDashboard, loadAccounts, loadTransactions, loadGoals]);

  const contextValue: UnifiedContextType = {
    state,
    dispatch,
    loadTransactions,
    loadAccounts,
    loadGoals,
    loadTrips,
    loadContacts,
    loadInvestments,
    loadSharedDebts,
    loadDashboard,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createAccount,
    updateAccount,
    deleteAccount,
  };

  return (
    <UnifiedContext.Provider value={contextValue}>
      {children}
    </UnifiedContext.Provider>
  );
}

// Hook principal
export function useUnified() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useUnified must be used within a UnifiedProvider');
  }
  return context;
}

// HOOKS ESPECIALIZADOS - USANDO APENAS DADOS DA API

export function useFinancialMetrics() {
  const { state } = useUnified();
  
  return useMemo(() => {
    const { dashboardData } = state;
    
    if (!dashboardData) {
      return {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        categoryBreakdown: {},
        trendAnalysis: {
          incomeChange: 0,
          expenseChange: 0,
        },
      };
    }
    
    return {
      totalBalance: dashboardData.totalBalance,
      totalIncome: dashboardData.totalIncome,
      totalExpenses: dashboardData.totalExpenses,
      netIncome: dashboardData.netIncome,
      categoryBreakdown: dashboardData.categoryBreakdown,
      trendAnalysis: dashboardData.trendAnalysis,
    };
  }, [state]);
}

export function useAccountMetrics(accountId?: string) {
  const { state } = useUnified();
  
  return useMemo(() => {
    if (accountId) {
      const account = state.accounts.find(acc => acc.id === accountId);
      return account ? {
        balance: account.balance,
        name: account.name,
        type: account.type,
        currency: account.currency,
        isActive: account.isActive,
      } : null;
    }
    
    return state.accounts.map(account => ({
      id: account.id,
      balance: account.balance,
      name: account.name,
      type: account.type,
      currency: account.currency,
      isActive: account.isActive,
    }));
  }, [state.accounts, accountId]);
}

export function useTransactions() {
  const { state } = useUnified();
  return state.transactions;
}

export function useAccounts() {
  const { state } = useUnified();
  return state.accounts;
}

export function useGoals() {
  const { state } = useUnified();
  return state.goals;
}

export function useDashboardData() {
  const { state } = useUnified();
  return state.dashboardData;
}
