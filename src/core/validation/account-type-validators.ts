/**
 * 🏦 VALIDADORES POR TIPO DE CONTA
 * 
 * Implementa validações específicas para cada tipo de conta bancária,
 * seguindo regras e limitações reais do sistema bancário brasileiro.
 */

import type { Account, Transaction } from '@/types';

export interface AccountTypeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface AccountLimits {
  minBalance: number;
  maxBalance: number;
  maxDailyTransactions: number;
  maxTransactionAmount: number;
  allowsNegativeBalance: boolean;
  requiresMinimumBalance: boolean;
  minimumBalanceAmount?: number;
}

// ===== LIMITES POR TIPO DE CONTA =====

export const ACCOUNT_TYPE_LIMITS: Record<string, AccountLimits> = {
  checking: {
    minBalance: -5000, // Permite cheque especial até R$ 5.000
    maxBalance: 10000000, // R$ 10 milhões
    maxDailyTransactions: 50,
    maxTransactionAmount: 100000, // R$ 100.000 por transação
    allowsNegativeBalance: true,
    requiresMinimumBalance: false,
  },
  
  savings: {
    minBalance: 0, // Poupança não permite saldo negativo
    maxBalance: 10000000, // R$ 10 milhões
    maxDailyTransactions: 20, // Limitação típica de poupança
    maxTransactionAmount: 50000, // R$ 50.000 por transação
    allowsNegativeBalance: false,
    requiresMinimumBalance: true,
    minimumBalanceAmount: 1, // R$ 1,00 mínimo
  },
  
  credit: {
    minBalance: -50000, // Limite de cartão de crédito
    maxBalance: 0, // Cartão não tem saldo positivo
    maxDailyTransactions: 100,
    maxTransactionAmount: 20000, // R$ 20.000 por transação
    allowsNegativeBalance: true,
    requiresMinimumBalance: false,
  },
  
  investment: {
    minBalance: 0, // Investimentos não permitem saldo negativo
    maxBalance: 50000000, // R$ 50 milhões
    maxDailyTransactions: 10, // Limitação para investimentos
    maxTransactionAmount: 1000000, // R$ 1 milhão por transação
    allowsNegativeBalance: false,
    requiresMinimumBalance: true,
    minimumBalanceAmount: 100, // R$ 100,00 mínimo
  },
  
  business: {
    minBalance: -20000, // Conta empresarial com limite maior
    maxBalance: 50000000, // R$ 50 milhões
    maxDailyTransactions: 200,
    maxTransactionAmount: 500000, // R$ 500.000 por transação
    allowsNegativeBalance: true,
    requiresMinimumBalance: false,
  },
};

// ===== VALIDADORES ESPECÍFICOS =====

export class AccountTypeValidators {
  
  /**
   * Valida conta corrente
   */
  static validateCheckingAccount(account: Account, transaction?: Transaction): AccountTypeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const limits = ACCOUNT_TYPE_LIMITS.checking;
    
    // Validar saldo
    if (account.balance < limits.minBalance) {
      errors.push(`Saldo não pode ser inferior a R$ ${Math.abs(limits.minBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (limite do cheque especial)`);
    }
    
