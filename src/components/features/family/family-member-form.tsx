'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import {
  useCreateFamilyMember,
  useUpdateFamilyMember,
  type FamilyMember,
  type CreateFamilyMemberInput,
} from '@/hooks/queries/use-family-members';

interface FamilyMemberFormProps {
  member?: FamilyMember;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FamilyMemberForm({ 
  member, 
  trigger, 
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange 
}: FamilyMemberFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateFamilyMemberInput>({
    name: '',
    relationship: 'adult',
    email: '',
    phone: '',
  });

  const createMutation = useCreateFamilyMember();
  const updateMutation = useUpdateFamilyMember();

  // Usar estado controlado se fornecido, senão usar estado interno
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        relationship: member.relationship || 'adult',
        email: member.email || '',
        phone: member.phone || '',
      });
    } else {
      setFormData({
        name: '',
        relationship: 'adult',
        email: '',
        phone: '',
      });
    }
  }, [member, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      return;
    }

    try {
      const data = {
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
      };

      if (member) {
        await updateMutation.mutateAsync({ id: member.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }

      setOpen(false);
      setFormData({
        name: '',
        relationship: 'adult',
        email: '',
        phone: '',
      });
      onSuccess?.();
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {member ? 'Editar Membro' : 'Gerenciar Membros da Família'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do membro"
                required
              />
            </div>

            <div>
              <Label htmlFor="relationship">Tipo</Label>
              <select
                id="relationship"
                value={formData.relationship}
                onChange={(e) =>
                  setFormData({ ...formData, relationship: e.target.value })
                }
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="adult">Adulto</option>
                <option value="child">Criança</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Salvando...' : member ? 'Atualizar' : 'Adicionar Membro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
