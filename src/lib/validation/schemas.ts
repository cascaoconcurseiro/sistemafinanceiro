/**
 * SCHEMAS DE VALIDAÇÃO COM ZOD
 * Validação centralizada para todas as entidades do sistema
 */

import { z } from 'zod';

// ============================================
// ENUMS E CONSTANTES
// ============================================

export const AccountType = z.enum(['ATIVO', 'PASSIVO', 'RECEITA', 'DESPESA']);
export const TransactionType = z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']);
export const JournalEntryType = z.enum(['DEBITO', 'CREDITO']);
export const TransactionStatus = z.enum(['pending', 'cleared', 'reconciled', 'cancelled']);
export const InvoiceStatus = z.enum(['open', 'partial', 'paid', 'overdue']);
export const SharedDebtStatus = z.enum(['active', 'paid', 'cancelled']);

// ============================================
// SCHEMAS DE ENTIDADES
// ============================================

/**
 * ACCOUNT SCHEMA
 */
export const AccountSchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  type: AccountType,
  balance: z.number().or(z.string().transform(Number)),
  currency: z.string().default('BRL'),
  isActive: z.boolean().default(true),
  reconciledBalance: z.number().or(z.string().transform(Number)).default(0),
  isInvestment: z.boolean().default(false),
  investmentType: z.string().optional(),
  currentValue: z.number().or(z.string().transform(Number)).optional(),
  investedAmount: z.number().or(z.string().transform(Number)).optional(),
});

export type AccountInput = z.infer<typeof AccountSchema>;

/**
 * TRANSACTION SCHEMA
 */
export const TransactionSchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid(),
  accountId: z.string().cuid().optional(),
  creditCardId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  amount: z.number().or(z.string().transform(Number)),
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  type: TransactionType,
  date: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  status: TransactionStatus.default('cleared'),
  isRecurring: z.boolean().default(false),
  transferId: z.string().cuid().optional(),
  parentTransactionId: z.string().cuid().optional(),
  installmentNumber: z.number().int().positive().optional(),
  totalInstallments: z.number().int().positive().optional(),
  tripId: z.string().cuid().optional(),
  goalId: z.string().cuid().optional(),
  investmentId: z.string().cuid().optional(),
  budgetId: z.string().cuid().optional(),
  invoiceId: z.string().cuid().optional(),
  installmentGroupId: z.string().cuid().optional(),
  isShared: z.boolean().default(false),
  sharedWith: z.array(z.string()).or(z.string()).optional(),
  totalSharedAmount: z.number().or(z.string().transform(Number)).optional(),
  myShare: z.number().or(z.string().transform(Number)).optional(),
  paidBy: z.string().optional(),
  owedTo: z.string().optional(),
  paymentMethod: z.string().optional(),
  isTransfer: z.boolean().default(false),
  transferType: z.string().optional(),
  recurringId: z.string().cuid().optional(),
  frequency: z.string().optional(),
  isReconciled: z.boolean().default(false),
  reconciledAt: z.date().optional(),
  currency: z.string().default('BRL'),
  exchangeRate: z.number().or(z.string().transform(Number)).optional(),
  originalAmount: z.number().or(z.string().transform(Number)).optional(),
  isTaxDeductible: z.boolean().default(false),
  taxCategory: z.string().optional(),
  isSuspicious: z.boolean().default(false),
  isFraudulent: z.boolean().default(false),
  isInstallment: z.boolean().default(false),
  tripExpenseType: z.enum(['shared', 'regular', 'trip']).optional(),
  metadata: z.string().optional(),
}).refine(
  (data) => {
    // ✅ Se tem paidBy (pago por outra pessoa), não precisa de accountId/creditCardId
    if (data.paidBy) {
      return true;
    }
    // Caso contrário, deve ter accountId OU creditCardId
    return data.accountId || data.creditCardId;
  },
  {
    message: 'Transação deve ter accountId OU creditCardId (exceto quando pago por outra pessoa)',
    path: ['accountId'],
  }
).refine(
  (data) => {
    // Se é parcelamento, deve ter installmentNumber e totalInstallments
    if (data.isInstallment) {
      return data.installmentNumber && data.totalInstallments;
    }
    return true;
  },
  {
    message: 'Parcelamento deve ter installmentNumber e totalInstallments',
    path: ['isInstallment'],
  }
).refine(
  (data) => {
    // Se é transferência, deve ter transferId
    if (data.isTransfer) {
      return data.transferId;
    }
    return true;
  },
  {
    message: 'Transferência deve ter transferId',
    path: ['isTransfer'],
  }
);

export type TransactionInput = z.infer<typeof TransactionSchema>;

