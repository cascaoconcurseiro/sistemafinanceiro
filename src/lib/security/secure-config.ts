import { z } from 'zod';

// Schema de validação para configurações
const configSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKUP_ENCRYPTION_KEY: z.string().min(32).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

// Configuração segura sem credenciais hardcoded
export class SecureConfig {
  private static instance: SecureConfig;
  private config: z.infer<typeof configSchema>;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): SecureConfig {
    if (!SecureConfig.instance) {
      SecureConfig.instance = new SecureConfig();
    }
    return SecureConfig.instance;
  }

  private loadConfig() {
    const env = {
      DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
      JWT_SECRET: process.env.JWT_SECRET || this.generateSecureSecret(),
      NODE_ENV: process.env.NODE_ENV,
      BACKUP_ENCRYPTION_KEY: process.env.BACKUP_ENCRYPTION_KEY,
      LOG_LEVEL: process.env.LOG_LEVEL
    };

    const result = configSchema.safeParse(env);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    return result.data;
  }

  private generateSecureSecret(): string {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    // Apenas para desenvolvimento
    return 'dev-secret-key-change-in-production-' + Date.now();
  }

  get(key: keyof z.infer<typeof configSchema>) {
    return this.config[key];
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }
}