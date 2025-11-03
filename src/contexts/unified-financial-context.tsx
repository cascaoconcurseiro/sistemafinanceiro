'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { ApiClient } from '@/lib/api/api-client';
import type { InstallmentInput, SharedDebtInput } from '@/lib/validation/schemas';
import { IntegratedFinancialService } from '@/lib/services/integrated-financial-service';

// Types for the unified financial context
interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
  currency?: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string | Date;
  accountId: string;
  type: string;
  category: string;
  status?: string;
  sharedWith?: string[];
  tripId?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  relationship?: string;
  phone?: string;
  isActive?: boolean;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: string;
  currency: string;
  participants?: string[];
  description?: string;
}

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate?: string;
  description?: string;
  priority?: string;
  isCompleted: boolean;
  progressPercentage?: number;
}

interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  period: string;
  isActive: boolean;
}

interface Investment {
  id: string;
  ticker: string;
  name: string;
  type: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  broker?: string;
  status: string;
  purchaseDate?: string;
}

interface FinancialMetrics {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  accountBalances: Record<string, number>;
  expensesByCategory: Record<string, number>;
  goalsProgress: number;
  budgetUtilization: Record<string, { spent: number; budget: number; percentage: number }>;
}

interface UnifiedFinancialData {
  accounts: Account[];
  transactions: Transaction[];
  contacts: Contact[];
  trips: Trip[];
  goals: Goal[];
  budgets: Budget[];
  investments: Investment[];
  categories: any[];
  balances: FinancialMetrics | null;
  meta?: {
    lastUpdated: string;
    totalRecords: number;
  };
}

interface UnifiedFinancialContextType {
  // Dados unificados
  data: UnifiedFinancialData | null;

  // Dados individuais (para compatibilidade)
  accounts: Account[];
  transactions: Transaction[];
  contacts: Contact[];
  trips: Trip[];
  goals: Goal[];
  budgets: Budget[];
  investments: Investment[];
  categories: any[];

  // Estado
  loading: boolean;
  isLoading: boolean;
  error: string | null;

  // Métricas pré-calculadas
  balances: FinancialMetrics | null;

  // Actions
  actions: {
    // Core
    refresh: () => void;
    forceRefresh: () => Promise<void>;

    // Transactions
    createTransaction: (data: any) => Promise<any>;
    updateTransaction: (id: string, data: any) => Promise<any>;
    deleteTransaction: (id: string) => Promise<any>;

    // Accounts
    createAccount: (data: any) => Promise<any>;
    updateAccount: (id: string, data: any) => Promise<any>;
    deleteAccount: (id: string) => Promise<any>;

    // Credit Cards
    createCreditCard: (data: any) => Promise<any>;
    updateCreditCard: (id: string, data: any) => Promise<any>;
    deleteCreditCard: (id: string) => Promise<any>;

    // Goals
    createGoal: (data: any) => Promise<any>;
    updateGoal: (id: string, data: any) => Promise<any>;
    deleteGoal: (id: string) => Promise<any>;

    // Budgets
    createBudget: (data: any) => Promise<any>;
    updateBudget: (id: string, data: any) => Promise<any>;
    deleteBudget: (id: string) => Promise<any>;

    // Trips
    createTrip: (data: any) => Promise<any>;
    updateTrip: (id: string, data: any) => Promise<any>;
    deleteTrip: (id: string) => Promise<any>;

    // ✨ Regras Avançadas
    anticipateInstallments: (installmentGroupId: string, accountId: string, discountPercent?: number) => Promise<any>;
    updateFutureInstallments: (installmentGroupId: string, fromInstallment: number, newAmount: number) => Promise<any>;
    cancelFutureInstallments: (installmentGroupId: string, reason?: string) => Promise<any>;
    payInvoicePartial: (invoiceId: string, accountId: string, amount: number, paymentDate?: string) => Promise<any>;
    reversePayment: (paymentId: string, reason: string) => Promise<any>;

    // ✨ Integridade
    validateConsistency: () => Promise<any>;
    fixInconsistencies: () => Promise<any>;
    detectDuplicate: (amount: number, description: string, date: string) => Promise<any>;
  };

