'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dados agora vêm do banco de dados, não do localStorage
    console.warn('session-provider - localStorage removido, use banco de dados');
    // Simular carregamento inicial sem localStorage
    setUser(null);
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // TODO: Implementar autenticação real via banco de dados
    console.warn('session signIn - Implementar autenticação real via banco de dados');
    
    // Por enquanto, retorna false até implementar autenticação real
    setUser(null);
    return false;
  };

  const signOut = () => {
    setUser(null);
    // Dados agora são removidos do banco de dados, não do localStorage
    console.warn('session signOut - localStorage removido, use banco de dados');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Manter compatibilidade com NextAuth
export const NextAuthProvider = AuthProvider;
