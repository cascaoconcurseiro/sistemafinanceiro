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

// Test React hooks import
// React hooks imported successfully

// Removendo import conflitante - usando interfaces locais
// import { Transaction, Account, Goal, Trip, Contact, Investment, SharedDebt } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '@/lib/events/event-bus';

// Interfaces locais para compatibilidade

// Estado unificado - TRANSAÇÕES COMO FONTE ÚNICA DE VERDADE
interface UnifiedState {
  // DADOS PRIMÁRIOS (persistidos)
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  trips: Trip[];
  contacts: Contact[];
  investments: Investment[];
  sharedDebts: SharedDebt[];
  
  // ESTADOS DE CARREGAMENTO
  loadingStates: {
    transactions: boolean;
    accounts: boolean;
    goals: boolean;
    trips: boolean;
    contacts: boolean;
    investments: boolean;
    sharedDebts: boolean;
  };
  
  // ESTADOS DE ERRO
  errors: {
    transactions: string | null;
    accounts: string | null;
    goals: string | null;
    trips: string | null;
    contacts: string | null;
    investments: string | null;
    sharedDebts: string | null;
  };
}

// DADOS DERIVADOS - CALCULADOS EM TEMPO REAL
interface DerivedData {
  // Saldos das contas (calculados das transações)
  accountBalances: Record<string, number>;
  
  // Métricas do dashboard
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  totalBalance: number;
  
  // Análises por categoria
  categoryBreakdown: Record<string, number>;
  
  // Transações recentes
  recentTransactions: Transaction[];
  
  // Análise de tendências
  monthlyTrends: {
    income: number[];
    expenses: number[];
    months: string[];
  };
  
  // NOVAS MÉTRICAS CENTRALIZADAS - SINGLE SOURCE OF TRUTH
  
  // Métricas mensais detalhadas
  monthlyMetrics: {
    currentMonth: {
      income: number;
      expenses: number;
      balance: number;
      transactionCount: number;
    };
    previousMonth: {
      income: number;
      expenses: number;
      balance: number;
      transactionCount: number;
    };
    yearToDate: {
      income: number;
      expenses: number;
      balance: number;
      transactionCount: number;
    };
  };
  
  // Métricas por conta (incluindo saldo correto)
  accountMetrics: Record<string, {
    balance: number;
    income: number;
    expenses: number;
    transactionCount: number;
    lastTransaction?: Transaction;
  }>;
  
  // Métricas por categoria detalhadas
  categoryMetrics: Record<string, {
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
    monthlyAverage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  
  // Transferências (agrupadas por ID de transferência)
  transfers: {
    id: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    description: string;
    transactions: Transaction[];
  }[];
  
  // Parcelamentos (agrupados por grupo de parcelamento)
  installments: {
    groupId: string;
    description: string;
    totalAmount: number;
    installmentCount: number;
    paidInstallments: number;
    remainingAmount: number;
    transactions: Transaction[];
  }[];
  
  // Cartões de crédito (transações agrupadas por fatura)
  creditCardInvoices: {
    cardAccountId: string;
    month: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
    status: 'pending' | 'paid' | 'overdue';
    transactions: Transaction[];
  }[];
}

// UTILITÁRIOS DE DATA CENTRALIZADOS - SINGLE SOURCE OF TRUTH
export const dateUtils = {
  getCurrentMonth: () => new Date().toISOString().substring(0, 7),
  getPreviousMonth: () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().substring(0, 7);
  },
  getCurrentYear: () => new Date().getFullYear().toString(),
  isInCurrentMonth: (date: string) => 
    date.startsWith(dateUtils.getCurrentMonth()),
  isInPreviousMonth: (date: string) => 
    date.startsWith(dateUtils.getPreviousMonth()),
  isInCurrentYear: (date: string) => 
    date.startsWith(dateUtils.getCurrentYear()),
  getMonthKey: (date: string) => 
    new Date(date).toISOString().substring(0, 7),
  formatMonthDisplay: (monthKey: string) => 
    new Date(monthKey + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
  isValidDate: (date: string) => !isNaN(new Date(date).getTime()),
  compareMonths: (month1: string, month2: string) => month1.localeCompare(month2)
};

// Tipos básicos para o contexto
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  accountId?: string;
  toAccountId?: string; // For transfers - destination account
  fromAccountId?: string; // For transfers - source account
  transferId?: string; // To connect transfer transactions
  createdAt?: string;
  updatedAt?: string;
}

interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  currency: string;
  status: 'planning' | 'planned' | 'active' | 'completed' | 'cancelled';
  participants: string[];
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  createdAt?: string;
  updatedAt?: string;
}

interface SharedDebt {
  id: string;
  description: string;
  amount: number;
  participants: string[];
  createdAt?: string;
  updatedAt?: string;
}

type ResourceType = 'transactions' | 'accounts' | 'goals' | 'contacts' | 'trips' | 'investments' | 'sharedDebts';

// Unified State Interface
interface UnifiedState {
  // Data
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  contacts: Contact[];
  trips: Trip[];
  investments: Investment[];
  sharedDebts: SharedDebt[];

  // UI State
  isLoading: boolean;
  isOnline: boolean;
  pendingOperations: number;
  lastSync: Date | null;

  // Error State
  errors: {
    transactions: string;
    accounts: string;
    goals: string;
    trips: string;
    contacts: string;
    investments: string;
    sharedDebts: string;
  };

  // Loading States per Resource
  loadingStates: Record<ResourceType, boolean>;
}

// Action Types
type UnifiedAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | {
      type: 'SET_RESOURCE_LOADING';
      payload: { resource: ResourceType; loading: boolean };
    }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { resource: string; error: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: string }
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'REMOVE_ACCOUNT'; payload: string }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'REMOVE_GOAL'; payload: string }
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'REMOVE_CONTACT'; payload: string }
  | { type: 'SET_TRIPS'; payload: Trip[] }
  | { type: 'ADD_TRIP'; payload: Trip }
  | { type: 'UPDATE_TRIP'; payload: Trip }
  | { type: 'REMOVE_TRIP'; payload: string }
  | { type: 'SET_INVESTMENTS'; payload: Investment[] }
  | { type: 'ADD_INVESTMENT'; payload: Investment }
  | { type: 'UPDATE_INVESTMENT'; payload: Investment }
  | { type: 'REMOVE_INVESTMENT'; payload: string }
  | { type: 'SET_SHARED_DEBTS'; payload: SharedDebt[] }
  | { type: 'ADD_SHARED_DEBT'; payload: SharedDebt }
  | { type: 'UPDATE_SHARED_DEBT'; payload: SharedDebt }
  | { type: 'REMOVE_SHARED_DEBT'; payload: string };

// Função para gerar IDs únicos
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initial State
const initialState: UnifiedState = {
  transactions: [],
  accounts: [],
  goals: [],
  contacts: [],
  trips: [],
  investments: [],
  sharedDebts: [],
  isLoading: false,
  isOnline:
    typeof window !== 'undefined' && window.navigator
      ? window.navigator.onLine
      : true,
  pendingOperations: 0,
  lastSync: null,
  errors: {
    transactions: '',
    accounts: '',
    goals: '',
    trips: '',
    contacts: '',
    investments: '',
    sharedDebts: '',
  },
  loadingStates: {
    transactions: false,
    accounts: false,
    goals: false,
    contacts: false,
    trips: false,
    investments: false,
    sharedDebts: false,
  },
};

// Reducer
function unifiedReducer(
  state: UnifiedState,
  action: UnifiedAction
): UnifiedState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_RESOURCE_LOADING':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.resource]: action.payload.loading,
        },
      };

    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.resource]: action.payload.error,
        },
      };

    case 'CLEAR_ERROR':
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return { ...state, errors: newErrors };

    // Transactions
    case 'SET_TRANSACTIONS':
      console.log('🔍 REDUCER SET_TRANSACTIONS - Payload recebido:', action.payload);
      console.log('🔍 REDUCER SET_TRANSACTIONS - Quantidade:', action.payload?.length || 0);
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'REMOVE_TRANSACTION':
      const validTransactionsForRemoval = Array.isArray(state.transactions) ? state.transactions : [];
      return {
        ...state,
        transactions: validTransactionsForRemoval.filter((t) => t.id !== action.payload),
      };

    // Accounts
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] };
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case 'REMOVE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.payload),
      };

    // Goals
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? action.payload : g
        ),
      };
    case 'REMOVE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      };

    // Contacts
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload };
    case 'ADD_CONTACT':
      return { ...state, contacts: [...state.contacts, action.payload] };
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'REMOVE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.payload),
      };

    // Trips
    case 'SET_TRIPS':
      return { ...state, trips: action.payload };
    case 'ADD_TRIP':
      return { ...state, trips: [...state.trips, action.payload] };
    case 'UPDATE_TRIP':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'REMOVE_TRIP':
      return {
        ...state,
        trips: state.trips.filter((t) => t.id !== action.payload),
      };

    // Investments
    case 'SET_INVESTMENTS':
      return { ...state, investments: action.payload };
    case 'ADD_INVESTMENT':
      return { ...state, investments: [...state.investments, action.payload] };
    case 'UPDATE_INVESTMENT':
      return {
        ...state,
        investments: state.investments.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case 'REMOVE_INVESTMENT':
      return {
        ...state,
        investments: state.investments.filter((i) => i.id !== action.payload),
      };

    // Shared Debts
    case 'SET_SHARED_DEBTS':
      return { ...state, sharedDebts: action.payload };
    case 'ADD_SHARED_DEBT':
      return { ...state, sharedDebts: [...state.sharedDebts, action.payload] };
    case 'UPDATE_SHARED_DEBT':
      return {
        ...state,
        sharedDebts: state.sharedDebts.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case 'REMOVE_SHARED_DEBT':
      return {
        ...state,
        sharedDebts: state.sharedDebts.filter((s) => s.id !== action.payload),
      };

    default:
      return state;
  }
}

