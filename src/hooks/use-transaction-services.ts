/**
 * Hook para usar os services de transação
 * Integra os services implementados com os componentes React via API
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface CreateTransactionData {
    userId: string;
    accountId?: string;
    creditCardId?: string;
    amount: number;
    description: string;
    type: 'income' | 'expense' | 'transfer';
    date: Date;
    categoryId?: string;
    paymentMethod?: 'ACCOUNT' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH';
    isInstallment?: boolean;
    totalInstallments?: number;
    isShared?: boolean;
    sharedWith?: Array<{ userId: string; amount: number }>;
    paidBy?: string;
    owedTo?: string;
    tripId?: string;
}

export function useTransactionServices() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Cria uma transação simples
     */
    const createTransaction = useCallback(async (data: CreateTransactionData) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'simple', data }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao criar transação');
            }

            const result = await response.json();
            toast.success('Transação criada com sucesso!');
            return result.transaction;
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Erro ao criar transação';

            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Cria uma transação parcelada
     */
    const createInstallmentTransaction = useCallback(async (data: CreateTransactionData & { totalInstallments: number; creditCardId: string }) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'installment',
                    data: { ...data, isInstallment: true }
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao criar transação parcelada');
            }

            const transactions = await response.json();
            toast.success(`${transactions.length} parcelas criadas com sucesso!`);
            return transactions;
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Erro ao criar transação parcelada';

            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Cria uma despesa compartilhada
     */
    const createSharedExpense = useCallback(async (data: CreateTransactionData & { sharedWith: Array<{ userId: string; amount: number }> }) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'shared',
                    data: { ...data, isShared: true }
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao criar despesa compartilhada');
            }

            const transaction = await response.json();
            toast.success('Despesa compartilhada criada com sucesso!');
            return transaction;
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Erro ao criar despesa compartilhada';

            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Cria uma transferência entre contas
     */
    const createTransfer = useCallback(async (data: {
        userId: string;
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        description: string;
        date: Date;
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'transfer', data }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao criar transferência');
            }

            const transactions = await response.json();
            toast.success('Transferência realizada com sucesso!');
            return transactions;
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Erro ao criar transferência';

            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Adiciona anexo a uma transação
     */
    const addAttachment = useCallback(async (
        transactionId: string,
        userId: string,
        file: {
            fileName: string;
            fileSize: number;
            fileType: string;
            fileUrl: string;
        }
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/transactions/${transactionId}/attachments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao adicionar anexo');
            }

            const attachment = await response.json();
            toast.success('Anexo adicionado com sucesso!');
            return attachment;
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Erro ao adicionar anexo';

            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Adiciona tag a uma transação
     */
    const addTag = useCallback(async (
        transactionId: string,
        userId: string,
        tagName: string,
        tagColor?: string
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/transactions/${transactionId}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagName, tagColor }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao adicionar tag');
            }

            toast.success('Tag adicionada com sucesso!');
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Erro ao adicionar tag';

            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Reconcilia uma transação
     */
    const reconcileTransaction = useCallback(async (transactionId: string, userId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/transactions/${transactionId}/reconcile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao reconciliar transação');
            }

            const transaction = await response.json();
            toast.success('Transação reconciliada com sucesso!');
            return transaction;
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Erro ao reconciliar transação';

            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Exclui uma transação
     */
    const deleteTransaction = useCallback(async (
        transactionId: string,
        userId: string,
        options?: { deleteAll?: boolean }
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/transactions/${transactionId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ options }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao excluir transação');
            }

            toast.success('Transação excluída com sucesso!');
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Erro ao excluir transação';

            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        createTransaction,
        createInstallmentTransaction,
        createSharedExpense,
        createTransfer,
        addAttachment,
        addTag,
        reconcileTransaction,
        deleteTransaction,
    };
}
