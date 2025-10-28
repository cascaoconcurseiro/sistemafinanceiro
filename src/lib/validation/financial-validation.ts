/**
 * 🔒 SISTEMA DE VALIDAÇÃO FINANCEIRA ROBUSTA
 * 
 * Centraliza todas as validações de dados financeiros,
 * garantindo integridade e consistência dos dados.
 */

import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { PrismaClient } from '@prisma/client';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

export const createAccountSchema = z.object({
  name: z.string()
    .min(1, 'Nome da conta é obrigatório')
    .max(100, 'Nome da conta deve ter no máximo 100 caracteres'),
  type: z.enum(['checking', 'savings', 'investment', 'credit', 'cash'], {
    errorMap: () => ({ message: 'Tipo de conta inválido' })
  }),
  balance: z.number()
    .finite('Saldo deve ser um número válido')
    .refine(val => new Decimal(val).isFinite(), 'Saldo deve ser um número válido'),
  currency: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL'),
  isActive: z.boolean().default(true)
});

export const createTransactionSchema = z.object({
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount: z.number()
    .finite('Valor deve ser um número válido')
    .refine(val => new Decimal(val).abs().greaterThan(0), 'Valor deve ser maior que zero'),
  type: z.enum(['income', 'expense', 'transfer', 'shared', 'goal_contribution'], {
    errorMap: () => ({ message: 'Tipo de transação inválido' })
  }),
  category: z.string()
    .min(1, 'Categoria é obrigatória')
    .max(100, 'Categoria deve ter no máximo 100 caracteres'),
  accountId: z.string().cuid('ID da conta inválido'),
  date: z.date().refine(date => date <= new Date(), 'Data não pode ser no futuro'),
  status: z.enum(['pending', 'cleared', 'reconciled']).default('cleared'),
  isRecurring: z.boolean().default(false),
  transferId: z.string().cuid().optional(),
  parentTransactionId: z.string().cuid().optional(),
  installmentNumber: z.number().int().positive().optional(),
  totalInstallments: z.number().int().positive().optional(),
  tripId: z.string().cuid().optional(),
  goalId: z.string().cuid().optional()
});