// Context
interface UnifiedContextType {
  state: UnifiedState;
  actions: {
    // Generic CRUD operations
    create: (resource: ResourceType, data: any) => Promise<any>;
    update: (resource: ResourceType, id: string, data: any) => Promise<any>;
    delete: (resource: ResourceType, id: string) => Promise<boolean>;
    refreshData: (resource: ResourceType) => Promise<void>;

    // Transfer operation
    transfer: (fromAccountId: string, toAccountId: string, amount: number, description: string) => Promise<{ success: boolean; transactions: Transaction[] }>;

    // Credit card transaction with installments
    createCreditCardTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, installments?: number) => Promise<Transaction[]>;

    // Utility actions
    setLoading: (loading: boolean) => void;
    setResourceLoading: (resource: ResourceType, loading: boolean) => void;
    setError: (resource: string, error: string) => void;
    clearError: (resource: string) => void;
  };
}

const UnifiedContext = createContext<UnifiedContextType | undefined>(undefined);

// Provider
interface UnifiedProviderProps {
  children: ReactNode;
}

export function UnifiedProvider({ children }: { children: ReactNode }) {
  // Initialize state and dispatch
  const [state, dispatch] = useReducer(unifiedReducer, initialState);
  
  console.log('🔍 UNIFIED PROVIDER RENDERIZADO - Estado atual:', {
    transactionsLength: state.transactions?.length || 0,
    accountsLength: state.accounts?.length || 0,
    isLoading: state.isLoading
  });
  
  // Simple useEffect for initialization check
  useEffect(() => {
    console.log('🔍 TESTE SIMPLES - useEffect executado!');
  }, []);

  // Data initialization useEffect
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

        // Load all data using API routes
        console.log('🔄 Inicializando dados via API...');

        // Load accounts
        const accountsResponse = await fetch('/api/accounts');
        const accounts = accountsResponse.ok ? await accountsResponse.json() : [];
        console.log('📊 ACCOUNTS CARREGADAS:', accounts);

        // Load transactions
        const transactionsResponse = await fetch('/api/transactions');
        const transactions = transactionsResponse.ok ? await transactionsResponse.json() : [];
        console.log('💰 TRANSACTIONS CARREGADAS:', transactions);

        // Load goals
        const goalsResponse = await fetch('/api/goals');
        const goals = goalsResponse.ok ? await goalsResponse.json() : [];
        console.log('🎯 GOALS CARREGADAS:', goals);

        // Dispatch all data to state
        console.log('🔍 ANTES DO DISPATCH - Transações a serem enviadas:', transactions);
        dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
        dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
        dispatch({ type: 'SET_GOALS', payload: goals });
        dispatch({ type: 'SET_CONTACTS', payload: [] }); // TODO: Implement contacts API
        dispatch({ type: 'SET_TRIPS', payload: [] }); // TODO: Implement trips API
        dispatch({ type: 'SET_INVESTMENTS', payload: [] }); // TODO: Implement investments API
        dispatch({ type: 'SET_SHARED_DEBTS', payload: [] }); // TODO: Implement shared debts API

        console.log('✅ Dados carregados via API:', {
          accounts: accounts.length,
          transactions: transactions.length,
          goals: goals.length
        });

        // DEBUG: Verificar se os dados chegaram no state
        console.log('🔍 DEBUG - Estado após carregamento:', {
          accountsLength: accounts.length,
          transactionsLength: transactions.length,
          goalsLength: goals.length,
          sampleAccount: accounts[0],
          sampleTransaction: transactions[0]
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

  // Event Bus listeners useEffect
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    console.log('🔗 Conectando Unified Context ao Event Bus...');

    // Listener para criação de transações
    const unsubscribeTransactionCreated = eventBus.on('data:transaction:created', (transaction) => {
      console.log('📥 Evento recebido: transaction created', transaction);
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
    });

    // Listener para atualização de transações
    const unsubscribeTransactionUpdated = eventBus.on('data:transaction:updated', (transaction) => {
      console.log('📥 Evento recebido: transaction updated', transaction);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
    });

    // Listener para exclusão de transações
    const unsubscribeTransactionDeleted = eventBus.on('data:transaction:deleted', ({ id }) => {
      console.log('📥 Evento recebido: transaction deleted', id);
      dispatch({ type: 'REMOVE_TRANSACTION', payload: id });
    });

    // Listener para atualização de saldo de conta
    const unsubscribeAccountBalanceUpdated = eventBus.on('data:account:balance:updated', ({ accountId }) => {
      console.log('📥 Evento recebido: account balance updated', accountId);
      // O saldo é calculado automaticamente pelos derived data, não precisa de ação específica
      // Mas podemos forçar um re-render se necessário
    });

    // Cleanup function para remover listeners
    return () => {
      unsubscribeTransactionCreated();
      unsubscribeTransactionUpdated();
      unsubscribeTransactionDeleted();
      unsubscribeAccountBalanceUpdated();
      console.log('🔌 Event Bus listeners removidos');
    };
  }, []);

  // Actions object with all CRUD operations
  const actions = {
    setLoading: (loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    },
    setResourceLoading: (resource: ResourceType, loading: boolean) => {
      dispatch({ type: 'SET_RESOURCE_LOADING', payload: { resource, loading } });
    },

    // Create operations
    create: async (resource: ResourceType, data: any) => {
      try {
        dispatch({ type: 'SET_RESOURCE_LOADING', payload: { resource, loading: true } });
        
        // Guards defensivos para validar dados de entrada
        if (!data || typeof data !== 'object') {
          throw new Error('Dados inválidos: objeto de dados é obrigatório');
        }

        // Validações específicas por tipo de recurso
        switch (resource) {
          case 'transactions':
            if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
              throw new Error('Descrição da transação é obrigatória');
            }
            if (typeof data.amount !== 'number' || data.amount <= 0 || !isFinite(data.amount)) {
              throw new Error('Valor da transação deve ser um número positivo válido');
            }
            if (!data.accountId || typeof data.accountId !== 'string') {
              throw new Error('ID da conta é obrigatório');
            }
            if (!data.type || !['income', 'expense'].includes(data.type)) {
              throw new Error('Tipo da transação deve ser "income" ou "expense"');
            }
            if (!data.category || typeof data.category !== 'string' || data.category.trim() === '') {
              throw new Error('Categoria da transação é obrigatória');
            }
            // Verificar se a conta existe
            const accountExists = state.accounts.some(account => account.id === data.accountId);
            if (!accountExists) {
              throw new Error('Conta especificada não existe');
            }
            break;

          case 'accounts':
            if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
              throw new Error('Nome da conta é obrigatório');
            }
            if (!data.type || !['checking', 'savings', 'credit', 'investment'].includes(data.type)) {
              throw new Error('Tipo de conta inválido');
            }
            if (typeof data.balance !== 'number' || !isFinite(data.balance)) {
              throw new Error('Saldo inicial deve ser um número válido');
            }
            // Verificar se já existe uma conta com o mesmo nome
            const duplicateAccount = state.accounts.some(account => 
              account.name.toLowerCase() === data.name.toLowerCase()
            );
            if (duplicateAccount) {
              throw new Error('Já existe uma conta com este nome');
            }
            break;

          case 'goals':
            if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
              throw new Error('Nome da meta é obrigatório');
            }
            if (typeof data.targetAmount !== 'number' || data.targetAmount <= 0 || !isFinite(data.targetAmount)) {
              throw new Error('Valor alvo deve ser um número positivo válido');
            }
            if (typeof data.currentAmount !== 'number' || data.currentAmount < 0 || !isFinite(data.currentAmount)) {
              throw new Error('Valor atual deve ser um número não negativo válido');
            }
            if (data.currentAmount > data.targetAmount) {
              throw new Error('Valor atual não pode ser maior que o valor alvo');
            }
            if (data.targetDate) {
              const targetDate = new Date(data.targetDate);
              if (isNaN(targetDate.getTime()) || targetDate <= new Date()) {
                throw new Error('Data alvo deve ser uma data válida no futuro');
              }
            }
            break;

          case 'contacts':
            if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
              throw new Error('Nome do contato é obrigatório');
            }
            if (data.email && (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) {
              throw new Error('Email deve ter um formato válido');
            }
            if (data.phone && typeof data.phone !== 'string') {
              throw new Error('Telefone deve ser uma string válida');
            }
            break;

          case 'trips':
            if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
              throw new Error('Nome da viagem é obrigatório');
            }
            if (!data.destination || typeof data.destination !== 'string' || data.destination.trim() === '') {
              throw new Error('Destino da viagem é obrigatório');
            }
            if (typeof data.budget !== 'number' || data.budget <= 0 || !isFinite(data.budget)) {
              throw new Error('Orçamento deve ser um número positivo válido');
            }
            if (data.startDate && data.endDate) {
              const startDate = new Date(data.startDate);
              const endDate = new Date(data.endDate);
              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('Datas de início e fim devem ser válidas');
              }
              if (startDate >= endDate) {
                throw new Error('Data de início deve ser anterior à data de fim');
              }
            }
            break;

          case 'investments':
            if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
              throw new Error('Nome do investimento é obrigatório');
            }
            if (typeof data.amount !== 'number' || data.amount <= 0 || !isFinite(data.amount)) {
              throw new Error('Valor do investimento deve ser um número positivo válido');
            }
            if (!data.type || typeof data.type !== 'string' || data.type.trim() === '') {
              throw new Error('Tipo do investimento é obrigatório');
            }
            break;

          case 'sharedDebts':
            if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
              throw new Error('Descrição da dívida compartilhada é obrigatória');
            }
            if (typeof data.amount !== 'number' || data.amount <= 0 || !isFinite(data.amount)) {
              throw new Error('Valor da dívida deve ser um número positivo válido');
            }
            if (!data.participants || !Array.isArray(data.participants) || data.participants.length === 0) {
              throw new Error('Lista de participantes é obrigatória e deve conter pelo menos um participante');
            }
            break;

          default:
            throw new Error(`Tipo de recurso desconhecido: ${resource}`);
        }
        
        let result;
        // Implementation for create operations using FinancialDataAdapter
        switch (resource) {
          case 'transactions':
// 
            result = { ...data, id: uuidv4() }; // Temporary placeholder
            if (!result || !result.id) {
              throw new Error('Falha ao criar transação: resultado inválido');
            }
            dispatch({ type: 'ADD_TRANSACTION', payload: result });
            break;
          case 'accounts':
            result = { ...data, id: uuidv4() }; // Temporary placeholder
            if (!result || !result.id) {
              throw new Error('Falha ao criar conta: resultado inválido');
            }
            dispatch({ type: 'ADD_ACCOUNT', payload: result });
            break;
          case 'goals':
            result = { ...data, id: uuidv4() }; // Temporary placeholder
            if (!result || !result.id) {
              throw new Error('Falha ao criar meta: resultado inválido');
            }
            dispatch({ type: 'ADD_GOAL', payload: result });
            break;
          case 'contacts':
            result = { ...data, id: uuidv4() }; // Temporary placeholder
            if (!result || !result.id) {
              throw new Error('Falha ao criar contato: resultado inválido');
            }
            dispatch({ type: 'ADD_CONTACT', payload: result });
            break;
          case 'trips':
            result = { ...data, id: uuidv4() }; // Temporary placeholder
            if (!result || !result.id) {
              throw new Error('Falha ao criar viagem: resultado inválido');
            }
            dispatch({ type: 'ADD_TRIP', payload: result });
            break;
          case 'investments':
            result = { ...data, id: uuidv4() }; // Temporary placeholder
            if (!result || !result.id) {
              throw new Error('Falha ao criar investimento: resultado inválido');
            }
            dispatch({ type: 'ADD_INVESTMENT', payload: result });
            break;
          case 'sharedDebts':
            result = { ...data, id: uuidv4() }; // Temporary placeholder
            if (!result || !result.id) {
              throw new Error('Falha ao criar dívida compartilhada: resultado inválido');
            }
            dispatch({ type: 'ADD_SHARED_DEBT', payload: result });
            break;
          default:
            throw new Error(`Tipo de recurso desconhecido: ${resource}`);
        }
        
        dispatch({ type: 'SET_RESOURCE_LOADING', payload: { resource, loading: false } });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        dispatch({ type: 'SET_ERROR', payload: { resource, error: errorMessage } });
        dispatch({ type: 'SET_RESOURCE_LOADING', payload: { resource, loading: false } });
        console.error(`Erro ao criar ${resource}:`, error);
        throw error;
      }
    },

    setError: (resource: string, error: string) => {
      dispatch({ type: 'SET_ERROR', payload: { resource, error } });
    },

    clearError: (resource: string) => {
      dispatch({ type: 'CLEAR_ERROR', payload: resource });
    },

    refreshData: async (resource: ResourceType) => {
      try {
        actions.setResourceLoading(resource, true);
        
        switch (resource) {
          case 'transactions':
            const transactionsResponse = await fetch('/api/transactions');
            if (transactionsResponse.ok) {
              const transactions = await transactionsResponse.json();
              dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
            }
            break;
            
          case 'accounts':
            const accountsResponse = await fetch('/api/accounts');
            if (accountsResponse.ok) {
              const accounts = await accountsResponse.json();
              dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
            }
            break;
            
          case 'goals':
            const goalsResponse = await fetch('/api/goals');
            if (goalsResponse.ok) {
              const goals = await goalsResponse.json();
              dispatch({ type: 'SET_GOALS', payload: goals });
            }
            break;
            
          case 'contacts':
            const contactsResponse = await fetch('/api/contacts');
            if (contactsResponse.ok) {
              const contacts = await contactsResponse.json();
              dispatch({ type: 'SET_CONTACTS', payload: contacts });
            }
            break;
            
          case 'trips':
            const tripsResponse = await fetch('/api/trips');
            if (tripsResponse.ok) {
              const trips = await tripsResponse.json();
              dispatch({ type: 'SET_TRIPS', payload: trips });
            }
            break;
            
          case 'investments':
            const investmentsResponse = await fetch('/api/investments');
            if (investmentsResponse.ok) {
              const investments = await investmentsResponse.json();
              dispatch({ type: 'SET_INVESTMENTS', payload: investments });
            }
            break;
            
          case 'sharedDebts':
            const sharedDebtsResponse = await fetch('/api/shared-debts');
            if (sharedDebtsResponse.ok) {
              const sharedDebts = await sharedDebtsResponse.json();
              dispatch({ type: 'SET_SHARED_DEBTS', payload: sharedDebts });
            }
            break;
            
          default:
            console.warn(`Refresh não implementado para o recurso: ${resource}`);
        }
      } catch (error) {
        console.error(`Erro ao atualizar ${resource}:`, error);
        actions.setError(resource, error instanceof Error ? error.message : 'Erro desconhecido');
      } finally {
        actions.setResourceLoading(resource, false);
      }
    },

    // Transfer operation - creates two connected transactions
    transfer: async (fromAccountId: string, toAccountId: string, amount: number, description: string) => {
      try {
        // Guards defensivos para validar dados de entrada
        if (!fromAccountId || typeof fromAccountId !== 'string' || fromAccountId.trim() === '') {
          throw new Error('ID da conta de origem é obrigatório');
        }

        if (!toAccountId || typeof toAccountId !== 'string' || toAccountId.trim() === '') {
          throw new Error('ID da conta de destino é obrigatório');
        }

        if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
          throw new Error('Valor da transferência deve ser um número positivo válido');
        }

        if (!description || typeof description !== 'string' || description.trim() === '') {
          throw new Error('Descrição da transferência é obrigatória');
        }

        if (fromAccountId === toAccountId) {
          throw new Error('Não é possível transferir para a mesma conta');
        }

        // Find accounts
        const fromAccount = state.accounts.find(a => a.id === fromAccountId);
        const toAccount = state.accounts.find(a => a.id === toAccountId);

        if (!fromAccount) {
          throw new Error('Conta de origem não encontrada');
        }

        if (!toAccount) {
          throw new Error('Conta de destino não encontrada');
        }

        // Verificar se as contas são válidas para transferência
        if (!fromAccount.id || !toAccount.id) {
          throw new Error('Contas inválidas para transferência');
        }

        // Calcular saldo atual das transações usando finance-engine
        const validTransactions = Array.isArray(state.transactions) ? state.transactions : [];
        const fromAccountTransactions = validTransactions.filter(t => t.accountId === fromAccountId);
        const fromBalance = getSaldoGlobal(fromAccountTransactions, [fromAccount]);

        if (fromBalance.saldoTotal < amount) {
          throw new Error('Saldo insuficiente na conta de origem');
        }

        // Generate a unique transfer ID to connect the transactions
        const transferId = generateUniqueId();
        const currentDate = new Date().toISOString();

        // Validar se o transferId foi gerado corretamente
        if (!transferId || typeof transferId !== 'string') {
          throw new Error('Falha ao gerar ID da transferência');
        }

        // Create debit transaction (expense from source account)
        const debitTransaction: Transaction = {
          id: generateUniqueId(),
          description: `${description.trim()} - Para ${toAccount.name}`,
          amount: amount,
          date: currentDate,
          category: 'Transferência',
          type: 'expense',
          accountId: fromAccountId,
          toAccountId: toAccountId, // Connect to destination account
          transferId: transferId, // Connect both transactions
          createdAt: currentDate,
          updatedAt: currentDate,
        };

        // Create credit transaction (income to destination account)
        const creditTransaction: Transaction = {
          id: generateUniqueId(),
          description: `${description.trim()} - De ${fromAccount.name}`,
          amount: amount,
          date: currentDate,
          category: 'Transferência',
          type: 'income',
          accountId: toAccountId,
          fromAccountId: fromAccountId, // Connect to source account
          transferId: transferId, // Connect both transactions
          createdAt: currentDate,
          updatedAt: currentDate,
        };

        // Validar se as transações foram criadas corretamente
        if (!debitTransaction.id || !creditTransaction.id) {
          throw new Error('Falha ao gerar IDs das transações');
        }

        // Add both transactions using FinancialDataAdapter
        // const savedDebitTransaction = await financialDataAdapter.createTransaction(debitTransaction);
        // const savedCreditTransaction = await financialDataAdapter.createTransaction(creditTransaction);
        
        // Implementação temporária
        const savedDebitTransaction = debitTransaction;
        const savedCreditTransaction = creditTransaction;
        
        // Verificar se as transações foram salvas com sucesso
        if (!savedDebitTransaction || !savedDebitTransaction.id) {
          throw new Error('Falha ao salvar transação de débito');
        }

        if (!savedCreditTransaction || !savedCreditTransaction.id) {
          throw new Error('Falha ao salvar transação de crédito');
        }

        dispatch({ type: 'ADD_TRANSACTION', payload: savedDebitTransaction });
        dispatch({ type: 'ADD_TRANSACTION', payload: savedCreditTransaction });

        return {
          success: true,
          transactions: [savedDebitTransaction, savedCreditTransaction],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro na transferência';
        dispatch({
          type: 'SET_ERROR',
          payload: { resource: 'transfer', error: errorMessage },
        });
        console.error('Erro na transferência:', error);
        throw error;
      }
    },

    // Credit card transaction with installments
    createCreditCardTransaction: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, installments?: number) => {
      try {
        // const transactions = financialEngine.createCreditCardTransaction(transaction, installments);
        
        // Implementação temporária para transações de cartão de crédito
        const transactions: Transaction[] = [];
        const installmentCount = installments || 1;
        const installmentAmount = transaction.amount / installmentCount;
        
        for (let i = 0; i < installmentCount; i++) {
          const installmentDate = new Date(transaction.date);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          transactions.push({
            ...transaction,
            id: uuidv4(),
            amount: installmentAmount,
            date: installmentDate.toISOString(),
            description: `${transaction.description} (${i + 1}/${installmentCount})`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        // Add all transactions to state
        for (const trans of transactions) {
          dispatch({ type: 'ADD_TRANSACTION', payload: trans });
        }

        return transactions;
      } catch (error) {
        console.error('Erro ao criar transação de cartão de crédito:', error);
        throw error;
      }
    },

    update: async (resource: ResourceType, id: string, data: any) => {
      try {
        dispatch({
          type: 'SET_RESOURCE_LOADING',
          payload: { resource, loading: true },
        });

        // Guards defensivos para validar dados de entrada
        if (!id || typeof id !== 'string' || id.trim() === '') {
          throw new Error('ID é obrigatório para atualização');
        }

        if (!data || typeof data !== 'object') {
          throw new Error('Dados inválidos: objeto de dados é obrigatório');
        }

        // Validações específicas por tipo de recurso
        switch (resource) {
          case 'transactions':
            if (data.description !== undefined && (typeof data.description !== 'string' || data.description.trim() === '')) {
              throw new Error('Descrição da transação deve ser uma string não vazia');
            }
            if (data.amount !== undefined && (typeof data.amount !== 'number' || data.amount <= 0 || !isFinite(data.amount))) {
              throw new Error('Valor da transação deve ser um número positivo válido');
            }
            if (data.accountId !== undefined && (typeof data.accountId !== 'string' || data.accountId.trim() === '')) {
              throw new Error('ID da conta deve ser uma string não vazia');
            }
            if (data.type !== undefined && !['income', 'expense'].includes(data.type)) {
              throw new Error('Tipo da transação deve ser "income" ou "expense"');
            }
            if (data.category !== undefined && (typeof data.category !== 'string' || data.category.trim() === '')) {
              throw new Error('Categoria da transação deve ser uma string não vazia');
            }
            // Verificar se a transação existe
            const transactionExists = state.transactions.some(transaction => transaction.id === id);
            if (!transactionExists) {
              throw new Error('Transação não encontrada');
            }
            // Verificar se a conta existe (se fornecida)
            if (data.accountId) {
              const accountExists = state.accounts.some(account => account.id === data.accountId);
              if (!accountExists) {
                throw new Error('Conta especificada não existe');
              }
            }
            break;

          case 'accounts':
            if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
              throw new Error('Nome da conta deve ser uma string não vazia');
            }
            if (data.type !== undefined && !['checking', 'savings', 'credit', 'investment'].includes(data.type)) {
              throw new Error('Tipo de conta inválido');
            }
            if (data.balance !== undefined && (typeof data.balance !== 'number' || !isFinite(data.balance))) {
              throw new Error('Saldo deve ser um número válido');
            }
            // Verificar se a conta existe
            const accountToUpdate = state.accounts.find(account => account.id === id);
            if (!accountToUpdate) {
              throw new Error('Conta não encontrada');
            }
            // Verificar duplicação de nome (se fornecido)
            if (data.name && data.name.toLowerCase() !== accountToUpdate.name.toLowerCase()) {
              const duplicateAccount = state.accounts.some(account => 
                account.id !== id && account.name.toLowerCase() === data.name.toLowerCase()
              );
              if (duplicateAccount) {
                throw new Error('Já existe uma conta com este nome');
              }
            }
            break;

          case 'goals':
            if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
              throw new Error('Nome da meta deve ser uma string não vazia');
            }
            if (data.targetAmount !== undefined && (typeof data.targetAmount !== 'number' || data.targetAmount <= 0 || !isFinite(data.targetAmount))) {
              throw new Error('Valor alvo deve ser um número positivo válido');
            }
            if (data.currentAmount !== undefined && (typeof data.currentAmount !== 'number' || data.currentAmount < 0 || !isFinite(data.currentAmount))) {
              throw new Error('Valor atual deve ser um número não negativo válido');
            }
            // Verificar se a meta existe
            const goalExists = state.goals.some(goal => goal.id === id);
            if (!goalExists) {
              throw new Error('Meta não encontrada');
            }
            // Validar relação entre valores atual e alvo
            const existingGoal = state.goals.find(goal => goal.id === id);
            if (existingGoal) {
              const newCurrentAmount = data.currentAmount !== undefined ? data.currentAmount : existingGoal.currentAmount;
              const newTargetAmount = data.targetAmount !== undefined ? data.targetAmount : existingGoal.targetAmount;
              if (newCurrentAmount > newTargetAmount) {
                throw new Error('Valor atual não pode ser maior que o valor alvo');
              }
            }
            if (data.targetDate !== undefined && data.targetDate !== null) {
              const targetDate = new Date(data.targetDate);
              if (isNaN(targetDate.getTime()) || targetDate <= new Date()) {
                throw new Error('Data alvo deve ser uma data válida no futuro');
              }
            }
            break;

          case 'contacts':
            if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
              throw new Error('Nome do contato deve ser uma string não vazia');
            }
            if (data.email !== undefined && data.email !== null && (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) {
              throw new Error('Email deve ter um formato válido');
            }
            if (data.phone !== undefined && data.phone !== null && typeof data.phone !== 'string') {
              throw new Error('Telefone deve ser uma string válida');
            }
            // Verificar se o contato existe
            const contactExists = state.contacts.some(contact => contact.id === id);
            if (!contactExists) {
              throw new Error('Contato não encontrado');
            }
            break;

          case 'trips':
            if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
              throw new Error('Nome da viagem deve ser uma string não vazia');
            }
            if (data.destination !== undefined && (typeof data.destination !== 'string' || data.destination.trim() === '')) {
              throw new Error('Destino da viagem deve ser uma string não vazia');
            }
            if (data.budget !== undefined && (typeof data.budget !== 'number' || data.budget <= 0 || !isFinite(data.budget))) {
              throw new Error('Orçamento deve ser um número positivo válido');
            }
            // Verificar se a viagem existe
            const tripExists = state.trips.some(trip => trip.id === id);
            if (!tripExists) {
              throw new Error('Viagem não encontrada');
            }
            // Validar datas se fornecidas
            const existingTrip = state.trips.find(trip => trip.id === id);
            if (existingTrip && (data.startDate !== undefined || data.endDate !== undefined)) {
              const newStartDate = data.startDate !== undefined ? new Date(data.startDate) : new Date(existingTrip.startDate);
              const newEndDate = data.endDate !== undefined ? new Date(data.endDate) : new Date(existingTrip.endDate);
              if (isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
                throw new Error('Datas de início e fim devem ser válidas');
              }
              if (newStartDate >= newEndDate) {
                throw new Error('Data de início deve ser anterior à data de fim');
              }
            }
            break;

          case 'investments':
            if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
              throw new Error('Nome do investimento deve ser uma string não vazia');
            }
            if (data.amount !== undefined && (typeof data.amount !== 'number' || data.amount <= 0 || !isFinite(data.amount))) {
              throw new Error('Valor do investimento deve ser um número positivo válido');
            }
            if (data.type !== undefined && (typeof data.type !== 'string' || data.type.trim() === '')) {
              throw new Error('Tipo do investimento deve ser uma string não vazia');
            }
            // Verificar se o investimento existe
            const investmentExists = state.investments.some(investment => investment.id === id);
            if (!investmentExists) {
              throw new Error('Investimento não encontrado');
            }
            break;

          case 'sharedDebts':
            if (data.description !== undefined && (typeof data.description !== 'string' || data.description.trim() === '')) {
              throw new Error('Descrição da dívida compartilhada deve ser uma string não vazia');
            }
            if (data.amount !== undefined && (typeof data.amount !== 'number' || data.amount <= 0 || !isFinite(data.amount))) {
              throw new Error('Valor da dívida deve ser um número positivo válido');
            }
            if (data.participants !== undefined && (!Array.isArray(data.participants) || data.participants.length === 0)) {
              throw new Error('Lista de participantes deve ser um array não vazio');
            }
            // Verificar se a dívida compartilhada existe
            const sharedDebtExists = state.sharedDebts.some(debt => debt.id === id);
            if (!sharedDebtExists) {
              throw new Error('Dívida compartilhada não encontrada');
            }
            break;

          default:
            throw new Error(`Tipo de recurso desconhecido: ${resource}`);
        }

        let result;
        // Update using FinancialDataAdapter
        switch (resource) {
          case 'transactions':
// 
            if (!result || !result.id) {
              throw new Error('Falha ao atualizar transação: resultado inválido');
            }
            dispatch({ type: 'UPDATE_TRANSACTION', payload: result });
            break;
          case 'accounts':
// 
            if (!result || !result.id) {
              throw new Error('Falha ao atualizar conta: resultado inválido');
            }
            dispatch({ type: 'UPDATE_ACCOUNT', payload: result });
            break;
          case 'goals':
// 
            if (!result || !result.id) {
              throw new Error('Falha ao atualizar meta: resultado inválido');
            }
            dispatch({ type: 'UPDATE_GOAL', payload: result });
            break;
          case 'contacts':
// 
            if (!result || !result.id) {
              throw new Error('Falha ao atualizar contato: resultado inválido');
            }
            dispatch({ type: 'UPDATE_CONTACT', payload: result });
            break;
          case 'trips':
// 
            if (!result || !result.id) {
              throw new Error('Falha ao atualizar viagem: resultado inválido');
            }
            dispatch({ type: 'UPDATE_TRIP', payload: result });
            break;
          case 'investments':
// 
            if (!result || !result.id) {
              throw new Error('Falha ao atualizar investimento: resultado inválido');
            }
            dispatch({ type: 'UPDATE_INVESTMENT', payload: result });
            break;
          case 'sharedDebts':
// 
            if (!result || !result.id) {
              throw new Error('Falha ao atualizar dívida compartilhada: resultado inválido');
            }
            dispatch({ type: 'UPDATE_SHARED_DEBT', payload: result });
            break;
          default:
            throw new Error(`Tipo de recurso desconhecido: ${resource}`);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        dispatch({
          type: 'SET_ERROR',
          payload: { resource, error: errorMessage },
        });
        console.error(`Erro ao atualizar ${resource}:`, error);
        throw error;
      } finally {
        dispatch({
          type: 'SET_RESOURCE_LOADING',
          payload: { resource, loading: false },
        });
      }
    },

    delete: async (resource: ResourceType, id: string) => {
      try {
        dispatch({
          type: 'SET_RESOURCE_LOADING',
          payload: { resource, loading: true },
        });

        // Guards defensivos para validar dados de entrada
        if (!id || typeof id !== 'string' || id.trim() === '') {
          throw new Error('ID é obrigatório para exclusão');
        }

        // Verificar se o recurso existe antes de tentar excluir
        let resourceExists = false;
        let resourceToDelete: any = null;

        switch (resource) {
          case 'transactions':
            resourceToDelete = state.transactions.find(transaction => transaction.id === id);
            resourceExists = !!resourceToDelete;
            break;
          case 'accounts':
            resourceToDelete = state.accounts.find(account => account.id === id);
            resourceExists = !!resourceToDelete;
            // Verificar se a conta tem transações associadas
            if (resourceExists) {
              const hasTransactions = state.transactions.some(transaction => transaction.accountId === id);
              if (hasTransactions) {
                throw new Error('Não é possível excluir conta que possui transações associadas');
              }
            }
            break;
          case 'goals':
            resourceToDelete = state.goals.find(goal => goal.id === id);
            resourceExists = !!resourceToDelete;
            break;
          case 'contacts':
            resourceToDelete = state.contacts.find(contact => contact.id === id);
            resourceExists = !!resourceToDelete;
            break;
          case 'trips':
            resourceToDelete = state.trips.find(trip => trip.id === id);
            resourceExists = !!resourceToDelete;
            break;
          case 'investments':
            resourceToDelete = state.investments.find(investment => investment.id === id);
            resourceExists = !!resourceToDelete;
            break;
          case 'sharedDebts':
            resourceToDelete = state.sharedDebts.find(debt => debt.id === id);
            resourceExists = !!resourceToDelete;
            break;
          default:
            throw new Error(`Tipo de recurso desconhecido: ${resource}`);
        }

        if (!resourceExists) {
          throw new Error(`${resource.charAt(0).toUpperCase() + resource.slice(1)} não encontrado(a) para exclusão`);
        }

        // Delete using FinancialDataAdapter
        switch (resource) {
          case 'transactions':
// 
            dispatch({ type: 'REMOVE_TRANSACTION', payload: id });
            break;
          case 'accounts':
// 
            dispatch({ type: 'REMOVE_ACCOUNT', payload: id });
            break;
          case 'goals':
// 
            dispatch({ type: 'REMOVE_GOAL', payload: id });
            break;
          case 'contacts':
// 
            dispatch({ type: 'REMOVE_CONTACT', payload: id });
            break;
          case 'trips':
// 
            dispatch({ type: 'REMOVE_TRIP', payload: id });
            break;
          case 'investments':
// 
            dispatch({ type: 'REMOVE_INVESTMENT', payload: id });
            break;
          case 'sharedDebts':
// 
            dispatch({ type: 'REMOVE_SHARED_DEBT', payload: id });
            break;
          default:
            throw new Error(`Tipo de recurso desconhecido: ${resource}`);
        }

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        dispatch({
          type: 'SET_ERROR',
          payload: { resource, error: errorMessage },
        });
        console.error(`Erro ao deletar ${resource}:`, error);
        return false;
      } finally {
        dispatch({
          type: 'SET_RESOURCE_LOADING',
          payload: { resource, loading: false },
        });
      }
    },
  };

  return (
    <UnifiedContext.Provider value={{ state, actions }}>
      {children}
    </UnifiedContext.Provider>
  );
}

