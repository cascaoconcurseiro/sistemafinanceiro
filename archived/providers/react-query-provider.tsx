/**
 * PROVIDER DO REACT QUERY UNIFICADO PARA DADOS FINANCEIROS
 * Sistema robusto de sincronização de dados com invalidação inteligente
 * Inclui sincronização em tempo real via Server-Sent Events
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { unifiedQueryClient } from '../lib/react-query/unified-query-client';
import { useRealTimeSync } from '../hooks/useRealTimeSync';
import { initializeSyncMiddleware } from '../lib/react-query/unified-query-client';

interface ReactQueryProviderProps {
  children: ReactNode;
}

// Componente interno para inicializar sincronização em tempo real
function RealTimeSyncInitializer({ children }: { children: ReactNode }) {
  const { enableSync } = useRealTimeSync();

  useEffect(() => {
    // Inicializar middleware de sincronização primeiro
    initializeSyncMiddleware();
    
    // Habilitar sincronização em tempo real automaticamente
    enableSync();
  }, [enableSync]);

  return <>{children}</>;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={unifiedQueryClient}>
      <RealTimeSyncInitializer>
        {children}
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
          position="left"
        />
      </RealTimeSyncInitializer>
    </QueryClientProvider>
  );
}