export const createGoalSchema = z.object({
  name: z.string()
    .min(1, 'Nome da meta é obrigatório')
    .max(100, 'Nome da meta deve ter no máximo 100 caracteres'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  target: z.number()
    .finite('Valor da meta deve ser um número válido')
    .refine(val => new Decimal(val).greaterThan(0), 'Valor da meta deve ser maior que zero'),
  current: z.number()
    .finite('Valor atual deve ser um número válido')
    .refine(val => new Decimal(val).greaterThanOrEqualTo(0), 'Valor atual deve ser maior ou igual a zero')
    .default(0),
  targetDate: z.date().refine(date => date > new Date(), 'Data da meta deve ser no futuro').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

export const createBudgetSchema = z.object({
  name: z.string()
    .min(1, 'Nome do orçamento é obrigatório')
    .max(100, 'Nome do orçamento deve ter no máximo 100 caracteres'),
  category: z.string()
    .min(1, 'Categoria é obrigatória')
    .max(100, 'Categoria deve ter no máximo 100 caracteres'),
  amount: z.number()
    .finite('Valor do orçamento deve ser um número válido')
    .refine(val => new Decimal(val).greaterThan(0), 'Valor do orçamento deve ser maior que zero'),
  period: z.enum(['monthly', 'quarterly', 'yearly'], {
    errorMap: () => ({ message: 'Período do orçamento inválido' })
  }),
  startDate: z.date(),
  endDate: z.date(),
  accountId: z.string().cuid().optional()
}).refine(data => data.endDate > data.startDate, {
  message: 'Data final deve ser posterior à data inicial',
  path: ['endDate']
});

// ============================================================================
// VALIDAÇÕES DE REGRAS DE NEGÓCIO
// ============================================================================

export class FinancialValidator {
  constructor(private prisma: PrismaClient) {}

  /**
   * Valida criação de transação com regras de negócio
   */
  async validateCreateTransaction(
    data: z.infer<typeof createTransactionSchema>,
    userId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Validar schema básico
      const validation = createTransactionSchema.safeParse(data);
      if (!validation.success) {
        validation.error.errors.forEach(err => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
        return { isValid: false, errors };
      }

      const validData = validation.data;

      // Verificar se conta existe e pertence ao usuário
      const account = await this.prisma.account.findFirst({
        where: { 
          id: validData.accountId,
          userId,
          isActive: true
        }
      });

      if (!account) {
        errors.push('Conta não encontrada ou inativa');
        return { isValid: false, errors };
      }

      // Validar saldo para transações de débito
      if (validData.type === 'expense' || validData.type === 'shared') {
        const transactionAmount = new Decimal(Math.abs(validData.amount));
        const accountBalance = new Decimal(account.balance);
        const newBalance = accountBalance.minus(transactionAmount);

        if (newBalance.lessThan(0)) {
          errors.push(
            `Saldo insuficiente. Saldo atual: R$ ${accountBalance.toFixed(2)}, ` +
            `Valor da transação: R$ ${transactionAmount.toFixed(2)}`
          );
        }
      }

      // Validar transferência
      if (validData.type === 'transfer' && !validData.transferId) {
        errors.push('ID de transferência é obrigatório para transações de transferência');
      }

      // Validar parcelamento
      if (validData.installmentNumber && validData.totalInstallments) {
        if (validData.installmentNumber > validData.totalInstallments) {
          errors.push('Número da parcela não pode ser maior que o total de parcelas');
        }
        if (validData.installmentNumber < 1) {
          errors.push('Número da parcela deve ser maior que zero');
        }
      }

      // Validar meta se especificada
      if (validData.goalId) {
        const goal = await this.prisma.goal.findFirst({
          where: {
            id: validData.goalId,
            userId,
            isCompleted: false
          }
        });

        if (!goal) {
          errors.push('Meta não encontrada ou já concluída');
        }
      }

      // Validar viagem se especificada
      if (validData.tripId) {
        const trip = await this.prisma.trip.findFirst({
          where: {
            id: validData.tripId,
            userId
          }
        });

        if (!trip) {
          errors.push('Viagem não encontrada');
        }
      }

      return { isValid: errors.length === 0, errors };

    } catch (error) {
      console.error('Erro na validação de transação:', error);
      errors.push('Erro interno na validação');
      return { isValid: false, errors };
    }
  }

  /**
   * Valida criação de conta
   */
  async validateCreateAccount(
    data: z.infer<typeof createAccountSchema>,
    userId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Validar schema básico
      const validation = createAccountSchema.safeParse(data);
      if (!validation.success) {
        validation.error.errors.forEach(err => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
        return { isValid: false, errors };
      }

      const validData = validation.data;

      // Verificar se já existe conta com mesmo nome para o usuário
      const existingAccount = await this.prisma.account.findFirst({
        where: {
          userId,
          name: validData.name,
          isActive: true
        }
      });

      if (existingAccount) {
        errors.push('Já existe uma conta ativa com este nome');
      }

      // Validar saldo inicial para contas de crédito
      if (validData.type === 'credit' && new Decimal(validData.balance).greaterThan(0)) {
        errors.push('Contas de crédito devem ter saldo inicial zero ou negativo');
      }

      return { isValid: errors.length === 0, errors };

    } catch (error) {
      console.error('Erro na validação de conta:', error);
      errors.push('Erro interno na validação');
      return { isValid: false, errors };
    }
  }

  /**
   * Valida criação de meta
   */
  async validateCreateGoal(
    data: z.infer<typeof createGoalSchema>,
    userId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Validar schema básico
      const validation = createGoalSchema.safeParse(data);
      if (!validation.success) {
        validation.error.errors.forEach(err => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
        return { isValid: false, errors };
      }

      const validData = validation.data;

      // Verificar se valor atual não é maior que a meta
      if (new Decimal(validData.current).greaterThan(validData.target)) {
        errors.push('Valor atual não pode ser maior que a meta');
      }

      // Verificar se já existe meta ativa com mesmo nome
      const existingGoal = await this.prisma.goal.findFirst({
        where: {
          userId,
          name: validData.name,
          isCompleted: false
        }
      });

      if (existingGoal) {
        errors.push('Já existe uma meta ativa com este nome');
      }

      return { isValid: errors.length === 0, errors };

    } catch (error) {
      console.error('Erro na validação de meta:', error);
      errors.push('Erro interno na validação');
      return { isValid: false, errors };
    }
  }

  /**
   * Valida criação de orçamento
   */
  async validateCreateBudget(
    data: z.infer<typeof createBudgetSchema>,
    userId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Validar schema básico
      const validation = createBudgetSchema.safeParse(data);
      if (!validation.success) {
        validation.error.errors.forEach(err => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
        return { isValid: false, errors };
      }

      const validData = validation.data;

      // Verificar se conta existe (se especificada)
      if (validData.accountId) {
        const account = await this.prisma.account.findFirst({
          where: {
            id: validData.accountId,
            userId,
            isActive: true
          }
        });

        if (!account) {
          errors.push('Conta não encontrada ou inativa');
        }
      }

      // Verificar sobreposição de orçamentos para a mesma categoria
      const overlappingBudget = await this.prisma.budget.findFirst({
        where: {
          userId,
          category: validData.category,
          isActive: true,
          OR: [
            {
              startDate: { lte: validData.endDate },
              endDate: { gte: validData.startDate }
            }
          ]
        }
      });

      if (overlappingBudget) {
        errors.push('Já existe um orçamento ativo para esta categoria no período especificado');
      }

      return { isValid: errors.length === 0, errors };

    } catch (error) {
      console.error('Erro na validação de orçamento:', error);
      errors.push('Erro interno na validação');
      return { isValid: false, errors };
    }
  }

  /**
   * Valida integridade referencial de uma transação
   */
  async validateTransactionIntegrity(transactionId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          account: true,
          goal: true,
          trip: true
        }
      });

      if (!transaction) {
        errors.push('Transação não encontrada');
        return { isValid: false, errors };
      }

      // Verificar se conta existe
      if (!transaction.account) {
        errors.push('Conta da transação não encontrada');
      }

      // Verificar se meta existe (se especificada)
      if (transaction.goalId && !transaction.goal) {
        errors.push('Meta da transação não encontrada');
      }

      // Verificar se viagem existe (se especificada)
      if (transaction.tripId && !transaction.trip) {
        errors.push('Viagem da transação não encontrada');
      }

      return { isValid: errors.length === 0, errors };

    } catch (error) {
      console.error('Erro na validação de integridade:', error);
      errors.push('Erro interno na validação');
      return { isValid: false, errors };
    }
  }

  /**
   * Valida consistência de saldos
   */
  async validateAccountBalance(accountId: string): Promise<{ isValid: boolean; errors: string[]; calculatedBalance: number; storedBalance: number }> {
    const errors: string[] = [];

    try {
      const account = await this.prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        errors.push('Conta não encontrada');
        return { isValid: false, errors, calculatedBalance: 0, storedBalance: 0 };
      }

      // Calcular saldo baseado nas transações
      const transactions = await this.prisma.transaction.findMany({
        where: { accountId }
      });

      const calculatedBalance = transactions.reduce((balance, transaction) => {
        const amount = new Decimal(transaction.amount);
        
        if (transaction.type === 'income') {
          return balance.plus(amount);
        } else {
          return balance.minus(amount.abs());
        }
      }, new Decimal(0));

      const storedBalance = new Decimal(account.balance);
      const difference = calculatedBalance.minus(storedBalance).abs();

      // Tolerância de 1 centavo
      if (difference.greaterThan(0.01)) {
        errors.push(
          `Saldo inconsistente. Calculado: R$ ${calculatedBalance.toFixed(2)}, ` +
          `Armazenado: R$ ${storedBalance.toFixed(2)}, ` +
          `Diferença: R$ ${difference.toFixed(2)}`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        calculatedBalance: calculatedBalance.toNumber(),
        storedBalance: storedBalance.toNumber()
      };

    } catch (error) {
      console.error('Erro na validação de saldo:', error);
      errors.push('Erro interno na validação');
      return { isValid: false, errors, calculatedBalance: 0, storedBalance: 0 };
    }
  }
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS DE VALIDAÇÃO
// ============================================================================

/**
 * Valida se um valor monetário é válido
 */
export function isValidMonetaryValue(value: number): boolean {
  try {
    const decimal = new Decimal(value);
    return decimal.isFinite() && !decimal.isNaN();
  } catch {
    return false;
  }
}

/**
 * Valida se uma data está dentro de um range válido
 */
export function isValidDateRange(startDate: Date, endDate: Date): boolean {
  return startDate <= endDate && startDate <= new Date();
}

/**
 * Valida formato de moeda
 */
export function isValidCurrency(currency: string): boolean {
  const validCurrencies = ['BRL', 'USD', 'EUR', 'GBP', 'JPY'];
  return validCurrencies.includes(currency.toUpperCase());
}

/**
 * Sanitiza valor monetário
 */
export function sanitizeMonetaryValue(value: number): number {
  return new Decimal(value).toDecimalPlaces(2).toNumber();
}