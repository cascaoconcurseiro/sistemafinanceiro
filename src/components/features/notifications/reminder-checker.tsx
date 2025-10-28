'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function ReminderChecker() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Verificar lembretes ao carregar
    const checkReminders = async () => {
      try {
        await fetch('/api/reminders/check-overdue', {
          credentials: 'include'
        });
        
        // Invalidar queries para atualizar dados
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch (error) {
        console.error('Erro ao verificar lembretes:', error);
      }
    };

    checkReminders();

    // Verificar a cada 1 minuto (mais responsivo)
    const interval = setInterval(checkReminders, 60 * 1000);

    return () => clearInterval(interval);
  }, [queryClient]);

  return null;
}
