/**
 * Configuração do Sentry para Servidor
 * Monitoramento de erros e performance no backend
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 1.0,
    
    // Configurações
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
    
    // Filtrar informações sensíveis
    beforeSend(event) {
      // Remover dados sensíveis
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.['authorization'];
      }
      
      return event;
    },
    
    // Integrations
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Prisma({ client: undefined }),
    ],
  });
  
  console.log('✅ Sentry inicializado (servidor)');
} else {
  console.log('⚠️  Sentry não configurado (SENTRY_DSN ausente)');
}
