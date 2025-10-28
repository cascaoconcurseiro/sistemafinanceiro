'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { clientDatabaseService } from '@/lib/services/client-database-service';

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
    // Carregar sessão do usuário do banco de dados
    const loadUserSession = async () => {
      try {
        // TODO: Implementar busca de sessão ativa no databaseService
        // const currentUser = await clientDatabaseService.getCurrentUser();
        // setUser(currentUser);
        setUser(null); // Por enquanto, até implementar autenticação
      } catch (error) {
        console.error('Erro ao carregar sessão do usuário:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      // TODO: Implementar autenticação real via databaseService
      // const authenticatedUser = await clientDatabaseService.authenticateUser(email, password);
      // if (authenticatedUser) {
      //   setUser(authenticatedUser);
      //   return true;
      // }
      
      console.warn('session signIn - Implementar autenticação real via databaseService');
      setUser(null);
      return false;
    } catch (error) {
      console.error('Erro durante autenticação:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      // TODO: Implementar logout via databaseService
      // await clientDatabaseService.signOut();
      setUser(null);
      console.warn('session signOut - Implementar logout via databaseService');
    } catch (error) {
      console.error('Erro durante logout:', error);
    }
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
