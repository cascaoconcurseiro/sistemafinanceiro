/**
 * SENTRY SERVER CONFIGURATION
 * Error tracking para o lado do servidor (Node.js)
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN || 'https://example@sentry.io/0', // Substituir com DSN real
  
  // Ambiente
  environment: ENVIRONMENT,
  
  // Sample rate para performance monitoring
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: undefined }), // Configurar depois
  ],
  
  // Filtrar informações sensíveis
  beforeSend(event) {
    // Remover dados sensíveis
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    
    // Remover senhas de logs
    if (event.extra) {
      const sanitized = JSON.stringify(event.extra).replace(
        /"password":\s*"[^"]*"/g,
        '"password":"[REDACTED]"'
      );
      event.extra = JSON.parse(sanitized);
    }
    
    return event;
  },
  
  // Configurações adicionais
  enabled: ENVIRONMENT !== 'test',
  debug: ENVIRONMENT === 'development',
  
  // Informações do release
  release: process.env.APP_VERSION || 'development',
  
  // Tags globais
  initialScope: {
    tags: {
      'runtime': 'node',
      'server': 'nextjs',
    },
  },
});

// Exportar para uso em outros lugares
export { Sentry };