// Base hook
export function useUnified() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useUnified must be used within a UnifiedProvider');
  }
  
  // Função para calcular resumo de período usando o financial engine
  const getPeriodSummary = useCallback((startDate: string, endDate: string, accountIds?: string[]) => {
    // return financialEngine.calculatePeriodSummary(
    //   context.state.transactions,
    //   startDate,
    //   endDate,
    //   accountIds
    // );
    
    // Implementação temporária
    const validTransactions = Array.isArray(context.state.transactions) ? context.state.transactions : [];
    const filteredTransactions = validTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const matchesDate = transactionDate >= start && transactionDate <= end;
      const matchesAccount = !accountIds || accountIds.includes(t.accountId);
      return matchesDate && matchesAccount;
    });
    
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expenses,
      balance: income - expenses,
      transactionCount: filteredTransactions.length
    };
  }, [context.state.transactions]);

  // Função para calcular saldo de uma conta - SIMPLIFICADA
  const getAccountBalance = useCallback((accountId: string) => {
    const validAccounts = Array.isArray(context.state.accounts) ? context.state.accounts : [];
    const account = validAccounts.find(a => a.id === accountId);
    
    // Retornar o saldo da conta diretamente do banco de dados
    // O saldo já é calculado automaticamente pela API quando transações são criadas
    return account ? (typeof account.balance === 'number' ? account.balance : parseFloat(account.balance) || 0) : 0;
  }, [context.state?.accounts]);

  const getRunningBalance = useCallback((transactionId: string): number => {
    const transaction = context.state.transactions.find(t => t.id === transactionId);
    if (!transaction || !transaction.accountId) return 0;
    
    // Obter saldo atual da conta
    const account = context.state.accounts.find(a => a.id === transaction.accountId);
    const currentBalance = account ? (typeof account.balance === 'number' ? account.balance : parseFloat(account.balance) || 0) : 0;
    
    // Ordenar TODAS as transações da conta por data (mais recentes primeiro)
    const sortedTransactions = context.state.transactions
      .filter(t => t.accountId === transaction.accountId || t.toAccountId === transaction.accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calcular saldo na data da transação, começando do saldo atual e voltando no tempo
    let runningBalance = currentBalance;
    
    // Subtrair todas as transações posteriores à transação alvo
    for (const t of sortedTransactions) {
      if (new Date(t.date) > new Date(transaction.date) || 
          (new Date(t.date).getTime() === new Date(transaction.date).getTime() && t.id !== transactionId)) {
        
        if (t.accountId === transaction.accountId) {
          // Transação de saída/entrada da conta - reverter o efeito
          runningBalance -= t.type === 'income' ? t.amount : -t.amount;
        } else if (t.toAccountId === transaction.accountId) {
          // Transferência de entrada na conta - reverter o efeito
          runningBalance -= t.amount;
        }
      }
    }
    
    return runningBalance;
  }, [context.state.transactions, context.state.accounts]);
  
  // Calcular dados derivados para compatibilidade com outros hooks
  const derivedData = useMemo(() => calculateDerivedData(context.state), [context.state.accounts, context.state.transactions]);

  return {
    // Spread all state properties directly
    ...context.state,
    // Include actions
    ...context.actions,
    // Add custom functions
    getPeriodSummary,
    getAccountBalance,
    getRunningBalance,
    // Keep loading state for backward compatibility - return the main loading state
    loading: context.state.isLoading,
    // Add balances object for compatibility with other hooks
    balances: {
      totalBalance: derivedData.totalBalance,
      totalIncome: derivedData.totalIncome,
      totalExpenses: derivedData.totalExpenses,
      netIncome: derivedData.netIncome,
      accountBalances: derivedData.accountBalances,
      monthlyReports: derivedData.monthlyTrends ? [
        {
          month: 'Atual',
          income: derivedData.monthlyMetrics?.currentMonth?.income || 0,
          expenses: derivedData.monthlyMetrics?.currentMonth?.expenses || 0,
          balance: derivedData.monthlyMetrics?.currentMonth?.balance || 0
        }
      ] : [],
      categoryStats: Object.entries(derivedData.categoryBreakdown || {}).map(([name, amount]) => ({
        name,
        amount: typeof amount === 'number' ? amount : 0,
        percentage: derivedData.totalExpenses > 0 ? ((typeof amount === 'number' ? amount : 0) / derivedData.totalExpenses) * 100 : 0,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      })),
      expensesByCategory: Object.entries(derivedData.categoryBreakdown || {}).map(([name, amount]) => ({
        name,
        amount: typeof amount === 'number' ? amount : 0,
        percentage: derivedData.totalExpenses > 0 ? ((typeof amount === 'number' ? amount : 0) / derivedData.totalExpenses) * 100 : 0,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      })),
      monthlyGrowth: {
        income: derivedData.monthlyMetrics?.currentMonth?.income - derivedData.monthlyMetrics?.previousMonth?.income || 0,
        expenses: derivedData.monthlyMetrics?.currentMonth?.expenses - derivedData.monthlyMetrics?.previousMonth?.expenses || 0
      }
    }
  };
}

