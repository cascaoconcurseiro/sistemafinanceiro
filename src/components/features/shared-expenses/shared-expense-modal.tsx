'use client';

import React, { useState, useEffect } from 'react';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { Users, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useFamilyMembers } from '@/hooks/queries/use-family-members';
import { FamilyMemberForm } from '../family/family-member-form';

interface SharedExpenseModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function SharedExpenseModal({
  onClose,
  onSave,
}: SharedExpenseModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    account: '',
    date: new Date().toISOString().split('T')[0],
    splitType: 'equal',
    participants: [] as string[],
    newParticipant: '',
    newParticipantName: '',
    notes: '',
    isPaidByOther: false, // ✅ NOVO: Pago por outra pessoa
    paidBy: '', // ✅ NOVO: ID de quem pagou
  });

  const [isLoading, setIsLoading] = useState(false);

  // Buscar dados da API
  const { data: familyMembersData, isLoading: loadingMembers } = useFamilyMembers();
  const familyMembers = familyMembersData?.data || [];
  
  const { accounts, categories } = useUnifiedFinancial();

  // Fallback para categorias se não houver no contexto
  const availableCategories = categories.length > 0 ? categories : [
    { id: 'alimentacao', name: 'Alimentação' },
    { id: 'transporte', name: 'Transporte' },
    { id: 'hospedagem', name: 'Hospedagem' },
    { id: 'entretenimento', name: 'Entretenimento' },
    { id: 'compras', name: 'Compras' },
    { id: 'servicos', name: 'Serviços' },
    { id: 'outros', name: 'Outros' },
  ];

  // Filtrar apenas contas ativas
  const availableAccounts = accounts.filter(account => account.isActive !== false);

  const addParticipant = (identifier: string) => {
    if (!formData.participants.includes(identifier)) {
      setFormData({
        ...formData,
        participants: [...formData.participants, identifier],
      });
    }
  };

  const removeParticipant = (identifier: string) => {
    setFormData({
      ...formData,
      participants: formData.participants.filter((p) => p !== identifier),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const amount = Number.parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Por favor, insira um valor válido');
        return;
      }

      // ✅ Validação: Se pago por outra pessoa, precisa selecionar quem pagou
      if (formData.isPaidByOther && !formData.paidBy) {
        toast.error('Selecione quem pagou a despesa');
        return;
      }

      // ✅ Validação: Se pago por outra pessoa, adicionar pagador aos participantes
      let participants = [...formData.participants];
      if (formData.isPaidByOther && formData.paidBy) {
        // Adicionar pagador aos participantes se não estiver
        if (!participants.includes(formData.paidBy)) {
          participants.push(formData.paidBy);
        }
      } else {
        // Se EU paguei, precisa ter pelo menos 1 participante
        if (participants.length === 0) {
          toast.error('Adicione pelo menos um participante');
          return;
        }
      }

      const totalParticipants = participants.length + 1; // +1 para o usuário atual
      const myShare = formData.splitType === 'equal' ? amount / totalParticipants : amount;

      console.log('🔵 [SharedExpenseModal] Criando transação:', {
        isPaidByOther: formData.isPaidByOther,
        paidBy: formData.paidBy,
        participants,
        myShare
      });

      // ✅ CORREÇÃO: Usar actions.createTransaction do contexto unificado
      await actions.createTransaction({
        description: formData.description,
        amount: amount,
        type: 'DESPESA',
        categoryId: formData.category,
        accountId: formData.isPaidByOther ? undefined : formData.account, // ✅ Sem conta se pago por outro
        date: formData.date,
        notes: formData.notes,
        isShared: !formData.isPaidByOther, // ✅ Só é "shared" se EU paguei
        sharedWith: participants,
        myShare: myShare,
        totalSharedAmount: amount,
        paidBy: formData.isPaidByOther ? formData.paidBy : undefined, // ✅ ID de quem pagou
      });

      console.log('✅ [SharedExpenseModal] Transação criada com sucesso');
      
      if (formData.isPaidByOther) {
        const payer = familyMembers.find(m => m.id === formData.paidBy);
        toast.success(`Dívida de R$ ${myShare.toFixed(2)} registrada com ${payer?.name || 'pessoa'}!`);
        toast.info('A dívida aparecerá na fatura para pagamento');
      } else {
        toast.success('Despesa compartilhada criada com sucesso!');
        toast.info(`Participantes serão notificados`);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('❌ [SharedExpenseModal] Erro ao criar despesa:', error);
      toast.error('Erro ao criar despesa compartilhada');
    } finally {
      setIsLoading(false);
    }
  };

  const totalParticipants = formData.participants.length + 1;
  const amountPerPerson = formData.amount
    ? (Number.parseFloat(formData.amount) / totalParticipants).toFixed(2)
    : '0.00';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Nova Despesa Compartilhada
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Informações da Despesa
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Valor Total *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Data *</Label>
                <DatePicker
                  id="date"
                  value={formData.date}
                  onChange={(value) =>
                    setFormData({ ...formData, date: value })
                  }
                  placeholder="Selecionar data"
                  maxDate={new Date()}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                placeholder="Ex: Jantar no restaurante, Uber para o aeroporto..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories
                      .filter((category) => category && category.name && category.name.trim() !== '')
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="account">
                  Pago com {!formData.isPaidByOther && '*'}
                </Label>
                <Select
                  value={formData.account}
                  onValueChange={(value) =>
                    setFormData({ ...formData, account: value })
                  }
                  required={!formData.isPaidByOther}
                  disabled={formData.isPaidByOther}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.isPaidByOther ? "Não aplicável" : "Selecione..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAccounts.length === 0 ? (
                      <SelectItem value="no-accounts" disabled>
                        Nenhuma conta encontrada - Cadastre uma conta primeiro
                      </SelectItem>
                    ) : (
                      availableAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} - {account.type}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.isPaidByOther && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ℹ️ Como outra pessoa pagou, não é necessário selecionar conta
                  </p>
                )}
              </div>
            </div>

            {/* ✅ NOVO: Checkbox "Pago por outra pessoa" */}
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <input
                type="checkbox"
                id="isPaidByOther"
                checked={formData.isPaidByOther}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({ 
                    ...formData, 
                    isPaidByOther: checked,
                    account: checked ? '' : formData.account, // Limpar conta se marcar
                    paidBy: checked ? formData.paidBy : '', // Limpar pagador se desmarcar
                  });
                }}
                className="w-4 h-4"
              />
              <Label htmlFor="isPaidByOther" className="cursor-pointer">
                Pago por outra pessoa
              </Label>
            </div>

            {/* ✅ NOVO: Seletor de quem pagou */}
            {formData.isPaidByOther && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                <Label htmlFor="paidBy">Quem pagou? *</Label>
                <Select
                  value={formData.paidBy}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paidBy: value })
                  }
                  required
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione quem pagou..." />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {formData.paidBy && formData.amount && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      ⚙️ Divisão Automática:
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Você:</span>
                        <span className="font-bold text-red-600">
                          R$ {(Number.parseFloat(formData.amount) / (formData.participants.length + 2)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{familyMembers.find(m => m.id === formData.paidBy)?.name}:</span>
                        <span className="font-bold">
                          R$ {(Number.parseFloat(formData.amount) / (formData.participants.length + 2)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Você passará a dever R$ {(Number.parseFloat(formData.amount) / (formData.participants.length + 2)).toFixed(2)} para {familyMembers.find(m => m.id === formData.paidBy)?.name}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Participantes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Participantes
              </h3>
              {formData.isPaidByOther && (
                <Badge variant="secondary" className="text-xs">
                  Divisão automática ativa
                </Badge>
              )}
            </div>

            {/* Membros da Família */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Membros da Família</Label>
                <FamilyMemberForm
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Novo Membro
                    </Button>
                  }
                />
              </div>
              {loadingMembers ? (
                <p className="text-sm text-gray-500">Carregando membros...</p>
              ) : familyMembers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhum membro cadastrado. Adicione um novo membro acima.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {familyMembers.map((member) => (
                    <Button
                      key={member.id}
                      type="button"
                      variant={
                        formData.participants.includes(member.id)
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        formData.participants.includes(member.id)
                          ? removeParticipant(member.id)
                          : addParticipant(member.id)
                      }
                    >
                      {member.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Participantes Selecionados */}
            {formData.participants.length > 0 && (
              <div>
                <Label>Participantes Selecionados</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">Você</Badge>
                  {formData.participants.map((participantId) => {
                    const member = familyMembers.find(
                      (m) => m.id === participantId
                    );
                    return (
                      <Badge
                        key={participantId}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {member?.name || participantId}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-600"
                          onClick={() => removeParticipant(participantId)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Tipo de Divisão */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Como Dividir
            </h3>
            <RadioGroup
              value={formData.splitType}
              onValueChange={(value) =>
                setFormData({ ...formData, splitType: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equal" id="equal" />
                <Label htmlFor="equal">Dividir igualmente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage">Por porcentagem</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="amount" id="amount" />
                <Label htmlFor="amount">Por valor específico</Label>
              </div>
            </RadioGroup>

            {/* Preview da Divisão */}
            {formData.amount &&
              totalParticipants > 1 &&
              formData.splitType === 'equal' && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">
                    Divisão Igual
                  </p>
                  <p className="text-sm text-purple-600">
                    R$ {amountPerPerson} por pessoa ({totalParticipants}{' '}
                    participantes)
                  </p>
                </div>
              )}
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre a despesa..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={formData.participants.length === 0 || isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar Despesa Compartilhada'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