  // Compatibility (DEPRECATED - usar dados diretos)
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
}

const defaultData: UnifiedFinancialData = {
  accounts: [],
  transactions: [],
  contacts: [],
  trips: [],
  goals: [],
  budgets: [],
  investments: [],
  categories: [],
  balances: null
};

const UnifiedFinancialContext = createContext<UnifiedFinancialContextType>({
  data: null,
  accounts: [],
  transactions: [],
  contacts: [],
  trips: [],
  goals: [],
  budgets: [],
  investments: [],
  categories: [],
  loading: false,
  isLoading: false,
  error: null,
  balances: null,
  actions: {
    refresh: () => {},
    forceRefresh: async () => {},
    createTransaction: async () => ({}),
    updateTransaction: async () => ({}),
    deleteTransaction: async () => ({}),
    createAccount: async () => ({}),
    updateAccount: async () => ({}),
    deleteAccount: async () => ({}),
    createCreditCard: async () => ({}),
    updateCreditCard: async () => ({}),
    deleteCreditCard: async () => ({}),
    createGoal: async () => ({}),
    updateGoal: async () => ({}),
    deleteGoal: async () => ({}),
    createBudget: async () => ({}),
    updateBudget: async () => ({}),
    deleteBudget: async () => ({}),
    createTrip: async () => ({}),
    updateTrip: async () => ({}),
    deleteTrip: async () => ({}),
    anticipateInstallments: async () => ({}),
    updateFutureInstallments: async () => ({}),
    cancelFutureInstallments: async () => ({}),
    payInvoicePartial: async () => ({}),
    reversePayment: async () => ({}),
    validateConsistency: async () => ({}),
    fixInconsistencies: async () => ({}),
    detectDuplicate: async () => ({}),
  },
  totalBalance: 0,
  totalIncome: 0,
  totalExpenses: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  monthlyBalance: 0,
});