// Convenience hooks
export function useTransactions() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a UnifiedProvider');
  }
  const { state, actions } = context;
  return {
    transactions: state.transactions,
    isLoading: state.loadingStates.transactions,
    error: state.errors.transactions,
    create: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) =>
      actions.create('transactions', data),
    update: (id: string, data: Partial<Transaction>) =>
      actions.update('transactions', id, data),
    delete: (id: string) => actions.delete('transactions', id),
    refresh: () => actions.refreshData('transactions'),
  };
}

export function useAccounts() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within a UnifiedProvider');
  }
  const { state, actions } = context;
  
  // Calcular dados derivados em tempo real com memoização para evitar recálculos desnecessários
  const derivedData = useMemo(() => calculateDerivedData(state), [state.accounts, state.transactions]);
  
  return {
    accounts: state.accounts,
    isLoading: state.loadingStates.accounts,
    error: state.errors.accounts,
    
    // Saldos calculados das transações (Single Source of Truth)
    accountBalances: derivedData.accountBalances,
    
    create: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) =>
      actions.create('accounts', data),
    update: (id: string, data: Partial<Account>) =>
      actions.update('accounts', id, data),
    delete: (id: string) => actions.delete('accounts', id),
    refresh: () => actions.refreshData('accounts'),
    
    // Função para obter saldo de conta específica (calculado das transações)
    getAccountBalance: (accountId: string) => derivedData.accountBalances[accountId] || 0,
    
    // Transferência entre contas - APENAS CRIA TRANSAÇÕES
    transferBetweenAccounts: async (
      fromId: string,
      toId: string,
      amount: number,
      description?: string
    ) => {
      const fromAccount = state.accounts.find((a) => a.id === fromId);
      const toAccount = state.accounts.find((a) => a.id === toId);

      if (!fromAccount || !toAccount) {
        throw new Error('Conta não encontrada');
      }

      // Verificar saldo calculado das transações
      const fromBalance = derivedData.accountBalances[fromId] || 0;
      if (fromBalance < amount) {
        throw new Error('Saldo insuficiente');
      }

      // Usar a função de transferência do contexto unificado
      return await actions.transfer(fromId, toId, amount, description || 'Transferência');
    },
  };
}

