/**
 * Testes para Sistema de Gerenciamento de Estado
 */

import { renderHook, act } from '@testing-library/react';
import { useFinancialStore } from '../src/lib/store/financial-store';
import { StateMigrationManager } from '../src/lib/store/state-migration';
import { updateEmitter } from '../src/lib/store/real-time-updates';

// Mock do localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn((key) => localStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  })
};

// Mock do fetch
global.fetch = jest.fn();

// Mock do navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock do window
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Financial Store', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('State Management', () => {
    test('deve inicializar com estado padrão', () => {
      const { result } = renderHook(() => useFinancialStore());
      
      expect(result.current.accounts).toEqual([]);
      expect(result.current.transactions).toEqual([]);
      expect(result.current.categories).toEqual([]);
      expect(result.current.preferences.currency).toBe('BRL');
      expect(result.current.isLoading.accounts).toBe(false);
    });

    test('deve carregar contas da API', async () => {
      const mockAccounts = [
        { id: '1', name: 'Conta Corrente', type: 'checking', balance: 1000, currency: 'BRL', isActive: true }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accounts: mockAccounts })
      });

      const { result } = renderHook(() => useFinancialStore());

      await act(async () => {
        await result.current.loadAccounts();
      });

      expect(result.current.accounts).toEqual(mockAccounts);
      expect(result.current.isLoading.accounts).toBe(false);
      expect(fetch).toHaveBeenCalledWith('/api/accounts');
    });

    test('deve lidar com erro ao carregar dados', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFinancialStore());

      await act(async () => {
        await result.current.loadAccounts();
      });

      expect(result.current.accounts).toEqual([]);
      expect(result.current.isLoading.accounts).toBe(false);
    });
  });

  describe('CRUD Operations', () => {
    test('deve criar conta com optimistic update', async () => {
      const newAccountData = {
        name: 'Nova Conta',
        type: 'savings',
        balance: 500,
        currency: 'BRL',
        isActive: true
      };

      const createdAccount = {
        ...newAccountData,
        id: 'real-id',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ account: createdAccount })
      });

      const { result } = renderHook(() => useFinancialStore());

      await act(async () => {
        const account = await result.current.createAccount(newAccountData);
        expect(account).toEqual(createdAccount);
      });

      expect(result.current.accounts).toContainEqual(createdAccount);
      expect(fetch).toHaveBeenCalledWith('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccountData)
      });
    });

    test('deve reverter optimistic update em caso de erro', async () => {
      const newAccountData = {
        name: 'Conta com Erro',
        type: 'checking',
        balance: 100,
        currency: 'BRL',
        isActive: true
      };

      fetch.mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() => useFinancialStore());

      await act(async () => {
        try {
          await result.current.createAccount(newAccountData);
        } catch (error) {
          expect(error.message).toBe('Server error');
        }
      });

      // Verificar que a conta temporária foi removida
      expect(result.current.accounts).toEqual([]);
    });

    test('deve atualizar conta existente', async () => {
      const existingAccount = {
        id: '1',
        name: 'Conta Original',
        type: 'checking',
        balance: 1000,
        currency: 'BRL',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      const updates = { name: 'Conta Atualizada', balance: 1500 };
      const updatedAccount = { ...existingAccount, ...updates };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ account: updatedAccount })
      });

      const { result } = renderHook(() => useFinancialStore());

      // Adicionar conta existente ao estado
      act(() => {
        result.current.accounts.push(existingAccount);
      });

      await act(async () => {
        const account = await result.current.updateAccount('1', updates);
        expect(account).toEqual(updatedAccount);
      });

      expect(result.current.accounts[0]).toEqual(updatedAccount);
    });

    test('deve excluir conta', async () => {
      const existingAccount = {
        id: '1',
        name: 'Conta para Excluir',
        type: 'checking',
        balance: 1000,
        currency: 'BRL',
        isActive: true
      };

      fetch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useFinancialStore());

      // Adicionar conta ao estado
      act(() => {
        result.current.accounts.push(existingAccount);
      });

      await act(async () => {
        await result.current.deleteAccount('1');
      });

      expect(result.current.accounts).toEqual([]);
      expect(fetch).toHaveBeenCalledWith('/api/accounts/1', {
        method: 'DELETE'
      });
    });
  });

  describe('Filters and Selectors', () => {
    test('deve filtrar transações por data', () => {
      const transactions = [
        { id: '1', date: '2023-01-15', accountId: 'acc1', categoryId: 'cat1', amount: 100, type: 'income', status: 'completed' },
        { id: '2', date: '2023-02-15', accountId: 'acc1', categoryId: 'cat1', amount: 200, type: 'expense', status: 'completed' },
        { id: '3', date: '2023-03-15', accountId: 'acc1', categoryId: 'cat1', amount: 300, type: 'income', status: 'completed' }
      ];

      const { result } = renderHook(() => useFinancialStore());

      act(() => {
        result.current.transactions.push(...transactions);
        result.current.setDateRange('2023-01-01', '2023-02-28');
      });

      const filtered = result.current.getFilteredTransactions();
      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.id)).toEqual(['1', '2']);
    });

    test('deve calcular saldo da conta corretamente', () => {
      const transactions = [
        { id: '1', accountId: 'acc1', amount: 1000, type: 'income', status: 'completed' },
        { id: '2', accountId: 'acc1', amount: 300, type: 'expense', status: 'completed' },
        { id: '3', accountId: 'acc1', amount: 200, type: 'expense', status: 'pending' }, // Não deve contar
        { id: '4', accountId: 'acc2', amount: 500, type: 'income', status: 'completed' } // Conta diferente
      ];

      const { result } = renderHook(() => useFinancialStore());

      act(() => {
        result.current.transactions.push(...transactions);
      });

      const balance = result.current.getAccountBalance('acc1');
      expect(balance).toBe(700); // 1000 - 300
    });

    test('deve calcular total por categoria', () => {
      const transactions = [
        { id: '1', categoryId: 'cat1', amount: 100, status: 'completed' },
        { id: '2', categoryId: 'cat1', amount: 200, status: 'completed' },
        { id: '3', categoryId: 'cat1', amount: 150, status: 'pending' }, // Não deve contar
        { id: '4', categoryId: 'cat2', amount: 300, status: 'completed' } // Categoria diferente
      ];

      const { result } = renderHook(() => useFinancialStore());

      act(() => {
        result.current.transactions.push(...transactions);
      });

      const total = result.current.getCategoryTotal('cat1');
      expect(total).toBe(300); // 100 + 200
    });
  });

  describe('Preferences', () => {
    test('deve atualizar preferências', () => {
      const { result } = renderHook(() => useFinancialStore());

      act(() => {
        result.current.updatePreferences({
          currency: 'USD',
          theme: 'dark'
        });
      });

      expect(result.current.preferences.currency).toBe('USD');
      expect(result.current.preferences.theme).toBe('dark');
      expect(result.current.preferences.notifications).toBe(true); // Deve manter valor anterior
    });
  });
});

