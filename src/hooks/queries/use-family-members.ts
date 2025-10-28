import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: Date | string | null;
  avatar?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateFamilyMemberInput {
  name: string;
  relationship: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  avatar?: string | null;
  notes?: string | null;
}

export interface UpdateFamilyMemberInput extends Partial<CreateFamilyMemberInput> {
  isActive?: boolean;
}

// Hook para listar membros da família
export function useFamilyMembers() {
  return useQuery({
    queryKey: ['family-members'],
    queryFn: async (): Promise<FamilyMember[]> => {
      const response = await fetch('/api/family-members', {
        credentials: 'include',
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      // ✅ CORREÇÃO: API retorna array direto, não { data: [] }
      const members = await response.json();
      return Array.isArray(members) ? members : [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para criar membro da família
export function useCreateFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFamilyMemberInput) => {
      const response = await fetch('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar membro');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Membro da família adicionado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao adicionar membro');
    },
  });
}

// Hook para atualizar membro da família
export function useUpdateFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFamilyMemberInput }) => {
      const response = await fetch(`/api/family-members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar membro');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Membro atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar membro');
    },
  });
}

// Hook para deletar membro da família
export function useDeleteFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/family-members/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover membro');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Membro removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover membro');
    },
  });
}
