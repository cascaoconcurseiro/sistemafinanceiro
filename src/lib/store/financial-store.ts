/**
 * Financial Store - Zustand
 * 
 * Store principal para dados financeiros com persistência seletiva,
 * optimistic updates e sincronização automática.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { dataCache } from '@/lib/cache/data-cache-manager';

// Tipos de dados financeiros
export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'cash';
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  status: 'pending' | 'completed' | 'cancelled';
  isRecurring?: boolean;
  installments?: {
    current: number;
    total: number;
    groupId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
  parentId?: string;
  isActive: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  accountId?: string;
  isActive: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

// Estado da aplicação
interface FinancialState {
  // Dados principais
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  creditCards: CreditCard[];
  budgets: Budget[];
  
  // Estado de loading
  isLoading: {
    accounts: boolean;
    transactions: boolean;
    categories: boolean;
    creditCards: boolean;
    budgets: boolean;
  };
  
  // Estado de sincronização
  lastSync: {
    accounts: number | null;
    transactions: number | null;
    categories: number | null;
    creditCards: number | null;
    budgets: number | null;
  };
  
  // Operações pendentes (optimistic updates)
  pendingOperations: Map<string, {
    type: 'create' | 'update' | 'delete';
    entity: 'account' | 'transaction' | 'category' | 'creditCard' | 'budget';
    data: any;
    timestamp: number;
  }>;
  
  // Filtros e configurações de UI
  filters: {
    dateRange: {
      start: string;
      end: string;
    };
    selectedAccounts: string[];
    selectedCategories: string[];
    transactionTypes: ('income' | 'expense' | 'transfer')[];
  };
  
  // Configurações de usuário
  preferences: {
    currency: string;
    dateFormat: string;
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    autoSync: boolean;
  };
}

// Ações do store
interface FinancialActions {
  // Ações de carregamento
  loadAccounts: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadCreditCards: () => Promise<void>;
  loadBudgets: () => Promise<void>;
  loadAll: () => Promise<void>;
  
  // Ações CRUD com optimistic updates
  createAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  
  createTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  
  createCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Ações de filtros
  setDateRange: (start: string, end: string) => void;
  setSelectedAccounts: (accountIds: string[]) => void;
  setSelectedCategories: (categoryIds: string[]) => void;
  setTransactionTypes: (types: ('income' | 'expense' | 'transfer')[]) => void;
  clearFilters: () => void;
  
  // Ações de sincronização
  syncAll: () => Promise<void>;
  syncEntity: (entity: keyof FinancialState['lastSync']) => Promise<void>;
  
  // Ações de preferências
  updatePreferences: (preferences: Partial<FinancialState['preferences']>) => void;
  
  // Utilitários
  getFilteredTransactions: () => Transaction[];
  getAccountBalance: (accountId: string) => number;
  getCategoryTotal: (categoryId: string, period?: { start: string; end: string }) => number;
  
  // Limpeza
  clearAll: () => void;
  clearCache: () => void;
}

type FinancialStore = FinancialState & FinancialActions;

// Estado inicial
const initialState: FinancialState = {
  accounts: [],
  transactions: [],
  categories: [],
  creditCards: [],
  budgets: [],
  
  isLoading: {
    accounts: false,
    transactions: false,
    categories: false,
    creditCards: false,
    budgets: false,
  },
  
  lastSync: {
    accounts: null,
    transactions: null,
    categories: null,
    creditCards: null,
    budgets: null,
  },
  
  pendingOperations: new Map(),
  
  filters: {
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    selectedAccounts: [],
    selectedCategories: [],
    transactionTypes: ['income', 'expense', 'transfer'],
  },
  
  preferences: {
    currency: 'BRL',
    dateFormat: 'dd/MM/yyyy',
    theme: 'system',
    notifications: true,
    autoSync: true,
  },
};

// Criar store com middlewares
export const useFinancialStore = create<FinancialStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // Carregamento de dados
        loadAccounts: async () => {
          set((state) => {
            state.isLoading.accounts = true;
          });
          
          try {
            // Tentar buscar do cache primeiro
            let accounts = dataCache.get('accounts');
            
            if (!accounts) {
              const response = await fetch('/api/accounts');
              if (!response.ok) throw new Error('Falha ao carregar contas');
              
              const data = await response.json();
              accounts = data.accounts || [];
              
              // Armazenar no cache
              dataCache.set('accounts', accounts, undefined, ['financial', 'accounts']);
            }
            
            set((state) => {
              state.accounts = accounts;
              state.lastSync.accounts = Date.now();
              state.isLoading.accounts = false;
            });
            
          } catch (error) {
            console.error('Erro ao carregar contas:', error);
            set((state) => {
              state.isLoading.accounts = false;
            });
          }
        },
        
        loadTransactions: async () => {
          set((state) => {
            state.isLoading.transactions = true;
          });
          
          try {
            let transactions = dataCache.get('transactions');
            
            if (!transactions) {
              const response = await fetch('/api/transactions');
              if (!response.ok) throw new Error('Falha ao carregar transações');
              
              const data = await response.json();
              transactions = data.transactions || [];
              
              dataCache.set('transactions', transactions, undefined, ['financial', 'transactions']);
            }
            
            set((state) => {
              state.transactions = transactions;
              state.lastSync.transactions = Date.now();
              state.isLoading.transactions = false;
            });
            
          } catch (error) {
            console.error('Erro ao carregar transações:', error);
            set((state) => {
              state.isLoading.transactions = false;
            });
          }
        },
        
        loadCategories: async () => {
          set((state) => {
            state.isLoading.categories = true;
          });
          
          try {
            let categories = dataCache.get('categories');
            
            if (!categories) {
              const response = await fetch('/api/categories');
              if (!response.ok) throw new Error('Falha ao carregar categorias');
              
              const data = await response.json();
              categories = data.categories || [];
              
              dataCache.set('categories', categories, undefined, ['financial', 'categories']);
            }
            
            set((state) => {
              state.categories = categories;
              state.lastSync.categories = Date.now();
              state.isLoading.categories = false;
            });
            
          } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            set((state) => {
              state.isLoading.categories = false;
            });
          }
        },
        
        loadCreditCards: async () => {
          set((state) => {
            state.isLoading.creditCards = true;
          });
          
          try {
            let creditCards = dataCache.get('credit-cards');
            
            if (!creditCards) {
              const response = await fetch('/api/credit-cards');
              if (!response.ok) throw new Error('Falha ao carregar cartões');
              
              const data = await response.json();
              creditCards = data.creditCards || [];
              
              dataCache.set('credit-cards', creditCards, undefined, ['financial', 'credit-cards']);
            }
            
            set((state) => {
              state.creditCards = creditCards;
              state.lastSync.creditCards = Date.now();
              state.isLoading.creditCards = false;
            });
            
          } catch (error) {
            console.error('Erro ao carregar cartões:', error);
            set((state) => {
              state.isLoading.creditCards = false;
            });
          }
        },
        
        loadBudgets: async () => {
          set((state) => {
            state.isLoading.budgets = true;
          });
          
          try {
            let budgets = dataCache.get('budgets');
            
            if (!budgets) {
              const response = await fetch('/api/budgets');
              if (!response.ok) throw new Error('Falha ao carregar orçamentos');
              
              const data = await response.json();
              budgets = data.budgets || [];
              
              dataCache.set('budgets', budgets, undefined, ['financial', 'budgets']);
            }
            
            set((state) => {
              state.budgets = budgets;
              state.lastSync.budgets = Date.now();
              state.isLoading.budgets = false;
            });
            
          } catch (error) {
            console.error('Erro ao carregar orçamentos:', error);
            set((state) => {
              state.isLoading.budgets = false;
            });
          }
        },
        
        loadAll: async () => {
          const { loadAccounts, loadTransactions, loadCategories, loadCreditCards, loadBudgets } = get();
          
          await Promise.allSettled([
            loadAccounts(),
            loadTransactions(),
            loadCategories(),
            loadCreditCards(),
            loadBudgets(),
          ]);
        },
        
        // CRUD com optimistic updates
        createAccount: async (accountData) => {
          const tempId = `temp_${Date.now()}`;
          const optimisticAccount: Account = {
            ...accountData,
            id: tempId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          // Optimistic update
          set((state) => {
            state.accounts.push(optimisticAccount);
            state.pendingOperations.set(tempId, {
              type: 'create',
              entity: 'account',
              data: optimisticAccount,
              timestamp: Date.now(),
            });
          });
          
          try {
            const response = await fetch('/api/accounts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(accountData),
            });
            
            if (!response.ok) throw new Error('Falha ao criar conta');
            
            const data = await response.json();
            const realAccount = data.account;
            
            // Substituir conta temporária pela real
            set((state) => {
              const index = state.accounts.findIndex(a => a.id === tempId);
              if (index !== -1) {
                state.accounts[index] = realAccount;
              }
              state.pendingOperations.delete(tempId);
            });
            
            // Invalidar cache
            dataCache.invalidate('accounts');
            
            return realAccount;
            
          } catch (error) {
            // Reverter optimistic update
            set((state) => {
              state.accounts = state.accounts.filter(a => a.id !== tempId);
              state.pendingOperations.delete(tempId);
            });
            
            throw error;
          }
        },
        
        updateAccount: async (id, updates) => {
          const originalAccount = get().accounts.find(a => a.id === id);
          if (!originalAccount) throw new Error('Conta não encontrada');
          
          const updatedAccount = { ...originalAccount, ...updates, updatedAt: new Date().toISOString() };
          
          // Optimistic update
          set((state) => {
            const index = state.accounts.findIndex(a => a.id === id);
            if (index !== -1) {
              state.accounts[index] = updatedAccount;
            }
            state.pendingOperations.set(id, {
              type: 'update',
              entity: 'account',
              data: updatedAccount,
              timestamp: Date.now(),
            });
          });
          
          try {
            const response = await fetch(`/api/accounts/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            
            if (!response.ok) throw new Error('Falha ao atualizar conta');
            
            const data = await response.json();
            const realAccount = data.account;
            
            set((state) => {
              const index = state.accounts.findIndex(a => a.id === id);
              if (index !== -1) {
                state.accounts[index] = realAccount;
              }
              state.pendingOperations.delete(id);
            });
            
            dataCache.invalidate('accounts');
            
            return realAccount;
            
          } catch (error) {
            // Reverter optimistic update
            set((state) => {
              const index = state.accounts.findIndex(a => a.id === id);
              if (index !== -1) {
                state.accounts[index] = originalAccount;
              }
              state.pendingOperations.delete(id);
            });
            
            throw error;
          }
        },
        
        deleteAccount: async (id) => {
          const originalAccount = get().accounts.find(a => a.id === id);
          if (!originalAccount) throw new Error('Conta não encontrada');
          
          // Optimistic update
          set((state) => {
            state.accounts = state.accounts.filter(a => a.id !== id);
            state.pendingOperations.set(id, {
              type: 'delete',
              entity: 'account',
              data: originalAccount,
              timestamp: Date.now(),
            });
          });
          
          try {
            const response = await fetch(`/api/accounts/${id}`, {
              method: 'DELETE',
            });
            
            if (!response.ok) throw new Error('Falha ao excluir conta');
            
            set((state) => {
              state.pendingOperations.delete(id);
            });
            
            dataCache.invalidate('accounts');
            
          } catch (error) {
            // Reverter optimistic update
            set((state) => {
              state.accounts.push(originalAccount);
              state.pendingOperations.delete(id);
            });
            
            throw error;
          }
        },
        
        // Implementações similares para transactions, categories, etc...
        createTransaction: async (transactionData) => {
          // Implementação similar ao createAccount
          const tempId = `temp_${Date.now()}`;
          const optimisticTransaction: Transaction = {
            ...transactionData,
            id: tempId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          set((state) => {
            state.transactions.push(optimisticTransaction);
          });
          
          try {
            const response = await fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(transactionData),
            });
            
            if (!response.ok) throw new Error('Falha ao criar transação');
            
            const data = await response.json();
            const realTransaction = data.transaction;
            
            set((state) => {
              const index = state.transactions.findIndex(t => t.id === tempId);
              if (index !== -1) {
                state.transactions[index] = realTransaction;
              }
            });
            
            dataCache.invalidate('transactions');
            
            return realTransaction;
            
          } catch (error) {
            set((state) => {
              state.transactions = state.transactions.filter(t => t.id !== tempId);
            });
            throw error;
          }
        },
        
        updateTransaction: async (id, updates) => {
          // Implementação similar ao updateAccount
          const original = get().transactions.find(t => t.id === id);
          if (!original) throw new Error('Transação não encontrada');
          
          const updated = { ...original, ...updates, updatedAt: new Date().toISOString() };
          
          set((state) => {
            const index = state.transactions.findIndex(t => t.id === id);
            if (index !== -1) {
              state.transactions[index] = updated;
            }
          });
          
          try {
            const response = await fetch(`/api/transactions/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            
            if (!response.ok) throw new Error('Falha ao atualizar transação');
            
            const data = await response.json();
            
            set((state) => {
              const index = state.transactions.findIndex(t => t.id === id);
              if (index !== -1) {
                state.transactions[index] = data.transaction;
              }
            });
            
            dataCache.invalidate('transactions');
            
            return data.transaction;
            
          } catch (error) {
            set((state) => {
              const index = state.transactions.findIndex(t => t.id === id);
              if (index !== -1) {
                state.transactions[index] = original;
              }
            });
            throw error;
          }
        },
        
        deleteTransaction: async (id) => {
          const original = get().transactions.find(t => t.id === id);
          if (!original) throw new Error('Transação não encontrada');
          
          set((state) => {
            state.transactions = state.transactions.filter(t => t.id !== id);
          });
          
          try {
            const response = await fetch(`/api/transactions/${id}`, {
              method: 'DELETE',
            });
            
            if (!response.ok) throw new Error('Falha ao excluir transação');
            
            dataCache.invalidate('transactions');
            
          } catch (error) {
            set((state) => {
              state.transactions.push(original);
            });
            throw error;
          }
        },
        
        // Implementações básicas para categories
        createCategory: async (categoryData) => {
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData),
          });
          
          if (!response.ok) throw new Error('Falha ao criar categoria');
          
          const data = await response.json();
          
          set((state) => {
            state.categories.push(data.category);
          });
          
          dataCache.invalidate('categories');
          
          return data.category;
        },
        
        updateCategory: async (id, updates) => {
          const response = await fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          
          if (!response.ok) throw new Error('Falha ao atualizar categoria');
          
          const data = await response.json();
          
          set((state) => {
            const index = state.categories.findIndex(c => c.id === id);
            if (index !== -1) {
              state.categories[index] = data.category;
            }
          });
          
          dataCache.invalidate('categories');
          
          return data.category;
        },
        
        deleteCategory: async (id) => {
          const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) throw new Error('Falha ao excluir categoria');
          
          set((state) => {
            state.categories = state.categories.filter(c => c.id !== id);
          });
          
          dataCache.invalidate('categories');
        },
        
        // Ações de filtros
        setDateRange: (start, end) => {
          set((state) => {
            state.filters.dateRange = { start, end };
          });
        },
        
        setSelectedAccounts: (accountIds) => {
          set((state) => {
            state.filters.selectedAccounts = accountIds;
          });
        },
        
        setSelectedCategories: (categoryIds) => {
          set((state) => {
            state.filters.selectedCategories = categoryIds;
          });
        },
        
        setTransactionTypes: (types) => {
          set((state) => {
            state.filters.transactionTypes = types;
          });
        },
        
        clearFilters: () => {
          set((state) => {
            state.filters = initialState.filters;
          });
        },
        
        // Sincronização
        syncAll: async () => {
          const { loadAll } = get();
          await loadAll();
        },
        
        syncEntity: async (entity) => {
          const actions = {
            accounts: get().loadAccounts,
            transactions: get().loadTransactions,
            categories: get().loadCategories,
            creditCards: get().loadCreditCards,
            budgets: get().loadBudgets,
          };
          
          await actions[entity]();
        },
        
        // Preferências
        updatePreferences: (preferences) => {
          set((state) => {
            state.preferences = { ...state.preferences, ...preferences };
          });
        },
        
        // Utilitários
        getFilteredTransactions: () => {
          const { transactions, filters } = get();
          
          return transactions.filter(transaction => {
            // Filtro por data
            const transactionDate = new Date(transaction.date);
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            
            if (transactionDate < startDate || transactionDate > endDate) {
              return false;
            }
            
            // Filtro por contas
            if (filters.selectedAccounts.length > 0 && !filters.selectedAccounts.includes(transaction.accountId)) {
              return false;
            }
            
            // Filtro por categorias
            if (filters.selectedCategories.length > 0 && !filters.selectedCategories.includes(transaction.categoryId)) {
              return false;
            }
            
            // Filtro por tipo
            if (!filters.transactionTypes.includes(transaction.type)) {
              return false;
            }
            
            return true;
          });
        },
        
        getAccountBalance: (accountId) => {
          const { transactions } = get();
          
          return transactions
            .filter(t => t.accountId === accountId && t.status === 'completed')
            .reduce((balance, transaction) => {
              return transaction.type === 'income' 
                ? balance + transaction.amount
                : balance - transaction.amount;
            }, 0);
        },
        
        getCategoryTotal: (categoryId, period) => {
          const { transactions } = get();
          
          let filteredTransactions = transactions.filter(t => 
            t.categoryId === categoryId && t.status === 'completed'
          );
          
          if (period) {
            const startDate = new Date(period.start);
            const endDate = new Date(period.end);
            
            filteredTransactions = filteredTransactions.filter(t => {
              const transactionDate = new Date(t.date);
              return transactionDate >= startDate && transactionDate <= endDate;
            });
          }
          
          return filteredTransactions.reduce((total, transaction) => {
            return total + Math.abs(transaction.amount);
          }, 0);
        },
        
        // Limpeza
        clearAll: () => {
          set(() => ({ ...initialState }));
        },
        
        clearCache: () => {
          dataCache.clear();
        },
      })),
      {
        name: 'financial-store',
        storage: createJSONStorage(() => localStorage),
        // Persistir apenas dados críticos
        partialize: (state) => ({
          preferences: state.preferences,
          filters: state.filters,
          lastSync: state.lastSync,
        }),
        // Migração de versões
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migração da versão 0 para 1
            return {
              ...persistedState,
              preferences: {
                ...initialState.preferences,
                ...persistedState.preferences,
              },
            };
          }
          return persistedState;
        },
      }
    )
  )
);

// Seletores otimizados
export const useAccounts = () => useFinancialStore(state => state.accounts);
export const useTransactions = () => useFinancialStore(state => state.transactions);
export const useCategories = () => useFinancialStore(state => state.categories);
export const useFilteredTransactions = () => useFinancialStore(state => state.getFilteredTransactions());
export const useIsLoading = () => useFinancialStore(state => state.isLoading);
export const useFilters = () => useFinancialStore(state => state.filters);
export const usePreferences = () => useFinancialStore(state => state.preferences);