export function UnifiedProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<UnifiedFinancialData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // 🚀 FETCH OTIMIZADO - UMA ÚNICA CHAMADA
  const fetchUnifiedData = useCallback(async () => {
    // Prevenir retry infinito
    if (retryCount >= MAX_RETRIES) {
      console.error('❌ [UnifiedContext] Máximo de tentativas atingido');
      setError('Não foi possível carregar os dados após várias tentativas');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
            const response = await fetch('/api/unified-financial/optimized', {
        credentials: 'include',
        cache: 'no-cache'
      });

      
      if (!response.ok) {
        if (response.status === 401) {
          setData(defaultData);
          setLoading(false);
          return;
        }
        throw new Error(`Erro ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [UnifiedContext] Dados unificados recebidos:', {
        accounts: result.accounts?.length || 0,
        transactions: result.transactions?.length || 0,
        contacts: result.contacts?.length || 0,
        trips: result.trips?.length || 0,
        goals: result.goals?.length || 0,
        budgets: result.budgets?.length || 0,
        investments: result.investments?.length || 0,
        totalRecords: result.meta?.totalRecords || 0
      });

      setData(result);
      setError(null);

      console.log('🎉 [UnifiedContext] Dados definidos com sucesso:', {
        accounts: result.accounts?.length || 0,
        loading: false
      });

    } catch (err) {
      console.error('❌ [UnifiedContext] Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      setData(defaultData);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  // Fetch data when component mounts - with debouncing
  useEffect(() => {
    // Load data immediately to prevent timing issues with forms
            fetchUnifiedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez no mount

  // Listen for cache invalidation events and account updates
  useEffect(() => {
    const handleCacheInvalidation = (event: CustomEvent) => {
      const { entity } = event.detail;
      console.log(`🔄 [UnifiedContext] Cache invalidation received for: ${entity}`);

      if (entity === 'unified-financial-data' || entity === 'transactions') {
                fetchUnifiedData();
      }
    };

    const handleAccountsUpdated = () => {
            fetchUnifiedData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cache-invalidation', handleCacheInvalidation as EventListener);
      window.addEventListener('accountsUpdated', handleAccountsUpdated);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cache-invalidation', handleCacheInvalidation as EventListener);
        window.removeEventListener('accountsUpdated', handleAccountsUpdated);
      }
    };
  }, [fetchUnifiedData]);

  // Action functions
  const actions = useMemo(() => ({
    refresh: () => {
      fetchUnifiedData();
    },

    // Force refresh - clears cache and refetches
    forceRefresh: async () => {
            setLoading(true);
      await fetchUnifiedData();
    },

    // ✨ NOVOS MÉTODOS - Parcelamentos
    createInstallments: async (installmentData: InstallmentInput) => {
      try {
        setLoading(true);
        setError(null);

        const result = await ApiClient.post<{ success: boolean; installments: any[] }>(
          '/api/installments',
          installmentData
        );

                await fetchUnifiedData();
        return result.installments;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao criar parcelamento';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    payInstallment: async (installmentId: string, accountId: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await ApiClient.post<{ success: boolean; payment: Transaction }>(
          `/api/installments/${installmentId}/pay`,
          { accountId }
        );

                await fetchUnifiedData();
        return result.payment;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao pagar parcela';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // ✨ NOVOS MÉTODOS - Transferências
    createTransfer: async (fromAccountId: string, toAccountId: string, amount: number, description: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await ApiClient.post<{ success: boolean; transfer: any }>(
          '/api/transfers',
          { fromAccountId, toAccountId, amount, description }
        );

                await fetchUnifiedData();
        return result.transfer;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao criar transferência';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // ✨ NOVOS MÉTODOS - Despesas Compartilhadas
    createSharedExpense: async (expenseData: SharedDebtInput) => {
      try {
        setLoading(true);
        setError(null);

        const result = await ApiClient.post<{ success: boolean; expense: any }>(
          '/api/shared-expenses',
          expenseData
        );

                await fetchUnifiedData();
        return result.expense;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao criar despesa compartilhada';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    paySharedDebt: async (debtId: string, accountId: string, amount: number) => {
      try {
        setLoading(true);
        setError(null);

        const result = await ApiClient.post<{ success: boolean; payment: Transaction; debt: any }>(
          `/api/shared-debts/${debtId}/pay`,
          { accountId, amount }
        );

                await fetchUnifiedData();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao pagar dívida';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // ✨ NOVOS MÉTODOS - Manutenção
    recalculateBalances: async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await ApiClient.post<{ success: boolean; results: any[] }>(
          '/api/maintenance/recalculate-balances',
          {}
        );

                await fetchUnifiedData();
        return result.results;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao recalcular saldos';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    verifyIntegrity: async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await ApiClient.get<{ hasIssues: boolean; issues: any[] }>(
          '/api/maintenance/verify-integrity'
        );

                return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao verificar integridade';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    createTransaction: async (transactionData: any) => {
      try {
        setLoading(true);
        setError(null);

        // ✅ VALIDAR com Zod antes de enviar (validação básica, API fará validação completa)
        
        // ✅ USAR ApiClient com retry automático
        const result = await ApiClient.post<{ success: boolean; transaction: Transaction }>(
          '/api/transactions',
          transactionData
        );

        
        // ✅ Atualizar estado local imediatamente (otimistic update)
        if (result.transaction) {
          setData(prev => ({
            ...prev,
            transactions: [...(prev?.transactions || []), result.transaction]
          }));
        }

        // ✅ Refresh completo em background
        fetchUnifiedData().catch(err => {
          console.error('❌ [UnifiedContext] Erro no refresh automático:', err);
        });

        // ✅ Emitir evento para outros componentes
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('transaction-created', {
            detail: { transaction: result.transaction }
          }));
        }

        return result.transaction;
      } catch (error) {
        console.error('❌ [UnifiedContext] Erro ao criar transação:', error);
        const message = error instanceof Error ? error.message : 'Erro ao criar transação';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    updateTransaction: async (id: string, transactionData: any) => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Preparar dados para atualização (API fará validação)
        
        // ✅ USAR ApiClient
        const result = await ApiClient.put<{ success: boolean; transaction: Transaction }>(
          `/api/transactions/${id}`,
          transactionData
        );

        
        // ✅ Atualizar estado local (optimistic update)
        if (result.transaction) {
          setData(prev => ({
            ...prev,
            transactions: (prev?.transactions || []).map(t =>
              t.id === id ? result.transaction : t
            )
          }));
        }

        // ✅ Refresh completo em background
        fetchUnifiedData().catch(err => {
          console.error('❌ [UnifiedContext] Erro no refresh:', err);
        });

        return result.transaction;
      } catch (error) {
        console.error('❌ [UnifiedContext] Erro ao atualizar transação:', error);
        const message = error instanceof Error ? error.message : 'Erro ao atualizar transação';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    deleteTransaction: async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        console.log('🗑️ [UnifiedContext] Deletando transação:', id);

        // ✅ USAR ApiClient
        const result = await ApiClient.delete<{ success: boolean; message: string }>(
          `/api/transactions/${id}`
        );

        console.log('✅ [UnifiedContext] Transação deletada com sucesso');
        
        // ✅ Atualizar estado local (optimistic update)
        setData(prev => ({
          ...prev,
          transactions: (prev?.transactions || []).filter(t => t.id !== id)
        }));

        // ✅ CRÍTICO: Forçar refresh IMEDIATO dos dados
        await fetchUnifiedData();
        
        console.log('✅ [UnifiedContext] Dados atualizados após deleção');

        return result;
      } catch (error) {
        console.error('❌ [UnifiedContext] Erro ao deletar transação:', error);
        const message = error instanceof Error ? error.message : 'Erro ao deletar transação';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // ✨ ACCOUNTS ACTIONS
    createAccount: async (accountData: any) => {
            try {
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(accountData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar conta');
        }

        const result = await response.json();
        await fetchUnifiedData();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('account-created', {
            detail: { account: result }
          }));
        }

        return result;
      } catch (error) {
        console.error('❌ [UnifiedContext] Erro ao criar conta:', error);
        throw error;
      }
    },

    updateAccount: async (id: string, accountData: any) => {
      try {
        const response = await fetch(`/api/accounts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(accountData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar conta');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error updating account:', error);
        throw error;
      }
    },

    deleteAccount: async (id: string) => {
      try {
        const response = await fetch(`/api/accounts/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao deletar conta');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
      }
    },

    // ✨ CREDIT CARDS ACTIONS
    createCreditCard: async (cardData: any) => {
            try {
        const response = await fetch('/api/credit-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(cardData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar cartão');
        }

        const result = await response.json();
        await fetchUnifiedData();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('credit-card-created', {
            detail: { card: result }
          }));
        }

        return result;
      } catch (error) {
        console.error('❌ [UnifiedContext] Erro ao criar cartão:', error);
        throw error;
      }
    },

    updateCreditCard: async (id: string, cardData: any) => {
      try {
        const response = await fetch(`/api/credit-cards/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(cardData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar cartão');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error updating credit card:', error);
        throw error;
      }
    },

    deleteCreditCard: async (id: string) => {
      try {
        const response = await fetch(`/api/credit-cards/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao deletar cartão');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error deleting credit card:', error);
        throw error;
      }
    },

    // ✨ GOALS ACTIONS
    createGoal: async (goalData: any) => {
            try {
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(goalData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar meta');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('❌ [UnifiedContext] Erro ao criar meta:', error);
        throw error;
      }
    },

    updateGoal: async (id: string, goalData: any) => {
      try {
        const response = await fetch(`/api/goals/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(goalData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar meta');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error updating goal:', error);
        throw error;
      }
    },

    deleteGoal: async (id: string) => {
      try {
        const response = await fetch(`/api/goals/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao deletar meta');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error deleting goal:', error);
        throw error;
      }
    },

    // ✨ TRIPS ACTIONS
    createTrip: async (tripData: any) => {
            try {
        const response = await fetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(tripData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar viagem');
        }

        const result = await response.json();
        await fetchUnifiedData();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('trip-created', {
            detail: { trip: result }
          }));
        }

        return result;
      } catch (error) {
        console.error('❌ [UnifiedContext] Erro ao criar viagem:', error);
        throw error;
      }
    },

    updateTrip: async (id: string, tripData: any) => {
      try {
        const response = await fetch(`/api/trips/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(tripData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar viagem');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error updating trip:', error);
        throw error;
      }
    },

    deleteTrip: async (id: string) => {
      try {
        const response = await fetch(`/api/trips/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao deletar viagem');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error deleting trip:', error);
        throw error;
      }
    },

    // ✨ BUDGETS ACTIONS
    createBudget: async (budgetData: any) => {
            try {
        const response = await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(budgetData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar orçamento');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('❌ [UnifiedContext] Erro ao criar orçamento:', error);
        throw error;
      }
    },

    updateBudget: async (id: string, budgetData: any) => {
      try {
        const response = await fetch(`/api/budgets/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(budgetData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar orçamento');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error updating budget:', error);
        throw error;
      }
    },

    deleteBudget: async (id: string) => {
      try {
        const response = await fetch(`/api/budgets/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao deletar orçamento');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error deleting budget:', error);
        throw error;
      }
    },

    // ✨ NOVAS FUNCIONALIDADES - REGRAS AVANÇADAS

    // Antecipar parcelas
    anticipateInstallments: async (installmentGroupId: string, accountId: string, discountPercent: number = 0) => {
      try {
        const response = await fetch('/api/installments/anticipate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ installmentGroupId, accountId, discountPercent }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao antecipar parcelas');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error anticipating installments:', error);
        throw error;
      }
    },

    // Editar parcelas futuras
    updateFutureInstallments: async (installmentGroupId: string, fromInstallment: number, newAmount: number) => {
      try {
        const response = await fetch('/api/installments/update-future', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ installmentGroupId, fromInstallment, newAmount }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar parcelas');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error updating future installments:', error);
        throw error;
      }
    },

    // Cancelar parcelas futuras
    cancelFutureInstallments: async (installmentGroupId: string, reason?: string) => {
      try {
        const response = await fetch('/api/installments/cancel-future', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ installmentGroupId, reason }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao cancelar parcelas');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error canceling future installments:', error);
        throw error;
      }
    },

    // Pagar fatura parcialmente (rotativo)
    payInvoicePartial: async (invoiceId: string, accountId: string, amount: number, paymentDate?: string) => {
      try {
        const response = await fetch('/api/invoices/pay-partial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ invoiceId, accountId, amount, paymentDate }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao pagar fatura');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error paying invoice partially:', error);
        throw error;
      }
    },

    // Estornar pagamento
    reversePayment: async (paymentId: string, reason: string) => {
      try {
        const response = await fetch('/api/invoices/reverse-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ paymentId, reason }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao estornar pagamento');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error reversing payment:', error);
        throw error;
      }
    },

    // ✨ INTEGRIDADE DE DADOS

    // Validar consistência
    validateConsistency: async () => {
      try {
        const response = await fetch('/api/integrity/validate', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao validar consistência');
        }

        return await response.json();
      } catch (error) {
        console.error('Error validating consistency:', error);
        throw error;
      }
    },

    // Corrigir inconsistências
    fixInconsistencies: async () => {
      try {
        const response = await fetch('/api/integrity/fix', {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao corrigir inconsistências');
        }

        const result = await response.json();
        await fetchUnifiedData();
        return result;
      } catch (error) {
        console.error('Error fixing inconsistencies:', error);
        throw error;
      }
    },

    // Detectar duplicata
    detectDuplicate: async (amount: number, description: string, date: string) => {
      try {
        const response = await fetch('/api/transactions/detect-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ amount, description, date }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao detectar duplicata');
        }

        return await response.json();
      } catch (error) {
        console.error('Error detecting duplicate:', error);
        throw error;
      }
    },
  }), [fetchUnifiedData]);

  // Computed values from unified data
  // ✅ CORREÇÃO: Mesclar cartões de crédito com contas para o formulário
  const bankAccounts = data?.accounts || [];
  const creditCards = data?.creditCards || [];
  
  // Converter cartões para formato de conta
  const creditCardsAsAccounts = creditCards.map((card: any) => ({
    id: `card-${card.id}`, // Prefixo para diferenciar
    name: card.name,
    type: 'credit_card',
    balance: -(card.currentBalance || 0), // Negativo porque é dívida
    isActive: card.isActive,
    currency: 'BRL',
    // Dados extras do cartão
    limit: card.limit,
    availableLimit: card.availableLimit,
    closingDay: card.closingDay,
    dueDay: card.dueDay,
    originalId: card.id, // ID original do cartão
  }));
  
  // Mesclar contas bancárias com cartões
  const accounts = [...bankAccounts, ...creditCardsAsAccounts];
  
  const transactions = data?.transactions || [];
  const contacts = data?.contacts || [];
  
  // ✅ NOVO: Calcular spent de cada viagem baseado nas transações
  const trips = useMemo(() => {
    const rawTrips = data?.trips || [];
    return rawTrips.map(trip => {
      // Calcular gastos da viagem usando myShare para transações compartilhadas
      const tripTransactions = transactions.filter(t => 
        t.tripId === trip.id && 
        (t.type === 'expense' || t.type === 'DESPESA')
      );
      
      const spent = tripTransactions.reduce((sum, t) => {
        const amount = Math.abs(Number(t.amount) || 0);
        const value = (t as any).isShared && (t as any).myShare !== null && (t as any).myShare !== undefined
          ? Math.abs(Number((t as any).myShare))
          : amount;
        return sum + value;
      }, 0);
      
      console.log(`💰 [Context] Viagem ${trip.name}:`, {
        tripId: trip.id,
        transactionsCount: tripTransactions.length,
        spent,
        transactions: tripTransactions.map(t => ({
          description: t.description,
          amount: t.amount,
          myShare: (t as any).myShare,
          isShared: (t as any).isShared
        }))
      });
      
      return {
        ...trip,
        spent, // ✅ Atualizar com valor calculado
      };
    });
  }, [data?.trips, transactions]);
  
  const goals = data?.goals || [];
  const budgets = data?.budgets || [];
  const investments = data?.investments || [];
  const categories = data?.categories || [];
  const balances = data?.balances || null;

  // Compatibility values (DEPRECATED)
  const totalBalance = balances?.totalBalance || 0;
  const totalIncome = balances?.monthlyIncome || 0;
  const totalExpenses = balances?.monthlyExpenses || 0;
  const monthlyIncome = balances?.monthlyIncome || 0;
  const monthlyExpenses = balances?.monthlyExpenses || 0;
  const monthlyBalance = balances?.monthlyBalance || 0;

  const value: UnifiedFinancialContextType = {
    data,
    accounts,
    transactions,
    contacts,
    trips,
    goals,
    budgets,
    investments,
    categories,
    loading,
    isLoading: loading,
    error,
    balances,
    actions,
    // Compatibility (DEPRECATED)
    totalBalance,
    totalIncome,
    totalExpenses,
    monthlyIncome,
    monthlyExpenses,
    monthlyBalance,
  };

  return (
    <UnifiedFinancialContext.Provider value={value}>
      {children}
    </UnifiedFinancialContext.Provider>
  );
}

// Hook exports
export const useUnifiedFinancial = () => {
  const context = useContext(UnifiedFinancialContext);
  if (!context) {
    throw new Error('useUnifiedFinancial deve ser usado dentro de UnifiedProvider');
  }
  return context;
};

export const useUnified = () => useUnifiedFinancial();

export const useAccounts = () => {
  const { accounts, loading, error } = useUnifiedFinancial();
  return { accounts, loading, error };
};

export const useTransactions = () => {
  const { transactions } = useUnifiedFinancial();
  return transactions;
};

export const useContacts = () => {
  const { contacts } = useUnifiedFinancial();
  return contacts;
};

export const useTrips = () => {
  const { trips, actions } = useUnifiedFinancial();
  return {
    trips,
    create: actions.createTrip,
    update: actions.updateTrip,
    delete: actions.deleteTrip
  };
};

export const useGoals = () => {
  const { goals, actions } = useUnifiedFinancial();
  return {
    goals,
    create: actions.createGoal,
    update: actions.updateGoal,
    delete: actions.deleteGoal
  };
};

export const useBudgets = () => {
  const { budgets, actions } = useUnifiedFinancial();
  return {
    budgets,
    create: actions.createBudget,
    update: actions.updateBudget,
    delete: actions.deleteBudget
  };
};

export const useInvestments = () => {
  const { transactions, loading, error } = useUnifiedFinancial();

  // Use a ref to track the last calculation timestamp to prevent excessive recalculations
  const lastCalculationRef = React.useRef<number>(0);
  const cacheRef = React.useRef<{ investments: any[]; portfolio: any } | null>(null);

  // Calculate investments from transactions with caching
  const { investments, portfolio } = React.useMemo(() => {
    const now = Date.now();

    // Use cache if data hasn't changed and cache is less than 5 seconds old
    if (cacheRef.current && (now - lastCalculationRef.current) < 5000) {
      return cacheRef.current;
    }

    console.log('🔄 [useInvestments] Recalculando investimentos...', {
      totalTransactions: transactions?.length || 0,
      investmentTransactions: (transactions || []).filter(t => t.category === 'investment').length
    });

    const investmentMap = new Map();

    // Process all investment transactions
    (transactions || [])
      .filter(t => t.category === 'investment')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(transaction => {
        const metadata = (transaction as any).metadata || {};
        const symbol = metadata.symbol || transaction.description?.split(' ')[0] || 'UNKNOWN';

        if (!investmentMap.has(symbol)) {
          investmentMap.set(symbol, {
            id: symbol,
            ticker: symbol,
            symbol: symbol,
            name: transaction.description || symbol,
            type: metadata.assetType || 'stock',
            quantity: 0,
            totalInvested: 0,
            purchasePrice: 0,
            currentPrice: 0,
            broker: metadata.brokerId || 'unknown',
            status: 'active',
            purchaseDate: transaction.date,
            transactions: []
          });
        }

        const investment = investmentMap.get(symbol);
        investment.transactions.push(transaction);

        if (transaction.type === 'expense' && metadata.operationType === 'buy') {
          const qty = metadata.quantity || 1;
          const price = metadata.unitPrice || (Math.abs(transaction.amount) / qty);

          const oldTotal = investment.quantity * investment.purchasePrice;
          const newTotal = qty * price;
          investment.quantity += qty;
          investment.totalInvested += Math.abs(transaction.amount);
          investment.purchasePrice = investment.quantity > 0 ? (oldTotal + newTotal) / investment.quantity : price;
          investment.currentPrice = price;

        } else if (transaction.type === 'income' && metadata.operationType === 'sell') {
          const qty = metadata.quantity || 1;
          investment.quantity -= qty;

          if (investment.quantity <= 0) {
            investment.status = 'sold';
            investment.quantity = 0;
          }
        }
      });

    const investmentsList = Array.from(investmentMap.values());
    const activeInvestments = investmentsList.filter(inv => inv.status === 'active' && inv.quantity > 0);

    const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.totalInvested, 0);
    const currentValue = activeInvestments.reduce((sum, inv) => {
      const price = inv.currentPrice || inv.purchasePrice;
      return sum + (price * inv.quantity);
    }, 0);

    const totalGainLoss = currentValue - totalInvested;
    const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    const portfolioData = {
      currentValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercentage,
      totalAssets: activeInvestments.length,
    };

    const result = {
      investments: investmentsList,
      portfolio: portfolioData
    };

    // Cache the result
    cacheRef.current = result;
    lastCalculationRef.current = now;

    console.log('✅ [useInvestments] Investimentos calculados:', {
      total: investmentsList.length,
      active: activeInvestments.length
    });

    return result;
  }, [transactions]);

  return {
    investments,
    isLoading: loading,
    error,
    portfolio,
  };
};

export default UnifiedFinancialContext;
