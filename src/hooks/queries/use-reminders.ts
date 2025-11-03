import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  category: string;
  priority: string;
  status: string;
  recurring: boolean;
  frequency?: string;
  amount?: number;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export function useReminders(status?: string) {
  return useQuery({
    queryKey: ['reminders', status],
    queryFn: async (): Promise<{ data: Reminder[] }> => {
      const url = status && status !== 'all'
        ? `/api/reminders?status=${status}`
        : '/api/reminders';

      const response = await fetch(url, { credentials: 'include' });

      if (!response.ok) {
        throw new Error('Erro ao buscar lembretes');
      }

      const result = await response.json();
      return { data: result.data || [] };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Reminder>) => {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erro ao criar lembrete');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Lembrete criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar lembrete');
    }
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Reminder> & { id: string }) => {
      const response = await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar lembrete');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Lembrete atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar lembrete');
    }
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/reminders?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir lembrete');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Lembrete excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir lembrete');
    }
  });
}
