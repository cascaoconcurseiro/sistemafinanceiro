// TESTES CRUD PARA FINANCE ENGINE
// Testes básicos para operações CRUD do FinanceEngine

import { FinancialEngine } from '../src/lib/financial-engine';
import { Transaction, Account } from '../src/types';

describe('FinanceEngine CRUD Operations', () => {
  let engine;
  let mockTransactions;
  let mockAccounts;

  beforeEach(async () => {
    // Reset singleton instance
    FinancialEngine.instance = null;
    engine = FinancialEngine.getInstance();
    
    // Mock data
    mockAccounts = [
      {
        id: 'acc-1',
        name: 'Conta Corrente',
        type: 'checking',
        balance: 1000,
        currency: 'BRL',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'acc-2',
        name: 'Poupança',
        type: 'savings',
        balance: 5000,
        currency: 'BRL',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ];

    mockTransactions = [
      {
        id: 'trans-1',
        amount: 100,
        description: 'Compra supermercado',
        date: '2024-01-15',
        accountId: 'acc-1',
        categoryId: 'cat-food',
        type: 'expense',
        status: 'completed',
        source: 'manual',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z'
      }
    ];

    await engine.initialize(mockTransactions, mockAccounts);
  });

  describe('Transaction CRUD Operations', () => {
    describe('CREATE Transaction', () => {
      test('should create a new transaction successfully', async () => {
        const newTransactionData = {
          amount: 250,
          description: 'Salário',
          date: '2024-01-20',
          accountId: 'acc-1',
          categoryId: 'cat-salary',
          type: 'income',
          status: 'completed',
          source: 'manual'
        };

        const createdTransaction = await engine.createTransaction(newTransactionData);

        expect(createdTransaction).toBeDefined();
        expect(createdTransaction.id).toBeDefined();
        expect(createdTransaction.amount).toBe(250);
        expect(createdTransaction.description).toBe('Salário');
        expect(createdTransaction.createdAt).toBeDefined();
        expect(createdTransaction.updatedAt).toBeDefined();
      });

      test('should throw error for invalid transaction data', async () => {
        const invalidTransactionData = {
          amount: -100, // Invalid negative amount for income
          description: '',
          date: '2024-01-20',
          accountId: 'acc-1',
          categoryId: 'cat-salary',
          type: 'income',
          status: 'completed',
          source: 'manual'
        };

        await expect(engine.createTransaction(invalidTransactionData))
          .rejects.toThrow('Erro de validação');
      });

      test('should add transaction to internal array', async () => {
        const initialCount = engine.getTransactions().length;
        
        const newTransactionData = {
          amount: 50,
          description: 'Café',
          date: '2024-01-20',
          accountId: 'acc-1',
          categoryId: 'cat-food',
          type: 'expense',
          status: 'completed',
          source: 'manual'
        };

        await engine.createTransaction(newTransactionData);
        
        const finalCount = engine.getTransactions().length;
        expect(finalCount).toBe(initialCount + 1);
      });
    });

    describe('READ Transaction', () => {
      test('should get all transactions', () => {
        const transactions = engine.getTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].id).toBe('trans-1');
      });

      test('should get transaction by ID', () => {
        const transaction = engine.getTransactionById('trans-1');
        expect(transaction).toBeDefined();
        expect(transaction.id).toBe('trans-1');
        expect(transaction.amount).toBe(100);
      });

      test('should return undefined for non-existent transaction ID', () => {
        const transaction = engine.getTransactionById('non-existent');
        expect(transaction).toBeUndefined();
      });

      test('should get transactions by account', () => {
        const transactions = engine.getTransactionsByAccount('acc-1');
        expect(transactions).toHaveLength(1);
        expect(transactions[0].accountId).toBe('acc-1');
      });

      test('should get transactions by category', () => {
        const transactions = engine.getTransactionsByCategory('cat-food');
        expect(transactions).toHaveLength(1);
        expect(transactions[0].categoryId).toBe('cat-food');
      });

      test('should get transactions by date range', () => {
        const transactions = engine.getTransactionsByDateRange('2024-01-01', '2024-01-31');
        expect(transactions).toHaveLength(1);
        
        const emptyTransactions = engine.getTransactionsByDateRange('2024-02-01', '2024-02-28');
        expect(emptyTransactions).toHaveLength(0);
      });
    });

    describe('UPDATE Transaction', () => {
      test('should update transaction successfully', async () => {
        const updates = {
          amount: 150,
          description: 'Compra supermercado - atualizada'
        };

        const updatedTransaction = await engine.updateTransaction('trans-1', updates);

        expect(updatedTransaction.amount).toBe(150);
        expect(updatedTransaction.description).toBe('Compra supermercado - atualizada');
        expect(updatedTransaction.updatedAt).not.toBe(mockTransactions[0].updatedAt);
      });

      test('should throw error for non-existent transaction', async () => {
        const updates = { amount: 200 };

        await expect(engine.updateTransaction('non-existent', updates))
          .rejects.toThrow('Transação com ID non-existent não encontrada');
      });

      test('should validate updated transaction data', async () => {
        const invalidUpdates = {
          amount: -500, // Invalid negative amount for expense
          type: 'expense'
        };

        await expect(engine.updateTransaction('trans-1', invalidUpdates))
          .rejects.toThrow('Erro de validação');
      });
    });

    describe('DELETE Transaction', () => {
      test('should delete transaction successfully', async () => {
        const initialCount = engine.getTransactions().length;
        
        const result = await engine.deleteTransaction('trans-1');
        
        expect(result).toBe(true);
        
        const finalCount = engine.getTransactions().length;
        expect(finalCount).toBe(initialCount - 1);
        
        const deletedTransaction = engine.getTransactionById('trans-1');
        expect(deletedTransaction).toBeUndefined();
      });

      test('should throw error for non-existent transaction', async () => {
        await expect(engine.deleteTransaction('non-existent'))
          .rejects.toThrow('Transação com ID non-existent não encontrada');
      });
    });
  });

  describe('Transfer Operations', () => {
    test('should create transfer transaction successfully', async () => {
      const transferData = {
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
        amount: 300,
        description: 'Transferência para poupança',
        date: '2024-01-20',
        status: 'completed'
      };

      const result = await engine.createTransferTransaction(transferData);

      expect(result.fromTransaction).toBeDefined();
      expect(result.toTransaction).toBeDefined();
      expect(result.transferGroupId).toBeDefined();
      
      expect(result.fromTransaction.accountId).toBe('acc-1');
      expect(result.fromTransaction.toAccountId).toBe('acc-2');
      expect(result.fromTransaction.amount).toBe(300);
      expect(result.fromTransaction.type).toBe('transfer');
      
      expect(result.toTransaction.accountId).toBe('acc-2');
      expect(result.toTransaction.amount).toBe(300);
      expect(result.toTransaction.type).toBe('transfer');
      
      expect(result.fromTransaction.transferGroupId).toBe(result.toTransaction.transferGroupId);
    });

    test('should throw error for same account transfer', async () => {
      const transferData = {
        fromAccountId: 'acc-1',
        toAccountId: 'acc-1',
        amount: 300,
        description: 'Transferência inválida',
        date: '2024-01-20'
      };

      await expect(engine.createTransferTransaction(transferData))
        .rejects.toThrow('Conta de origem e destino não podem ser iguais');
    });
  });

  describe('Balance Calculations', () => {
    test('should calculate account balance correctly', () => {
      const balance = engine.calculateAccountBalance('acc-1');
      // FinanceEngine calculates balance from transactions only (no initial balance)
      // Expense transaction of 100 = -100 balance
      expect(balance).toBe(-100);
    });

    test('should get all account balances', () => {
      const balances = engine.getAllAccountBalances();
      
      expect(balances['acc-1']).toBe(-100); // Only expense transaction of 100
      expect(balances['acc-2']).toBe(0); // No transactions
    });

    test('should return 0 for non-existent account', () => {
      const balance = engine.calculateAccountBalance('non-existent');
      expect(balance).toBe(0);
    });
  });

  describe('Engine Initialization', () => {
    test('should initialize with transactions and accounts', async () => {
      const newEngine = FinancialEngine.getInstance();
      
      await newEngine.initialize(mockTransactions, mockAccounts);
      
      expect(newEngine.getTransactions()).toHaveLength(1);
      expect(newEngine.getTransactions()[0].id).toBe('trans-1');
    });

    test('should be singleton', () => {
      const engine1 = FinancialEngine.getInstance();
      const engine2 = FinancialEngine.getInstance();
      
      expect(engine1).toBe(engine2);
    });
  });
});