'use client';

import * as React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { Transaction, Account, Goal, Contact, Investment } from '../types';

// Definindo tipos que não existem no arquivo types/index.ts
interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  expenses: any[];
  status?: 'planned' | 'active' | 'completed';
}

interface SharedDebt {
  id: string;
  creditor: string;
  debtor: string;
  originalAmount: number;
  currentAmount: number;
  description: string;
  transactionId?: string;
  status: 'active' | 'paid' | 'cancelled';
}

// Estado unificado
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
}

// Ações do reducer
type UnifiedAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Transaction } }
  | { type: 'REMOVE_TRANSACTION'; payload: string }
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'SET_TRIPS'; payload: Trip[] }
  | { type: 'SET_INVESTMENTS'; payload: Investment[] }
  | { type: 'SET_SHARED_DEBTS'; payload: SharedDebt[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { key: string; message: string } }
  | { type: 'SET_DASHBOARD_DATA'; payload: any };

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
};

// Reducer
function unifiedReducer(state: UnifiedState, action: UnifiedAction): UnifiedState {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { 
        ...state, 
        transactions: [...state.transactions, action.payload] 
      };
    case 'UPDATE_TRANSACTION':
      return { 
        ...state, 
        transactions: state.transactions.map(transaction => 
          transaction.id === action.payload.id ? action.payload.updates : transaction
        )
      };
    case 'REMOVE_TRANSACTION':
      return { 
        ...state, 
        transactions: state.transactions.filter(transaction => transaction.id !== action.payload)
      };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'UPDATE_ACCOUNT':
      return { 
        ...state, 
        accounts: state.accounts.map(account => 
          account.id === action.payload.id ? action.payload : account
        )
      };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload };
    case 'SET_TRIPS':
      return { ...state, trips: action.payload };
    case 'SET_INVESTMENTS':
      return { ...state, investments: action.payload };
    case 'SET_SHARED_DEBTS':
      return { ...state, sharedDebts: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { 
        ...state, 
        errors: { ...state.errors, [action.payload.key]: action.payload.message } 
      };
    case 'SET_DASHBOARD_DATA':
      return { ...state }; // Dashboard data é gerenciado separadamente no estado do provider
    default:
      return state;
  }
}

// Tipo do contexto
interface UnifiedContextType {
  state: UnifiedState;
  dispatch: React.Dispatch<UnifiedAction>;
  dashboardData: any;
  dashboardLoading: boolean;
  loading: boolean;
  transactions: Transaction[];
  accounts: Account[];
  actions: any;
  isLoading: boolean;
}

// Contexto
const UnifiedContext = createContext<UnifiedContextType | undefined>(undefined);

