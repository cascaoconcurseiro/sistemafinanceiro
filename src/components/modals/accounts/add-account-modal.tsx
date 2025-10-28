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
import { sanitizeString, sanitizeNumber, validateRequiredString, validatePositiveNumber } from '@/lib/validation/form-validators';

import { useUnifiedFinancial } from '@/contexts/unified-financial-context';

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AccountFormData {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'wallet';
  balance: string;
  bank: string;
  description: string;
  currency: string;
}

const INITIAL_FORM_DATA: AccountFormData = {
  name: '',
  type: 'checking',
  balance: '0',
  bank: '',
  description: '',
  currency: 'BRL',
};

export function AddAccountModal({ open, onOpenChange }: AddAccountModalProps) {
  const unifiedContext = useUnifiedFinancial();
  const { accounts = [], actions, isLoading: contextLoading } = unifiedContext;
  
  console.log('🔍 Modal - Contexto unificado:', {
    accountsCount: accounts?.length || 0,
    hasActions: !!actions,
    contextLoading
  });

  const [formData, setFormData] = useState<AccountFormData>(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM_DATA);
      setIsLoading(false);
      setFormLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AddAccountModal - Estado atual:', {
        open,
        accountsCount: Array.isArray(accounts) ? accounts.length : 0,
        contextLoading,
        formLoading
      });
    }
  }, [open, accounts, contextLoading, formLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedName = sanitizeString(formData.name);
    const sanitizedBalance = sanitizeNumber(formData.balance);

    if (!validateRequiredString(sanitizedName)) {
      toast.error('Nome da conta é obrigatório.');
      return;
    }

    if (sanitizedName.length > 100) {
      toast.error('Nome da conta deve ter no máximo 100 caracteres.');
      return;
    }

    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    console.log('🔍 Modal - Contas existentes:', safeAccounts.map(acc => acc.name));
    
    const existingAccount = safeAccounts.find(
      account => account.name?.toLowerCase() === sanitizedName.toLowerCase()
    );
    
    if (existingAccount) {
      console.log('❌ Modal - Conta já existe localmente:', existingAccount.name);
      toast.error('Já existe uma conta com este nome.');
      return;
    }
    
    console.log('✅ Modal - Nome disponível localmente');

    setFormLoading(true);

    try {
      const generateId = (): string => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return `account_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      };

      // Preparar dados para a API (apenas os campos que a API espera)
      const accountData = {
        name: sanitizedName,
        type: formData.type, // Manter lowercase conforme schema
        currency: formData.currency,
      };
      
      console.log('🔍 Modal - Enviando dados:', accountData);
      
      const response = await fetch('/api/accounts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Modal - Resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const createdAccount = await response.json();
      console.log('✅ [Modal] Conta criada:', createdAccount);
      
      toast.success('Conta criada com sucesso!');
      
      // Forçar atualização da lista ANTES de fechar o modal
      if (actions?.refresh) {
        console.log('🔄 [Modal] Chamando actions.refresh()...');
        await actions.refresh();
        console.log('✅ [Modal] Refresh concluído!');
      }
      
      setFormData(INITIAL_FORM_DATA);
      onOpenChange(false);

    } catch (error) {
      console.error('❌ Erro ao criar conta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao criar conta: ${errorMessage}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (field: keyof AccountFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Conta</DialogTitle>
          <DialogDescription>
            Adicione uma nova conta bancária ao seu sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Conta Corrente Banco do Brasil"
              required
              disabled={formLoading}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Conta *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value as AccountFormData['type'])}
              disabled={formLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">💳 Conta Corrente</SelectItem>
                <SelectItem value="savings">🏦 Poupança</SelectItem>
                <SelectItem value="credit">💰 Cartão de Crédito</SelectItem>
                <SelectItem value="investment">📈 Investimento</SelectItem>
                <SelectItem value="wallet">👛 Carteira/Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange('currency', value)}
                disabled={formLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">🇧🇷 Real (BRL)</SelectItem>
                  <SelectItem value="USD">🇺🇸 Dólar (USD)</SelectItem>
                  <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">🇬🇧 Libra (GBP)</SelectItem>
                  <SelectItem value="JPY">🇯🇵 Iene (JPY)</SelectItem>
                  <SelectItem value="CAD">🇨🇦 Dólar Canadense (CAD)</SelectItem>
                  <SelectItem value="AUD">🇦🇺 Dólar Australiano (AUD)</SelectItem>
                  <SelectItem value="CHF">🇨🇭 Franco Suíço (CHF)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Saldo Inicial *</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => handleInputChange('balance', e.target.value)}
                placeholder="0.00"
                required
                disabled={formLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank">Banco</Label>
            <Input
              id="bank"
              value={formData.bank}
              onChange={(e) => handleInputChange('bank', e.target.value)}
              placeholder="Ex: Banco do Brasil"
              disabled={formLoading}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrição opcional da conta"
              rows={3}
              disabled={formLoading}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={formLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={formLoading || contextLoading}>
              {formLoading ? 'Criando...' : 'Criar Conta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