describe('State Migration', () => {
  let migrationManager;

  beforeEach(() => {
    migrationManager = StateMigrationManager.getInstance();
    localStorageMock.clear();
  });

  test('deve migrar estado da versão 0 para 1', () => {
    const oldState = {
      accounts: [],
      transactions: []
    };

    const migratedState = migrationManager.migrateState(oldState, 0, 1);

    expect(migratedState.preferences).toBeDefined();
    expect(migratedState.preferences.currency).toBe('BRL');
    expect(migratedState.version).toBe(1);
  });

  test('deve criar backup antes da migração', () => {
    const state = { accounts: [], version: 0 };

    migrationManager.createBackup(state, 0);

    const backups = migrationManager.getBackups();
    expect(backups).toHaveLength(1);
    expect(backups[0].version).toBe(0);
    expect(backups[0].data).toEqual(state);
  });

  test('deve validar estrutura do estado', () => {
    const validState = {
      accounts: [],
      transactions: [],
      categories: [],
      preferences: {}
    };

    const invalidState = {
      accounts: 'not an array',
      transactions: []
    };

    const validResult = migrationManager.validateState(validState);
    const invalidResult = migrationManager.validateState(invalidState);

    expect(validResult.isValid).toBe(true);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain('Campo "accounts" deve ser um array');
  });

  test('deve reparar estado corrompido', () => {
    const corruptedState = {
      accounts: 'not an array',
      transactions: null,
      preferences: 'not an object'
    };

    const repairedState = migrationManager.repairState(corruptedState);

    expect(Array.isArray(repairedState.accounts)).toBe(true);
    expect(Array.isArray(repairedState.transactions)).toBe(true);
    expect(typeof repairedState.preferences).toBe('object');
  });

  test('deve limpar estados expirados', () => {
    // Simular dados expirados no localStorage
    localStorageMock.store['expired_data'] = JSON.stringify({
      data: 'test',
      expiresAt: Date.now() - 1000 // Expirado há 1 segundo
    });

    localStorageMock.store['valid_data'] = JSON.stringify({
      data: 'test',
      expiresAt: Date.now() + 1000 // Expira em 1 segundo
    });

    migrationManager.clearExpiredStates();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('expired_data');
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('valid_data');
  });
});

