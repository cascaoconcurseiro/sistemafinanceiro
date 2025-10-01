import { z } from 'zod';

// Account validation schemas
export const accountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório').max(50, 'Nome muito longo'),
  type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash'], {
    errorMap: () => ({ message: 'Tipo de conta inválido' }),
  }),
  balance: z.number().min(0, 'Saldo não pode ser negativo'),
  currency: z.string().default('BRL'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateAccountSchema = accountSchema.partial();

// Transaction validation schemas
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer'], {
    errorMap: () => ({ message: 'Tipo de transação inválido' }),
  }),
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória').max(200, 'Descrição muito longa'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  toAccountId: z.string().optional(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida',
  }),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  recurring: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().positive(),
    endDate: z.string().optional(),
    maxOccurrences: z.number().positive().optional(),
  }).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('completed'),
});

export const updateTransactionSchema = transactionSchema.partial();

// Budget validation schemas
export const budgetSchema = z.object({
  name: z.string().min(1, 'Nome do orçamento é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('Valor deve ser maior que zero'),
  period: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data de início inválida',
  }),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  alertThreshold: z.number().min(0).max(100).default(80),
});

export const updateBudgetSchema = budgetSchema.partial();

// Goal validation schemas
export const goalSchema = z.object({
  name: z.string().min(1, 'Nome da meta é obrigatório').max(100, 'Nome muito longo'),
  targetAmount: z.number().positive('Valor da meta deve ser maior que zero'),
  currentAmount: z.number().min(0, 'Valor atual não pode ser negativo').default(0),
  targetDate: z.string().refine((date) => {
    const targetDate = new Date(date);
    const today = new Date();
    return !isNaN(targetDate.getTime()) && targetDate > today;
  }, {
    message: 'Data da meta deve ser futura e válida',
  }),
  category: z.enum(['emergency', 'investment', 'purchase', 'debt', 'other']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  monthlyContribution: z.number().min(0, 'Contribuição mensal não pode ser negativa').default(0),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateGoalSchema = goalSchema.partial();

// Category validation schemas
export const categorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório').max(50, 'Nome muito longo'),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal').optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = categorySchema.partial();

// User preferences validation
export const userPreferencesSchema = z.object({
  currency: z.string().default('BRL'),
  language: z.string().default('pt-BR'),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'),
  numberFormat: z.enum(['1,234.56', '1.234,56', '1 234,56']).default('1.234,56'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  notifications: z.object({
    budgetAlerts: z.boolean().default(true),
    goalReminders: z.boolean().default(true),
    transactionReminders: z.boolean().default(false),
    weeklyReports: z.boolean().default(true),
    monthlyReports: z.boolean().default(true),
  }).default({}),
  privacy: z.object({
    shareAnalytics: z.boolean().default(false),
    shareUsageData: z.boolean().default(false),
  }).default({}),
});

// Import/Export validation
export const importDataSchema = z.object({
  accounts: z.array(accountSchema).optional(),
  transactions: z.array(transactionSchema).optional(),
  budgets: z.array(budgetSchema).optional(),
  goals: z.array(goalSchema).optional(),
  categories: z.array(categorySchema).optional(),
});

// Search and filter validation
export const transactionFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  category: z.string().optional(),
  accountId: z.string().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  tags: z.array(z.string()).optional(),
  searchTerm: z.string().optional(),
});

// Validation helper functions
export function validateAccount(data: unknown) {
  return accountSchema.safeParse(data);
}

export function validateTransaction(data: unknown) {
  return transactionSchema.safeParse(data);
}

export function validateBudget(data: unknown) {
  return budgetSchema.safeParse(data);
}

export function validateGoal(data: unknown) {
  return goalSchema.safeParse(data);
}

export function validateCategory(data: unknown) {
  return categorySchema.safeParse(data);
}

export function validateUserPreferences(data: unknown) {
  return userPreferencesSchema.safeParse(data);
}

export function validateImportData(data: unknown) {
  return importDataSchema.safeParse(data);
}

export function validateTransactionFilter(data: unknown) {
  return transactionFilterSchema.safeParse(data);
}

// Utility validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequiredString(value: string, minLength = 1): boolean {
  return typeof value === 'string' && value.trim().length >= minLength;
}

export function validatePositiveNumber(value: number): boolean {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

export function sanitizeString(value: string): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>]/g, '');
}

export function sanitizeNumber(value: any): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

// Custom validation utilities
export const validationUtils = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidCPF: (cpf: string): boolean => {
    // Remove non-numeric characters
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Check if has 11 digits
    if (cleanCPF.length !== 11) return false;
    
    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validate CPF algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  },

  isValidCNPJ: (cnpj: string): boolean => {
    // Remove non-numeric characters
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    // Check if has 14 digits
    if (cleanCNPJ.length !== 14) return false;
    
    // Check if all digits are the same
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validate CNPJ algorithm
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return digit2 === parseInt(cleanCNPJ.charAt(13));
  },

  isValidPhone: (phone: string): boolean => {
    // Remove non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if has 10 or 11 digits (Brazilian format)
    return cleanPhone.length === 10 || cleanPhone.length === 11;
  },

  isValidCurrency: (amount: string): boolean => {
    // Check if is a valid currency format
    const currencyRegex = /^\d+([.,]\d{1,2})?$/;
    return currencyRegex.test(amount.replace(/\s/g, ''));
  },

  formatCurrency: (amount: number, currency = 'BRL'): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  parseCurrency: (value: string): number => {
    // Remove currency symbols and convert to number
    const cleanValue = value.replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  },

  isValidDate: (date: string): boolean => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  },

  isFutureDate: (date: string): boolean => {
    const parsedDate = new Date(date);
    const today = new Date();
    return parsedDate > today;
  },

  isPastDate: (date: string): boolean => {
    const parsedDate = new Date(date);
    const today = new Date();
    return parsedDate < today;
  },
};

// Export types
export type AccountData = z.infer<typeof accountSchema>;
export type UpdateAccountData = z.infer<typeof updateAccountSchema>;
export type TransactionData = z.infer<typeof transactionSchema>;
export type UpdateTransactionData = z.infer<typeof updateTransactionSchema>;
export type BudgetData = z.infer<typeof budgetSchema>;
export type UpdateBudgetData = z.infer<typeof updateBudgetSchema>;
export type GoalData = z.infer<typeof goalSchema>;
export type UpdateGoalData = z.infer<typeof updateGoalSchema>;
export type CategoryData = z.infer<typeof categorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;
export type UserPreferencesData = z.infer<typeof userPreferencesSchema>;
export type ImportData = z.infer<typeof importDataSchema>;
export type TransactionFilterData = z.infer<typeof transactionFilterSchema>;
