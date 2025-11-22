import { z } from 'zod'

export const transactionSchema = z.object({
  description: z
    .string()
    .min(3, 'Descrição deve ter no mínimo 3 caracteres')
    .max(100, 'Descrição deve ter no máximo 100 caracteres'),
  
  amount: z
    .number()
    .positive('Valor deve ser positivo')
    .max(1000000000, 'Valor muito alto'),
  
  type: z.enum(['income', 'expense', 'transfer'], {
    errorMap: () => ({ message: 'Tipo inválido' }),
  }),
  
  date: z.string().datetime('Data inválida'),
  
  categoryId: z.string().uuid('ID de categoria inválido'),
  
  accountId: z.string().uuid('ID de conta inválido').optional(),
  
  creditCardId: z.string().uuid('ID de cartão inválido').optional(),
  
  status: z.enum(['pending', 'completed', 'cancelled']).default('completed'),
  
  isRecurring: z.boolean().optional(),
  
  installments: z
    .object({
      current: z.number().int().positive(),
      total: z.number().int().positive(),
      groupId: z.string(),
    })
    .optional(),
})

export const accountSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  
  type: z.enum(['checking', 'savings', 'investment', 'cash']),
  
  balance: z.number(),
  
  currency: z.string().length(3, 'Código de moeda inválido').default('BRL'),
  
  isActive: z.boolean().default(true),
})

export const creditCardSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  
  limit: z.number().positive('Limite deve ser positivo'),
  
  closingDay: z
    .number()
    .int()
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),
  
  dueDay: z
    .number()
    .int()
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),
  
  accountId: z.string().uuid('ID de conta inválido').optional(),
  
  isActive: z.boolean().default(true),
})

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(30, 'Nome deve ter no máximo 30 caracteres'),
  
  type: z.enum(['income', 'expense']),
  
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
  
  icon: z.string().optional(),
  
  parentId: z.string().uuid().optional(),
  
  isActive: z.boolean().default(true),
})

export const sharedExpenseSchema = z.object({
  description: z
    .string()
    .min(3, 'Descrição deve ter no mínimo 3 caracteres')
    .max(100, 'Descrição deve ter no máximo 100 caracteres'),
  
  amount: z.number().positive('Valor deve ser positivo'),
  
  paidBy: z.string().uuid('ID do pagador inválido'),
  
  tripId: z.string().uuid('ID da viagem inválido').optional(),
  
  splitBetween: z
    .array(
      z.object({
        userId: z.string().uuid(),
        amount: z.number().positive(),
      })
    )
    .min(1, 'Deve ter pelo menos um participante'),
  
  date: z.string().datetime('Data inválida'),
})

// Tipos TypeScript inferidos dos schemas
export type TransactionInput = z.infer<typeof transactionSchema>
export type AccountInput = z.infer<typeof accountSchema>
export type CreditCardInput = z.infer<typeof creditCardSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type SharedExpenseInput = z.infer<typeof sharedExpenseSchema>
