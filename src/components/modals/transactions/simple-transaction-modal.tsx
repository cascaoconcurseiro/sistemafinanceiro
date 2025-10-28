'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';

interface SimpleTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TransactionFormData {
  description: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
  accountId: string;
  date: string;
  notes: string;
}

const INITIAL_FORM_DATA: TransactionFormData = {
  description: '',
  amount: '',
  type: 'expense',
  category: 'Outros',
  accountId: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

const CATEGORIES = {
  income: [
    'Salário',
    'Freelance',
    'Investimentos',
    'Vendas',
    'Outros Rendimentos'
  ],
  expense: [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
    'Compras',
    'Serviços',
    'Outros'
  ]
};

export function SimpleTransactionModal({ open, onOpenChange }: SimpleTransactionModalProps) {
  const { accounts, actions, isLoading: contextLoading } = useUnifiedFinancial();
  const [formData, setFormData] = useState<TransactionFormData>(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [open]);

  // Auto-select first account when accounts are loaded
  useEffect(() => {
    if (accounts && accounts.length > 0 && !formData.accountId) {
      const firstActiveAccount = accounts.find(account => account.isActive);
      if (firstActiveAccount) {
        setFormData(prev => ({ ...prev, accountId: firstActiveAccount.id }));
      }
    }
  }, [accounts, formData.accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações básicas
      if (!formData.description.trim()) {
        toast.error('Descrição é obrigatória');
        return;
      }

      const amount = parseFloat(formData.amount.replace(',', '.'));
      if (isNaN(amount) || amount <= 0) {
        toast.error('Valor deve ser um número positivo');
        return;
      }

      if (!formData.accountId) {
        toast.error('Selecione uma conta');
        return;
      }

      // Preparar dados da transação
      const transactionData = {
        description: formData.description.trim(),
        amount: formData.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        type: formData.type,
        category: formData.category,
        accountId: formData.accountId,
        date: formData.date,
        notes: formData.notes.trim(),
        status: 'cleared'
      };

      // Criar transação usando o contexto unificado
      if (actions?.createTransaction) {
        await actions.createTransaction(transactionData);
        toast.success('Transação criada com sucesso!');
        onOpenChange(false);
      } else {
        throw new Error('Função de criação não disponível');
      }

    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar transação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TransactionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Adicione uma nova transação ao seu sistema financeiro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Ex: Compra no supermercado"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="text"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0,00"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES[formData.type].map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">Conta *</Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) => handleInputChange('accountId', value)}
              disabled={isLoading || contextLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - {account.type}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações opcionais"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || contextLoading}>
              {isLoading ? 'Criando...' : 'Criar Transação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}