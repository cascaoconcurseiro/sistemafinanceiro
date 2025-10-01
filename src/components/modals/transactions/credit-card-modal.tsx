'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { CreditCard, Calendar, DollarSign, Hash } from 'lucide-react';
import { useUnified } from '@/contexts/unified-context-simple';
import { toast } from 'sonner';
import {
  convertBRDateToISO,
  convertISODateToBR,
  getCurrentDateBR,
} from '@/lib/utils/date-utils';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreditCardFormData {
  description: string;
  amount: string;
  account: string;
  categoryId: string;
  date: string;
  dueDate: string;
  notes: string;
  isInstallment: boolean;
  installments: number;
}

const CATEGORIES = [
  { id: 'alimentacao', name: 'Alimentação' },
  { id: 'transporte', name: 'Transporte' },
  { id: 'saude', name: 'Saúde' },
  { id: 'educacao', name: 'Educação' },
  { id: 'lazer', name: 'Lazer' },
  { id: 'compras', name: 'Compras' },
  { id: 'casa', name: 'Casa' },
  { id: 'outros', name: 'Outros' },
];

export function CreditCardModal({ isOpen, onClose }: CreditCardModalProps) {
  const { accounts, actions } = useUnified();
  const [formData, setFormData] = useState<CreditCardFormData>({
    description: '',
    amount: '',
    account: '',
    categoryId: '',
    date: getCurrentDateBR(),
    dueDate: '',
    notes: '',
    isInstallment: false,
    installments: 1,
  });

  const creditCardAccounts = (accounts || []).filter(
    (account) => account.type === 'credit' && account.status === 'active'
  );

  const handleInputChange = (field: keyof CreditCardFormData, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateInstallmentPreview = () => {
    if (!formData.amount || !formData.isInstallment || formData.installments <= 1) {
      return null;
    }

    const totalAmount = parseFloat(formData.amount);
    const installmentAmount = totalAmount / formData.installments;
    
    return {
      totalAmount,
      installmentAmount,
      installments: formData.installments,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.description.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    if (!formData.account || formData.account === 'Dinheiro') {
      toast.error('Selecione um cartão de crédito válido');
      return;
    }

    // Verificar se o cartão selecionado existe
    const selectedCard = creditCardAccounts.find(card => card.id === formData.account);
    if (!selectedCard) {
      toast.error('O cartão de crédito selecionado não é válido');
      return;
    }

    if (!formData.categoryId) {
      toast.error('Selecione uma categoria');
      return;
    }

    if (!formData.dueDate) {
      toast.error('Data de vencimento é obrigatória');
      return;
    }

    try {
      const transactionData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: convertBRDateToISO(formData.date),
        account: formData.account,
        categoryId: formData.categoryId,
        type: 'expense',
        category: formData.categoryId,
        dueDate: formData.dueDate,
        notes: formData.notes || undefined,
        creditCardId: formData.account,
      };

      if (formData.isInstallment && formData.installments > 1) {
        // Create installment transactions
        const installmentAmount = parseFloat(formData.amount) / formData.installments;
        
        for (let i = 0; i < formData.installments; i++) {
          const installmentDate = new Date(convertBRDateToISO(formData.date));
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          await actions.createTransaction({
            id: `${transactionData.id}-installment-${i + 1}`,
            description: `${formData.description} (${i + 1}/${formData.installments})`,
            amount: installmentAmount,
            date: installmentDate.toISOString().split('T')[0],
            type: 'expense',
            category: formData.categoryId,
            account: formData.account,
          });
        }
        
        toast.success(`Transação parcelada em ${formData.installments}x criada com sucesso!`);
      } else {
        // Single transaction
        await actions.createTransaction({
          ...transactionData,
          amount: parseFloat(formData.amount),
          type: 'expense',
          category: formData.categoryId,
          account: formData.account,
        });
        toast.success('Transação de cartão de crédito criada com sucesso!');
      }

      // Reset form
      setFormData({
        description: '',
        amount: '',
        account: '',
        categoryId: '',
        date: getCurrentDateBR(),
        dueDate: '',
        notes: '',
        isInstallment: false,
        installments: 1,
      });

      onClose();
    } catch (error) {
      console.error('Erro ao criar transação de cartão:', error);
      toast.error('Erro ao criar transação de cartão de crédito');
    }
  };

  const installmentPreview = calculateInstallmentPreview();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Nova Transação de Cartão de Crédito
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Ex: Compra no supermercado"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Valor *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="pl-10"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="date">Data da Compra *</Label>
                <DatePicker
                  id="date"
                  value={convertBRDateToISO(formData.date)}
                  onChange={(value) =>
                    handleInputChange('date', convertISODateToBR(value))
                  }
                  placeholder="Selecionar data"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account">Cartão de Crédito *</Label>
                <Select
                  value={formData.account}
                  onValueChange={(value) => handleInputChange('account', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditCardAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="categoryId">Categoria *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleInputChange('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <DatePicker
                id="dueDate"
                value={formData.dueDate ? convertBRDateToISO(formData.dueDate) : ''}
                onChange={(value) =>
                  handleInputChange('dueDate', value ? convertISODateToBR(value) : '')
                }
                placeholder="Selecionar data de vencimento"
              />
            </div>
          </div>

          {/* Parcelamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-purple-600" />
                  Parcelamento
                </div>
                <Switch
                  checked={formData.isInstallment}
                  onCheckedChange={(checked) => {
                    handleInputChange('isInstallment', checked);
                    if (!checked) {
                      handleInputChange('installments', 1);
                    }
                  }}
                />
              </CardTitle>
            </CardHeader>
            {formData.isInstallment && (
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="installments">Número de Parcelas</Label>
                  <Select
                    value={formData.installments.toString()}
                    onValueChange={(value) => handleInputChange('installments', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i + 2).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {installmentPreview && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Resumo do Parcelamento</h4>
                    <div className="space-y-1 text-sm text-purple-700">
                      <p>Total: R$ {installmentPreview.totalAmount.toFixed(2)}</p>
                      <p>
                        {installmentPreview.installments}x de R${' '}
                        {installmentPreview.installmentAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-purple-600 mt-2">
                        Cada parcela será criada com vencimento mensal
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Informações adicionais sobre a transação..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {formData.isInstallment && formData.installments > 1
                ? `Criar ${formData.installments} Parcelas`
                : 'Criar Transação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
