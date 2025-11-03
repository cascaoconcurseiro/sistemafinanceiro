'use client';

import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface InactivityLogoutProps {
  /**
   * Tempo de inatividade em minutos antes do logout
   * Padrão: 5 minutos
   */
  inactivityMinutes?: number;
  
  /**
   * Tempo de aviso antes do logout em segundos
   * Padrão: 30 segundos
   */
  warningSeconds?: number;
}

export function InactivityLogout({ 
  inactivityMinutes = 5, 
  warningSeconds = 30 
}: InactivityLogoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const inactivityMs = inactivityMinutes * 60 * 1000;
  const warningMs = warningSeconds * 1000;

  const resetTimer = () => {
    lastActivityRef.current = Date.now();

    // Limpar timers anteriores
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Timer de aviso (30 segundos antes do logout)
    warningTimeoutRef.current = setTimeout(() => {
      toast.warning('Sessão expirando!', {
        description: `Você será desconectado em ${warningSeconds} segundos por inatividade.`,
        duration: warningMs,
      });
    }, inactivityMs - warningMs);

    // Timer de logout
    timeoutRef.current = setTimeout(async () => {
      toast.error('Sessão expirada', {
        description: 'Você foi desconectado por inatividade.',
      });

      // Fazer logout
      await signOut({ 
        redirect: false,
        callbackUrl: '/login'
      });

      // Redirecionar para login
      router.push('/login');
    }, inactivityMs);
  };

  useEffect(() => {
    // Só ativar se estiver logado
    if (status !== 'authenticated') {
      return;
    }

    // Eventos que indicam atividade do usuário
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Resetar timer em qualquer atividade
    const handleActivity = () => {
      resetTimer();
    };

    // Adicionar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Iniciar timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [status, inactivityMs, warningMs, router]);

  return null; // Componente invisível
}
