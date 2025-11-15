'use client';

import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Receipt,
  CheckCircle,
  Download,
  Plane,
  Info,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface SharedExpensesBillingV2Props {
  mode: 'regular' | 'trip';
  tripId?: string;
}

interface BillingObligation {
  id: string;
  debtId: string;
  originTransactionId: string | null;
  description: string;
  category: string;
  categoryId: string | null;
  owedValue: number;
  paidAmount: number;
  remainingAmount: number;
  date: string;
  dueDate: string;
  status: 'active' | 'paid';
  type: 'DEBIT' | 'CREDIT';
  counterparty: {
    id: string;
    name: string;
    email: string;
  };
  tripId: string | null;
}

interface BillingByUser {
  user: {
    id: string;
    name: string;
    email: string;
  };
  netBalance: number;
  obligations: BillingObligation[];
}

/**
 * ✅ NOVO COMPONENTE SIMPLIFICADO
 * 
 * - Usa apenas /api/billing (fonte única de verdade)
 * - Zero processamento no frontend
 * - Zero duplicações
 * - Código 10x mais simples
 */
export const SharedExpensesBillingV2 = memo(function SharedExpensesBillingV2({ 
  mode, 
  tripId 
}: SharedExpensesBillingV2Props) {
  const [billingData, setBillingData] = useState<Record<string, BillingByUser>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  
  // Estados do modal de pagamento
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<BillingObligation | null>(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ CARREGAR DADOS DA NOVA API
  useEffect(() => {
    loadBillingData();
  }, [mode, tripId]);

  // ✅ CARREGAR CONTAS
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      console.log(`📋 [Billing V2] Carregando dados, modo: ${mode}`);

      const url = tripId 
        ? `/api/billing?mode=${mode}&tripId=${tripId}`
        : `/api/billing?mode=${mode}`;

      const response = await fetch(url, {
        credentials: 'include',
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar fatura');
      }

      const data = await response.json();
      
      console.log(`✅ [Billing V2] Dados carregados:`, {
        totalObligations: data.obligations?.length || 0,
        totalUsers: Object.keys(data.billingByUser || {}).length,
        summary: data.summary,
      });

      setBillingData(data.billingByUser || {});
    } catch (error) {
      console.error('❌ [Billing V2] Erro ao carregar:', error);
      toast.error('Erro ao carregar fatura');
      setBillingData({});
    } finally {
      setIsLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/accounts', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAvailableAccounts(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  // ✅ PAGAR OBRIGAÇÃO INDIVIDUAL
  const handlePayObligation = async (obligation: BillingObligation) => {
    setSelectedObligation(obligation);
    setPaymentModalOpen(true);
  };

  // ✅ PAGAR TODAS AS OBRIGAÇÕES DE UM USUÁRIO
  const handlePayAllForUser = async (userId: string) => {
    const billing = billingData[userId];
    if (!billing) return;

    const pendingObligations = billing.obligations.filter(o => o.status === 'active');
    
    if (pendingObligations.length === 0) {
      toast.info('Não há obrigações pendentes');
      return;
    }

    // Criar obrigação consolidada para o modal
    const consolidatedObligation: BillingObligation = {
      id: `consolidated-${userId}`,
      debtId: 'multiple',
      originTransactionId: null,
      description: `Fatura completa de ${billing.user.name}`,
      category: 'Múltiplas',
      categoryId: null,
      owedValue: pendingObligations.reduce((sum, o) => sum + o.owedValue, 0),
      paidAmount: 0,
      remainingAmount: Math.abs(billing.netBalance),
      date: new Date().toISOString(),
      dueDate: new Date().toISOString().substring(0, 10),
      status: 'active',
      type: billing.netBalance > 0 ? 'CREDIT' : 'DEBIT',
      counterparty: billing.user,
      tripId: tripId || null,
    };

    setSelectedObligation(consolidatedObligation);
    setPaymentModalOpen(true);
  };

  // ✅ CONFIRMAR PAGAMENTO
  const confirmPayment = async () => {
    if (!selectedObligation || !selectedAccount) {
      toast.error('Selecione uma conta');
      return;
    }

    setIsProcessing(true);
    try {
      const isConsolidated = selectedObligation.id.startsWith('consolidated-');
      const userId = selectedObligation.counterparty.id;
      
      if (isConsolidated) {
        // Pagar todas as obrigações pendentes do usuário
        const billing = billingData[userId];
        const pendingObligations = billing.obligations.filter(o => o.status === 'active');
        
        console.log(`💰 [Billing V2] Pagando ${pendingObligations.length} obrigações`);

        // Criar uma transação para cada obrigação
        for (const obligation of pendingObligations) {
          await createPaymentTransaction(obligation);
        }

        toast.success(`✅ Fatura paga com sucesso! ${pendingObligations.length} item(ns)`);
      } else {
        // Pagar obrigação individual
        await createPaymentTransaction(selectedObligation);
        toast.success('✅ Pagamento realizado com sucesso!');
      }

      // Recarregar dados
      await loadBillingData();
      setPaymentModalOpen(false);
      setSelectedObligation(null);
      setSelectedAccount('');
    } catch (error) {
      console.error('❌ [Billing V2] Erro ao pagar:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ CRIAR TRANSAÇÃO DE PAGAMENTO
  const createPaymentTransaction = async (obligation: BillingObligation) => {
    const transactionType = obligation.type === 'CREDIT' ? 'RECEITA' : 'DESPESA';
    const amount = obligation.type === 'CREDIT' 
      ? obligation.remainingAmount 
      : -obligation.remainingAmount;

    const description = obligation.type === 'CREDIT'
      ? `💰 Recebimento - ${obligation.description} (${obligation.counterparty.name})`
      : `💸 Pagamento - ${obligation.description} (para ${obligation.counterparty.name})`;

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        type: transactionType,
        amount: amount,
        description: description.substring(0, 500),
        accountId: selectedAccount,
        categoryId: obligation.categoryId,
        date: paymentDate,
        status: 'completed',
        metadata: JSON.stringify({
          type: 'shared_expense_payment',
          billingItemId: obligation.id,
          debtId: obligation.debtId,
          originalTransactionId: obligation.originTransactionId,
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar transação');
    }

    // Atualizar dívida
    if (obligation.debtId !== 'multiple') {
      await fetch(`/api/debts/${obligation.debtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentAmount: 0,
          status: 'paid',
        }),
      });
    }
  };

  // ✅ EXPORTAR FATURA
  const handleExportBilling = () => {
    const rows = Object.values(billingData).flatMap(billing =>
      billing.obligations.map(obligation => [
        billing.user.name,
        billing.user.email,
        obligation.description,
        obligation.category,
        obligation.type === 'CREDIT' ? `+R$ ${obligation.remainingAmount.toFixed(2)}` : `-R$ ${obligation.remainingAmount.toFixed(2)}`,
        new Date(obligation.date).toLocaleDateString('pt-BR'),
        obligation.status === 'paid' ? 'Pago' : 'Pendente',
      ].join(','))
    );

    const csvContent = [
      ['Nome', 'Email', 'Descrição', 'Categoria', 'Valor', 'Data', 'Status'].join(','),
      ...rows,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fatura-${mode}-${new Date().toISOString().substring(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando fatura...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const billingUsers = Object.values(billingData);

  if (billingUsers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma fatura encontrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com resumo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {mode === 'trip' ? <Plane className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
              {mode === 'trip' ? 'Faturas de Viagem' : 'Faturas Compartilhadas'}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportBilling}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Faturas por usuário */}
      {billingUsers.map((billing) => {
        const pendingObligations = billing.obligations.filter(o => o.status === 'active');
        const paidObligations = billing.obligations.filter(o => o.status === 'paid');
        const isCredit = billing.netBalance > 0;

        return (
          <Card key={billing.user.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{billing.user.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{billing.user.email}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                    {isCredit ? '+' : '-'}R$ {Math.abs(billing.netBalance).toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isCredit ? 'A receber' : 'A pagar'}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Botão pagar tudo */}
              {pendingObligations.length > 0 && (
                <Button 
                  className="w-full" 
                  onClick={() => handlePayAllForUser(billing.user.id)}
                >
                  {isCredit ? (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Receber Fatura - R$ {Math.abs(billing.netBalance).toFixed(2)}
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Pagar Fatura - R$ {Math.abs(billing.netBalance).toFixed(2)}
                    </>
                  )}
                </Button>
              )}

              {/* Lista de obrigações */}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Itens da Fatura ({billing.obligations.length}):
                </p>

                {billing.obligations.map((obligation) => (
                  <div
                    key={obligation.id}
                    className={`p-3 rounded-lg border ${
                      obligation.status === 'paid'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{obligation.description}</span>
                          <Badge variant={obligation.status === 'paid' ? 'default' : 'secondary'}>
                            {obligation.status === 'paid' ? 'Pago' : 'Pendente'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {obligation.category} • {new Date(obligation.date).toLocaleDateString('pt-BR')}
                        </p>
                        {obligation.paidAmount > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Pago: R$ {obligation.paidAmount.toFixed(2)} de R$ {obligation.owedValue.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}R$ {obligation.remainingAmount.toFixed(2)}
                        </div>
                        {obligation.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => handlePayObligation(obligation)}
                          >
                            {isCredit ? 'Receber' : 'Pagar'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumo */}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Pendentes:</span>
                  <span>{pendingObligations.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pagos:</span>
                  <span>{paidObligations.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Modal de Pagamento */}
      {paymentModalOpen && selectedObligation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {selectedObligation.type === 'CREDIT' ? 'Receber Pagamento' : 'Realizar Pagamento'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <p className="text-sm text-muted-foreground">{selectedObligation.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Valor</label>
                <p className="text-lg font-bold">
                  R$ {selectedObligation.remainingAmount.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Conta</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                >
                  <option value="">Selecione uma conta</option>
                  {availableAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - R$ {account.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Data</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPaymentModalOpen(false);
                    setSelectedObligation(null);
                  }}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={confirmPayment}
                  disabled={isProcessing || !selectedAccount}
                >
                  {isProcessing ? 'Processando...' : 'Confirmar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});
