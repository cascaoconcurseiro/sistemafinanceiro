/**
 * Componentes com Lazy Loading
 * Melhora performance carregando componentes sob demanda
 */

import { lazy, Suspense, ComponentType } from 'react';

/**
 * Wrapper para lazy loading com fallback
 */
function lazyWithFallback<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <div className="animate-pulse h-64 bg-gray-200 rounded" />
) {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Componentes Lazy
 */

// Investimentos
export const LazyInvestmentDashboard = lazyWithFallback(
  () => import('./investments/investment-dashboard')
);

export const LazyInvestmentList = lazyWithFallback(
  () => import('./investments/investment-list')
);

export const LazyInvestmentReports = lazyWithFallback(
  () => import('./investments/investment-reports')
);

// Viagens
export const LazyTripDetails = lazyWithFallback(
  () => import('./trip-details')
);

export const LazyTripExpenses = lazyWithFallback(
  () => import('./trip-expenses')
);

export const LazyTripItinerary = lazyWithFallback(
  () => import('./trip-itinerary')
);

// Cartões de Crédito
export const LazyCreditCardBills = lazyWithFallback(
  () => import('./credit-card-bills')
);

// Despesas Compartilhadas
export const LazySharedExpensesBilling = lazyWithFallback(
  () => import('./shared-expenses-billing')
);

// Relatórios
export const LazyReports = lazyWithFallback(
  () => import('./reports')
);

// Configurações
export const LazyUserSettings = lazyWithFallback(
  () => import('./modals/user-settings-modal')
);

/**
 * Fallback Loading Component
 */
export function LoadingFallback({ height = '400px' }: { height?: string }) {
  return (
    <div className="w-full animate-pulse" style={{ height }}>
      <div className="h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper genérico para lazy loading
 */
export function LazyWrapper({
  children,
  height = '400px'
}: {
  children: React.ReactNode;
  height?: string;
}) {
  return (
    <Suspense fallback={<LoadingFallback height={height} />}>
      {children}
    </Suspense>
  );
}
