/**
 * SENTRY CLIENT CONFIGURATION
 * Error tracking para o lado do cliente (browser)
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN || 'https://example@sentry.io/0', // Substituir com DSN real
  
  // Ambiente
  environment: ENVIRONMENT,
  
  // Sample rate para performance monitoring
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Sample rate para session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
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
  
  // Filtrar erros conhecidos
  beforeSend(event, hint) {
    // Ignorar erros de extensões do browser
    if (event.exception?.values?.[0]?.value?.includes('Extension')) {
      return null;
    }
    
    // Ignorar erros de rede em desenvolvimento
    if (ENVIRONMENT === 'development' && event.exception?.values?.[0]?.type === 'NetworkError') {
      return null;
    }
    
    return event;
  },
  
  // Configurações adicionais
  enabled: ENVIRONMENT !== 'test',
  debug: ENVIRONMENT === 'development',
  
  // Informações do release
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
});

// Exportar para uso em outros lugares
export { Sentry };