// Provider
export function UnifiedProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(unifiedReducer, initialState);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Carregar dados do dashboard
  const loadDashboardData = useCallback(async () => {
    try {
      setDashboardLoading(true);
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      console.log('📊 Dashboard data carregado:', data);
      
      setDashboardData(data);
      dispatch({ type: 'SET_DASHBOARD_DATA', payload: data });
    } catch (error) {
      console.error('Erro ao carregar dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Carregar contas
  const loadAccounts = useCallback(async () => {
    try {
      const response = await fetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      
      const accounts = await response.json();
      dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const transactions = await response.json();
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initializeData = async () => {
      try {
        await Promise.all([
          loadAccounts(),
          loadTransactions(),
          loadDashboardData()
        ]);
      } catch (error) {
        console.error('Erro ao inicializar dados:', error);
      }
    };

    initializeData();
  }, [loadAccounts, loadTransactions, loadDashboardData]);

  // Função getPeriodSummary para compatibilidade
  const getPeriodSummary = useCallback((startDate: string, endDate: string, accountIds?: string[]) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filteredTransactions = state.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const matchesDate = transactionDate >= start && transactionDate <= end;
      const matchesAccount = !accountIds || accountIds.includes(t.accountId);
      
      // Excluir transações pai de parcelamentos para evitar duplicação
      // Apenas incluir transações filhas (parcelas) ou transações normais
      const isParentInstallment = t.totalInstallments && t.totalInstallments > 1 && !t.parentTransactionId;
      const isValidStatus = t.status === 'completed' || t.status === 'cleared';
      
      return matchesDate && matchesAccount && !isParentInstallment && isValidStatus;
    });
    
    const income = filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return {
      income,
      expenses,
      balance: income - expenses,
      transactions: filteredTransactions
    };
  }, [state.transactions]);
  
  // Função para calcular dados do dashboard
  const calculateDashboardData = useCallback((transactions: Transaction[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const matchesMonth = transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
      
      // Excluir transações pai de parcelamentos para evitar duplicação
      const isParentInstallment = transaction.totalInstallments && transaction.totalInstallments > 1 && !transaction.parentTransactionId;
      const isValidStatus = transaction.status === 'completed' || transaction.status === 'cleared';
      
      return matchesMonth && !isParentInstallment && isValidStatus;
    });
    
    const income = filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return {
      income,
      expenses,
      balance: income - expenses,
      transactions: filteredTransactions
    };
  }, []);
  
  // Função para calcular saldo corrente
  const getRunningBalance = useCallback((transactionId: string, accountId?: string) => {
    const transaction = state.transactions.find(t => t.id === transactionId);
    if (!transaction) return 0;
    
    // Usar accountId fornecido ou o da transação
    const targetAccountId = accountId || transaction.accountId;
    if (!targetAccountId) return 0;
    
    // Ordenar TODAS as transações relacionadas à conta por data (mais antigas primeiro)
    const allAccountTransactions = state.transactions
      .filter(t => t.accountId === targetAccountId || t.toAccountId === targetAccountId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calcular saldo corrente até a transação específica, começando do zero
    let runningBalance = 0;
    
    for (const t of allAccountTransactions) {
      // Aplicar o efeito da transação no saldo
      if (t.accountId === targetAccountId) {
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
          // Transferência de saída
          runningBalance -= t.amount;
        }
      } else if (t.toAccountId === targetAccountId && t.type === 'transfer') {
        // Transferência de entrada na conta
        runningBalance += t.amount;
      }
      
      // Parar quando chegar na transação alvo
      if (t.id === transactionId) {
        break;
      }
    }
    
    return runningBalance;
  }, [state.transactions]);
  
  // Funções CRUD para transações usando APIs do backend
  const createTransaction = useCallback(async (transactionData: any) => {
    try {
      // Se for uma transação compartilhada, usar a API específica
      if (transactionData.isShared && transactionData.sharedWith && transactionData.sharedWith.length > 0) {
        const response = await fetch('/api/shared-expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: transactionData.description,
            amount: transactionData.amount,
            accountId: transactionData.accountId,
            category: transactionData.category,
            date: transactionData.date,
            sharedWith: transactionData.sharedWith,
            sharedPercentages: transactionData.sharedPercentages,
            notes: transactionData.notes
          })
        });

        if (!response.ok) throw new Error('Failed to create shared transaction');

        const result = await response.json();
        
        dispatch({ type: 'ADD_TRANSACTION', payload: result.transaction });
        await loadDashboardData();
        
        return { success: true, data: result };
      } else {
        // Transação normal
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) throw new Error('Failed to create transaction');

        const newTransaction = await response.json();
        
        dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
        await loadDashboardData();
        
        return { success: true, data: newTransaction };
      }
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      return { success: false, error: error.message };
    }
  }, [loadDashboardData]);

  const updateTransaction = useCallback(async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update transaction');

      const updatedTransaction = await response.json();
      
      dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, updates: updatedTransaction } });
      await loadDashboardData();
      
      return { success: true, data: updatedTransaction };
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      return { success: false, error: error.message };
    }
  }, [loadDashboardData]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete transaction');
      
      dispatch({ type: 'REMOVE_TRANSACTION', payload: id });
      await loadDashboardData();
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      return { success: false, error: error.message };
    }
  }, [loadDashboardData]);

  const refreshState = useCallback(async () => {
    try {
      await Promise.all([
        loadAccounts(),
        loadTransactions(),
        loadDashboardData()
      ]);
    } catch (error) {
      console.error('Erro ao atualizar estado:', error);
    }
  }, [loadAccounts, loadTransactions, loadDashboardData]);

  const updateAccount = useCallback(async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update account');

      const updatedAccount = await response.json();
      
      dispatch({ type: 'UPDATE_ACCOUNT', payload: { id, updates: updatedAccount } });
      
      return { success: true, data: updatedAccount };
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Função para calcular saldo de uma conta
  const getAccountBalance = useCallback((accountId: string) => {
    const validAccounts = Array.isArray(state.accounts) ? state.accounts : [];
    const account = validAccounts.find(a => a.id === accountId);
    
    // Retornar o saldo da conta diretamente do banco de dados
    return account ? (typeof account.balance === 'number' ? account.balance : parseFloat(account.balance) || 0) : 0;
  }, [state.accounts]);

  // Função para remover transação
  const removeTransaction = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }
      
      dispatch({ type: 'REMOVE_TRANSACTION', payload: id });
      
      // Recarregar dados do dashboard após remover transação
      await loadDashboardData();
      
      return { success: true };
    } catch (error) {
      console.error('Error removing transaction:', error);
      throw error;
    }
  }, [loadDashboardData]);

  const addTransaction = useCallback(async (transactionData: any) => {
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
  }, [loadDashboardData]);

  const contextValue = useMemo(() => {
    return {
      state,
      dispatch,
      dashboardData,
      dashboardLoading,
      loading: state.isLoading || dashboardLoading,
      transactions: state.transactions,
      accounts: state.accounts,
      actions: {}, // Placeholder para actions
      isLoading: state.isLoading || dashboardLoading,
      getPeriodSummary,
      getRunningBalance: (transactionId: string, accountId?: string) => getRunningBalance(transactionId, accountId),
      calculateDashboardData: () => calculateDashboardData(state.transactions),
      getAccountBalance,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      removeTransaction,
      addTransaction,
      refreshState,
      updateAccount
    };
  }, [state, dashboardData, dashboardLoading, getAccountBalance, createTransaction, updateTransaction, deleteTransaction, removeTransaction, addTransaction, refreshState, updateAccount]);

  console.log('🔍 SIMPLE PROVIDER - Retornando JSX');

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
  
  return context;
}

