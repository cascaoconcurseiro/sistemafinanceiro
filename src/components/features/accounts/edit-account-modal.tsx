import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BankSelector } from '@/components/ui/bank-logo';
import {
  Save,
  X,
  AlertTriangle,
  CreditCard,
  Building2,
  Wallet,
  TrendingUp,
  Eye,
  EyeOff,
  Edit,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Account } from '@/types';

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
    bankCode: '',
    bankName: '',
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
        bankCode: account.bankCode || '',
        bankName: account.bankName || '',
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
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          bankCode: formData.bankCode || undefined,
          bankName: formData.bankName || undefined,
          description: formData.description,
          creditLimit: formData.type === 'credit' ? parseFloat(formData.creditLimit) || undefined : undefined,
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
      console.error('Erro ao atualizar conta:', error);
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
                <BankSelector
                  value={formData.bankCode}
                  onChange={(code, name) => {
                    setFormData((prev) => ({
                      ...prev,
                      bankCode: code,
                      bankName: name,
                    }));
                  }}
                />
                <p className="text-xs text-gray-500">
                  Selecione o banco da sua conta
                </p>
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

