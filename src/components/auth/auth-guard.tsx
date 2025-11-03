'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 🔒 AUTHGUARD - Proteção de Rotas
 *
 * Componente que protege páginas verificando autenticação.
 * Agora com validação mais robusta e melhor tratamento de erros.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // 🔒 SEGURANÇA: Verificar token via API (mais seguro que apenas checar cookie)
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();

          if (data.user && data.user.id) {
                        setIsAuthenticated(true);
            setLoading(false);
          } else {
                        router.replace('/auth/login');
          }
        } else {
          // Token inválido ou expirado
          
          // Limpar cookies antigos
          if (typeof document !== 'undefined') {
            document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          }

          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('❌ [AuthGuard] Erro na verificação:', error);
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
          <p className="mt-4 text-gray-600">🔒 Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
