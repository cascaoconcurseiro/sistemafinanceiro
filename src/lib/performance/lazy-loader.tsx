/**
 * 🚀 Smart Lazy Loading System
 * Intelligent component lazy loading with preloading strategies
 */

import { lazy, Suspense, ComponentType, ReactNode, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface LazyLoadOptions {
  fallback?: ReactNode;
  preload?: boolean;
  delay?: number;
  retries?: number;
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
}

interface LazyComponentProps {
  loading?: boolean;
  error?: Error | null;
}

// Default loading component
const DefaultLoading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Default error component
const DefaultError = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-red-600 mb-4">
      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <p className="text-sm font-medium">Failed to load component</p>
    </div>
    <button
      onClick={retry}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

/**
 * Create a lazy-loaded component with intelligent preloading
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const {
    fallback = <DefaultLoading />,
    preload = false,
    delay = 0,
    retries = 3,
    errorFallback: ErrorFallback = DefaultError
  } = options;

  // Create lazy component with retry logic
  const LazyComponent = lazy(() => {
    let retryCount = 0;
    
    const loadWithRetry = async (): Promise<{ default: T }> => {
      try {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        return await importFn();
      } catch (error) {
        if (retryCount < retries) {
          retryCount++;
          console.warn(`Lazy load failed, retrying (${retryCount}/${retries}):`, error);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return loadWithRetry();
        }
        throw error;
      }
    };

    return loadWithRetry();
  });

  // Preload if requested
  if (preload && typeof window !== 'undefined') {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      importFn().catch(error => {
        console.warn('Preload failed:', error);
      });
    }, 100);
  }

  // Wrapper component with error boundary
  const WrappedComponent = (props: any) => {
    const [retryKey, setRetryKey] = useState(0);

    return (
      <ErrorBoundary
        key={retryKey}
        fallbackRender={({ error }) => (
          <ErrorFallback 
            error={error} 
            retry={() => setRetryKey(prev => prev + 1)} 
          />
        )}
      >
        <Suspense fallback={fallback}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };

  // Add preload method to component
  (WrappedComponent as any).preload = () => importFn();

  return WrappedComponent;
}

/**
 * Hook for intelligent preloading based on user behavior
 */
export function useIntelligentPreload() {
  useEffect(() => {
    // Preload on mouse enter (user likely to click)
    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const preloadAttr = target.getAttribute('data-preload');
      
      if (preloadAttr) {
        // Dynamically import the component
        import(preloadAttr).catch(error => {
          console.warn('Intelligent preload failed:', error);
        });
      }
    };

    // Preload on intersection (component coming into view)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const preloadAttr = entry.target.getAttribute('data-preload');
            if (preloadAttr) {
              import(preloadAttr).catch(error => {
                console.warn('Intersection preload failed:', error);
              });
            }
          }
        });
      },
      { rootMargin: '100px' } // Start loading 100px before element is visible
    );

    // Add event listeners
    document.addEventListener('mouseenter', handleMouseEnter, true);
    
    // Observe elements with preload attribute
    document.querySelectorAll('[data-preload]').forEach(el => {
      observer.observe(el);
    });

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      observer.disconnect();
    };
  }, []);
}

/**
 * Preload components based on route
 */
export function preloadRouteComponents(route: string) {
  const routeComponentMap: Record<string, () => Promise<any>> = {
    '/dashboard': () => import('@/components/dashboard/DashboardPage'),
    '/accounts': () => import('@/components/accounts/AccountsPage'),
    '/transactions': () => import('@/components/transactions/TransactionsPage'),
    '/investments': () => import('@/components/investments/InvestmentsPage'),
    '/trips': () => import('@/components/trips/TripsPage'),
  };

  const preloadFn = routeComponentMap[route];
  if (preloadFn) {
    preloadFn().catch(error => {
      console.warn(`Failed to preload route ${route}:`, error);
    });
  }
}

/**
 * Batch preload multiple components
 */
export function batchPreload(importFunctions: Array<() => Promise<any>>) {
  return Promise.allSettled(
    importFunctions.map(fn => fn())
  ).then(results => {
    const failed = results.filter(result => result.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`${failed.length} components failed to preload`);
    }
    return results;
  });
}

// Export commonly used lazy components
export const LazyDashboard = createLazyComponent(
  () => import('@/components/dashboard/DashboardPage'),
  { preload: true }
);

export const LazyAccounts = createLazyComponent(
  () => import('@/components/accounts/AccountsPage')
);

export const LazyTransactions = createLazyComponent(
  () => import('@/components/transactions/TransactionsPage')
);

export const LazyInvestments = createLazyComponent(
  () => import('@/components/investments/InvestmentsPage')
);

export const LazyTrips = createLazyComponent(
  () => import('@/components/trips/TripsPage')
);