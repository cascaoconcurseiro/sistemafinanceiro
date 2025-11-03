'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    currency: string;
    language: string;
  };
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string;
}

// 🔒 HOOK DE AUTENTICAÇÃO OTIMIZADO
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  // 🔒 CARREGAR AUTENTICAÇÃO OTIMIZADA - Evita conflitos com AuthGuard
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Verificar se tem token antes de fazer requisição
        const hasToken = typeof document !== 'undefined' && document.cookie.includes('access_token');

        if (!hasToken) {
          if (isMounted) {
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false
            });
          }
          return;
        }

        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-cache'
        });

        if (!isMounted) return;

        const result = await response.json();

        if (result.success && result.user) {
          setAuthState({
            user: result.user,
            isLoading: false,
            isAuthenticated: true
          });
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          });
        }
      } catch (error) {
        console.error('Erro ao carregar autenticação:', error);
        if (isMounted) {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: 'Erro ao carregar autenticação'
          });
        }
      }
    };

    // Pequeno delay para evitar conflito com AuthGuard
    const timeoutId = setTimeout(initAuth, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success && result.data?.user) {
        setAuthState({
          user: result.data.user,
          isLoading: false,
          isAuthenticated: true
        });
        return { success: true };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Erro no login'
        }));
        return { success: false, error: result.error || 'Erro no login' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no login';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
        return { success: true };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Erro no logout'
        }));
        return { success: false, error: result.error || 'Erro no logout' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no logout';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!authState.user) return { success: false, error: 'Usuário não autenticado' };

    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // TODO: Implementar atualização de usuário via banco de dados
      console.log('Atualização de usuário deve ser implementada via banco de dados');

      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
        isLoading: false
      }));

      return { success: true };
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar usuário'
      }));
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao atualizar usuário' };
    }
  }, [authState.user]);

  const refreshUser = useCallback(async () => {
    if (!authState.isAuthenticated) return;

    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // TODO: Implementar refresh de usuário via banco de dados
      console.log('Refresh de usuário deve ser implementado via banco de dados');

      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar dados do usuário'
      }));
    }
  }, [authState.isAuthenticated]);

  return {
    ...authState,
    login,
    logout,
    updateUser,
    refreshUser
  };
};

// Implementar autenticação real via banco de dados
// TODO: Implementar sistema de autenticação completo com JWT/sessions
