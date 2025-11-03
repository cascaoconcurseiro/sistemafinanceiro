'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { AlertCircle, TrendingDown, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';

interface PendingDebt {
  id: string;
  transactionId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  creditorId: string;
  creditorName: string;
  creditorEmail: string;
}

interface Credit {
  id: string;
  debtorId: string;
  debtorName: string;
  amount: number;
}

export function PendingDebtsList() {
  const { transactions, contacts, accounts, actions } = useUnifiedFinancial();
  const [pendingDebts, setPendingDebts] = useState<PendingDebt[]>([]);
  const [credits, setCredits] = useState<Record<string, Credit[]>>({});
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<PendingDebt | null>(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Carregar dívidas pendentes
  useEffect(() => {
    const loadPendingDebts = () => {
      const debts: PendingDebt[] = [];

      transactions
        .filter(t => t.status === 'pending' || t.status === 'pending_payment')
        .forEach(transaction => {
          const creditor = contacts.find(c => c.id === transaction.paidBy);

          if (creditor) {
            debts.push({
              id: transaction.id,
              transactionId: transaction.id,
              description: transaction.description,
              amount: Math.abs(transaction.amount),
              date: transaction.date,
              category: transaction.category || 'Outros',
              creditorId: creditor.id,
              creditorName: creditor.name,
              creditorEmail: creditor.email || '',
            });
          }
        });

      setPendingDebts(debts);
    };

    loadPendingDebts();
  }, [transactions, contacts]);

  // Carregar créditos (pessoas que te devem)
  useEffect(() => {
    const loadCredits = async () => {
      try {
        const response = await fetch('/api/shared-debts', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const debts = data.debts || [];

          // Agrupar créditos por credor
          const creditsByCreditor: Record<string, Credit[]> = {};

          debts.forEach((debt: any) => {
            if (debt.status === 'active') {
              const debtor = contacts.find(c => c.id === debt.debtorId);
              if (debtor) {
                if (!creditsByCreditor[debt.creditorId]) {
                  creditsByCreditor[debt.creditorId] = [];
                }
                creditsByCreditor[debt.creditorId].push({
                  id: debt.id,
                  debtorId: debtor.id,
                  debtorName: debtor.name,
                  amount: Number(debt.currentAmount),
                });
              }
            }
          });

          setCredits(creditsByCreditor);
        }
      } catch (error) {
        console.error('Erro ao carregar créditos:', error);
      }
    };

    loadCredits();
  }, [contacts]);

  // Agrupar dívidas por credor
  const debtsByCreditor = pendingDebts.reduce((acc, debt) => {
    if (!acc[debt.creditorId]) {
      acc[debt.creditorId] = [];
    }
    acc[debt.creditorId].push(debt);
    return acc;
  }, {} as Record<string, PendingDebt[]>);

  // Calcular totais por credor
  const getCreditorSummary = (creditorId: string) => {
    const debts = debtsByCreditor[creditorId] || [];
    const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);

    const creditorCredits = credits[creditorId] || [];
    const totalCredit = creditorCredits.reduce((sum, c) => sum + c.amount, 0);

    const netAmount = totalDebt - totalCredit;

    return {
      totalDebt,
      totalCredit,
      netAmount,
      hasCredit: totalCredit > 0,
    };
  };

  // Abrir modal de pagamento
  const handlePayDebt = (debt: PendingDebt) => {
    setSelectedDebt(debt);
    setPaymentModalOpen(true);
  };

  // Confirmar pagamento
  const confirmPayment = async () => {
    if (!selectedDebt || !selectedAccount) {
      toast.error('Selecione uma conta para débito');
      return;
    }

    setIsProcessing(true);
    try {
      const summary = getCreditorSummary(selectedDebt.creditorId);
      const netAmount = summary.netAmount;

      // ✅ Buscar conta principal do credor
      let creditorAccount;
      try {
        const response = await fetch(`/api/accounts?userId=${selectedDebt.creditorId}`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const creditorAccounts = await response.json();
          creditorAccount = creditorAccounts.find((acc: any) => acc.isActive !== false);
        }
      } catch (error) {
        console.error('Erro ao buscar conta do credor:', error);
      }

      if (!creditorAccount) {
        toast.error('❌ Conta do credor não encontrada');
        return;
      }

      // ✅ USAR ENDPOINT ATÔMICO
      const paymentResponse = await fetch('/api/shared-debts/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          debtId: selectedDebt.id,
          creditorId: selectedDebt.creditorId,
          creditorAccountId: creditorAccount.id,
          debtorAccountId: selectedAccount,
          amount: Math.abs(netAmount),
          totalDebt: summary.totalDebt,
          totalCredit: summary.totalCredit,
          description: selectedDebt.description,
          category: selectedDebt.category,
          date: paymentDate,
          isCompensation: netAmount === 0,
        }),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        throw new Error(error.error || 'Erro ao processar pagamento');
      }

      const result = await paymentResponse.json();
      console.log('✅ Pagamento processado:', result);

      // 3. Atualizar créditos usados
      if (summary.hasCredit) {
        const creditorCredits = credits[selectedDebt.creditorId] || [];
        for (const credit of creditorCredits) {
          await fetch(`/api/shared-debts/${credit.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              status: 'paid',
              paidAt: new Date().toISOString(),
            }),
          });
        }
      }

      toast.success('✅ Pagamento registrado com sucesso! Ambas as transações foram criadas.');
      setPaymentModalOpen(false);
      setSelectedDebt(null);
      setSelectedAccount('');

      // Recarregar dados
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('❌ Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  if (Object.keys(debtsByCreditor).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Dívidas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="text-gray-500 font-medium">
              Nenhuma dívida pendente
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Você está em dia com todos! 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            Dívidas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(debtsByCreditor).map(([creditorId, debts]) => {
            const summary = getCreditorSummary(creditorId);
            const creditor = debts[0];

            return (
              <Card key={creditorId} className="border-2 border-red-200">
                <CardHeader className="bg-red-50 dark:bg-red-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                        {creditor.creditorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{creditor.creditorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {creditor.creditorEmail}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(summary.totalDebt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {debts.length} despesa(s)
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Resumo */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Devido</p>
                      <p className="font-bold text-red-600">
                        {formatCurrency(summary.totalDebt)}
                      </p>
                    </div>
                    {summary.hasCredit && (
                      <>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Crédito</p>
                          <p className="font-bold text-green-600">
                            -{formatCurrency(summary.totalCredit)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Líquido</p>
                          <p className="font-bold text-blue-600">
                            {formatCurrency(Math.max(0, summary.netAmount))}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Aviso de compensação */}
                  {summary.hasCredit && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">
                            Compensação Automática
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {creditor.creditorName} te deve R$ {summary.totalCredit.toFixed(2)}.
                            Este valor será descontado automaticamente ao pagar.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de despesas */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Despesas:</h4>
                    {debts.map(debt => (
                      <div
                        key={debt.id}
                        className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200 dark:bg-red-950 dark:border-red-800 gap-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{debt.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {debt.category} • {new Date(debt.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            {formatCurrency(debt.amount)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                // Buscar transação completa
                                const response = await fetch(`/api/transactions/${debt.transactionId}`, {
                                  credentials: 'include',
                                });
                                if (response.ok) {
                                  const transaction = await response.json();
                                  // Abrir modal de edição
                                  window.dispatchEvent(new CustomEvent('edit-transaction', {
                                    detail: { transaction }
                                  }));
                                }
                              } catch (error) {
                                console.error('Erro ao buscar transação:', error);
                                toast.error('Erro ao carregar transação');
                              }
                            }}
                            className="h-8 w-8 p-0"
                            title="Editar dívida"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm(`Tem certeza que deseja excluir a dívida "${debt.description}"?\n\nIsso irá:\n- Remover a transação\n- Cancelar a dívida\n- Atualizar os saldos`)) {
                                try {
                                  // Deletar transação
                                  const response = await fetch(`/api/transactions/${debt.transactionId}`, {
                                    method: 'DELETE',
                                    credentials: 'include',
                                  });
                                  
                                  if (response.ok) {
                                    toast.success('Dívida excluída com sucesso!');
                                    // Recarregar dados
                                    setTimeout(() => {
                                      window.location.reload();
                                    }, 500);
                                  } else {
                                    const error = await response.json();
                                    throw new Error(error.error || 'Erro ao excluir');
                                  }
                                } catch (error) {
                                  console.error('Erro ao excluir dívida:', error);
                                  toast.error('Erro ao excluir dívida');
                                }
                              }
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                            title="Excluir dívida"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botão de pagar/compensar */}
                  <Button
                    onClick={() => handlePayDebt(debts[0])}
                    className={`w-full ${summary.netAmount === 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                    size="lg"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {summary.netAmount === 0 
                      ? 'Compensar Dívidas' 
                      : summary.hasCredit 
                        ? `Pagar R$ ${summary.netAmount.toFixed(2)}` 
                        : 'Pagar Dívida'
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Modal de Pagamento */}
      {paymentModalOpen && selectedDebt && (
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {(() => {
                  const summary = getCreditorSummary(selectedDebt.creditorId);
                  return summary.netAmount === 0 ? 'Compensar Dívidas' : 'Pagar Dívida';
                })()}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const summary = getCreditorSummary(selectedDebt.creditorId);
                    return summary.netAmount === 0 ? 'Compensação com:' : 'Você deve a:';
                  })()}
                </p>
                <p className="text-lg font-bold">{selectedDebt.creditorName}</p>
              </div>

              {(() => {
                const summary = getCreditorSummary(selectedDebt.creditorId);
                return (
                  <>
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span>Total devido:</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(summary.totalDebt)}
                        </span>
                      </div>
                      {summary.hasCredit && (
                        <>
                          <div className="flex justify-between">
                            <span>Crédito disponível:</span>
                            <span className="font-bold text-green-600">
                              -{formatCurrency(summary.totalCredit)}
                            </span>
                          </div>
                          <div className="border-t pt-2 flex justify-between">
                            <span className="font-bold">Valor a pagar:</span>
                            <span className="font-bold text-blue-600">
                              {formatCurrency(Math.max(0, summary.netAmount))}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <Label>Conta para Débito *</Label>
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma conta..." />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter(acc => acc.isActive !== false && !acc.deletedAt)
                            .map(account => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name} ({account.type})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Data do Pagamento *</Label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800 space-y-2">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        📋 O que será registrado:
                      </p>
                      {summary.netAmount === 0 ? (
                        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                          <p className="font-semibold mb-2">🔄 Compensação Total</p>
                          <p>✅ <strong>RECEITA</strong> de {formatCurrency(summary.totalDebt)} (você recebe)</p>
                          <p>✅ <strong>DESPESA</strong> de {formatCurrency(summary.totalDebt)} (você paga)</p>
                          <p className="text-xs mt-2 text-blue-700 dark:text-blue-300 font-medium">
                            💡 Saldo líquido: R$ 0,00 - As dívidas se compensam, mas as transações serão registradas para auditoria
                          </p>
                        </div>
                      ) : (
                        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                          <p>✅ <strong>RECEITA</strong> de {formatCurrency(Math.max(0, summary.netAmount))} para {selectedDebt.creditorName}</p>
                          <p>✅ <strong>DESPESA</strong> de {formatCurrency(Math.max(0, summary.netAmount))} na sua conta</p>
                          {summary.hasCredit && (
                            <p className="text-xs mt-2 text-blue-700 dark:text-blue-300">
                              💡 Valores já compensados com créditos disponíveis
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setPaymentModalOpen(false)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={confirmPayment}
                        disabled={isProcessing || !selectedAccount}
                        className={`flex-1 ${summary.netAmount === 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        {isProcessing 
                          ? 'Processando...' 
                          : summary.netAmount === 0 
                            ? 'Confirmar Compensação' 
                            : 'Confirmar Pagamento'
                        }
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
