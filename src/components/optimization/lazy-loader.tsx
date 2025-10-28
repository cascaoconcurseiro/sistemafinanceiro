'use client';

import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading dos componentes
const InvestmentDashboardComponent = lazy(
  () => import('@/components/investments/investment-dashboard').then(mod => ({ default: mod.InvestmentDashboard }))
);

const AdvancedReportsDashboardComponent = lazy(
  () => import('@/components/advanced-reports-dashboard')
);

// Componentes lazy com Suspense
export const LazyInvestmentDashboard = ({ userId }: { userId?: string }) => (
  <Suspense
    fallback={
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    }
  >
    {userId && <InvestmentDashboardComponent userId={userId} />}
  </Suspense>
);

export const LazyAdvancedReportsDashboard = () => (
  <Suspense
    fallback={
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    }
  >
    <AdvancedReportsDashboardComponent />
  </Suspense>
);

// Componentes ainda não implementados
export const LazyInvestmentPortfolio = () => (
  <div className="p-4 text-center text-gray-500">
    Investment Portfolio (em desenvolvimento)
  </div>
);

export const LazyAdvancedAnalyticsDashboard = () => (
  <div className="p-4 text-center text-gray-500">
    Advanced Analytics Dashboard (em desenvolvimento)
  </div>
);

export const LazyFinancialAnalysisDashboard = () => (
  <div className="p-4 text-center text-gray-500">
    Financial Analysis Dashboard (em desenvolvimento)
  </div>
);

export const LazySmartNotificationCenter = () => (
  <div className="p-4 text-center text-gray-500">
    Smart Notification Center (em desenvolvimento)
  </div>
);

// Componente wrapper com loading skeleton
interface LazyWrapperProps {
  children: React.ReactNode;
  height?: string;
  className?: string;
}

export function LazyWrapper({
  children,
  height = '400px',
  className = '',
}: LazyWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className={`w-full space-y-4 p-4 ${className}`} style={{ height }}>
          <Skeleton className="h-8 w-1/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// Hook para lazy loading de dados
export function useLazyData<T>(
  fetchFunction: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFunction();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error };
}
