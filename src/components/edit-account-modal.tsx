'use client';

import { useState, useEffect } from 'react';
import { logComponents } from '../lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Loader2, Edit } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
  bank?: string;
  balance: number;
  description?: string;
  creditLimit?: number;
  formattedBalance?: string;
}

interface EditAccountModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onAccountUpdated: () => void;
}

export function EditAccountModal({
  account,
  isOpen,
  onClose,
  onAccountUpdated,
}: EditAccountModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    bank: '',
    description: '',
    balance: '',
    creditLimit: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (account && isOpen) {
      setFormData({
        name: account.name || '',
        type: account.type || '',
        bank: account.bank || '',
        description: account.description || '',
        balance: account.balance?.toString() || '0',
        creditLimit: account.creditLimit?.toString() || '',
      });
    }
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    if (!formData.name.trim()) {
      toast.error('Nome da conta é obrigatório');
      return;
    }

    if (!formData.type) {
      toast.error('Tipo da conta é obrigatório');
      return;
    }

    setIsLoading(true);

    try {
      // Atualizar conta via API
      const response = await fetch('/api/accounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: account.id,
          name: formData.name,
          type: formData.type,
          bank: formData.bank,
          description: formData.description,
          balance: parseFloat(formData.balance),
          creditLimit: formData.type === 'credit' ? parseFloat(formData.creditLimit) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar conta');
      }

      toast.success('Conta atualizada com sucesso!');
      onAccountUpdated();
      onClose();
    } catch (error) {
      logError.modal('Erro ao atualizar conta:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const accountTypes = [
    { value: 'checking', label: 'Conta Corrente' },
    { value: 'savings', label: 'Conta Poupança' },
    { value: 'credit', label: 'Cartão de Crédito' },
    { value: 'investment', label: 'Conta Investimento' },
    { value: 'cash', label: 'Dinheiro' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Conta
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da conta "{account?.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta *</Label>
              <Input
                id="name"
                placeholder="Ex: Conta Corrente Banco do Brasil"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank">Banco</Label>
                <Input
                  id="bank"
                  placeholder="Ex: Banco do Brasil"
                  value={formData.bank}
                  onChange={(e) => handleInputChange('bank', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição opcional da conta"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balance">Saldo Atual</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.balance}
                  onChange={(e) => handleInputChange('balance', e.target.value)}
                />
              </div>

              {formData.type === 'credit' && (
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Limite de Crédito</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.creditLimit}
                    onChange={(e) =>
                      handleInputChange('creditLimit', e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

