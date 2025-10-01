import { useState, useEffect, useMemo } from 'react';
import { useUnified } from '@/contexts/unified-context-simple';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function useOptimizedAccounts() {
  const { accounts, transactions, loading, error, balances } = useUnified();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Account['type'] | 'all'>('all');

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];

    return accounts.filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || account.type === filterType;
      return matchesSearch && matchesType && account.isActive;
    });
  }, [accounts, searchTerm, filterType]);

  // 🔒 USAR DADOS PRÉ-CALCULADOS DO USEUNIFIED
  const totalBalance = balances?.totalBalance || 0;

  const accountsByType = useMemo(() => {
    return filteredAccounts.reduce((acc, account) => {
      if (!acc[account.type]) {
        acc[account.type] = [];
      }
      acc[account.type].push(account);
      return acc;
    }, {} as Record<Account['type'], Account[]>);
  }, [filteredAccounts]);

  // 🔒 USAR SALDOS PRÉ-CALCULADOS DAS CONTAS
  const accountsWithBalances = useMemo(() => {
    return filteredAccounts.map(account => ({
      ...account,
      balance: balances?.accountBalances?.[account.id] || account.balance || 0
    }));
  }, [filteredAccounts, balances?.accountBalances]);

  return {
    accounts: accountsWithBalances,
    allAccounts: accounts || [],
    isLoading: loading,
    error,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    totalBalance,
    accountsByType,
    refresh: () => {} // TODO: Implement refresh via Unified Context actions
  };
}

// Export alias para compatibilidade
export const useAccounts = useOptimizedAccounts;
