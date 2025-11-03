'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, DollarSign, Info } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

interface RefundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  transactionDescription: string;
  transactionAmount: number;
  onSuccess?: () => void;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface RefundInfo {
  originalAmount: number;
  refundedAmount: number;
  remainingAmount: number;
  refundPercentage: number;
  status: 'not_refunded' | 'partially_refunded' | 'fully_refunded';
}

// ============================================
// COMPONENTE
// ============================================

export function RefundModal({
  open,
  onOpenChange,
  transactionId,
  transactionDescription,
  transactionAmount,
  onSuccess,
}: RefundModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [refundInfo, setRefundInfo] = useState<RefundInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Form state
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');

  // Carregar dados ao abrir
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, transactionId]);

  const loadData = async () => {
    try {
      setLoadingInfo(true);

      // Carregar contas e informações de reembolso
      const [accountsRes, refundInfoRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch(`/api/refunds/info?transactionId=${transactionId}`),
      ]);

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData.filter((a: Account) => a.balance >= 0));
      }

      if (refundInfoRes.ok) {
        const refundData = await refundInfoRes.json();
        setRefundInfo(refundData);

        // Preencher valor padrão com o valor restante
        setAmount(refundData.remainingAmount.toString());
      }

      // Preencher descrição padrão
      setDescription(`Reembolso: ${transactionDescription}`);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar informações');
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId) {
      toast.error('Selecione uma conta');
      return;
    }

    const refundAmount = parseFloat(amount);

    if (isNaN(refundAmount) || refundAmount <= 0) {
      toast.error('Valor inválido');
      return;
    }

    if (refundInfo && refundAmount > refundInfo.remainingAmount) {
      toast.error(
        `Valor excede o valor restante (${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(refundInfo.remainingAmount)})`
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalTransactionId: transactionId,
          amount: refundAmount,
          accountId,
          date: new Date().toISOString(),
          description,
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar reembolso');
      }

      toast.success('Reembolso criado com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar reembolso:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao criar reembolso'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFullRefund = () => {
    if (refundInfo) {
      setAmount(refundInfo.remainingAmount.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Criar Reembolso
          </DialogTitle>
          <DialogDescription>
            Registre um reembolso vinculado à transação original
          </DialogDescription>
        </DialogHeader>

        {loadingInfo ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informações da Transação Original */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">{transactionDescription}</p>
                  <p className="text-sm">
                    Valor original:{' '}
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Math.abs(transactionAmount))}
                  </p>
                  {refundInfo && refundInfo.refundedAmount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Já reembolsado:{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(refundInfo.refundedAmount)}{' '}
                      ({refundInfo.refundPercentage.toFixed(1)}%)
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Conta */}
            <div className="space-y-2">
              <Label htmlFor="account">Conta que receberá o reembolso *</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} -{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(account.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Valor do reembolso *</Label>
                {refundInfo && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={handleFullRefund}
                    className="h-auto p-0"
                  >
                    Reembolsar tudo (
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(refundInfo.remainingAmount)}
                    )
                  </Button>
                )}
              </div>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={refundInfo?.remainingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do reembolso"
              />
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Produto devolvido, erro na cobrança, etc."
                rows={3}
              />
            </div>

            {/* Aviso */}
            {refundInfo && refundInfo.status === 'partially_refunded' && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta transação já possui reembolsos parciais. O novo reembolso
                  será adicionado ao histórico.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Reembolso'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