// Hook para trips com implementação funcional
export function useTrips() {
  console.log('🔍 useTrips CHAMADO - Implementação funcional');
  
  const create = useCallback(async (tripData: any) => {
    console.log('➕ Criando viagem via API:', tripData);
    
    try {
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
      console.log('✅ Viagem criada:', newTrip);
      
      // Criar transação inicial para a viagem se houver orçamento
      if (tripData.budget && tripData.budget > 0) {
        const transactionData = {
          description: `Orçamento inicial - ${tripData.name}`,
          amount: tripData.budget,
          type: 'expense',
          category: 'travel',
          tripId: newTrip.id,
          date: new Date().toISOString()
        };

        try {
          await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactionData),
          });
        } catch (error) {
          console.warn('Erro ao criar transação inicial da viagem:', error);
        }
      }
      
      return newTrip;
    } catch (error) {
      console.error('❌ Erro ao criar viagem:', error);
      throw error;
    }
  }, []);

  const update = useCallback(async (id: string, updateData: any) => {
    console.log('✏️ Atualizando viagem:', id, updateData);
    
    try {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar viagem');
      }

      const updatedTrip = await response.json();
      console.log('✅ Viagem atualizada:', updatedTrip);
      
      return updatedTrip;
    } catch (error) {
      console.error('❌ Erro ao atualizar viagem:', error);
      throw error;
    }
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    console.log('🗑️ Deletando viagem:', id);
    
    try {
      // Primeiro, deletar todas as transações relacionadas à viagem
      const transactionsResponse = await fetch(`/api/transactions?tripId=${id}`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        const tripTransactions = transactionsData.data || [];
        
        for (const transaction of tripTransactions) {
          await fetch(`/api/transactions/${transaction.id}`, {
            method: 'DELETE',
          });
        }
      }

      // Depois, deletar a viagem
      const response = await fetch(`/api/trips/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar viagem');
      }

      console.log('✅ Viagem deletada com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar viagem:', error);
      throw error;
    }
  }, []);

  // Função para obter gastos da viagem baseado em transactions
  const getTripExpenses = useCallback(async (tripId: string) => {
    try {
      const response = await fetch(`/api/transactions?tripId=${tripId}`);
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar gastos da viagem:', error);
      return [];
    }
  }, []);

  return {
    trips: [],
    loading: false,
    error: null,
    create,
    update,
    delete: deleteTrip,
    createTrip: create, // Alias para compatibilidade
    updateTrip: update, // Alias para compatibilidade
    deleteTrip,
    getTrip: async () => null,
    refreshTrips: async () => {},
    getTripExpenses // Nova função para obter gastos baseados em transactions
  };
}

// Hook para accounts com CRUD implementado
export function useAccounts() {
  const context = useUnified();
  const { state } = context;
  
  // Funções CRUD para contas usando APIs do backend
  const createAccount = useCallback(async (accountData: Omit<Account, 'id'>) => {
    console.log('🔄 Criando conta via API:', accountData);
    
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar conta');
      }

      const newAccount = await response.json();
      console.log('✅ Conta criada:', newAccount);

      // Recarregar dados para sincronizar
      window.location.reload(); // Força reload para sincronizar

      return newAccount;
    } catch (error) {
      console.error('❌ Erro ao criar conta:', error);
      throw error;
    }
  }, []);

  const deleteAccount = useCallback(async (id: string, deleteTransactions = false) => {
    console.log('🔄 Deletando conta via API:', id, 'deleteTransactions:', deleteTransactions);
    
    try {
      const response = await fetch(`/api/accounts?id=${id}&deleteTransactions=${deleteTransactions}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar conta');
      }

      console.log('✅ Conta deletada:', id);

      // Recarregar dados para sincronizar
      window.location.reload(); // Força reload para sincronizar

      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar conta:', error);
      throw error;
    }
  }, []);

  const getAccount = useCallback(async (id: string) => {
    return state.accounts.find(account => account.id === id) || null;
  }, [state.accounts]);

  const refreshAccounts = useCallback(async () => {
    window.location.reload(); // Força reload para sincronizar
  }, []);
  
  return {
    accounts: state.accounts || [],
    loading: state.isLoading,
    error: null,
    createAccount,
    updateAccount: context.updateAccount,
    deleteAccount,
    getAccount,
    refreshAccounts
  };
}

