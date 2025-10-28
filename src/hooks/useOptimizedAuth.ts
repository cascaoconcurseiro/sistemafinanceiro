/**
 * 🚀 Optimized Authentication Hook
 * High-performance auth hook with intelligent caching and silent refresh
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { authCache } from '@/lib/performance/auth-cache';

interface User {
  userId: string;
  email: string;
  permissions: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
}

export function useOptimizedAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const isRefreshingRef = useRef(false);

  /**
   * Initialize auth state from cache
   */
  const initializeAuth = useCallback(async () => {
    try {
      // Check cache first (fast)
      const isAuth = authCache.isAuthenticated();
      const userInfo = authCache.getUserInfo();

      if (isAuth && userInfo) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: userInfo,
          error: null
        });

        // Schedule token refresh if needed
        scheduleTokenRefresh();
        return;
      }

      // Validate with server if cache is empty/invalid
      const validation = await authCache.validateAuth();
      
      setState({
        isAuthenticated: validation.isValid,
        isLoading: false,
        user: validation.user || null,
        error: null
      });

      if (validation.isValid) {
        scheduleTokenRefresh();
      }

    } catch (error) {
      console.error('Auth initialization failed:', error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: 'Authentication check failed'
      });
    }
  }, []);

  /**
   * Schedule automatic token refresh
   */
  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const timeUntilExpiry = authCache.getTimeUntilExpiry();
    const refreshTime = Math.max(0, timeUntilExpiry - (10 * 60 * 1000)); // 10 minutes before expiry

    refreshTimeoutRef.current = setTimeout(async () => {
      if (!isRefreshingRef.current) {
        await refreshToken();
      }
    }, refreshTime);
  }, []);

  /**
   * Login with credentials
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success && data.accessToken) {
        // Cache tokens
        authCache.setToken(data.accessToken, data.refreshToken, data.expiresIn || 3600);
        
        const userInfo = authCache.getUserInfo();
        
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: userInfo,
          error: null
        });

        scheduleTokenRefresh();
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Login failed'
        }));
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Network error during login'
      }));
      return false;
    }
  }, [scheduleTokenRefresh]);

  /**
   * Logout and clear all auth data
   */
  const logout = useCallback(() => {
    // Clear timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Clear cache
    authCache.clearCache();

    // Update state
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null
    });

    // Call logout API to invalidate server session
    fetch('/api/auth/logout', { method: 'POST' }).catch(console.warn);

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }, []);

  /**
   * Refresh token silently
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return false;
    }

    isRefreshingRef.current = true;

    try {
      const success = await authCache.refreshTokenSilently();
      
      if (success) {
        const userInfo = authCache.getUserInfo();
        setState(prev => ({
          ...prev,
          user: userInfo,
          isAuthenticated: true
        }));
        
        scheduleTokenRefresh();
        return true;
      } else {
        // Refresh failed, logout user
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [logout, scheduleTokenRefresh]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();

    // Listen for session expiry events
    const handleSessionExpired = () => {
      logout();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:session-expired', handleSessionExpired);
      
      return () => {
        window.removeEventListener('auth:session-expired', handleSessionExpired);
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    }
  }, [initializeAuth, logout]);

  // Auto-refresh on focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (state.isAuthenticated && authCache.needsRefresh()) {
        refreshToken();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [state.isAuthenticated, refreshToken]);

  return {
    ...state,
    login,
    logout,
    refreshToken,
    clearError
  };
}