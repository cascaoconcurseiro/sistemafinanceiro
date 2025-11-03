/**
 * SERVIÇO DE VALIDAÇÕES
 * Valida regras de negócio antes de criar/editar transações
 * Garante integridade e consistência dos dados
 */

import { prisma } from '@/lib/prisma';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ValidationService {
  /**
   * Validar saldo da conta antes de criar despesa
   */
  static async validateAccountBalance(accountId: string, amount: number) {
    const account = await prisma.account.findUnique({ 
      where: { id: accountId } 
    });
    
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    
    // Validar saldo normal
    if (!account.allowNegativeBalance && Number(account.balance) < amount) {
      throw new Error(
        `❌ Saldo insuficiente!\n\n` +
        `Disponível: R$ ${Number(account.balance).toFixed(2)}\n` +
        `Necessário: R$ ${amount.toFixed(2)}\n` +
        `Faltam: R$ ${(amount - Number(account.balance)).toFixed(2)}`
      );
    }
    
    // Validar limite de cheque especial
    if (account.allowNegativeBalance) {
      const availableLimit = Number(account.balance) + Number(account.overdraftLimit);
      
      if (availableLimit < amount) {
        throw new Error(
          `❌ Limite de cheque especial excedido!\n\n` +
          `Saldo: R$ ${Number(account.balance).toFixed(2)}\n` +
          `Limite: R$ ${Number(account.overdraftLimit).toFixed(2)}\n` +
          `Disponível: R$ ${availableLimit.toFixed(2)}\n` +
          `Necessário: R$ ${amount.toFixed(2)}`
        );
      }
    }
    
    console.log(`✅ [Validation] Saldo validado: R$ ${Number(account.balance).toFixed(2)} >= R$ ${amount.toFixed(2)}`);
  }
  
  /**
   * Validar limite do cartão antes de criar despesa
   */
  static async validateCreditCardLimit(cardId: string, amount: number) {
    const card = await prisma.creditCard.findUnique({ 
      where: { id: cardId } 
    });
    
    if (!card) {
      throw new Error('Cartão não encontrado');
    }
    
    const availableLimit = Number(card.limit) - Number(card.currentBalance);
    
    // Validar limite normal
    if (!card.allowOverLimit && availableLimit < amount) {
      throw new Error(
        `❌ Limite insuficiente!\n\n` +
        `Limite total: R$ ${Number(card.limit).toFixed(2)}\n` +
        `Já usado: R$ ${Number(card.currentBalance).toFixed(2)}\n` +
        `Disponível: R$ ${availableLimit.toFixed(2)}\n` +
        `Necessário: R$ ${amount.toFixed(2)}\n` +
        `Faltam: R$ ${(amount - availableLimit).toFixed(2)}`
      );
    }
    
    // Validar limite estendido
    if (card.allowOverLimit) {
      const maxOverLimit = Number(card.limit) * (1 + card.overLimitPercent / 100);
      const totalAvailable = maxOverLimit - Number(card.currentBalance);
      
      if (totalAvailable < amount) {
        throw new Error(
          `❌ Limite máximo excedido!\n\n` +
          `Limite normal: R$ ${Number(card.limit).toFixed(2)}\n` +
          `Limite estendido: R$ ${maxOverLimit.toFixed(2)}\n` +
          `Disponível: R$ ${totalAvailable.toFixed(2)}\n` +
          `Necessário: R$ ${amount.toFixed(2)}`
        );
      }
      
      // Avisar que está usando limite estendido
      if (Number(card.currentBalance) + amount > Number(card.limit)) {
        console.warn(
          `⚠️ [Validation] ATENÇÃO: Usando limite estendido!\n` +
          `Isso pode gerar juros adicionais.`
        );
      }
    }
    
    console.log(`✅ [Validation] Limite validado: R$ ${availableLimit.toFixed(2)} >= R$ ${amount.toFixed(2)}`);
  }
  
  /**
   * Validar transação completa
   */
  static async validateTransaction(transaction: any) {
    console.log(`🔍 [Validation] Validando transação:`, {
      type: transaction.type,
      amount: transaction.amount,
      accountId: transaction.accountId,
      creditCardId: transaction.creditCardId
    });
    
    // Validar que tem conta OU cartão
    if (!transaction.accountId && !transaction.creditCardId) {
      throw new Error('Transação deve ter conta ou cartão de crédito');
    }
    
    const amount = Math.abs(Number(transaction.amount));
    
    // Validar saldo (se for despesa em conta)
    if (transaction.type === 'DESPESA' && transaction.accountId) {
      await this.validateAccountBalance(transaction.accountId, amount);
    }
    
    // Validar limite (se for despesa em cartão)
    if (transaction.type === 'DESPESA' && transaction.creditCardId) {
      await this.validateCreditCardLimit(transaction.creditCardId, amount);
    }
    
    console.log(`✅ [Validation] Transação validada com sucesso`);
  }
}

// Export da instância para compatibilidade
export const validationService = ValidationService;
export default ValidationService;