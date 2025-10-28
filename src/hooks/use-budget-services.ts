/**
 * Hook para usar os services de orçamento
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { budgetService, BudgetUsage, BudgetAlert } from '@/lib/services/budget-service';

export function useBudgetServices() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createBudget = useCallback(async (data: {
        userId: string;
        categoryId: string;
        amount: number;
        period: 'MONTHLY' | 'YEARLY';
        startDate: Date;
        endDate?: Date;
        alertThreshold?: number;
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            const budget = await budgetService.createBudget(data);
            toast.success('Orçamento criado com sucesso!');
            return budget;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao criar orçamento';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getBudgetUsage = useCallback(async (budgetId: string, userId: string): Promise<BudgetUsage | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const usage = await budgetService.calculateBudgetUsage(budgetId, userId);
            return usage;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao calcular uso do orçamento';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const checkBudgetAlerts = useCallback(async (userId: string): Promise<BudgetAlert[]> => {
        setIsLoading(true);
        setError(null);

        try {
            const alerts = await budgetService.checkBudgetAlerts(userId);
            return alerts;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao verificar alertas de orçamento';
            setError(errorMessage);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getBudgetReport = useCallback(async (userId: string, startDate: Date, endDate: Date) => {
        setIsLoading(true);
        setError(null);

        try {
            const report = await budgetService.getBudgetReport(userId, startDate, endDate);
            return report;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao gerar relatório de orçamento';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        createBudget,
        getBudgetUsage,
        checkBudgetAlerts,
        getBudgetReport,
    };
}