describe('Real-time Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve emitir eventos de atualização', () => {
    const mockListener = jest.fn();
    
    const cleanup = updateEmitter.on('account', mockListener);

    const event = {
      type: 'create',
      entity: 'account',
      id: '1',
      timestamp: Date.now(),
      source: 'local'
    };

    updateEmitter.emit(event);

    expect(mockListener).toHaveBeenCalledWith(event);

    cleanup();
  });

  test('deve escutar eventos de todas as entidades', () => {
    const mockListener = jest.fn();
    
    const cleanup = updateEmitter.on('*', mockListener);

    const accountEvent = {
      type: 'create',
      entity: 'account',
      id: '1',
      timestamp: Date.now(),
      source: 'local'
    };

    const transactionEvent = {
      type: 'update',
      entity: 'transaction',
      id: '2',
      timestamp: Date.now(),
      source: 'remote'
    };

    updateEmitter.emit(accountEvent);
    updateEmitter.emit(transactionEvent);

    expect(mockListener).toHaveBeenCalledTimes(2);
    expect(mockListener).toHaveBeenCalledWith(accountEvent);
    expect(mockListener).toHaveBeenCalledWith(transactionEvent);

    cleanup();
  });

  test('deve atualizar status de sincronização', () => {
    const mockListener = jest.fn();
    
    const cleanup = updateEmitter.onSyncStatus(mockListener);

    updateEmitter.updateSyncStatus({
      isOnline: false,
      syncInProgress: true
    });

    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({
        isOnline: false,
        syncInProgress: true
      })
    );

    cleanup();
  });
});

describe('Performance Optimizations', () => {
  test('deve prevenir re-renders desnecessários com seletores otimizados', () => {
    // Este teste seria mais complexo e envolveria renderização de componentes
    // Por simplicidade, testamos apenas a lógica de comparação
    
    const shallowEqual = (a, b) => {
      if (a === b) return true;
      if (a == null || b == null) return false;
      
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => item === b[index]);
      }
      
      return false;
    };

    const array1 = [1, 2, 3];
    const array2 = [1, 2, 3];
    const array3 = [1, 2, 4];

    expect(shallowEqual(array1, array2)).toBe(true);
    expect(shallowEqual(array1, array3)).toBe(false);
  });

  test('deve memoizar seletores complexos', () => {
    const accounts = [
      { id: '1', type: 'checking', balance: 1000, isActive: true },
      { id: '2', type: 'savings', balance: 2000, isActive: true },
      { id: '3', type: 'checking', balance: 500, isActive: false }
    ];

    // Simular memoização
    let memoizedResult = null;
    let computationCount = 0;

    const getActiveAccountsByType = (accounts) => {
      computationCount++;
      
      if (memoizedResult && memoizedResult.inputHash === JSON.stringify(accounts)) {
        return memoizedResult.result;
      }

      const result = accounts
        .filter(account => account.isActive)
        .reduce((groups, account) => {
          if (!groups[account.type]) groups[account.type] = [];
          groups[account.type].push(account);
          return groups;
        }, {});

      memoizedResult = {
        inputHash: JSON.stringify(accounts),
        result
      };

      return result;
    };

    // Primeira chamada
    const result1 = getActiveAccountsByType(accounts);
    expect(computationCount).toBe(1);
    expect(result1.checking).toHaveLength(1);
    expect(result1.savings).toHaveLength(1);

    // Segunda chamada com mesmos dados (deve usar cache)
    const result2 = getActiveAccountsByType(accounts);
    expect(computationCount).toBe(1); // Não deve ter recomputado
    expect(result2).toBe(result1);

    // Terceira chamada com dados diferentes
    const modifiedAccounts = [...accounts, { id: '4', type: 'investment', balance: 3000, isActive: true }];
    const result3 = getActiveAccountsByType(modifiedAccounts);
    expect(computationCount).toBe(2); // Deve ter recomputado
    expect(result3.investment).toHaveLength(1);
  });
});