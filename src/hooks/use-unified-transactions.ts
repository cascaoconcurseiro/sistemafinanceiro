import { useUnified } from '@/contexts/unified-context-simple';

export interface CreateTransactionData {
  amount: number;
  description: string;
  category: string;
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  date?: Date;
  tags?: string[];
}

export interface Transaction extends CreateTransactionData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useUnifiedTransactions() {
  const { transactions, loading } = useUnified();

  return {
    data: {
      items: transactions || []
    },
    error: null,
    isLoading: loading
  };
}

export function useUpdateUnifiedTransaction() {
  const { updateTransaction } = useUnified();

  const mutateAsync = async (data: { id: string } & Partial<CreateTransactionData>) => {
    return await updateTransaction(data.id, data);
  };

  return {
    mutateAsync,
    isLoading: false
  };
}

export function useDeleteUnifiedTransaction() {
  const { removeTransaction } = useUnified();

  const mutateAsync = async (id: string) => {
    return await removeTransaction(id);
  };

  return {
    mutateAsync,
    isLoading: false
  };
}

export function useCreateUnifiedTransaction() {
  const { addTransaction } = useUnified();

  const createTransaction = async (data: CreateTransactionData) => {
    return await addTransaction(data);
  };

  return {
    createTransaction,
    isCreating: false
  };
}

export function useUpdateTransaction() {
  const { updateTransaction } = useUnified();

  const updateTransactionFn = async (id: string, data: Partial<CreateTransactionData>) => {
    return await updateTransaction(id, data);
  };

  return {
    updateTransaction: updateTransactionFn,
    isUpdating: false
  };
}

export function useDeleteTransaction() {
  const { removeTransaction } = useUnified();

  const deleteTransaction = async (id: string) => {
    return await removeTransaction(id);
  };

  return {
    deleteTransaction,
    isDeleting: false
  };
}
