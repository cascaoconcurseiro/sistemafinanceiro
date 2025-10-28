import { z } from 'zod';
import { InputSanitizer } from './input-sanitizer';

// Schemas de validação seguros
export const secureSchemas = {
  // Validação de usuário
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email().transform(InputSanitizer.sanitizeString),
    name: z.string().min(1).max(100).transform(InputSanitizer.sanitizeString),
    password: z.string().min(8).max(128)
  }),

  // Validação de conta
  account: z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100).transform(InputSanitizer.sanitizeString),
    type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash']),
    balance: z.number().finite(),
    currency: z.string().length(3).default('BRL'),
    description: z.string().max(500).transform(InputSanitizer.sanitizeString).optional()
  }),

  // Validação de transação
  transaction: z.object({
    id: z.string().uuid().optional(),
    description: z.string().min(1).max(200).transform(InputSanitizer.sanitizeString),
    amount: z.number().positive().finite(),
    date: z.date(),
    accountId: z.string().uuid(),
    type: z.enum(['income', 'expense', 'transfer']),
    category: z.string().min(1).max(50).transform(InputSanitizer.sanitizeString)
  }),

  // Validação de meta
  goal: z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100).transform(InputSanitizer.sanitizeString),
    target: z.number().positive().finite(),
    current: z.number().min(0).finite().default(0),
    targetDate: z.date().optional(),
    description: z.string().max(500).transform(InputSanitizer.sanitizeString).optional()
  }),

  // Validação de orçamento
  budget: z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100).transform(InputSanitizer.sanitizeString),
    category: z.string().min(1).max(50).transform(InputSanitizer.sanitizeString),
    amount: z.number().positive().finite(),
    period: z.enum(['monthly', 'yearly']),
    startDate: z.date(),
    endDate: z.date()
  })
};

// Validador seguro
export class SecureValidator {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  static validatePartial<T>(schema: z.ZodSchema<T>, data: unknown): Partial<T> {
    try {
      return schema.partial().parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  // Validação específica para IDs
  static validateId(id: string): string {
    if (!InputSanitizer.validateUuid(id)) {
      throw new Error('Invalid ID format');
    }
    return id;
  }

  // Validação de paginação
  static validatePagination(page?: string, limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('Invalid page number');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new Error('Invalid limit (must be between 1 and 100)');
    }

    return { page: pageNum, limit: limitNum };
  }
}