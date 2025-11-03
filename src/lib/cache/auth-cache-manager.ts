/**
 * Auth Cache Manager
 * 
 * Gerencia cache de autenticação com TTL de 24 horas,
 * renovação automática de tokens e fallback para múltiplas tentativas.
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  tags: string[];
}

interface AuthToken {
  token: string;
  expiresAt: number;
  refreshToken?: string;
  userId?: string;
}

export class AuthCacheManager {
  private static instance: AuthCacheManager;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly AUTH_KEY = 'auth_token';
  private readonly SESSION_KEY = 'auth_session';
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 horas
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private retryCount = 0;

  private constructor() {
    this.loadFromStorage();
    this.startCleanupInterval();
  }

  static getInstance(): AuthCacheManager {
    if (!AuthCacheManager.instance) {
      AuthCacheManager.instance = new AuthCacheManager();
    }
    return AuthCacheManager.instance;
  }

  /**
   * Armazena token de autenticação com TTL
   */
  storeToken(token: string, expiresIn: number, refreshToken?: string, userId?: string): void {
    const expiresAt = Date.now() + (expiresIn * 1000);
    
    const authToken: AuthToken = {
      token,
      expiresAt,
      refreshToken,
      userId
    };

    this.set(this.AUTH_KEY, authToken, this.DEFAULT_TTL, ['auth']);
    
    // Armazenar informações de sessão separadamente
    this.set(this.SESSION_KEY, {
      isAuthenticated: true,
      userId,
      loginTime: Date.now()
    }, this.DEFAULT_TTL, ['session']);

    console.log('🔐 [AuthCache] Token armazenado com TTL de 24h');
    this.saveToStorage();
  }

  /**
   * Obtém token válido ou null se expirado
   */
  getValidToken(): string | null {
    const authData = this.get(this.AUTH_KEY) as AuthToken;
    
    if (!authData) {
      console.log('🔐 [AuthCache] Nenhum token encontrado');
      return null;
    }

    // Verificar se token ainda é válido
    if (Date.now() >= authData.expiresAt) {
      console.log('🔐 [AuthCache] Token expirado, tentando renovar...');
      
      // Tentar renovar automaticamente
      if (authData.refreshToken) {
        this.refreshTokenAsync(authData.refreshToken);
      }
      
      return null;
    }

    console.log('🔐 [AuthCache] Token válido encontrado');
    return authData.token;
  }

  /**
   * Verifica se usuário está autenticado (sem verificar token)
   */
  isAuthenticated(): boolean {
    const sessionData = this.get(this.SESSION_KEY);
    return sessionData?.isAuthenticated === true;
  }

  /**
   * Obtém informações da sessão
   */
  getSessionInfo(): { userId?: string; loginTime?: number } | null {
    const sessionData = this.get(this.SESSION_KEY);
    return sessionData || null;
  }

  /**
   * Renova token automaticamente
   */
  async refreshToken(): Promise<string | null> {
    const authData = this.get(this.AUTH_KEY) as AuthToken;
    
    if (!authData?.refreshToken) {
      console.log('🔐 [AuthCache] Nenhum refresh token disponível');
      return null;
    }

    try {
      console.log('🔐 [AuthCache] Renovando token...');
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: authData.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na renovação: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        // Armazenar novo token
        this.storeToken(
          data.token, 
          data.expiresIn || 3600, 
          data.refreshToken || authData.refreshToken,
          authData.userId
        );
        
        this.retryCount = 0; // Reset contador de tentativas
        console.log('🔐 [AuthCache] Token renovado com sucesso');
        return data.token;
      }

      throw new Error('Resposta inválida do servidor');

    } catch (error) {
      console.error('🔐 [AuthCache] Erro ao renovar token:', error);
      
      this.retryCount++;
      
      // Se excedeu tentativas, limpar cache e redirecionar
      if (this.retryCount >= this.MAX_RETRY_ATTEMPTS) {
        console.log('🔐 [AuthCache] Máximo de tentativas excedido, fazendo logout');
        this.clearAuth();
        this.redirectToLogin();
      }
      
      return null;
    }
  }

  /**
   * Renova token de forma assíncrona (não bloqueia)
   */
  private refreshTokenAsync(refreshToken: string): void {
    // Executar renovação em background
    setTimeout(() => {
      this.refreshToken().catch(error => {
        console.error('🔐 [AuthCache] Erro na renovação assíncrona:', error);
      });
    }, 100);
  }

  /**
   * Limpa dados de autenticação
   */
  clearAuth(): void {
    this.invalidate('auth');
    this.invalidate('session');
    this.retryCount = 0;
    this.saveToStorage();
    console.log('🔐 [AuthCache] Cache de autenticação limpo');
  }

  /**
   * Redireciona para login após falhas
   */
  private redirectToLogin(): void {
    // Evitar redirecionamento se já estiver na página de login
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      console.log('🔐 [AuthCache] Redirecionando para login...');
      window.location.href = '/login?reason=session_expired';
    }
  }

  /**
   * Métodos base de cache
   */
  set(key: string, data: any, ttl?: number, tags: string[] = []): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
      tags
    };
    
    this.cache.set(key, entry);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      // Invalidar por tag ou padrão de chave
      if (entry.tags.includes(pattern) || key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Persistência no localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('auth_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('🔐 [AuthCache] Erro ao salvar no localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('auth_cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        this.cache = new Map(cacheData);
        
        // Limpar entradas expiradas
        this.cleanup();
      }
    } catch (error) {
      console.error('🔐 [AuthCache] Erro ao carregar do localStorage:', error);
      localStorage.removeItem('auth_cache');
    }
  }

  /**
   * Limpeza automática de entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🔐 [AuthCache] Limpeza: ${keysToDelete.length} entradas expiradas removidas`);
      this.saveToStorage();
    }
  }

  private startCleanupInterval(): void {
    // Limpeza a cada 5 minutos
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Estatísticas do cache
   */
  getStats(): {
    totalEntries: number;
    authTokenExists: boolean;
    sessionExists: boolean;
    retryCount: number;
  } {
    return {
      totalEntries: this.cache.size,
      authTokenExists: this.cache.has(this.AUTH_KEY),
      sessionExists: this.cache.has(this.SESSION_KEY),
      retryCount: this.retryCount
    };
  }
}

// Instância singleton
export const authCache = AuthCacheManager.getInstance();