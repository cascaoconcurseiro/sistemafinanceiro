'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { toast } from 'sonner';
import { storage, type Account } from '../../../lib/storage';
import {
  validateRequiredString,
  validatePositiveNumber,
  sanitizeString,
  sanitizeNumber,
} from '../../../lib/validation';
import { useLogger } from '../../../lib/logger';
import { useUnified } from '../../../contexts/unified-context-simple';

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountModal({ open, onOpenChange }: AddAccountModalProps) {
  const unifiedContext = useUnified();
  const contextLoading = unifiedContext?.loading || false;

  const logger = useLogger('AddAccountModal');
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as Account['type'],
    balance: '',
    bank: '',
    description: '',
    currency: 'BRL',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  // Using sonner toast

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        type: 'checking',
        balance: '',
        bank: '',
        description: '',
        currency: 'BRL',
      });
      setIsLoading(false);
      setFormLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    logger.info('Starting account creation', { formData });

    // Sanitize inputs
    const sanitizedName = sanitizeString(formData.name);
    const sanitizedBank = sanitizeString(formData.bank);
    const sanitizedDescription = sanitizeString(formData.description);
    const sanitizedBalance = sanitizeNumber(formData.balance);

    // Comprehensive validation
    if (!validateRequiredString(sanitizedName)) {
      toast.error('Nome da conta é obrigatório.');
      return;
    }

    if (!validatePositiveNumber(sanitizedBalance) && sanitizedBalance !== 0) {
      toast.error('Por favor, insira um valor válido para o saldo.');
      return;
    }

    // Additional business validation
    if (sanitizedName.length > 100) {
      toast.error('Nome da conta deve ter no máximo 100 caracteres.');
      return;
    }

    setFormLoading(true);

    try {
      const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return (
          Date.now().toString(36) + Math.random().toString(36).substring(2)
        );
      };

      const newAccount = {
        id: generateId(),
        name: sanitizedName,
        type: formData.type,
        balance: sanitizedBalance,
        bank: sanitizedBank || undefined,
        description: sanitizedDescription || undefined,
        currency: formData.currency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      logger.debug('Creating account', newAccount);
      
      // Save account using API
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAccount),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar conta');
      }

      const createdAccount = await response.json();
      
      // Atualizar estado do financial engine
      if (unifiedContext && unifiedContext.refreshData) {
        await unifiedContext.refreshData();
      } else {
        logger.warn('UnifiedContext or refreshData not available');
      }
      
      logger.info('Account created successfully', createdAccount);

      toast.success('Conta criada com sucesso!');

      // Reset form
      setFormData({
        name: '',
        type: 'checking',
        balance: '',
        bank: '',
        description: '',
        currency: 'BRL',
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('Error creating account', error);
      toast.error(
        `Erro ao criar conta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Conta *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Conta Corrente</SelectItem>
                <SelectItem value="savings">Poupança</SelectItem>
                <SelectItem value="credit">Cartão de Crédito</SelectItem>
                <SelectItem value="investment">Investimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange('currency', value)}
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
                  <SelectItem value="AUD">
                    🇦🇺 Dólar Australiano (AUD)
                  </SelectItem>
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
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Criando...' : 'Criar Conta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
