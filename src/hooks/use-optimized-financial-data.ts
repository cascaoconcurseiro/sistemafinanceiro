/**
 * Hooks Otimizados para Dados Financeiros
 * 
 * Hooks especializados que combinam cache, estado global e atualizações em tempo real
 * com prevenção de re-renders desnecessários.
 */

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useFinancialStore, Account, Transaction, Category } from '@/lib/store/financial-store';
import { useOptimizedSelector, useRealTimeUpdates, useRealTimeSync } from '@/lib/store/real-time-updates';
import { useCache } from './use-cache';

// Hook otimizado para contas
export function useOptimizedAccounts() {
  const accounts = useOptimizedSelector(
    state => state.accounts,
    (prev, next) => {
      if (prev.length !== next.length) return false;
      return prev.every((account, index) => 
        account.id === next[index]?.id && 
        account.balance === next[index]?.balance &&
        account.updatedAt === next[index]?.updatedAt
      );
    }
  );

  const isLoading = useOptimizedSelector(state => state.isLoading.accounts);
  const loadAccounts = useFinancialStore(state => state.loadAccounts);
  
  // Escutar atualizações em tempo real
  const updates = useRealTimeUpdates('account');
  
  // Carregar dados na inicialização se necessário
  useEffect(() => {
    if (accounts.length === 0 && !isLoading) {
      loadAccounts();
    }
  }, [accounts.length, isLoading, loadAccounts]);

  // Seletores memoizados
  const activeAccounts = useMemo(
    () => accounts.filter(account => account.isActive),
    [accounts]
  );

  const totalBalance = useMemo(
    () => activeAccounts.reduce((total, account) => total + account.balance, 0),
    [activeAccounts]
  );

  const accountsByType = useMemo(
    () => activeAccounts.reduce((groups, account) => {
      const type = account.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(account);
      return groups;
    }, {} as Record<string, Account[]>),
    [activeAccounts]
  );

  return {
    accounts: activeAccounts,
    allAccounts: accounts,
    isLoading,
    totalBalance,
    accountsByType,
    recentUpdates: updates.slice(-3), // Últimas 3 atualizações
    refresh: loadAccounts,
  };
}

// Hook otimizado para transações com filtros
export function useOptimizedTransactions(filters?: {
  accountIds?: string[];
  categoryIds?: string[];
  dateRange?: { start: string; end: string };
  types?: ('income' | 'expense' | 'transfer')[];
  limit?: number;
}) {
  const allTransactions = useOptimizedSelector(state => state.transactions);
  const isLoading = useOptimizedSelector(state => state.isLoading.transactions);
  const loadTransactions = useFinancialStore(state => state.loadTransactions);
  
  // Aplicar filtros de forma otimizada
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    if (filters?.accountIds?.length) {
      filtered = filtered.filter(t => filters.accountIds!.includes(t.accountId));
    }

    if (filters?.categoryIds?.length) {
      filtered = filtered.filter(t => filters.categoryIds!.includes(t.categoryId));
    }

    if (filters?.types?.length) {
      filtered = filtered.filter(t => filters.types!.includes(t.type));
    }

    if (filters?.dateRange) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Aplicar limite se especificado
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }, [allTransactions, filters]);

  // Estatísticas calculadas
  const statistics = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const pending = filteredTransactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      pending,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Escutar atualizações
  const updates = useRealTimeUpdates('transaction');

  // Carregar dados se necessário
  useEffect(() => {
    if (allTransactions.length === 0 && !isLoading) {
      loadTransactions();
    }
  }, [allTransactions.length, isLoading, loadTransactions]);

  return {
    transactions: filteredTransactions,
    statistics,
    isLoading,
    recentUpdates: updates.slice(-5),
    refresh: loadTransactions,
  };
}

