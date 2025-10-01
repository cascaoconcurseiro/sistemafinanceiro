'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { Account, Transaction } from '@/types';

interface DeleteAccountModalProps {
  account: Account | null;
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accountId: string, deleteTransactions?: boolean) => Promise<void>;
}

export function DeleteAccountModal({
  account,
  transactions = [],
  isOpen,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [deleteTransactions, setDeleteTransactions] = useState(false);

  // Contar transações associadas à conta
  const transactionCount = account ? transactions.filter(t => 
    t.accountId === account.id || t.toAccountId === account.id
  ).length : 0;

  useEffect(() => {
    if (isOpen && account) {
      setConfirmationText('');
      setDeleteTransactions(false);
    }
  }, [isOpen, account]);

  const handleConfirm = async () => {
    if (!account) return;

    // Verificar se o texto de confirmação está correto
    if (confirmationText !== 'confirmar') {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm(account.id, deleteTransactions);
      onClose();
    } catch (error) {
      // Erro já é tratado na função onConfirm
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmationText === 'confirmar';

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Excluir Conta
          </DialogTitle>
          <DialogDescription className="text-left">
            Tem certeza que deseja excluir a conta{' '}
            <span className="font-semibold text-foreground">"{account.name}"</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aviso de segurança */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">Esta ação não pode ser desfeita!</p>
                <p>
                  A conta será permanentemente removida do sistema.
                </p>
              </div>
            </div>
          </div>

          {/* Informações sobre transações */}
          {transactionCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium mb-2">
                    Esta conta possui {transactionCount} transação{transactionCount !== 1 ? 'ões' : ''} associada{transactionCount !== 1 ? 's' : ''}.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="delete-transactions"
                        checked={deleteTransactions}
                        onCheckedChange={(checked) => setDeleteTransactions(checked as boolean)}
                      />
                      <Label htmlFor="delete-transactions" className="text-sm font-medium">
                        Excluir também todas as transações desta conta
                      </Label>
                    </div>
                    <p className="text-xs text-amber-600 ml-6">
                      {deleteTransactions 
                        ? 'As transações serão permanentemente excluídas.' 
                        : 'As transações serão mantidas como "órfãs" no sistema.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campo de confirmação */}
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium">
              Para confirmar, digite a palavra: <span className="font-bold">confirmar</span>
            </Label>
            <Input
              id="confirmation"
              type="text"
              placeholder="confirmar"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className={`${
                confirmationText && !isConfirmationValid 
                  ? 'border-red-300 focus:border-red-500' 
                  : ''
              }`}
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-xs text-red-600">
                Digite "confirmar" para prosseguir.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || !isConfirmationValid}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Excluir Conta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
