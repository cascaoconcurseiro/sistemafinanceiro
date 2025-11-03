'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function ReminderChecker() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Verificar lembretes ao carregar
    const checkReminders = async () => {
      try {
        const response = await fetch('/api/reminders/check-overdue', {
          credentials: 'include'
        });

        // ✅ Ignorar silenciosamente erros 401 (não autenticado)
        if (response.status === 401) {
          return;
        }

        if (response.ok) {
          // Invalidar queries para atualizar dados
          queryClient.invalidateQueries({ queryKey: ['reminders'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      } catch (error) {
        // Ignorar erros de rede silenciosamente
        // console.error('Erro ao verificar lembretes:', error);
      }
    };

    checkReminders();

    // Verificar a cada 1 minuto (mais responsivo)
    const interval = setInterval(checkReminders, 60 * 1000);

    return () => clearInterval(interval);
  }, [queryClient]);

  return null;
}
