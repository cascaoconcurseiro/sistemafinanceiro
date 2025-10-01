/**
 * HOOK PARA DADOS FINANCEIROS EM TEMPO REAL
 * 
 * Gerencia estado e sincronização de dados financeiros usando observables
 * Garante que todos os dados venham exclusivamente do banco de dados
 */

import { useState, useEffect, useCallback } from 'react';
import { eventBus, DataState } from '../events/event-bus';
import { clientDatabaseAdapter } from '../database/client-database-adapter';

export interface UseFinancialDataReturn {
  // Estado dos dados
  accounts: any[];
  transactions: any[];
  creditCards: any[];
  budgets: any[];
  
  // Estado de carregamento
  isLoading: boolean;
  errors: string[];
  lastUpdated: string;
  
  // Ações
  refreshData: () => Promise<void>;
  clearErrors: () => void;
  
  // Operações de contas
  createAccount: (accountData: any) => Promise<any>;
  updateAccount: (id: string, updates: any) => Promise<any>;
  deleteAccount: (id: string) => Promise<void>;
  
  // Operações de transações
  createTransaction: (transactionData: any) => Promise<any>;
  updateTransaction: (id: string, updates: any) => Promise<any>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Operações de cartões de crédito
  createCreditCard: (cardData: any) => Promise<any>;
  updateCreditCard: (id: string, updates: any) => Promise<any>;
  deleteCreditCard: (id: string) => Promise<void>;
  
  // Operações de orçamentos
  createBudget: (budgetData: any) => Promise<any>;
  updateBudget: (id: string, updates: any) => Promise<any>;
  deleteBudget: (id: string) => Promise<void>;
  
