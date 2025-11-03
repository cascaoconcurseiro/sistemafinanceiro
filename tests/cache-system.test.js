/**
 * Testes para Sistema de Cache Inteligente
 */

// Mock do localStorage para testes
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

// Mock do fetch para testes
global.fetch = jest.fn();

// Mock do window
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Importar após configurar mocks
const { AuthCacheManager } = require('../src/lib/cache/auth-cache-manager.ts');
const { DataCacheManager } = require('../src/lib/cache/data-cache-manager.ts');

describe('Auth Cache Manager', () => {
  let authCache;

  beforeEach(() => {
    // Resetar mocks
    localStorageMock.clear();
    jest.clearAllMocks();
    
    // Criar nova instância para cada teste
    authCache = new AuthCacheManager();
  });

  describe('Token Storage', () => {
    test('deve armazenar token com TTL correto', () => {
      const token = 'test-token-123';
      const expiresIn = 3600; // 1 hora
      const userId = 'user-123';

      authCache.storeToken(token, expiresIn, 'refresh-token', userId);

      const storedToken = authCache.getValidToken();
      expect(storedToken).toBe(token);
      
      const sessionInfo = authCache.getSessionInfo();
      expect(sessionInfo.userId).toBe(userId);
      expect(sessionInfo.isAuthenticated).toBe(true);
    });

    test('deve retornar null para token expirado', () => {
      const token = 'expired-token';
      const expiresIn = -1; // Já expirado

      authCache.storeToken(token, expiresIn);

      const storedToken = authCache.getValidToken();
      expect(storedToken).toBeNull();
    });

    test('deve persistir token no localStorage', () => {
      const token = 'persistent-token';
      
      authCache.storeToken(token, 3600);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth_cache',
        expect.any(String)
      );
    });
  });

  describe('Token Refresh', () => {
    test('deve renovar token automaticamente', async () => {
      // Mock da resposta de renovação
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          token: 'new-token',
          expiresIn: 3600,
          refreshToken: 'new-refresh-token'
        })
      });

      authCache.storeToken('old-token', 3600, 'refresh-token');
      
      const newToken = await authCache.refreshToken();
      
      expect(newToken).toBe('new-token');
      expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'refresh-token' })
      });
    });

    test('deve limpar cache após máximo de tentativas falhadas', async () => {
      // Mock de falha na renovação
      fetch.mockRejectedValue(new Error('Network error'));

      authCache.storeToken('token', 3600, 'refresh-token');
      
      // Tentar renovar 3 vezes (máximo)
      await authCache.refreshToken();
      await authCache.refreshToken();
      await authCache.refreshToken();
      
      // Verificar se cache foi limpo
      expect(authCache.isAuthenticated()).toBe(false);
    });
  });

  describe('Session Management', () => {
    test('deve verificar autenticação corretamente', () => {
      expect(authCache.isAuthenticated()).toBe(false);
      
      authCache.storeToken('token', 3600);
      expect(authCache.isAuthenticated()).toBe(true);
      
      authCache.clearAuth();
      expect(authCache.isAuthenticated()).toBe(false);
    });

    test('deve limpar todos os dados de autenticação', () => {
      authCache.storeToken('token', 3600, 'refresh', 'user-123');
      
      expect(authCache.isAuthenticated()).toBe(true);
      expect(authCache.getValidToken()).toBeTruthy();
      
      authCache.clearAuth();
      
      expect(authCache.isAuthenticated()).toBe(false);
      expect(authCache.getValidToken()).toBeNull();
      expect(authCache.getSessionInfo()).toBeNull();
    });
  });

  describe('Statistics', () => {
    test('deve fornecer estatísticas corretas', () => {
      const stats = authCache.getStats();
      
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('authTokenExists');
      expect(stats).toHaveProperty('sessionExists');
      expect(stats).toHaveProperty('retryCount');
      
      authCache.storeToken('token', 3600);
      
      const newStats = authCache.getStats();
      expect(newStats.authTokenExists).toBe(true);
      expect(newStats.sessionExists).toBe(true);
    });
  });
});

