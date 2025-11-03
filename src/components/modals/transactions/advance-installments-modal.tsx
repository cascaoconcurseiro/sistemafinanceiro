'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils/format-currency';
import { AlertTriangle, CreditCard, Calendar, DollarSign } from 'lucide-react';

interface AdvanceInstallmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onSuccess: () => void;
  accounts: any[];
}

export function AdvanceInstallmentsModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
  accounts,
}: AdvanceInstallmentsModalProps) {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [installmentsToAdvance, setInstallmentsToAdvance] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!transaction) return null;

  const currentInstallment = transaction.installmentNumber || 1;
  const totalInstallments = transaction.totalInstallments || 1;
  const remainingInstallments = totalInstallments - currentInstallment;
  const installmentAmount = Math.abs(transaction.amount);
  const totalAmount = installmentAmount * installmentsToAdvance;

  const handleAdvance = async () => {
    if (!selectedAccount) {
      alert('Selecione uma conta para o pagamento');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/transactions/advance-installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transactionId: transaction.id,
          installmentGroupId: transaction.installmentGroupId,
          installmentsToAdvance,
          accountId: selectedAccount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adiantar parcelas');
      }

      alert(`✅ ${installmentsToAdvance} parcela(s) adiantada(s) com sucesso!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao adiantar parcelas:', error);
      alert(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Adiantar Parcelas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da parcela atual */}
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{transaction.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Parcela atual:</span>
                    <p className="font-medium">{currentInstallment}/{totalInstallments}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <p className="font-medium">{formatCurrency(installmentAmount)}</p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {remainingInstallments === 0 ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta é a última parcela. Não há parcelas futuras para adiantar.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Seletor de quantidade de parcelas */}
              <div className="space-y-2">
                <Label htmlFor="installments">Quantas parcelas deseja adiantar?</Label>
                <Select
                  value={installmentsToAdvance.toString()}
                  onValueChange={(value) => setInstallmentsToAdvance(parseInt(value))}
                >
                  <SelectTrigger id="installments">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: remainingInstallments }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} parcela{num > 1 ? 's' : ''} - {formatCurrency(installmentAmount * num)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seletor de conta */}
              <div className="space-y-2">
                <Label htmlFor="account">Conta para débito</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((acc) => acc.isActive && acc.type !== 'credit_card')
                      .map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} - {formatCurrency(acc.balance)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resumo do adiantamento */}
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Resumo do adiantamento:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Parcelas a adiantar:</span>
                        <span className="font-medium">
                          {currentInstallment + 1} até {currentInstallment + installmentsToAdvance}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor por parcela:</span>
                        <span className="font-medium">{formatCurrency(installmentAmount)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-medium">Total a pagar:</span>
                        <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Calendar className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  As parcelas adiantadas serão marcadas como pagas e o valor será debitado da conta
                  selecionada.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          {remainingInstallments > 0 && (
            <Button onClick={handleAdvance} disabled={!selectedAccount || isProcessing}>
              {isProcessing ? 'Processando...' : `Adiantar ${installmentsToAdvance} parcela(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