    if (account.balance > limits.maxBalance) {
      errors.push(`Saldo não pode ser superior a R$ ${limits.maxBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }
    
    // Avisos para saldo negativo
    if (account.balance < 0) {
      warnings.push('Conta está utilizando cheque especial - juros podem ser cobrados');
      suggestions.push('Considere fazer um depósito para evitar juros do cheque especial');
    }
    
    // Validar transação se fornecida
    if (transaction) {
      const transactionValidation = this.validateTransactionForAccount(transaction, account, limits);
      errors.push(...transactionValidation.errors);
      warnings.push(...transactionValidation.warnings);
      suggestions.push(...transactionValidation.suggestions);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
  
  /**
   * Valida conta poupança
   */
  static validateSavingsAccount(account: Account, transaction?: Transaction): AccountTypeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const limits = ACCOUNT_TYPE_LIMITS.savings;
    
    // Poupança não permite saldo negativo
    if (account.balance < 0) {
      errors.push('Conta poupança não permite saldo negativo');
    }
    
    // Saldo mínimo obrigatório
    if (limits.requiresMinimumBalance && account.balance < (limits.minimumBalanceAmount || 0)) {
      errors.push(`Conta poupança deve manter saldo mínimo de R$ ${(limits.minimumBalanceAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }
    
    if (account.balance > limits.maxBalance) {
      errors.push(`Saldo não pode ser superior a R$ ${limits.maxBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }
    
    // Sugestões para poupança
    if (account.balance > 100000) {
      suggestions.push('Considere diversificar em outros investimentos para rendimentos maiores');
    }
    
    // Validar transação se fornecida
    if (transaction) {
      const transactionValidation = this.validateTransactionForAccount(transaction, account, limits);
      errors.push(...transactionValidation.errors);
      warnings.push(...transactionValidation.warnings);
      suggestions.push(...transactionValidation.suggestions);
      
      // Validação específica para poupança
      if (transaction.type === 'expense' && (account.balance - transaction.amount) < 0) {
        errors.push('Transação resultaria em saldo negativo, não permitido em conta poupança');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
  
  /**
   * Valida cartão de crédito
   */
  static validateCreditAccount(account: Account, transaction?: Transaction): AccountTypeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const limits = ACCOUNT_TYPE_LIMITS.credit;
    
    // Cartão de crédito tem lógica invertida (saldo negativo = dívida)
    const creditLimit = Math.abs(limits.minBalance);
    const currentDebt = Math.abs(Math.min(account.balance, 0));
    const availableCredit = creditLimit - currentDebt;
    
    if (account.balance > 0) {
      warnings.push('Cartão de crédito com saldo positivo - verifique se há crédito a receber');
    }
    
    if (currentDebt > creditLimit) {
      errors.push(`Limite de crédito excedido. Limite: R$ ${creditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Utilizado: R$ ${currentDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }
    
    // Avisos de utilização do limite
    const utilizationPercentage = (currentDebt / creditLimit) * 100;
    if (utilizationPercentage > 80) {
      warnings.push(`Alto uso do limite de crédito (${utilizationPercentage.toFixed(1)}%) - pode afetar o score`);
      suggestions.push('Considere quitar parte da fatura para melhorar o score de crédito');
    } else if (utilizationPercentage > 50) {
      warnings.push(`Uso moderado do limite de crédito (${utilizationPercentage.toFixed(1)}%)`);
    }
    
    // Validar transação se fornecida
    if (transaction) {
      const transactionValidation = this.validateTransactionForAccount(transaction, account, limits);
      errors.push(...transactionValidation.errors);
      warnings.push(...transactionValidation.warnings);
      suggestions.push(...transactionValidation.suggestions);
      
      // Validação específica para cartão de crédito
      if (transaction.type === 'expense') {
        const newDebt = currentDebt + transaction.amount;
        if (newDebt > creditLimit) {
          errors.push(`Transação excederia o limite de crédito. Disponível: R$ ${availableCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
  
  /**
   * Valida conta de investimento
   */
  static validateInvestmentAccount(account: Account, transaction?: Transaction): AccountTypeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const limits = ACCOUNT_TYPE_LIMITS.investment;
    
    // Investimentos não permitem saldo negativo
    if (account.balance < 0) {
      errors.push('Conta de investimento não permite saldo negativo');
    }
    
    // Saldo mínimo para investimentos
    if (limits.requiresMinimumBalance && account.balance < (limits.minimumBalanceAmount || 0)) {
      errors.push(`Conta de investimento deve manter saldo mínimo de R$ ${(limits.minimumBalanceAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }
    
    if (account.balance > limits.maxBalance) {
      warnings.push(`Saldo muito alto para uma única conta de investimento - considere diversificar`);
    }
    
    // Sugestões para investimentos
    if (account.balance < 1000) {
      suggestions.push('Considere aumentar o valor investido para melhores oportunidades');
    }
    
    // Validar transação se fornecida
    if (transaction) {
      const transactionValidation = this.validateTransactionForAccount(transaction, account, limits);
      errors.push(...transactionValidation.errors);
      warnings.push(...transactionValidation.warnings);
      suggestions.push(...transactionValidation.suggestions);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
  
  /**
   * Valida transação para um tipo específico de conta
   */
  private static validateTransactionForAccount(
    transaction: Transaction,
    account: Account,
    limits: AccountLimits
  ): AccountTypeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Validar valor da transação
    if (transaction.amount > limits.maxTransactionAmount) {
      errors.push(`Valor da transação (R$ ${transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) excede o limite máximo de R$ ${limits.maxTransactionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }
    
    // Validar se a transação resultaria em saldo inválido
    const newBalance = transaction.type === 'expense' 
      ? account.balance - transaction.amount 
      : account.balance + transaction.amount;
    
    if (newBalance < limits.minBalance) {
      if (!limits.allowsNegativeBalance) {
        errors.push('Transação resultaria em saldo negativo, não permitido para este tipo de conta');
      } else {
        warnings.push(`Transação resultará em saldo negativo de R$ ${Math.abs(newBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      }
    }
    
    if (newBalance > limits.maxBalance) {
      errors.push(`Transação resultaria em saldo superior ao limite máximo de R$ ${limits.maxBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
  
  /**
   * Validador principal que escolhe o validador correto baseado no tipo da conta
   */
  static validateAccountByType(account: Account, transaction?: Transaction): AccountTypeValidationResult {
    switch (account.type) {
      case 'checking':
        return this.validateCheckingAccount(account, transaction);
      case 'savings':
        return this.validateSavingsAccount(account, transaction);
      case 'credit':
        return this.validateCreditAccount(account, transaction);
      case 'investment':
        return this.validateInvestmentAccount(account, transaction);
      case 'business':
        // Usar validação de conta corrente como base para conta empresarial
        return this.validateCheckingAccount(account, transaction);
      default:
        return {
          isValid: false,
          errors: [`Tipo de conta não reconhecido: ${account.type}`],
          warnings: [],
          suggestions: [],
        };
    }
  }
  
  /**
   * Obter limites para um tipo de conta
   */
  static getAccountLimits(accountType: string): AccountLimits | null {
    return ACCOUNT_TYPE_LIMITS[accountType] || null;
  }
  
  /**
   * Verificar se um tipo de conta permite saldo negativo
   */
  static allowsNegativeBalance(accountType: string): boolean {
    const limits = this.getAccountLimits(accountType);
    return limits?.allowsNegativeBalance || false;
  }
  
  /**
   * Obter limite máximo de transação para um tipo de conta
   */
  static getMaxTransactionAmount(accountType: string): number {
    const limits = this.getAccountLimits(accountType);
    return limits?.maxTransactionAmount || 0;
  }
}

export default AccountTypeValidators;