// Hook para transactions com CRUD implementado
export function useTransactions() {
  const context = useUnified();
  const { state } = context;
  
  console.log('🔍 useTransactions CHAMADO - Retornando transactions do contexto unificado');
  
  const getTransaction = useCallback(async (id: string) => {
    return state.transactions.find(transaction => transaction.id === id) || null;
  }, [state.transactions]);

  const refreshTransactions = useCallback(async () => {
    await context.refreshState();
  }, [context]);
  
  return {
    transactions: state.transactions || [],
    loading: state.isLoading,
    error: null,
    create: context.createTransaction,
    update: context.updateTransaction,
    delete: context.deleteTransaction,
    remove: context.removeTransaction,
    add: context.addTransaction,
    getTransaction,
    refreshTransactions
  };
}

// Hook para métricas das contas (placeholder para compatibilidade)
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
          lastTransaction: accountMetric?.lastTransaction || null,
          
          // Métricas calculadas
          netFlow: (accountMetric?.income || 0) - (accountMetric?.expenses || 0),
          averageTransaction: (accountMetric?.transactionCount || 0) > 0 
            ? ((accountMetric?.income || 0) + (accountMetric?.expenses || 0)) / (accountMetric?.transactionCount || 1)
            : 0
        };
      });
    }
  }, [state.accounts, state.transactions, accountId]);
}

// Hook para goals (placeholder para compatibilidade)
export function useGoals() {
  const { state, dispatch } = useUnified();
  
  const createGoal = async (goalData: any) => {
    try {
      const goalPayload = {
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: goalData.name,
        description: goalData.description || null,
        targetAmount: goalData.target || goalData.targetAmount || 0,
        currentAmount: goalData.current || goalData.currentAmount || 0,
        targetDate: goalData.deadline || goalData.targetDate || null,
        category: goalData.category || 'other',
        status: 'active',
        priority: goalData.priority || 'medium',
      };

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalPayload),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar meta');
      }

      const newGoal = await response.json();
      
      // Atualizar o estado local
      const updatedGoals = [...(state.goals || []), newGoal];
      dispatch({ type: 'SET_GOALS', payload: updatedGoals });
      
      return { success: true, data: newGoal };
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };
  
  return {
    goals: state.goals || [],
    loading: state.isLoading,
    error: null,
    createGoal,
    updateGoal: async () => ({ success: false, error: 'Not implemented in simplified context' }),
    deleteGoal: async () => ({ success: false, error: 'Not implemented in simplified context' }),
    getGoal: async () => null,
    refreshGoals: async () => {}
  };
}

// Hook para contacts (placeholder para compatibilidade)
export function useContacts() {
  const { state } = useUnified();
  
  return {
    contacts: state.contacts || [],
    loading: state.isLoading,
    error: null,
    createContact: async () => ({ success: false, error: 'Not implemented in simplified context' }),
    updateContact: async () => ({ success: false, error: 'Not implemented in simplified context' }),
    deleteContact: async () => ({ success: false, error: 'Not implemented in simplified context' }),
    getContact: async () => null,
    refreshContacts: async () => {}
  };
}

// Hook para investments (placeholder para compatibilidade)
export function useInvestments() {
  const { state } = useUnified();
  
  return {
    investments: state.investments || [],
    loading: state.isLoading,
    error: null,
    createInvestment: async () => ({ success: false, error: 'Not implemented in simplified context' }),
    updateInvestment: async () => ({ success: false, error: 'Not implemented in simplified context' }),
    deleteInvestment: async () => ({ success: false, error: 'Not implemented in simplified context' }),
    getInvestment: async () => null,
    refreshInvestments: async () => {}
  };
}