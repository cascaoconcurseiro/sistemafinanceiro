/**
 * 🔧 CONFIGURAÇÃO CENTRALIZADA DO SISTEMA
 * 
 * Este arquivo centraliza todas as configurações do sistema,
 * validando variáveis de ambiente e fornecendo valores padrão seguros.
 */

import { z } from 'zod';

// Schema de validação para variáveis de ambiente
const envSchema = z.object({
  // Banco de dados
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  
  // Autenticação
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres'),
  
  // Next.js
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  
  // Aplicação
  NEXT_PUBLIC_APP_NAME: z.string().default('SuaGrana'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),
  
  // Backup
  BACKUP_ENABLED: z.string().transform(val => val === 'true').default('true'),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'),
  BACKUP_RETENTION_DAYS: z.string().transform(val => parseInt(val)).default('30'),
  BACKUP_PATH: z.string().default('./backups'),
  
  // Logs
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_ROTATION_ENABLED: z.string().transform(val => val === 'true').default('true'),
  LOG_MAX_SIZE: z.string().default('10MB'),
  LOG_MAX_FILES: z.string().transform(val => parseInt(val)).default('5'),
  
  // Performance
  CACHE_ENABLED: z.string().transform(val => val === 'true').default('true'),
  CACHE_TTL: z.string().transform(val => parseInt(val)).default('300'),
  
  // Monitoramento
  MONITORING_ENABLED: z.string().transform(val => val === 'true').default('true'),
  HEALTH_CHECK_INTERVAL: z.string().transform(val => parseInt(val)).default('60000'),
  
  // Desenvolvimento
  DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
  MOCK_DATA_ENABLED: z.string().transform(val => val === 'true').default('false'),
});

// Função para validar e carregar configurações
function loadConfig() {
  try {
    // Carregar variáveis de ambiente
    const env = {
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
      BACKUP_ENABLED: process.env.BACKUP_ENABLED,
      BACKUP_SCHEDULE: process.env.BACKUP_SCHEDULE,
      BACKUP_RETENTION_DAYS: process.env.BACKUP_RETENTION_DAYS,
      BACKUP_PATH: process.env.BACKUP_PATH,
      LOG_LEVEL: process.env.LOG_LEVEL,
      LOG_ROTATION_ENABLED: process.env.LOG_ROTATION_ENABLED,
      LOG_MAX_SIZE: process.env.LOG_MAX_SIZE,
      LOG_MAX_FILES: process.env.LOG_MAX_FILES,
      CACHE_ENABLED: process.env.CACHE_ENABLED,
      CACHE_TTL: process.env.CACHE_TTL,
      MONITORING_ENABLED: process.env.MONITORING_ENABLED,
      HEALTH_CHECK_INTERVAL: process.env.HEALTH_CHECK_INTERVAL,
      DEBUG_MODE: process.env.DEBUG_MODE,
      MOCK_DATA_ENABLED: process.env.MOCK_DATA_ENABLED,
    };

    // Validar configurações
    const validatedConfig = envSchema.parse(env);
    
    return validatedConfig;
  } catch (error) {
    console.error('❌ Erro na configuração do ambiente:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Variáveis de ambiente inválidas:');
      error.errors.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    }
    
    throw new Error('Configuração de ambiente inválida');
  }
}

// Carregar e exportar configurações
export const config = loadConfig();

// Configurações específicas por ambiente
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Configurações de segurança
export const security = {
  jwtSecret: config.JWT_SECRET,
  jwtRefreshSecret: config.JWT_REFRESH_SECRET,
  cookieOptions: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    path: '/',
  },
} as const;

// Configurações de banco de dados
export const database = {
  url: config.DATABASE_URL,
} as const;

// Configurações de backup
export const backup = {
  enabled: config.BACKUP_ENABLED,
  schedule: config.BACKUP_SCHEDULE,
  retentionDays: config.BACKUP_RETENTION_DAYS,
  path: config.BACKUP_PATH,
} as const;

// Configurações de log
export const logging = {
  level: config.LOG_LEVEL,
  rotationEnabled: config.LOG_ROTATION_ENABLED,
  maxSize: config.LOG_MAX_SIZE,
  maxFiles: config.LOG_MAX_FILES,
} as const;

// Configurações de cache
export const cache = {
  enabled: config.CACHE_ENABLED,
  ttl: config.CACHE_TTL,
} as const;

// Configurações de monitoramento
export const monitoring = {
  enabled: config.MONITORING_ENABLED,
  healthCheckInterval: config.HEALTH_CHECK_INTERVAL,
} as const;

// Configurações de desenvolvimento
export const development = {
  debugMode: config.DEBUG_MODE,
  mockDataEnabled: config.MOCK_DATA_ENABLED,
} as const;

// Configurações da aplicação
export const app = {
  name: config.NEXT_PUBLIC_APP_NAME,
  version: config.NEXT_PUBLIC_APP_VERSION,
  url: config.NEXT_PUBLIC_APP_URL,
} as const;

// Função para verificar se todas as configurações críticas estão presentes
export function validateCriticalConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verificar JWT secrets
  if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET deve ter pelo menos 32 caracteres');
  }

  if (!config.JWT_REFRESH_SECRET || config.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres');
  }

  // Verificar DATABASE_URL
  if (!config.DATABASE_URL) {
    errors.push('DATABASE_URL é obrigatória');
  }

  // Em produção, verificar configurações adicionais
  if (isProduction) {
    if (config.JWT_SECRET.includes('change-in-production')) {
      errors.push('JWT_SECRET deve ser alterado em produção');
    }

    if (config.JWT_REFRESH_SECRET.includes('change-in-production')) {
      errors.push('JWT_REFRESH_SECRET deve ser alterado em produção');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Log de inicialização
if (isDevelopment) {
  console.log('🔧 Configuração carregada:', {
    environment: config.NODE_ENV,
    app: app.name,
    version: app.version,
    database: database.url.includes('postgresql') ? 'PostgreSQL' : 'SQLite',
    backup: backup.enabled ? 'Habilitado' : 'Desabilitado',
    cache: cache.enabled ? 'Habilitado' : 'Desabilitado',
    monitoring: monitoring.enabled ? 'Habilitado' : 'Desabilitado'
  });
}