  // Utilitários
  getAccountBalance: (accountId: string) => number;
  getTotalBalance: () => number;
  getTransactionsByAccount: (accountId: string) => any[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => any[];
}

export function useFinancialData(): UseFinancialDataReturn {
  const [dataState, setDataState] = useState<DataState>({
    accounts: [],
    transactions: [],
    creditCards: [],
    budgets: [],
    lastUpdated: new Date().toISOString(),
    isLoading: false,
    errors: []
  });

  // Inicializa sistema de eventos
  useEffect(() => {
    eventBus.initialize();
    
    // Subscreve ao estado dos dados
    const subscription = eventBus.dataState$().subscribe(setDataState);
    
    // Carrega dados iniciais
    refreshData();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [refreshData]); // Adicionando refreshData como dependência

  /**
   * Atualiza todos os dados do banco
   */
  const refreshData = useCallback(async (): Promise<void> => {
    try {
      eventBus.setLoading(true);
      eventBus.clearErrors();

      console.log('🔄 Carregando dados do banco de dados...');

      // Carrega contas
      const accounts = await clientDatabaseAdapter.getAccounts();
      eventBus.emit('data:accounts:fetched', { accounts });

      // Carrega transações
      const transactions = await clientDatabaseAdapter.getTransactions();
      eventBus.emit('data:transactions:fetched', { transactions });

      // Carrega cartões de crédito
      const creditCards = await clientDatabaseAdapter.getCreditCards();
      eventBus.emit('data:creditCards:fetched', { creditCards });

      // Carrega orçamentos
      const budgets = await clientDatabaseAdapter.getBudgets();
      eventBus.emit('data:budgets:fetched', { budgets });

      console.log('✅ Dados carregados com sucesso do banco');

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      eventBus.emit('system:error', { 
        message: `Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    } finally {
      eventBus.setLoading(false);
    }
  }, []);

  /**
   * Limpa erros
   */
  const clearErrors = useCallback((): void => {
    eventBus.clearErrors();
  }, []);

  // OPERAÇÕES DE CONTAS
  const createAccount = useCallback(async (accountData: any): Promise<any> => {
    try {
      console.log('💳 Criando conta no banco...', accountData);
      
      const account = await clientDatabaseAdapter.createAccount(accountData);
      eventBus.emit('data:account:created', account);
      
      console.log('✅ Conta criada com sucesso:', account);
      return account;
    } catch (error) {
      console.error('❌ Erro ao criar conta:', error);
      eventBus.emit('system:error', { 
        message: `Erro ao criar conta: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
      throw error;
    }
  }, []);

  const updateAccount = useCallback(async (id: string, updates: any): Promise<any> => {
    try {
      console.log('💳 Atualizando conta no banco...', { id, updates });
      
      const account = await clientDatabaseAdapter.updateAccount(id, updates);
      eventBus.emit('data:account:updated', account);
      
      console.log('✅ Conta atualizada com sucesso:', account);
      return account;
    } catch (error) {
      console.error('❌ Erro ao atualizar conta:', error);
      eventBus.emit('system:error', { 
        message: `Erro ao atualizar conta: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
      throw error;
    }
  }, []);

  const deleteAccount = useCallback(async (id: string): Promise<void> => {
    try {
      console.log('💳 Deletando conta do banco...', id);
      
      await clientDatabaseAdapter.deleteAccount(id);
      eventBus.emit('data:account:deleted', { id });
      
      console.log('✅ Conta deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar conta:', error);
      eventBus.emit('system:error', { 
        message: `Erro ao deletar conta: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
      throw error;
    }
  }, []);

  // OPERAÇÕES DE TRANSAÇÕES
  const createTransaction = useCallback(async (transactionData: any): Promise<any> => {
    try {
      console.log('💰 Criando transação no banco...', transactionData);
      
      const transaction = await clientDatabaseAdapter.createTransaction(transactionData);
      eventBus.emit('data:transaction:created', transaction);
      
      // Atualiza saldo da conta se necessário
      if (transaction.accountId) {
        // Note: updateAccountBalance não está disponível no client adapter
        // Isso será tratado no backend
        eventBus.emit('data:account:balance:updated', { accountId: transaction.accountId });
      }
      
      console.log('✅ Transação criada com sucesso:', transaction);
      return transaction;
    } catch (error) {
      console.error('❌ Erro ao criar transação:', error);
      eventBus.emit('system:error', { 
        message: `Erro ao criar transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
      throw error;
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: any): Promise<any> => {
    try {
      console.log('💰 Atualizando transação no banco...', { id, updates });
      
      const transaction = await clientDatabaseAdapter.updateTransaction(id, updates);
      eventBus.emit('data:transaction:updated', transaction);
      
      // Atualiza saldo da conta se necessário
      if (transaction.accountId) {
        // Note: updateAccountBalance não está disponível no client adapter
        // Isso será tratado no backend
        eventBus.emit('data:account:balance:updated', { accountId: transaction.accountId });
      }
      
      console.log('✅ Transação atualizada com sucesso:', transaction);
      return transaction;
    } catch (error) {
      console.error('❌ Erro ao atualizar transação:', error);
      eventBus.emit('system:error', { 
        message: `Erro ao atualizar transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
      throw error;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    try {
      console.log('💰 Deletando transação do banco...', id);
      
      // Busca transação antes de deletar para atualizar saldo
      const transactions = dataState.transactions;
      const transaction = transactions.find(t => t.id === id);
      
      await clientDatabaseAdapter.deleteTransaction(id);
      eventBus.emit('data:transaction:deleted', { id });
      
      // Atualiza saldo da conta se necessário
      if (transaction?.accountId) {
        // Note: updateAccountBalance não está disponível no client adapter
        // Isso será tratado no backend
        eventBus.emit('data:account:balance:updated', { accountId: transaction.accountId });
      }
      
      console.log('✅ Transação deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar transação:', error);
      eventBus.emit('system:error', { 
        message: `Erro ao deletar transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
      throw error;
    }
  }, [dataState.transactions]);

  // OPERAÇÕES DE CARTÕES DE CRÉDITO
  const createCreditCard = useCallback(async (cardData: any): Promise<any> => {
    try {
      console.log('💳 Criando cartão de crédito no banco...', cardData);
      
      const creditCard = await clientDatabaseAdapter.createCreditCard(cardData);
      eventBus.emit('data:creditCard:created', creditCard);
      
      console.log('✅ Cartão de crédito criado com sucesso:', creditCard);
      return creditCard;
    } catch (error) {
      console.error('❌ Erro ao criar cartão de crédito:', error);
      eventBus.emit('system:error', { 
        message: `Erro ao criar cartão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
      throw error;
    }
  }, []);

  const updateCreditCard = useCallback(async (id: string, updates: any): Promise<any> => {
    try {
      console.log('💳 Atualizando cartão de crédito no banco...', { id, updates });
      
      const creditCard = await clientDatabaseAdapter.updateCreditCard(id, updates);
       eventBus.emit('data:creditCard:updated', creditCard);
       
       console.log('✅ Cartão de crédito atualizado com sucesso:', creditCard);
       return creditCard;
     } catch (error) {
       console.error('❌ Erro ao atualizar cartão de crédito:', error);
       eventBus.emit('system:error', { 
         message: `Erro ao atualizar cartão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
       });
       throw error;
     }
   }, []);

   const deleteCreditCard = useCallback(async (id: string): Promise<void> => {
     try {
       console.log('💳 Deletando cartão de crédito do banco...', id);
       
       await clientDatabaseAdapter.deleteCreditCard(id);
       eventBus.emit('data:creditCard:deleted', { id });
       
       console.log('✅ Cartão de crédito deletado com sucesso');
     } catch (error) {
       console.error('❌ Erro ao deletar cartão de crédito:', error);
       eventBus.emit('system:error', { 
         message: `Erro ao deletar cartão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
       });
       throw error;
     }
   }, []);

   // OPERAÇÕES DE ORÇAMENTOS
   const createBudget = useCallback(async (budgetData: any): Promise<any> => {
     try {
       console.log('📊 Criando orçamento no banco...', budgetData);
       
       const budget = await clientDatabaseAdapter.createBudget(budgetData);
       eventBus.emit('data:budget:created', budget);
       
       console.log('✅ Orçamento criado com sucesso:', budget);
       return budget;
     } catch (error) {
       console.error('❌ Erro ao criar orçamento:', error);
       eventBus.emit('system:error', { 
         message: `Erro ao criar orçamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
       });
       throw error;
     }
   }, []);

   const updateBudget = useCallback(async (id: string, updates: any): Promise<any> => {
     try {
       console.log('📊 Atualizando orçamento no banco...', { id, updates });
       
       const budget = await clientDatabaseAdapter.updateBudget(id, updates);
       eventBus.emit('data:budget:updated', budget);
       
       console.log('✅ Orçamento atualizado com sucesso:', budget);
       return budget;
     } catch (error) {
       console.error('❌ Erro ao atualizar orçamento:', error);
       eventBus.emit('system:error', { 
         message: `Erro ao atualizar orçamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
       });
       throw error;
     }
   }, []);

   const deleteBudget = useCallback(async (id: string): Promise<void> => {
     try {
       console.log('📊 Deletando orçamento do banco...', id);
       
       await clientDatabaseAdapter.deleteBudget(id);
       eventBus.emit('data:budget:deleted', { id });
      
      console.log('✅ Orçamento deletado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar orçamento:', error);
      eventBus.emit('system:error', { 
        message: `Erro ao deletar orçamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
      throw error;
    }
  }, []);

  // UTILITÁRIOS
  const getAccountBalance = useCallback((accountId: string): number => {
    const account = dataState.accounts.find(acc => acc.id === accountId);
    return account?.balance || 0;
  }, [dataState.accounts]);

  const getTotalBalance = useCallback((): number => {
    return dataState.accounts.reduce((total, account) => total + (account.balance || 0), 0);
  }, [dataState.accounts]);

  const getTransactionsByAccount = useCallback((accountId: string): any[] => {
    return dataState.transactions.filter(transaction => transaction.accountId === accountId);
  }, [dataState.transactions]);

  const getTransactionsByDateRange = useCallback((startDate: string, endDate: string): any[] => {
    return dataState.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return transactionDate >= start && transactionDate <= end;
    });
  }, [dataState.transactions]);

  return {
    // Estado dos dados
    accounts: dataState.accounts,
    transactions: dataState.transactions,
    creditCards: dataState.creditCards,
    budgets: dataState.budgets,
    
    // Estado de carregamento
    isLoading: dataState.isLoading,
    errors: dataState.errors,
    lastUpdated: dataState.lastUpdated,
    
    // Ações
    refreshData,
    clearErrors,
    
    // Operações de contas
    createAccount,
    updateAccount,
    deleteAccount,
    
    // Operações de transações
    createTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Operações de cartões de crédito
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
    
    // Operações de orçamentos
    createBudget,
    updateBudget,
    deleteBudget,
    
    // Utilitários
    getAccountBalance,
    getTotalBalance,
    getTransactionsByAccount,
    getTransactionsByDateRange
  };
}

/**
 * Função para carregar dados iniciais
 */
const loadInitialData = useCallback(async () => {
if (state.isLoading) return;

setState(prev => ({ ...prev, isLoading: true, error: null }));

try {
// Carregar transactions como fonte principal de dados
const transactionsResponse = await fetch('/api/transactions');
if (transactionsResponse.ok) {
const transactionsData = await transactionsResponse.json();
setState(prev => ({ 
...prev, 
transactions: transactionsData.data || transactionsData.transactions || []
}));
}

// Carregar accounts
const accountsResponse = await fetch('/api/accounts');
if (accountsResponse.ok) {
const accountsData = await accountsResponse.json();
setState(prev => ({ 
...prev, 
accounts: accountsData.data || accountsData.accounts || []
}));
}

// Carregar goals
const goalsResponse = await fetch('/api/goals');
if (goalsResponse.ok) {
const goalsData = await goalsResponse.json();
setState(prev => ({ 
...prev, 
goals: goalsData.data?.goals || goalsData.goals || []
}));
}

// Carregar budgets
const budgetsResponse = await fetch('/api/budgets');
if (budgetsResponse.ok) {
const budgetsData = await budgetsResponse.json();
setState(prev => ({ 
...prev, 
budgets: budgetsData.data || budgetsData.budgets || []
}));
}

// Carregar investments
const investmentsResponse = await fetch('/api/investments');
if (investmentsResponse.ok) {
const investmentsData = await investmentsResponse.json();
setState(prev => ({ 
...prev, 
investments: investmentsData.data || investmentsData.investments || []
}));
}

// Carregar trips
const tripsResponse = await fetch('/api/trips');
if (tripsResponse.ok) {
const tripsData = await tripsResponse.json();
setState(prev => ({ 
...prev, 
trips: tripsData.data || tripsData.trips || []
}));
}

} catch (error) {
console.error('Erro ao carregar dados:', error);
setState(prev => ({ 
...prev, 
error: error instanceof Error ? error.message : 'Erro ao carregar dados'
}));
} finally {
setState(prev => ({ ...prev, isLoading: false }));
}
}, [state.isLoading]);

  // Função para calcular saldo das contas baseado em transactions
  const calculateAccountBalance = useCallback((accountId: string): number => {
    return state.transactions
      .filter(transaction => transaction.accountId === accountId)
      .reduce((balance, transaction) => {
        if (transaction.type === 'income') {
          return balance + transaction.amount;
        } else if (transaction.type === 'expense') {
          return balance - transaction.amount;
        }
        return balance;
      }, 0);
  }, [state.transactions]);

  // Função para filtrar transactions por conta
  const getTransactionsByAccount = useCallback((accountId: string) => {
    return state.transactions.filter(transaction => transaction.accountId === accountId);
  }, [state.transactions]);

  // Função para filtrar transactions por período
  const getTransactionsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return state.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [state.transactions]);

  // Função para calcular estatísticas baseadas em transactions
  const getFinancialStats = useCallback(() => {
    const totalIncome = state.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = state.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      balance,
      transactionCount: state.transactions.length
    };
  }, [state.transactions]);

  // Retornar todas as funcionalidades do hook
  return {
    // Estados
    ...state,
    
    // Funções de carregamento
    loadInitialData,
    refreshData: loadInitialData,
    clearError,
    
    // Operações CRUD para accounts
    createAccount,
    updateAccount,
    deleteAccount,
    
    // Operações CRUD para transactions
    createTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Operações CRUD para credit cards
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
    
    // Operações CRUD para budgets
    createBudget,
    updateBudget,
    deleteBudget,
    
    // Funções utilitárias baseadas em transactions
    calculateAccountBalance,
    getTransactionsByAccount,
    getTransactionsByDateRange,
    getFinancialStats
  };
}
