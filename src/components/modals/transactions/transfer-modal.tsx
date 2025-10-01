'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useUnified } from '@/contexts/unified-context-simple';
import { formatCurrency } from '@/lib/utils';
import { convertBRDateToISO, convertISODateToBR, getCurrentDateBR } from '@/lib/utils/date-utils';
import { toast } from 'sonner';

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferModal({ open, onOpenChange }: TransferModalProps) {
  console.log('TransferModal rendered with open:', open);
  
  const { accounts = [], transactions = [], actions } = useUnified();
  
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: '',
    date: getCurrentDateBR(),
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        fromAccount: '',
        toAccount: '',
        amount: '',
        description: '',
        date: getCurrentDateBR(),
      });
    }
  }, [open]);

  // Calculate account balance
  const getAccountBalance = (account: string) => {
    if (!Array.isArray(transactions)) return 0;
    
    return transactions
      .filter(t => t.account === account)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const fromAccount = accounts?.find(a => a.id === formData.fromAccount);
  const toAccount = accounts?.find(a => a.id === formData.toAccount);
  const fromAccountBalance = fromAccount ? getAccountBalance(fromAccount.id) : 0;
  const transferAmount = parseFloat(formData.amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de campos obrigatórios
    if (!formData.fromAccount || !formData.toAccount || !formData.amount || !formData.description) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    // Validação adicional para contas válidas
    if (formData.fromAccount === 'Dinheiro' || formData.toAccount === 'Dinheiro') {
      toast.error('Por favor, selecione contas válidas para a transferência');
      return;
    }

    // Verificar se as contas existem
    const fromAccount = accounts.find(acc => acc.id === formData.fromAccount);
    const toAccount = accounts.find(acc => acc.id === formData.toAccount);
    
    if (!fromAccount || !toAccount) {
      toast.error('Uma ou ambas as contas selecionadas não são válidas');
      return;
    }

    // Verificar se as contas são diferentes
    if (formData.fromAccount === formData.toAccount) {
      toast.error('As contas de origem e destino devem ser diferentes');
      return;
    }

    // Validação de valor mínimo
    const transferAmount = parseFloat(formData.amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    if (transferAmount < 0.01) {
      toast.error('Valor mínimo para transferência é R$ 0,01');
      return;
    }

    // Verificar saldo suficiente
    const fromAccountBalance = getAccountBalance(formData.fromAccount);
    if (fromAccountBalance < transferAmount) {
      toast.error('Saldo insuficiente na conta de origem');
      return;
    }

    try {
      setIsLoading(true);

      // Create transfer transactions using financial engine
      const transferAmount = parseFloat(formData.amount);
      
      // Create expense transaction for source account
      await actions.createTransaction({
        id: `transfer-out-${Date.now()}`,
        description: `Transferência para ${accounts.find(a => a.id === formData.toAccount)?.name || 'conta'}: ${formData.description}`,
        amount: -transferAmount,
        date: convertBRDateToISO(formData.date),
        type: 'expense',
        category: 'Transferência',
        account: formData.fromAccount,
      });

      // Create income transaction for destination account
      await actions.createTransaction({
        id: `transfer-in-${Date.now() + 1}`,
        description: `Transferência de ${accounts.find(a => a.id === formData.fromAccount)?.name || 'conta'}: ${formData.description}`,
        amount: transferAmount,
        date: convertBRDateToISO(formData.date),
        type: 'income',
        category: 'Transferência',
        account: formData.toAccount,
      });

      toast.success('Transferência realizada com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao realizar transferência:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao realizar transferência';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferência entre Contas</DialogTitle>
          <DialogDescription>
            Transfira dinheiro entre suas contas. Duas transações conectadas serão criadas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de Contas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromAccount">Conta de Origem *</Label>
              <Select
                value={formData.fromAccount}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, fromAccount: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{account.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatCurrency(getAccountBalance(account.id))}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toAccount">Conta de Destino *</Label>
              <Select
                value={formData.toAccount}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, toAccount: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem 
                      key={account.id} 
                      value={account.id}
                      disabled={account.id === formData.fromAccount}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span>{account.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatCurrency(getAccountBalance(account.id))}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview da Transferência */}
          {fromAccount && toAccount && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="font-medium">{fromAccount.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Saldo: {formatCurrency(fromAccountBalance)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">{toAccount.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Saldo: {formatCurrency(getAccountBalance(toAccount.id))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor da Transferência *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, amount: e.target.value }))
              }
              required
            />
            {transferAmount > 0 && fromAccountBalance < transferAmount && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                Saldo insuficiente na conta de origem
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Motivo da transferência"
              value={formData.description}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              rows={2}
              required
            />
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <DatePicker
              id="date"
              value={convertBRDateToISO(formData.date)}
              onChange={(value) =>
                setFormData(prev => ({ ...prev, date: convertISODateToBR(value) }))
              }
              placeholder="Selecionar data"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Transferindo...' : 'Realizar Transferência'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
