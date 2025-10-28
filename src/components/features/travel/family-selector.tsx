'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Plus, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useFamilyMembers } from '../../../hooks/queries/use-family-members';
import { FamilyMemberForm } from '../family/family-member-form';

interface FamilySelectorProps {
  selectedMembers: string[];
  onSelectionChange: (memberIds: string[]) => void;
  maxSelection?: number;
  allowAddNew?: boolean;
}

export function FamilySelector({
  selectedMembers,
  onSelectionChange,
  maxSelection,
  allowAddNew = true,
}: FamilySelectorProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  // Usar API unificada
  const { data: familyMembersData, isLoading } = useFamilyMembers();
  const members = familyMembersData?.data || [];

  const toggleMemberSelection = (memberId: string) => {
    const isSelected = selectedMembers.includes(memberId);

    if (!isSelected && maxSelection && selectedMembers.length >= maxSelection) {
      toast.error(`Máximo de ${maxSelection} membros podem ser selecionados`);
      return;
    }

    const newSelection = isSelected
      ? selectedMembers.filter((id) => id !== memberId)
      : [...selectedMembers, memberId];

    onSelectionChange(newSelection);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedCount = selectedMembers.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <Label className="text-base font-medium">Membros da Família</Label>
          {selectedCount > 0 && (
            <Badge variant="secondary">
              {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {allowAddNew && (
          <FamilyMemberForm
            open={showAddForm}
            onOpenChange={setShowAddForm}
            trigger={
              <Button type="button" variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            }
          />
        )}
      </div>

      {/* Lista de membros */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Carregando membros...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum membro cadastrado</p>
            <p className="text-sm">
              Adicione membros da família para incluir na viagem
            </p>
          </div>
        ) : (
          members.map((member) => {
            const isSelected = selectedMembers.includes(member.id);
            const isChild = member.relationship === 'child';

            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => toggleMemberSelection(member.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    className={
                      isChild
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }
                  >
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    <Badge
                      variant={isChild ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {isChild ? 'Criança' : 'Adulto'}
                    </Badge>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selecionado
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {member.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {maxSelection && (
        <div className="text-sm text-muted-foreground">
          Máximo de {maxSelection} membros podem ser selecionados
        </div>
      )}
    </div>
  );
}

export default FamilySelector;
