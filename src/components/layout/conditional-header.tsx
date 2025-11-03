'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HeaderWithLogout } from './header-with-logout';

interface User {
  id: string;
  name: string;
  email: string;
}

export function ConditionalHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Páginas que não devem mostrar o header
  const publicPages = ['/auth/login', '/auth/register'];
  const shouldShowHeader = !publicPages.includes(pathname);

  useEffect(() => {
    if (!shouldShowHeader) {
      setLoading(false);
      return;
    }

    // Buscar informações do usuário
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [shouldShowHeader, pathname]);

  // Não mostrar header em páginas públicas
  if (!shouldShowHeader) {
    return null;
  }

  // Mostrar loading apenas se estiver carregando
  if (loading) {
    return (
      <div className="h-16 bg-white dark:bg-gray-900 border-b flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <HeaderWithLogout
      userName={user?.name}
      userEmail={user?.email}
    />
  );
}