export function useGoals() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a UnifiedProvider');
  }
  const { state, actions } = context;
  return {
    goals: state.goals,
    isLoading: state.loadingStates.goals,
    error: state.errors.goals,
    create: (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) =>
      actions.create('goals', data),
    update: (id: string, data: Partial<Goal>) =>
      actions.update('goals', id, data),
    delete: (id: string) => actions.delete('goals', id),
    refresh: () => actions.refreshData('goals'),
  };
}

export function useContacts() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a UnifiedProvider');
  }
  const { state, actions } = context;
  return {
    contacts: state.contacts,
    isLoading: state.loadingStates.contacts,
    error: state.errors.contacts,
    create: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) =>
      actions.create('contacts', data),
    update: (id: string, data: Partial<Contact>) =>
      actions.update('contacts', id, data),
    delete: (id: string) => actions.delete('contacts', id),
    refresh: () => actions.refreshData('contacts'),
  };
}

export function useTrips() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useTrips must be used within a UnifiedProvider');
  }
  const { state, actions } = context;
  return {
    trips: state.trips,
    isLoading: state.loadingStates.trips,
    error: state.errors.trips,
    create: (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) =>
      actions.create('trips', data),
    update: (id: string, data: Partial<Trip>) =>
      actions.update('trips', id, data),
    delete: (id: string) => actions.delete('trips', id),
    refresh: () => actions.refreshData('trips'),
  };
}