/**
 * CREDIT CARD SCHEMA
 */
export const CreditCardSchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  limit: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().min(0.01, 'Limite deve ser positivo')),
  currentBalance: z.union([z.number(), z.string().transform(Number)]).default(0),
  dueDay: z.number().int().min(1).max(31),
  closingDay: z.number().int().min(1).max(31),
  isActive: z.boolean().default(true),
  interestRate: z.union([z.number(), z.string().transform(Number)]).optional(),
});

export type CreditCardInput = z.infer<typeof CreditCardSchema>;

/**
 * INVOICE SCHEMA
 */
export const InvoiceSchema = z.object({
  id: z.string().cuid().optional(),
  creditCardId: z.string().cuid(),
  userId: z.string().cuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  totalAmount: z.number().or(z.string().transform(Number)).default(0),
  paidAmount: z.number().or(z.string().transform(Number)).default(0),
  dueDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  isPaid: z.boolean().default(false),
  status: InvoiceStatus.default('open'),
  paidAt: z.date().optional(),
});

export type InvoiceInput = z.infer<typeof InvoiceSchema>;

/**
 * INSTALLMENT SCHEMA
 */
export const InstallmentSchema = z.object({
  id: z.string().cuid().optional(),
  transactionId: z.string().cuid(),
  userId: z.string().cuid(),
  installmentNumber: z.number().int().positive(),
  totalInstallments: z.number().int().positive(),
  amount: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive()),
  dueDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  status: z.enum(['pending', 'paid', 'cancelled', 'overdue']).default('pending'),
  paidAt: z.date().optional(),
  description: z.string().optional(),
}).refine(
  (data) => data.installmentNumber <= data.totalInstallments,
  {
    message: 'Número da parcela não pode ser maior que total de parcelas',
    path: ['installmentNumber'],
  }
);

export type InstallmentInput = z.infer<typeof InstallmentSchema>;

/**
 * SHARED DEBT SCHEMA (UNIFICADO)
 */
export const SharedDebtSchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid(),
  creditorId: z.string().cuid(),
  debtorId: z.string().cuid(),
  originalAmount: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive()),
  currentAmount: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive()),
  paidAmount: z.union([z.number(), z.string().transform(Number)]).default(0),
  description: z.string().min(1, 'Descrição é obrigatória'),
  status: SharedDebtStatus.default('active'),
  transactionId: z.string().cuid().optional(),
  paidAt: z.date().optional(),
});

export type SharedDebtInput = z.infer<typeof SharedDebtSchema>;

/**
 * JOURNAL ENTRY SCHEMA
 */
export const JournalEntrySchema = z.object({
  id: z.string().cuid().optional(),
  transactionId: z.string().cuid(),
  accountId: z.string().cuid(),
  entryType: JournalEntryType,
  amount: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive()),
  description: z.string().min(1),
});

export type JournalEntryInput = z.infer<typeof JournalEntrySchema>;

/**
 * CATEGORY SCHEMA
 */
export const CategorySchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().optional(),
  type: TransactionType,
  parentId: z.string().cuid().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export type CategoryInput = z.infer<typeof CategorySchema>;

/**
 * BUDGET SCHEMA
 */
export const BudgetSchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid(),
  accountId: z.string().cuid().optional(),
  categoryId: z.string().cuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  amount: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive()),
  spent: z.number().or(z.string().transform(Number)).default(0),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  endDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  isActive: z.boolean().default(true),
  alertThreshold: z.number().int().min(0).max(100).default(80),
});

export type BudgetInput = z.infer<typeof BudgetSchema>;

/**
 * GOAL SCHEMA
 */
export const GoalSchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().optional(),
  currentAmount: z.number().or(z.string().transform(Number)).default(0),
  targetAmount: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive()),
  deadline: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['active', 'completed', 'cancelled']).default('active'),
});

export type GoalInput = z.infer<typeof GoalSchema>;

/**
 * TRIP SCHEMA
 */
export const TripSchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  destination: z.string().min(1, 'Destino é obrigatório').max(200),
  description: z.string().optional(),
  startDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  endDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  budget: z.number().or(z.string().transform(Number)).default(0),
  spent: z.number().or(z.string().transform(Number)).default(0),
  currency: z.string().default('BRL'),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).default('planned'),
  participants: z.array(z.string()).or(z.string()).optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: 'Data final deve ser maior ou igual à data inicial',
    path: ['endDate'],
  }
);

export type TripInput = z.infer<typeof TripSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Valida e transforma dados de entrada
 */
export function validateAndTransform<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, error: result.error };
}

/**
 * Valida ou lança erro
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}