// Hook para resumo financeiro otimizado
export function useFinancialSummary(period: { start: string; end: string }) {
  const { transactions, statistics, isLoading: transactionsLoading } = useOptimizedTransactions({
    dateRange: period,
  });

  const { accounts, totalBalance, isLoading: accountsLoading } = useOptimizedAccounts();
  
  const categories = useOptimizedSelector(state => state.categories);

  // Resumo por categoria
  const categoryBreakdown = useMemo(() => {
    const breakdown = new Map<string, {
      category: Category;
      income: number;
      expenses: number;
      count: number;
    }>();

    transactions.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      if (!category) return;

      const existing = breakdown.get(category.id) || {
        category,
        income: 0,
        expenses: 0,
        count: 0,
      };

      if (transaction.type === 'income') {
        existing.income += transaction.amount;
      } else if (transaction.type === 'expense') {
        existing.expenses += transaction.amount;
      }

      existing.count++;
      breakdown.set(category.id, existing);
    });

    return Array.from(breakdown.values())
      .sort((a, b) => (b.income + b.expenses) - (a.income + a.expenses));
  }, [transactions, categories]);

  // Tendências (comparação com período anterior)
  const previousPeriod = useMemo(() => {
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    const periodLength = endDate.getTime() - startDate.getTime();
    
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = new Date(startDate.getTime() - 1);

    return {
      start: previousStart.toISOString().split('T')[0],
      end: previousEnd.toISOString().split('T')[0],
    };
  }, [period]);

  const { statistics: previousStats } = useOptimizedTransactions({
    dateRange: previousPeriod,
  });

  const trends = useMemo(() => {
    const incomeChange = statistics.income - previousStats.income;
    const expenseChange = statistics.expenses - previousStats.expenses;
    const balanceChange = statistics.balance - previousStats.balance;

    return {
      income: {
        value: incomeChange,
        percentage: previousStats.income > 0 ? (incomeChange / previousStats.income) * 100 : 0,
      },
      expenses: {
        value: expenseChange,
        percentage: previousStats.expenses > 0 ? (expenseChange / previousStats.expenses) * 100 : 0,
      },
      balance: {
        value: balanceChange,
        percentage: previousStats.balance !== 0 ? (balanceChange / Math.abs(previousStats.balance)) * 100 : 0,
      },
    };
  }, [statistics, previousStats]);

  return {
    period,
    statistics,
    totalBalance,
    categoryBreakdown,
    trends,
    accounts: accounts.length,
    isLoading: transactionsLoading || accountsLoading,
  };
}

// Hook para operações CRUD otimizadas
export function useFinancialOperations() {
  const store = useFinancialStore();
  const { syncEntity } = useRealTimeSync();

  // Operações de conta
  const accountOperations = useMemo(() => ({
    create: async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
      const account = await store.createAccount(accountData);
      syncEntity('account', account.id);
      return account;
    },
    
    update: async (id: string, updates: Partial<Account>) => {
      const account = await store.updateAccount(id, updates);
      syncEntity('account', id);
      return account;
    },
    
    delete: async (id: string) => {
      await store.deleteAccount(id);
      syncEntity('account');
    },
  }), [store, syncEntity]);

  // Operações de transação
  const transactionOperations = useMemo(() => ({
    create: async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const transaction = await store.createTransaction(transactionData);
      syncEntity('transaction', transaction.id);
      // Também sincronizar conta afetada
      syncEntity('account', transaction.accountId);
      return transaction;
    },
    
    update: async (id: string, updates: Partial<Transaction>) => {
      const transaction = await store.updateTransaction(id, updates);
      syncEntity('transaction', id);
      syncEntity('account', transaction.accountId);
      return transaction;
    },
    
    delete: async (id: string) => {
      const transaction = store.transactions.find(t => t.id === id);
      await store.deleteTransaction(id);
      syncEntity('transaction');
      if (transaction) {
        syncEntity('account', transaction.accountId);
      }
    },
  }), [store, syncEntity]);

  // Operações de categoria
  const categoryOperations = useMemo(() => ({
    create: async (categoryData: Omit<Category, 'id'>) => {
      const category = await store.createCategory(categoryData);
      syncEntity('category', category.id);
      return category;
    },
    
    update: async (id: string, updates: Partial<Category>) => {
      const category = await store.updateCategory(id, updates);
      syncEntity('category', id);
      return category;
    },
    
    delete: async (id: string) => {
      await store.deleteCategory(id);
      syncEntity('category');
    },
  }), [store, syncEntity]);

  return {
    accounts: accountOperations,
    transactions: transactionOperations,
    categories: categoryOperations,
  };
}

// Hook para performance e debug
export function usePerformanceMonitor() {
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState(Date.now());
  
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    setLastRenderTime(Date.now());
  });

  const updates = useRealTimeUpdates(['account', 'transaction', 'category']);
  const { syncStatus } = useRealTimeSync();

  return {
    renderCount,
    lastRenderTime,
    recentUpdates: updates.slice(-10),
    syncStatus,
    cacheStats: {
      // Adicionar estatísticas de cache se necessário
    },
  };
}