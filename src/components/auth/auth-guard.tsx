'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

// 🔒 AUTHGUARD SIMPLIFICADO - Sem loops
export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        // Verificação simples de token
        const hasToken = typeof document !== 'undefined' && document.cookie.includes('access_token');
        
        if (!hasToken) {
          if (isMounted) {
            console.log('❌ Sem token, redirecionando para login');
            router.replace('/auth/login');
          }
          return;
        }

        // Token existe, considerar autenticado
        if (isMounted) {
          console.log('✅ Token encontrado, usuário autenticado');
          setIsAuthenticated(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro na verificação de autenticação:', error);
        if (isMounted) {
          router.replace('/auth/login');
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}