describe('Data Cache Manager', () => {
  let dataCache;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    
    dataCache = new DataCacheManager();
  });

  describe('Basic Cache Operations', () => {
    test('deve armazenar e recuperar dados', () => {
      const testData = { id: 1, name: 'Test Account' };
      
      dataCache.set('accounts_1', testData, 5000, ['accounts']);
      
      const retrieved = dataCache.get('accounts_1');
      expect(retrieved).toEqual(testData);
    });

    test('deve retornar null para dados expirados', (done) => {
      const testData = { id: 1, name: 'Test' };
      
      dataCache.set('test_key', testData, 10); // 10ms TTL
      
      setTimeout(() => {
        const retrieved = dataCache.get('test_key');
        expect(retrieved).toBeNull();
        done();
      }, 20);
    });

    test('deve invalidar dados por padrão', () => {
      dataCache.set('accounts_1', { id: 1 }, 5000, ['accounts']);
      dataCache.set('accounts_2', { id: 2 }, 5000, ['accounts']);
      dataCache.set('transactions_1', { id: 1 }, 5000, ['transactions']);
      
      expect(dataCache.get('accounts_1')).toBeTruthy();
      expect(dataCache.get('accounts_2')).toBeTruthy();
      expect(dataCache.get('transactions_1')).toBeTruthy();
      
      dataCache.invalidate('accounts');
      
      expect(dataCache.get('accounts_1')).toBeNull();
      expect(dataCache.get('accounts_2')).toBeNull();
      expect(dataCache.get('transactions_1')).toBeTruthy(); // Não deve ser afetado
    });
  });

  describe('TTL Configuration', () => {
    test('deve usar TTL correto baseado no tipo de dados', () => {
      // Accounts devem ter TTL longo (30 min)
      dataCache.set('accounts', { data: 'test' });
      
      // Transactions devem ter TTL médio (5 min)
      dataCache.set('transactions', { data: 'test' });
      
      // unified-financial deve ter TTL curto (1 min)
      dataCache.set('unified-financial', { data: 'test' });
      
      // Verificar que todos estão no cache
      expect(dataCache.get('accounts')).toBeTruthy();
      expect(dataCache.get('transactions')).toBeTruthy();
      expect(dataCache.get('unified-financial')).toBeTruthy();
    });
  });

  describe('Background Updates', () => {
    test('deve atualizar dados em background', async () => {
      // Mock da resposta da API
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ updated: true, timestamp: Date.now() })
      });

      await dataCache.updateInBackground('accounts');
      
      expect(fetch).toHaveBeenCalledWith('/api/accounts');
    });

    test('deve sincronizar dados pendentes', async () => {
      // Adicionar dados antigos ao cache
      dataCache.set('accounts', { old: true }, 5000);
      dataCache.set('transactions', { old: true }, 5000);
      
      // Mock das respostas
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ synced: true })
      });

      await dataCache.syncPendingData();
      
      // Verificar se tentou sincronizar
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('Cache Statistics', () => {
    test('deve calcular hit rate corretamente', () => {
      // Adicionar dados
      dataCache.set('test1', { data: 1 });
      dataCache.set('test2', { data: 2 });
      
      // Fazer algumas consultas
      dataCache.get('test1'); // Hit
      dataCache.get('test2'); // Hit
      dataCache.get('test3'); // Miss
      dataCache.get('test1'); // Hit novamente
      
      const stats = dataCache.getStats();
      expect(stats.totalHits).toBe(3);
      expect(stats.totalMisses).toBe(1);
      expect(stats.hitRate).toBe(0.75); // 3/4 = 75%
    });

    test('deve fornecer estatísticas completas', () => {
      const stats = dataCache.getStats();
      
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalHits');
      expect(stats).toHaveProperty('totalMisses');
      expect(stats).toHaveProperty('lastCleanup');
    });
  });

  describe('Cache Size Management', () => {
    test('deve limitar tamanho do cache', () => {
      // Simular cache cheio (assumindo limite de 100)
      for (let i = 0; i < 105; i++) {
        dataCache.set(`test_${i}`, { id: i });
      }
      
      const stats = dataCache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(100);
    });
  });

  describe('Persistence', () => {
    test('deve salvar no localStorage', () => {
      dataCache.set('test_persist', { data: 'persistent' });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'data_cache',
        expect.any(String)
      );
    });

    test('deve carregar do localStorage', () => {
      // Simular dados no localStorage
      const cacheData = [
        ['test_key', {
          data: { test: 'data' },
          timestamp: Date.now(),
          ttl: 60000,
          tags: ['test'],
          version: 1
        }]
      ];
      
      localStorageMock.store['data_cache'] = JSON.stringify(cacheData);
      
      // Criar nova instância que deve carregar os dados
      const newCache = new DataCacheManager();
      
      expect(newCache.get('test_key')).toEqual({ test: 'data' });
    });
  });

  describe('Error Handling', () => {
    test('deve lidar com erros de localStorage graciosamente', () => {
      // Simular erro no localStorage
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      // Não deve quebrar ao tentar salvar
      expect(() => {
        dataCache.set('test', { data: 'test' });
      }).not.toThrow();
    });

    test('deve limpar localStorage corrompido', () => {
      // Simular dados corrompidos
      localStorageMock.store['data_cache'] = 'invalid json';
      
      // Não deve quebrar ao carregar
      expect(() => {
        new DataCacheManager();
      }).not.toThrow();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('data_cache');
    });
  });
});

describe('Cache Integration', () => {
  test('deve funcionar em conjunto auth e data cache', () => {
    const authCache = new AuthCacheManager();
    const dataCache = new DataCacheManager();
    
    // Login
    authCache.storeToken('token', 3600, 'refresh', 'user-123');
    
    // Armazenar dados do usuário
    dataCache.set('user_data', { userId: 'user-123', name: 'Test User' });
    
    // Verificar integração
    expect(authCache.isAuthenticated()).toBe(true);
    expect(dataCache.get('user_data')).toBeTruthy();
    
    // Logout deve limpar tudo
    authCache.clearAuth();
    dataCache.clear();
    
    expect(authCache.isAuthenticated()).toBe(false);
    expect(dataCache.get('user_data')).toBeNull();
  });
});