/**
 * Configuração do Sentry para Cliente
 * Monitoramento de erros e performance
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Configurações
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
    
    // Filtrar erros conhecidos
    beforeSend(event, hint) {
      // Ignorar erros de rede
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }
      
      // Ignorar erros de cancelamento
      if (event.exception?.values?.[0]?.value?.includes('AbortError')) {
        return null;
      }
      
      return event;
    },
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/suagrana\.com/],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
  
  console.log('✅ Sentry inicializado (cliente)');
} else {
  console.log('⚠️  Sentry não configurado (SENTRY_DSN ausente)');
}
