'use client';

import React, { createContext, useContext } from 'react';
import { useAuth as useAuthHook, type User } from '@/hooks/useAuth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  error?: string;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function EnhancedAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuthHook();

  const value: AuthContextType = {
    user: auth.user,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    login: auth.login,
    logout: auth.logout,
    updateUser: auth.updateUser,
    error: auth.error,
    clearError: auth.clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an EnhancedAuthProvider');
  }
  return context;
}
