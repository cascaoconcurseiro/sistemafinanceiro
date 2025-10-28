import { PrismaClient } from '@prisma/client';
import { InputSanitizer, SecureLogger } from './input-sanitizer';

// Cliente Prisma seguro com middleware de sanitização
export class SecureDatabase {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!SecureDatabase.instance) {
      SecureDatabase.instance = new PrismaClient();
      
      // Middleware para sanitizar inputs
      SecureDatabase.instance.$use(async (params, next) => {
        // Sanitizar argumentos de entrada
        if (params.args?.data) {
          params.args.data = SecureDatabase.sanitizeData(params.args.data);
        }
        
        if (params.args?.where) {
          params.args.where = SecureDatabase.sanitizeData(params.args.where);
        }

        // Log seguro da operação
        SecureLogger.info('Database operation', {
          model: params.model,
          action: params.action
        });

        return next(params);
      });
    }
    
    return SecureDatabase.instance;
  }

  private static sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => SecureDatabase.sanitizeData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = InputSanitizer.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = SecureDatabase.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Método seguro para queries customizadas
  static async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      // Validar query básica (sem SQL injection)
      if (query.includes(';') || query.includes('--') || query.includes('/*')) {
        throw new Error('Invalid query detected');
      }

      // Sanitizar parâmetros
      const sanitizedParams = params.map(param => 
        typeof param === 'string' ? InputSanitizer.sanitizeSqlInput(param) : param
      );

      const db = SecureDatabase.getInstance();
      return await db.$queryRawUnsafe(query, ...sanitizedParams);
    } catch (error) {
      SecureLogger.error('Database query failed', error);
      throw error;
    }
  }
}