'use client';

import { useMemo } from 'react';
import { useUnified } from '@/contexts/unified-context-simple';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  account?: string;
  tags?: string[];
}

export function useTransactions() {
  const { accounts, transactions: transactionsData, loading, error, balances } = useUnified();
  
  const transactions = useMemo(() => {
    return Array.isArray(transactionsData) ? transactionsData : [];
  }, [transactionsData]);

  // 🔒 USAR DADOS PRÉ-CALCULADOS DO USEUNIFIED
  const totalIncome = balances?.totalIncome || 0;
  const totalExpenses = balances?.totalExpenses || 0;
  const balance = balances?.totalBalance || 0;

  const transactionsByCategory = useMemo(() => {
    // Use pre-calculated data from useUnified if available
    if (balances?.expensesByCategory) {
      return balances.expensesByCategory;
    }
    
    // Fallback: Group transactions by category
    const grouped: Record<string, Transaction[]> = {};
    
    transactions.forEach(transaction => {
      if (!grouped[transaction.category]) {
        grouped[transaction.category] = [];
      }
      grouped[transaction.category].push(transaction);
    });
    
    return grouped;
  }, [transactions, balances?.expensesByCategory]);

  const recentTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactions]);

  const searchTransactions = (query: string) => {
    if (!query.trim()) return transactions;
    
    const lowercaseQuery = query.toLowerCase();
    return transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(lowercaseQuery) ||
      transaction.category.toLowerCase().includes(lowercaseQuery) ||
      transaction.amount.toString().includes(query)
    );
  };

  const getTransactionsByDateRange = (startDate: string, endDate: string) => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return transactionDate >= start && transactionDate <= end;
    });
  };

  const getTransactionsByCategory = (category: string) => {
    return transactions.filter(transaction => transaction.category === category);
  };

  return {
    transactions,
    totalIncome,
    totalExpenses,
    balance,
    transactionsByCategory,
    recentTransactions,
    searchTransactions,
    getTransactionsByDateRange,
    getTransactionsByCategory,
    isLoading: loading || false,
    error: error || null,
  };
}

export function useRecentTransactions(limit: number = 10) {
  const { transactions, loading, error } = useTransactions();
  
  const recentTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [transactions, limit]);

  return {
    data: recentTransactions,
    isLoading: loading,
    error,
  };
}

export function useTransactionStats() {
  const { transactions, totalIncome, totalExpenses, balance, transactionsByCategory } = useTransactions();
  const { balances } = useUnified();
  
  const stats = useMemo(() => {
    // 🔒 USAR DADOS PRÉ-CALCULADOS DO USEUNIFIED
    const monthlyIncome = balances?.monthlyIncome || 0;
    const monthlyExpenses = balances?.monthlyExpenses || 0;
    const monthlyBalance = monthlyIncome - monthlyExpenses;
    
    // 🔒 USAR DADOS PRÉ-CALCULADOS DO USEUNIFIED
    const categoryStats = balances?.categoryStats || 
      balances?.expensesByCategory || 
      Object.entries(transactionsByCategory).map(([category, categoryTransactions]) => ({
        category,
        total: 0, // Avoid local calculations - should come from balances
        count: Array.isArray(categoryTransactions) ? categoryTransactions.length : 0,
        percentage: 0 // Avoid local calculations - should come from balances
      }));
    
    return {
      totalIncome,
      totalExpenses,
      balance,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance,
      categoryStats,
      transactionCount: transactions.length,
      averageTransaction: transactions.length > 0 ? 
        (totalIncome + totalExpenses) / transactions.length : 0
    };
  }, [transactions, totalIncome, totalExpenses, balance, transactionsByCategory, balances]);
  
  return stats;
}
