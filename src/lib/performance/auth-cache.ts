/**
 * 🚀 Smart Authentication Cache System
 * Intelligent caching for authentication to reduce server calls and improve UX
 */

import jwt from 'jsonwebtoken';

interface AuthCacheData {
  token: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email: string;
  lastValidated: number;
  permissions: string[];
}

interface AuthValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  user?: {
    userId: string;
    email: string;
    permissions: string[];
  };
}

class AuthCacheService {
  private cache: Map<string, AuthCacheData> = new Map();
  private readonly CACHE_KEY = 'auth_session';
  private readonly VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly REFRESH_THRESHOLD = 10 * 60 * 1000; // 10 minutes before expiry
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'sua-grana-secret-key';

  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    refreshes: 0,
    validations: 0
  };

  constructor() {
    // Load from localStorage on client side
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * Set authentication data in cache
   */
  setToken(token: string, refreshToken: string, expiresIn: number): void {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded) {
        throw new Error('Invalid token format');
      }

      const authData: AuthCacheData = {
        token,
        refreshToken,
        expiresAt: Date.now() + (expiresIn * 1000),
        userId: decoded.userId || decoded.sub,
        email: decoded.email,
        lastValidated: Date.now(),
        permissions: decoded.permissions || []
      };

      this.cache.set(this.CACHE_KEY, authData);
      this.saveToStorage();

      console.log('🔐 Auth cache updated for user:', decoded.email);
    } catch (error) {
      console.error('Failed to cache auth data:', error);
    }
  }

  /**
   * Get valid token from cache (returns null if expired or invalid)
   */
  getValidToken(): string | null {
    const authData = this.cache.get(this.CACHE_KEY);

    if (!authData) {
      this.stats.misses++;
      return null;
    }

    // Check if token is expired
    if (Date.now() >= authData.expiresAt) {
      this.stats.misses++;
      this.clearCache();
      return null;
    }

    this.stats.hits++;
    return authData.token;
  }

  /**
   * Check if user is authenticated without server call
   */
  isAuthenticated(): boolean {
    const authData = this.cache.get(this.CACHE_KEY);

    if (!authData) {
      return false;
    }

    // Check if token is expired
    if (Date.now() >= authData.expiresAt) {
      this.clearCache();
      return false;
    }

    // Check if we need to validate with server (every 5 minutes)
    const needsValidation = Date.now() - authData.lastValidated > this.VALIDATION_INTERVAL;

    if (needsValidation) {
      // Validate in background without blocking
      this.validateSessionBackground();
    }

    return true;
  }

  /**
   * Validate authentication with comprehensive checks
   */
  async validateAuth(): Promise<AuthValidationResult> {
    const authData = this.cache.get(this.CACHE_KEY);

    if (!authData) {
      return { isValid: false, needsRefresh: false };
    }

    // Check if token is expired
    if (Date.now() >= authData.expiresAt) {
      this.clearCache();
      return { isValid: false, needsRefresh: true };
    }

    // Check if token needs refresh soon
    const needsRefresh = Date.now() >= (authData.expiresAt - this.REFRESH_THRESHOLD);

    // Verify token signature
    try {
      const decoded = jwt.verify(authData.token, this.JWT_SECRET) as any;

      // Update last validated time
      authData.lastValidated = Date.now();
      this.cache.set(this.CACHE_KEY, authData);
      this.saveToStorage();

      this.stats.validations++;

      return {
        isValid: true,
        needsRefresh,
        user: {
          userId: decoded.userId || decoded.sub,
          email: decoded.email,
          permissions: decoded.permissions || []
        }
      };
    } catch (error) {
      console.warn('Token validation failed:', error);
      this.clearCache();
      return { isValid: false, needsRefresh: true };
    }
  }

  /**
   * Refresh token silently in background
   */
  async refreshTokenSilently(): Promise<boolean> {
    const authData = this.cache.get(this.CACHE_KEY);

    if (!authData || !authData.refreshToken) {
      return false;
    }

    try {
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
        throw new Error('Refresh failed');
      }

      const data = await response.json();

      if (data.success && data.accessToken) {
        this.setToken(data.accessToken, data.refreshToken || authData.refreshToken, data.expiresIn || 3600);
        this.stats.refreshes++;
                return true;
      }

      return false;
    } catch (error) {
      console.warn('Silent token refresh failed:', error);
      this.clearCache();
      return false;
    }
  }

  /**
   * Validate session in background without blocking UI
   */
  private validateSessionBackground(): void {
    // Use setTimeout to avoid blocking
    setTimeout(async () => {
      try {
        const result = await this.validateAuth();

        if (!result.isValid) {
          // Try to refresh token
          const refreshed = await this.refreshTokenSilently();

          if (!refreshed) {
            // Emit event for components to handle logout
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:session-expired'));
            }
          }
        } else if (result.needsRefresh) {
          // Proactively refresh token
          this.refreshTokenSilently();
        }
      } catch (error) {
        console.warn('Background session validation failed:', error);
      }
    }, 0);
  }

  /**
   * Get user info from cache
   */
  getUserInfo(): { userId: string; email: string; permissions: string[] } | null {
    const authData = this.cache.get(this.CACHE_KEY);

    if (!authData || Date.now() >= authData.expiresAt) {
      return null;
    }

    return {
      userId: authData.userId,
      email: authData.email,
      permissions: authData.permissions
    };
  }

  /**
   * Clear authentication cache
   */
  clearCache(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_cache');
      sessionStorage.removeItem('auth_cache');
    }
    console.log('🗑️ Auth cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): typeof this.stats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('auth_cache') || sessionStorage.getItem('auth_cache');

      if (stored) {
        const authData: AuthCacheData = JSON.parse(stored);

        // Check if stored data is still valid
        if (Date.now() < authData.expiresAt) {
          this.cache.set(this.CACHE_KEY, authData);
          console.log('🔐 Auth cache loaded from storage');
        } else {
          // Clean up expired data
          localStorage.removeItem('auth_cache');
          sessionStorage.removeItem('auth_cache');
        }
      }
    } catch (error) {
      console.warn('Failed to load auth cache from storage:', error);
      // Clean up corrupted data
      localStorage.removeItem('auth_cache');
      sessionStorage.removeItem('auth_cache');
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const authData = this.cache.get(this.CACHE_KEY);

      if (authData) {
        const serialized = JSON.stringify(authData);

        // Use localStorage for persistent sessions, sessionStorage for temporary
        if (authData.refreshToken) {
          localStorage.setItem('auth_cache', serialized);
        } else {
          sessionStorage.setItem('auth_cache', serialized);
        }
      }
    } catch (error) {
      console.warn('Failed to save auth cache to storage:', error);
    }
  }

  /**
   * Check if token needs refresh soon
   */
  needsRefresh(): boolean {
    const authData = this.cache.get(this.CACHE_KEY);

    if (!authData) {
      return false;
    }

    return Date.now() >= (authData.expiresAt - this.REFRESH_THRESHOLD);
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry(): number {
    const authData = this.cache.get(this.CACHE_KEY);

    if (!authData) {
      return 0;
    }

    return Math.max(0, authData.expiresAt - Date.now());
  }

  /**
   * Print cache statistics (for debugging)
   */
  printStats(): void {
    const stats = this.getStats();
        console.log(`   Hits: ${stats.hits}`);
    console.log(`   Misses: ${stats.misses}`);
    console.log(`   Hit Rate: ${stats.hitRate}%`);
    console.log(`   Refreshes: ${stats.refreshes}`);
    console.log(`   Validations: ${stats.validations}`);
  }
}

// Singleton instance
export const authCache = new AuthCacheService();

// Export for use in other modules
export default AuthCacheService;
