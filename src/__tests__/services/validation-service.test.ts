/**
 * TESTES: ValidationService
 * Testa o serviço de validações
 */

import { ValidationService } from '@/lib/services/validation-service';

describe('ValidationService', () => {
  const mockTx = {
    account: {
      findUnique: jest.fn(),
    },
    creditCard: {
      findUnique: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAccountBalance', () => {
    it('deve permitir despesa com saldo suficiente', async () => {
      mockTx.account.findUnique.mockResolvedValue({
        id: 'account-1',
        name: 'Conta Corrente',
        balance: 1000,
        allowNegativeBalance: false,
      });

      await expect(
        ValidationService.validateAccountBalance(mockTx, 'account-1', 500)
      ).resolves.not.toThrow();
    });

    it('deve bloquear despesa com saldo insuficiente', async () => {
      mockTx.account.findUnique.mockResolvedValue({
        id: 'account-1',
        name: 'Conta Corrente',
        balance: 100,
        allowNegativeBalance: false,
      });

      await expect(
        ValidationService.validateAccountBalance(mockTx, 'account-1', 500)
      ).rejects.toThrow('Saldo insuficiente');
    });

    it('deve permitir saldo negativo se configurado', async () => {
      mockTx.account.findUnique.mockResolvedValue({
        id: 'account-1',
        name: 'Conta Corrente',
        balance: 100,
        allowNegativeBalance: true,
        overdraftLimit: 1000,
      });

      await expect(
        ValidationService.validateAccountBalance(mockTx, 'account-1', 500)
      ).resolves.not.toThrow();
    });
  });

  describe('validateCreditCardLimit', () => {
    it('deve permitir compra dentro do limite', async () => {
      mockTx.creditCard.findUnique.mockResolvedValue({
        id: 'card-1',
        name: 'Cartão Visa',
        limit: 5000,
        currentBalance: 1000,
        allowOverLimit: false,
      });

      await expect(
        ValidationService.validateCreditCardLimit(mockTx, 'card-1', 500)
      ).resolves.not.toThrow();
    });

    it('deve bloquear compra acima do limite', async () => {
      mockTx.creditCard.findUnique.mockResolvedValue({
        id: 'card-1',
        name: 'Cartão Visa',
        limit: 5000,
        currentBalance: 4800,
        allowOverLimit: false,
      });

      await expect(
        ValidationService.validateCreditCardLimit(mockTx, 'card-1', 500)
      ).rejects.toThrow('Limite insuficiente');
    });
  });

  describe('validateCategory', () => {
    it('deve validar categoria ativa', async () => {
      mockTx.category.findUnique.mockResolvedValue({
        id: 'category-1',
        name: 'Alimentação',
        type: 'DESPESA',
        isActive: true,
      });

      await expect(
        ValidationService.validateCategory(mockTx, 'category-1', 'DESPESA')
      ).resolves.not.toThrow();
    });

    it('deve bloquear categoria inativa', async () => {
      mockTx.category.findUnique.mockResolvedValue({
        id: 'category-1',
        name: 'Alimentação',
        type: 'DESPESA',
        isActive: false,
      });

      await expect(
        ValidationService.validateCategory(mockTx, 'category-1', 'DESPESA')
      ).rejects.toThrow('está inativa');
    });

    it('deve bloquear categoria null', async () => {
      await expect(
        ValidationService.validateCategory(mockTx, null, 'DESPESA')
      ).rejects.toThrow('Categoria é obrigatória');
    });
  });

  describe('validateTransactionData', () => {
    it('deve validar dados corretos', () => {
      const data = {
        description: 'Teste',
        amount: 100,
        type: 'DESPESA',
        date: new Date(),
      };

      expect(() => ValidationService.validateTransactionData(data)).not.toThrow();
    });

    it('deve bloquear descrição vazia', () => {
      const data = {
        description: '',
        amount: 100,
        type: 'DESPESA',
        date: new Date(),
      };

      expect(() => ValidationService.validateTransactionData(data)).toThrow('Descrição é obrigatória');
    });

    it('deve bloquear valor zero', () => {
      const data = {
        description: 'Teste',
        amount: 0,
        type: 'DESPESA',
        date: new Date(),
      };

      expect(() => ValidationService.validateTransactionData(data)).toThrow('Valor deve ser maior que zero');
    });
  });
});
