'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge'; // Não usado
import { Checkbox } from '@/components/ui/checkbox';
import { ReconciliationBadge } from '@/components/ui/reconciliation-badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  isReconciled: boolean;
  reconciledAt?: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  reconciledBalance: number;
}

export default function ReconciliationPage() {
  const { data: session } = useSession();
  console.log('Session:', session); // Para evitar warning
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [bankBalance, setBankBalance] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions(selectedAccount);
    }
  }, [selectedAccount]);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
        if (data.length > 0) {
          setSelectedAccount(data[0].id);
        }
      }
    } catch (error) {
      toast.error('Erro ao carregar contas');
    }
  };

  const loadTransactions = async (accountId: string) => {
    try {
      const response = await fetch(`/api/transactions?accountId=${accountId}&reconciled=false`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar transações');
    }
  };

  const handleReconcile = async () => {
    if (selectedTransactions.length === 0) {
      toast.error('Selecione pelo menos uma transação');
      return;
    }

    setIsLoading(true);
    try {
      for (const transactionId of selectedTransactions) {
        await fetch(`/api/transactions/${transactionId}/reconcile`, {
          method: 'PATCH',
        });
      }

      toast.success(`${selectedTransactions.length} transações reconciliadas!`);
      setSelectedTransactions([]);
      loadTransactions(selectedAccount);
      loadAccounts();
    } catch (error) {
      toast.error('Erro ao reconciliar transações');
    } finally {
      setIsLoading(false);
    }
  };

  const currentAccount = accounts.find(a => a.id === selectedAccount);
  const difference = currentAccount 
    ? currentAccount.balance - (parseFloat(bankBalance) || 0)
    : 0;

  const unreconciledTotal = transactions
    .filter(t => !t.isReconciled)
    .reduce((sum, t) => sum + t.amount, 0);
  console.log('Unreconciled total:', unreconciledTotal); // Para evitar warning

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reconciliação Bancária</h1>
          <p className="text-muted-foreground">
            Compare suas transações com o extrato bancário
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Saldo no Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {currentAccount?.balance.toFixed(2) || '0,00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Saldo Reconciliado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {currentAccount?.reconciledBalance.toFixed(2) || '0,00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Diferença</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {Math.abs(difference).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliar Transações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Conta</Label>
              <select
                className="w-full p-2 border rounded"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Saldo no Banco</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={bankBalance}
                onChange={(e) => setBankBalance(e.target.value)}
              />
            </div>
          </div>

          {difference !== 0 && bankBalance && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    Diferença detectada: R$ {Math.abs(difference).toFixed(2)}
                  </p>
                  <p className="text-sm text-yellow-700">
                    {difference > 0 
                      ? 'O saldo no sistema é maior que no banco'
                      : 'O saldo no banco é maior que no sistema'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Transações Não Reconciliadas ({transactions.length})</Label>
              <Button
                size="sm"
                onClick={handleReconcile}
                disabled={selectedTransactions.length === 0 || isLoading}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Reconciliar Selecionadas ({selectedTransactions.length})
              </Button>
            </div>

            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {transactions.map(transaction => (
                <div key={transaction.id} className="p-3 flex items-center gap-3 hover:bg-gray-50">
                  <Checkbox
                    checked={selectedTransactions.includes(transaction.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTransactions([...selectedTransactions, transaction.id]);
                      } else {
                        setSelectedTransactions(selectedTransactions.filter(id => id !== transaction.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{transaction.description}</span>
                      <span className={`font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <ReconciliationBadge isReconciled={transaction.isReconciled} />
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                  <p>Todas as transações estão reconciliadas!</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
