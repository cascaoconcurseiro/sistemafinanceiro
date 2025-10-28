/**
 * Hook para usar os services de análises
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { analyticsService } from '@/lib/services/analytics-service';

export function useAnalyticsServices() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTrends = useCallback(async (userId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const trends = await analyticsService.calculateTrends(userId);
            return trends;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao calcular tendências';
            setError(errorMessage);
            toast.error(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getForecast = useCallback(async (userId: string, monthsAhead: number = 3) => {
        setIsLoading(true);
        setError(null);

        try {
            const forecast = await analyticsService.predictFutureBalance(userId, monthsAhead);
            return forecast;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao calcular previsão';
            setError(errorMessage);
            toast.error(errorMessage);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    const checkNegativeBalanceAlert = useCallback(async (userId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const alert = await analyticsService.checkNegativeBalanceAlert(userId);
            
            if (alert.hasAlert) {
                toast.warning(alert.message, {
                    duration: 5000,
                });
            }
            
            return alert;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao verificar saldo';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getTrendCharts = useCallback(async (userId: string, months: number = 12) => {
        setIsLoading(true);
        setError(null);

        try {
            const charts = await analyticsService.getTrendCharts(userId, months);
            return charts;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao gerar gráficos';
            setError(errorMessage);
            toast.error(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        getTrends,
        getForecast,
        checkNegativeBalanceAlert,
        getTrendCharts,
    };
}
