'use client';

import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAutoInvalidateCache } from '@/lib/react-query-invalidation';
import { queryClient } from '@/lib/react-query';

// Componente interno para usar o hook de invalidação automática
function CacheInvalidationManager() {
  useAutoInvalidateCache();
  return null;
}

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <CacheInvalidationManager />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