export function useInvestments() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useInvestments must be used within a UnifiedProvider');
  }
  const { state, actions } = context;
  return {
    investments: state.investments,
    isLoading: state.loadingStates.investments,
    error: state.errors.investments,
    create: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) =>
      actions.create('investments', data),
    update: (id: string, data: Partial<Investment>) =>
      actions.update('investments', id, data),
    delete: (id: string) => actions.delete('investments', id),
    refresh: () => actions.refreshData('investments'),
  };
}

export function useSharedDebts() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useSharedDebts must be used within a UnifiedProvider');
  }
  const { state, actions } = context;
  return {
    sharedDebts: state.sharedDebts,
    isLoading: state.loadingStates.sharedDebts,
    error: state.errors.sharedDebts,
    create: (data: Omit<SharedDebt, 'id' | 'createdAt' | 'updatedAt'>) =>
      actions.create('sharedDebts', data),
    update: (id: string, data: Partial<SharedDebt>) =>
      actions.update('sharedDebts', id, data),
    delete: (id: string) => actions.delete('sharedDebts', id),
    refresh: () => actions.refreshData('sharedDebts'),
  };
}

// FUNÇÕES DE CÁLCULO DERIVADO - SINGLE SOURCE OF TRUTH
const calculateDerivedData = (state: UnifiedState): DerivedData => {
  const { transactions = [], accounts = [] } = state || {};
  
  // Garantir que accounts seja sempre um array válido
  const validAccounts = Array.isArray(accounts) ? accounts : [];
  const validTransactions = Array.isArray(transactions) ? transactions : [];
  
  // UTILITÁRIOS DE DATA LOCAIS
  const currentMonth = dateUtils.getCurrentMonth();
  const previousMonth = dateUtils.getPreviousMonth();
  const currentYear = dateUtils.getCurrentYear();
  
  // 1. SALDOS DAS CONTAS - calculados das transações (CORRIGIDO PARA TRANSFERÊNCIAS)
  const accountBalances: Record<string, number> = {};
  validAccounts.forEach(account => {
    // Começar com saldo zero - vamos calcular tudo baseado nas transações
    let balance = 0;
    
    // Processar todas as transações relacionadas à conta
    validTransactions
      .filter(t => t.status === 'completed') // Apenas transações concluídas
      .forEach(t => {
        if (t.accountId === account.id) {
          // Transações normais da conta
          if (t.type === 'income') {
            balance += Number(t.amount);
          } else if (t.type === 'expense') {
            balance -= Number(t.amount);
          } else if (t.type === 'transfer') {
            // Transferência saindo da conta
            balance -= Number(t.amount);
          }
        } else if (t.toAccountId === account.id && t.type === 'transfer') {
          // Transferência entrando na conta
          balance += Number(t.amount);
        }
      });
    
    accountBalances[account.id] = balance;
    
    console.log(`=== SALDO CONTA ${account.name} ===`);
    console.log('Transações da conta:', validTransactions.filter(t => 
      (t.accountId === account.id || t.toAccountId === account.id) && t.status === 'completed'
    ));
    console.log('Saldo calculado:', balance);
    console.log('=== FIM SALDO ===');
  });
  
  // 2. MÉTRICAS TOTAIS - Usando finance-engine
  const currentMonthStr = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const relatorioGeral = getRelatorioMensal(currentMonthStr, validTransactions, validAccounts);
  const totalIncome = relatorioGeral.income;
  const totalExpenses = relatorioGeral.expenses;
  const netIncome = relatorioGeral.balance;
  const totalBalance = getSaldoGlobal(validTransactions, validAccounts).saldoTotal;
  
  // 3. MÉTRICAS MENSAIS DETALHADAS - Usando finance-engine
  const currentDate = new Date();
  const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const yearStartDate = new Date(currentDate.getFullYear(), 0, 1);
  
  const currentMonthString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const previousMonthString = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
  const yearStartString = `${yearStartDate.getFullYear()}-${String(yearStartDate.getMonth() + 1).padStart(2, '0')}`;
  
  const relatorioAtual = getRelatorioMensal(currentMonthString, validTransactions, validAccounts);
  const relatorioAnterior = getRelatorioMensal(previousMonthString, validTransactions, validAccounts);
  const relatorioAnual = getRelatorioMensal(yearStartString, validTransactions, validAccounts);
  
  const monthlyMetrics = {
      currentMonth: {
        income: relatorioAtual.income,
        expenses: relatorioAtual.expenses,
        balance: relatorioAtual.balance,
        transactionCount: relatorioAtual.transactionCount
      },
      previousMonth: {
        income: relatorioAnterior.income,
        expenses: relatorioAnterior.expenses,
        balance: relatorioAnterior.balance,
        transactionCount: relatorioAnterior.transactionCount
      },
      yearToDate: {
        income: relatorioAnual.income,
        expenses: relatorioAnual.expenses,
        balance: relatorioAnual.balance,
        transactionCount: relatorioAnual.transactionCount
      }
    };
  
  // Calcular balances
  monthlyMetrics.currentMonth.balance = monthlyMetrics.currentMonth.income - monthlyMetrics.currentMonth.expenses;
  monthlyMetrics.previousMonth.balance = monthlyMetrics.previousMonth.income - monthlyMetrics.previousMonth.expenses;
  monthlyMetrics.yearToDate.balance = monthlyMetrics.yearToDate.income - monthlyMetrics.yearToDate.expenses;
  
  // 4. MÉTRICAS POR CONTA
  const accountMetrics: Record<string, {
    balance: number;
    income: number;
    expenses: number;
    transactionCount: number;
    lastTransaction?: Transaction;
  }> = {};
  
  validAccounts.forEach(account => {
    const accountTransactions = validTransactions.filter(t => t.accountId === account.id);
    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const relatorioContaAtual = getRelatorioMensal(currentMonthStr, accountTransactions, validAccounts);
    
    accountMetrics[account.id] = {
      balance: accountBalances[account.id],
      income: relatorioContaAtual.income,
      expenses: relatorioContaAtual.expenses,
      transactionCount: relatorioContaAtual.transactionCount,
      lastTransaction: accountTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    };
  });
  
  // 5. MÉTRICAS POR CATEGORIA DETALHADAS
  const categoryMetrics: Record<string, {
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
    monthlyAverage: number;
    trend: 'up' | 'down' | 'stable';
  }> = {};
  
  // Agrupar transações por categoria (excluindo transferências)
  const nonTransferTransactions = validTransactions.filter(t => t.category !== 'Transferência');
  const categoriesMap = new Map<string, Transaction[]>();
  
  nonTransferTransactions.forEach(t => {
    if (!categoriesMap.has(t.category)) {
      categoriesMap.set(t.category, []);
    }
    categoriesMap.get(t.category)!.push(t);
  });
  
  categoriesMap.forEach((categoryTransactions, category) => {
    // Usar finance-engine para cálculos de categoria
    const resumoCategoria = getResumoCategorias(currentMonthStr, categoryTransactions);
    const categoryData = resumoCategoria[category] || { total: 0, quantidade: 0, media: 0 };
    
    categoryMetrics[category] = {
      totalAmount: categoryData.total,
      transactionCount: categoryData.quantidade,
      averageAmount: categoryData.media,
      monthlyAverage: categoryData.total / 12, // Aproximação mensal
      trend: 'stable' // Simplificado por enquanto
    };
  });
  
  // 6. ANÁLISE POR CATEGORIA (mantendo compatibilidade)
  const categoryBreakdown: Record<string, number> = {};
  nonTransferTransactions.forEach(t => {
    if (!categoryBreakdown[t.category]) {
      categoryBreakdown[t.category] = 0;
    }
    categoryBreakdown[t.category] += t.type === 'expense' ? t.amount : -t.amount;
  });
  
  // 7. TRANSAÇÕES RECENTES (últimas 10, excluindo transferências internas)
  const recentTransactions = [...nonTransferTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
  
  // 8. ANÁLISE DE TENDÊNCIAS MENSAIS (mantendo compatibilidade)
  const monthlyData: Record<string, { income: number; expenses: number }> = {};
  nonTransferTransactions.forEach(t => {
    const monthKey = dateUtils.getMonthKey(t.date);
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    if (t.type === 'income') {
      monthlyData[monthKey].income += t.amount;
    } else {
      monthlyData[monthKey].expenses += t.amount;
    }
  });
  
  const sortedMonths = Object.keys(monthlyData).sort();
  const monthlyTrends = {
    months: sortedMonths.map(month => dateUtils.formatMonthDisplay(month)),
    income: sortedMonths.map(month => monthlyData[month].income),
    expenses: sortedMonths.map(month => monthlyData[month].expenses)
  };

  // 9. TRANSFERÊNCIAS (agrupadas por ID de transferência)
  const transfersData = transactions
    .filter(t => t.category === 'Transferência')
    .reduce((acc, t) => {
      const key = `${t.date}-${t.amount}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);

  // Converter transfers para o formato esperado
  const transfers = Object.entries(transfersData).map(([key, transactions], index) => {
    const [date, amount] = key.split('-');
    const fromTransaction = transactions.find(t => t.type === 'expense');
    const toTransaction = transactions.find(t => t.type === 'income');
    
    return {
      id: `transfer-${index}`,
      fromAccountId: fromTransaction?.accountId || '',
      toAccountId: toTransaction?.accountId || '',
      amount: parseFloat(amount),
      date: date,
      description: transactions[0]?.description || 'Transferência',
      transactions: transactions
    };
  });

  // 10. PARCELAMENTOS (agrupados por grupo de parcelamento)
  const installments = transactions
    .filter(t => t.description && /\d+\/\d+/.test(t.description))
    .reduce((acc, t) => {
      const match = t.description.match(/(\d+)\/(\d+)/);
      if (match) {
        const current = parseInt(match[1]);
        const total = parseInt(match[2]);
        const groupId = t.description.replace(/\s*\d+\/\d+\s*/, '').trim() || t.description;
        
        if (!acc[groupId]) {
          acc[groupId] = {
            groupId,
            description: groupId,
            totalAmount: t.amount * total,
            installmentCount: total,
            paidInstallments: current - 1,
            remainingAmount: t.amount * (total - current + 1),
            transactions: []
          };
        }
        
        acc[groupId].transactions.push(t);
        return acc;
      }
      return acc;
    }, {} as Record<string, any>);

  // Converter para array
  const installmentsArray = Object.values(installments);

  // 11. FATURAS DE CARTÃO (simulação baseada em categoria)
  const creditCardInvoices = transactions
    .filter(t => t.category === 'Cartão de Crédito' || t.category.toLowerCase().includes('cartão'))
    .reduce((acc, t) => {
      const monthKey = dateUtils.getMonthKey(t.date);
      const invoiceKey = `${t.accountId}-${monthKey}`;
      
      if (!acc[invoiceKey]) {
        acc[invoiceKey] = {
          cardAccountId: t.accountId || '',
          month: monthKey,
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          dueDate: new Date(new Date(monthKey + '-01').getFullYear(), new Date(monthKey + '-01').getMonth() + 1, 10).toISOString(),
          status: 'pending' as 'pending' | 'paid' | 'overdue',
          transactions: []
        };
      }
      
      acc[invoiceKey].totalAmount += t.amount;
      // Assumir que todas as transações estão completas por enquanto
      acc[invoiceKey].paidAmount += t.amount;
      acc[invoiceKey].remainingAmount = acc[invoiceKey].totalAmount - acc[invoiceKey].paidAmount;
      acc[invoiceKey].transactions.push(t);
      
      // Determinar status
      const today = new Date();
      const dueDate = new Date(acc[invoiceKey].dueDate);
      if (acc[invoiceKey].remainingAmount === 0) {
        acc[invoiceKey].status = 'paid';
      } else if (dueDate < today) {
        acc[invoiceKey].status = 'overdue';
      }
      
      return acc;
    }, {} as Record<string, any>);

  // Converter para array
  const creditCardInvoicesArray = Object.values(creditCardInvoices);

  // RETORNAR TODOS OS DADOS DERIVADOS
  return {
    // Métricas básicas (compatibilidade)
    accountBalances,
    totalIncome,
    totalExpenses,
    netIncome,
    totalBalance,
    categoryBreakdown,
    recentTransactions,
    monthlyTrends,
    transfers,
    installments: installmentsArray,
    creditCardInvoices: creditCardInvoicesArray,
    
    // NOVAS MÉTRICAS CENTRALIZADAS
    monthlyMetrics,
    accountMetrics,
    categoryMetrics
  };
};

// HOOK PARA MÉTRICAS DO DASHBOARD - CALCULADAS EM TEMPO REAL
export function useDashboardMetrics() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error('useDashboardMetrics must be used within a UnifiedProvider');
  }
  
  const { state } = context;
  
  // Calcular dados derivados em tempo real com otimização de performance
  const derivedData = useMemo(() => {
    return calculateDerivedData(state);
  }, [state?.transactions, state?.accounts]);
  
  // Funções memoizadas para evitar recriação desnecessária
  const getAccountBalance = useCallback((accountId: string) => {
    return derivedData.accountBalances[accountId] || 0;
  }, [derivedData.accountBalances]);
  
  const getTransactionsByPeriod = useCallback((startDate: string, endDate: string) => {
    const validTransactions = Array.isArray(state.transactions) ? state.transactions : [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    return validTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });
  }, [state.transactions]);
  
  const getTransactionsByCategory = useCallback((category: string) => {
    const validTransactions = Array.isArray(state.transactions) ? state.transactions : [];
    return validTransactions.filter(t => t.category === category);
  }, [state.transactions]);
  
  const getTransactionsByAccount = useCallback((accountId: string) => {
    const validTransactions = Array.isArray(state.transactions) ? state.transactions : [];
    return validTransactions.filter(t => t.accountId === accountId);
  }, [state.transactions]);
  
  return {
    // Métricas principais
    totalIncome: derivedData.totalIncome,
    totalExpenses: derivedData.totalExpenses,
    netIncome: derivedData.netIncome,
    totalBalance: derivedData.totalBalance,
    
    // Saldos das contas (calculados das transações)
    accountBalances: derivedData.accountBalances,
    
    // Análises
    categoryBreakdown: derivedData.categoryBreakdown,
    recentTransactions: derivedData.recentTransactions,
    monthlyTrends: derivedData.monthlyTrends,
    
    // Estados de carregamento
    isLoading: state.loadingStates.transactions || state.loadingStates.accounts,
    
    // Funções otimizadas
    getAccountBalance,
    getTransactionsByPeriod,
    getTransactionsByCategory,
    getTransactionsByAccount
  };
}

// HOOKS CENTRALIZADOS - SINGLE SOURCE OF TRUTH
export function useFinancialMetrics() {
  const context = useUnified();
  
  // Calcular dados derivados em tempo real
  const derivedData = useMemo(() => calculateDerivedData(context), [context]);
  
  return useMemo(() => ({
    // Métricas totais
    totalBalance: derivedData.totalBalance,
    totalIncome: derivedData.totalIncome,
    totalExpenses: derivedData.totalExpenses,
    netIncome: derivedData.netIncome,
    
    // Métricas mensais
    currentMonth: {
      income: derivedData.monthlyMetrics.currentMonth.income,
      expenses: derivedData.monthlyMetrics.currentMonth.expenses,
      balance: derivedData.monthlyMetrics.currentMonth.balance,
      transactionCount: derivedData.monthlyMetrics.currentMonth.transactionCount
    },
    
    previousMonth: {
      income: derivedData.monthlyMetrics.previousMonth.income,
      expenses: derivedData.monthlyMetrics.previousMonth.expenses,
      balance: derivedData.monthlyMetrics.previousMonth.balance,
      transactionCount: derivedData.monthlyMetrics.previousMonth.transactionCount
    },
    
    yearToDate: {
      income: derivedData.monthlyMetrics.yearToDate.income,
      expenses: derivedData.monthlyMetrics.yearToDate.expenses,
      balance: derivedData.monthlyMetrics.yearToDate.balance,
      transactionCount: derivedData.monthlyMetrics.yearToDate.transactionCount
    },
    
    // Comparações e tendências
    monthlyGrowth: {
      income: derivedData.monthlyMetrics.currentMonth.income - derivedData.monthlyMetrics.previousMonth.income,
      expenses: derivedData.monthlyMetrics.currentMonth.expenses - derivedData.monthlyMetrics.previousMonth.expenses,
      balance: derivedData.monthlyMetrics.currentMonth.balance - derivedData.monthlyMetrics.previousMonth.balance
    },
    
    // Análise de categorias
    categoryBreakdown: derivedData.categoryBreakdown,
    categoryMetrics: derivedData.categoryMetrics,
    
    // Tendências mensais
    monthlyTrends: derivedData.monthlyTrends,
    
    // Transações recentes
    recentTransactions: derivedData.recentTransactions
  }), [derivedData]);
}

export function useAccountMetrics(accountId?: string) {
  const context = useUnified();
  
  // Calcular dados derivados em tempo real
  const derivedData = useMemo(() => calculateDerivedData(context), [context]);
  
  return useMemo(() => {
    // Add null safety checks for SSR
    if (!derivedData || !context || !context.accounts) {
      return accountId ? null : [];
    }
    
    if (accountId) {
      // Retornar métricas de uma conta específica
      const accountMetric = derivedData.accountMetrics?.[accountId];
      const account = context.accounts.find(a => a.id === accountId);
      
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
      return context.accounts.map(account => {
        const accountMetric = derivedData.accountMetrics?.[account.id];
        
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
  }, [derivedData, context?.accounts, accountId]);
}

export function useCategoryMetrics(category?: string) {
  const context = useUnified();
  
  // Calcular dados derivados em tempo real
  const derivedData = useMemo(() => calculateDerivedData(context), [context]);
  
  return useMemo(() => {
    if (category) {
      // Retornar métricas de uma categoria específica
      const categoryMetric = derivedData.categoryMetrics[category];
      
      if (!categoryMetric) {
        return null;
      }
      
      return {
        category,
        totalAmount: categoryMetric.totalAmount,
        transactionCount: categoryMetric.transactionCount,
        averageAmount: categoryMetric.averageAmount,
        monthlyAverage: categoryMetric.monthlyAverage,
        trend: categoryMetric.trend
      };
    } else {
      // Retornar métricas de todas as categorias
      return Object.entries(derivedData.categoryMetrics).map(([category, metric]) => ({
        category,
        totalAmount: metric.totalAmount,
        transactionCount: metric.transactionCount,
        averageAmount: metric.averageAmount,
        monthlyAverage: metric.monthlyAverage,
        trend: metric.trend
      }));
    }
  }, [derivedData.categoryMetrics, category]);
}

// Hook para relatórios centralizados
export function useReportsData() {
  const context = useUnified();
  
  // Calcular dados derivados em tempo real
  const derivedData = useMemo(() => calculateDerivedData(context), [context]);
  
  return useMemo(() => ({
    // Dados para gráficos
    monthlyTrends: derivedData.monthlyTrends,
    categoryBreakdown: derivedData.categoryBreakdown,
    accountBalances: derivedData.accountBalances,
    
    // Métricas para relatórios
    totalBalance: derivedData.totalBalance,
    totalIncome: derivedData.totalIncome,
    totalExpenses: derivedData.totalExpenses,
    netIncome: derivedData.netIncome,
    
    // Análises detalhadas
    categoryMetrics: derivedData.categoryMetrics,
    accountMetrics: derivedData.accountMetrics,
    monthlyMetrics: derivedData.monthlyMetrics,
    
    // Dados brutos para filtros personalizados
    transactions: context?.transactions || [],
    accounts: context?.accounts || [],
    
    // Funções utilitárias
    getTransactionsByPeriod: (startDate: string, endDate: string) => {
      const validTransactions = Array.isArray(context.transactions) ? context.transactions : [];
      return validTransactions.filter(t => 
        t.date >= startDate && t.date <= endDate
      );
    },
    
    getTransactionsByCategory: (category: string) => {
      const validTransactions = Array.isArray(context.transactions) ? context.transactions : [];
      return validTransactions.filter(t => t.category === category);
    },
    
    getTransactionsByAccount: (accountId: string) => {
      const validTransactions = Array.isArray(context.transactions) ? context.transactions : [];
      return validTransactions.filter(t => t.accountId === accountId);
    },

    // Função para filtrar dados baseado nos filtros de relatório
    getFilteredData: (filters?: any) => {
      const now = new Date();
      let startDate: Date;
      let endDate = new Date();

      // Definir período baseado no filtro usando dateUtils
      switch (filters?.period) {
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          break;
        case 'last6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'custom':
          if (filters.startDate && filters.endDate) {
            startDate = new Date(filters.startDate);
            endDate = new Date(filters.endDate);
          } else {
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          }
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      }

      // Filtrar transações por período (excluindo transferências)
      const validTransactions = Array.isArray(context.transactions) ? context.transactions : [];
      const filteredTransactions = validTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        const inPeriod = transactionDate >= startDate && transactionDate <= endDate;
        const notTransfer = t.category !== 'Transferência';
        return inPeriod && notTransfer;
      });

      // Calcular receitas e despesas usando finance-engine
      const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const relatorioFiltrado = getRelatorioMensal(currentMonthStr, filteredTransactions, context.accounts);
      const income = relatorioFiltrado.income;
      const expenses = relatorioFiltrado.expenses;

      // Agrupar por categoria usando finance-engine
      const resumoCategoriasFiltrado = getResumoCategorias(currentMonthStr, filteredTransactions.filter(t => t.type === 'expense'));
      const categoryGroups = Object.fromEntries(
        Object.entries(resumoCategoriasFiltrado).map(([cat, data]) => [cat, (data as any).total])
      );

      const totalExpenses = Object.values(categoryGroups).reduce((sum, amount) => sum + amount, 0);

      const categories = Object.entries(categoryGroups)
        .map(([name, amount], index) => ({
          name,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'][index % 10],
        }))
        .sort((a, b) => b.amount - a.amount);

      // Tendência mensal usando dateUtils
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthTransactions = validTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          const inMonth = transactionDate >= monthStart && transactionDate <= monthEnd;
          const notTransfer = t.category !== 'Transferência';
          return inMonth && notTransfer;
        });

        // Usar finance-engine para cálculos mensais
        const monthStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
        const relatorioMensal = getRelatorioMensal(monthStr, monthTransactions, context.accounts);
        const monthIncome = relatorioMensal.income;
        const monthExpenses = relatorioMensal.expenses;

        monthlyData.push({
          month: dateUtils.formatMonthDisplay(dateUtils.getMonthKey(monthStart.toISOString())),
          income: monthIncome,
          expenses: monthExpenses,
          balance: monthIncome - monthExpenses
        });
      }

      // Usar saldos das contas do derivedData
      const accountBalances = (context?.accounts || []).map(account => ({
        ...account,
        balance: derivedData.accountBalances[account.id] || 0
      }));

      return {
        totalIncome: income,
        totalExpenses: expenses,
        balance: income - expenses,
        monthlyData,
        categoryBreakdown: categories,
        accountBalances
      };
    }
  }), [derivedData, context]);
}
