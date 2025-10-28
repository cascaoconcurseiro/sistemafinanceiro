'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { InvestmentType, INVESTMENT_TYPE_LABELS } from '@/types/investment';

const investmentSchema = z.object({
  ticker: z.string().min(1, 'Ticker é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.nativeEnum(InvestmentType),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  averagePrice: z.number().positive('Preço deve ser positivo'),
  purchaseDate: z.date(),
  broker: z.string().optional(),
  brokerageFee: z.number().min(0).optional(),
  otherFees: z.number().min(0).optional(),
  notes: z.string().optional(),
  createTransaction: z.boolean().default(false),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function InvestmentModal({ isOpen, onClose, userId }: InvestmentModalProps) {
  const [type, setType] = useState<InvestmentType>(InvestmentType.STOCK);
  const queryClient = useQueryClient();
  
  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      type: InvestmentType.STOCK,
      quantity: 0,
      averagePrice: 0,
      brokerageFee: 0,
      otherFees: 0,
      createTransaction: false,
    }
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: InvestmentFormData) => {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId })
      });
      if (!res.ok) throw new Error('Failed to create investment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-portfolio'] });
      toast.success('Investimento cadastrado com sucesso!');
      onClose();
      form.reset();
    },
    onError: () => {
      toast.error('Erro ao cadastrar investimento');
    }
  });
  
  const onSubmit = (data: InvestmentFormData) => {
    createMutation.mutate(data);
  };
  
  const totalInvested = (
    (form.watch('quantity') || 0) * (form.watch('averagePrice') || 0) +
    (form.watch('brokerageFee') || 0) +
    (form.watch('otherFees') || 0)
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>➕ Novo Investimento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo de Ativo */}
          <div className="space-y-2">
            <Label>Tipo de Ativo</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(INVESTMENT_TYPE_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  variant={type === key ? 'default' : 'outline'}
                  onClick={() => {
                    setType(key as InvestmentType);
                    form.setValue('type', key as InvestmentType);
                  }}
                  className="w-full"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Ticker/Nome */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker/Código *</Label>
              <Input
                id="ticker"
                placeholder="PETR4, HGLG11..."
                {...form.register('ticker')}
              />
              {form.formState.errors.ticker && (
                <p className="text-sm text-red-500">{form.formState.errors.ticker.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="Petrobras PN"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>
          
          {/* Quantidade e Preço */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="100"
                {...form.register('quantity', { valueAsNumber: true })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="averagePrice">Preço Médio *</Label>
              <Input
                id="averagePrice"
                type="number"
                step="0.01"
                placeholder="30.50"
                {...form.register('averagePrice', { valueAsNumber: true })}
              />
            </div>
          </div>
          
          {/* Data e Corretora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Data de Compra *</Label>
              <Input
                id="purchaseDate"
                type="date"
                {...form.register('purchaseDate', { valueAsDate: true })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="broker">Corretora</Label>
              <Input
                id="broker"
                placeholder="XP Investimentos"
                {...form.register('broker')}
              />
            </div>
          </div>
          
          {/* Custos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brokerageFee">Corretagem (R$)</Label>
              <Input
                id="brokerageFee"
                type="number"
                step="0.01"
                placeholder="15.00"
                {...form.register('brokerageFee', { valueAsNumber: true })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="otherFees">Outras Taxas (R$)</Label>
              <Input
                id="otherFees"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register('otherFees', { valueAsNumber: true })}
              />
            </div>
          </div>
          
          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Notas sobre este investimento..."
              {...form.register('notes')}
            />
          </div>
          
          {/* Valor Total */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">💰 Valor Total Investido:</span>
              <span className="text-2xl font-bold">
                R$ {totalInvested.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {form.watch('quantity')} × R$ {form.watch('averagePrice')} + taxas
            </p>
          </div>
          
          {/* Opções */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createTransaction"
                checked={form.watch('createTransaction')}
                onCheckedChange={(checked) => 
                  form.setValue('createTransaction', checked as boolean)
                }
              />
              <Label htmlFor="createTransaction" className="cursor-pointer">
                Registrar como transação (débito da conta)
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Salvando...' : '💾 Salvar Investimento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
