'use client';

import { useEffect } from 'react';

/**
 * Componente que intercepta requisições e detecta tokens inválidos
 * Força logout automático quando necessário
 */
export function AuthInterceptor() {
  useEffect(() => {
    let isLoggingOut = false;

    // Interceptar fetch global
    const originalFetch = window.fetch;

    window.fetch = async function(...args: Parameters<typeof fetch>) {
      try {
        const response = await originalFetch.apply(this, args);

        // Se receber 401 com ação de force logout
        if (response.status === 401 && !isLoggingOut) {
          const clonedResponse = response.clone();

          try {
            const data = await clonedResponse.json();

            if (
              data.action === 'FORCE_LOGOUT' ||
              data.error === 'INVALID_USER_TOKEN' ||
              data.error === 'INVALID_TOKEN'
            ) {
              console.warn('🔐 Token inválido detectado. Forçando logout...');
              isLoggingOut = true;

              // Limpar cookies
              document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
              });

              // Limpar storage
              localStorage.clear();
              sessionStorage.clear();

              // Redirecionar para login
              window.location.href = '/auth/login?error=session_expired';
            }
          } catch (e) {
            // Se não conseguir parsear JSON, continuar normalmente
          }
        }

        return response;
      } catch (error) {
        throw error;
      }
    };

    
    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
