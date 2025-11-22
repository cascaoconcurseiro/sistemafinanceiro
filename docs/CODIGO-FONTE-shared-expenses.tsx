'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { SharedExpensesBilling } from './shared-expenses-billing';
import { AddTransactionModal } from '@/components/modals/transactions/add-transaction-modal';
import { Plane, Receipt, DollarSign, Users } from 'lucide-react';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { usePeriod } from '@/contexts/period-context';

export function SharedExpenses() {
  const { data } = useUnifiedFinancial();
  const { transactions = [] } = data || {};

  // ✅ NOVO: Buscar dívidas da API
  const [debts, setDebts] = useState<any[]>([]);
  
  // ✅ NOVO: Estado do modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  useEffect(() => {
    const loadDebts = async () => {
      try {
                const response = await fetch('/api/debts', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const activeDebts = (data.debts || [])
            .filter((d: any) => d.status === 'active')
            .map((d: any) => ({
              id: d.id,
              description: d.description,
              amount: d.currentAmount,
              creditor: d.creditorId,
              debtor: d.debtorId,
              status: d.status
            }));
          setDebts(activeDebts);
        } else {
          console.error('❌ [SharedExpenses] Erro ao buscar dívidas:', response.status);
        }
      } catch (error) {
        console.error('❌ [SharedExpenses] Erro ao carregar dívidas:', error);
      }
    };
    loadDebts();
  }, []);

  // ✅ NOVO: Listener para evento de edição
  useEffect(() => {
    const handleEditTransaction = (event: any) => {
      console.log('📝 Evento edit-transaction recebido:', event.detail);
      const { transaction } = event.detail;
      setEditingTransaction(transaction);
      setEditModalOpen(true);
    };

    window.addEventListener('edit-transaction', handleEditTransaction);
    return () => {
      window.removeEventListener('edit-transaction', handleEditTransaction);
    };
  }, []);

  // ✅ CORREÇÃO: Combinar transações compartilhadas COM dívidas
  const sharedTransactions = [
    // Transações compartilhadas (EU paguei)
    ...transactions.filter((t: any) => {
      const hasSharedWith = t.sharedWith &&
        (Array.isArray(t.sharedWith) ? t.sharedWith.length > 0 :
         typeof t.sharedWith === 'string' && t.sharedWith.length > 0 && t.sharedWith !== '[]');
      return t.isShared || hasSharedWith;
    }),
    // Dívidas (OUTRA PESSOA pagou) - converter para formato de transação
    // ✅ FILTRO: Apenas dívidas ativas E sem transactionId (evita duplicação)
    ...debts
      .filter((d: any) => {
        const isActive = d.status === 'active';
        const noTransaction = !d.transactionId;

        if (!isActive) {
          console.log('⏭️ [SharedExpenses] Pulando dívida inativa:', d.id);
        }
        if (!noTransaction) {
          console.log('⏭️ [SharedExpenses] Pulando dívida com transação:', d.id, d.transactionId);
        }

        return isActive && noTransaction;
      })
      .map((debt: any) => {
        console.log('✅ [SharedExpenses] Incluindo dívida:', {
          id: debt.id,
          description: debt.description,
          amount: debt.currentAmount
        });

        return {
          id: `debt-${debt.id}`,
          description: debt.description,
          amount: debt.currentAmount,
          date: debt.createdAt,
          type: 'DESPESA',
          category: 'Dívida',
          paidBy: debt.creditorId,
          myShare: debt.currentAmount,
          isShared: true,
          sharedWith: [],
          tripId: null,
        };
      })
  ];

  const { getPeriodDates, selectedMonth, selectedYear } = usePeriod();
  const [activeTab, setActiveTab] = useState('regular');
  const [totals, setTotals] = useState({
    total: 0,
    regular: 0,
    trip: 0,
    people: 0,
    regularCount: 0,
    tripCount: 0,
  });

  // Calcular totais realistas baseados no banco de dados
  const calculateTotals = () => {
    const periodDates = getPeriodDates();
    const { startDate, endDate } = periodDates;

    // Filtrar despesas regulares do período
    const regularExpenses = sharedTransactions.filter(t => {
      if (t.tripId) return false;
      const itemDate = new Date(t.date);
      return itemDate >= startDate && itemDate <= endDate;
    });

    // Filtrar despesas de viagem (todas, não apenas do período)
    const tripExpenses = sharedTransactions.filter(t => t.tripId);

    // ✅ CORREÇÃO: Calcular valores compartilhados considerando CRÉDITOS e DÉBITOS
    const calculateSharedAmount = (transaction: any) => {
      console.log('💰 [calculateSharedAmount] Processando:', {
        desc: transaction.description,
        amount: transaction.amount,
        paidBy: transaction.paidBy,
        myShare: transaction.myShare,
        sharedWith: transaction.sharedWith
      });

      // ✅ CASO 1: Outra pessoa pagou (EU DEVO) → Valor NEGATIVO
      if (transaction.paidBy) {
        // Usar myShare se disponível, senão calcular
        if (transaction.myShare) {
          const result = -Math.abs(transaction.myShare);
          console.log('🔴 [calculateSharedAmount] EU DEVO (myShare):', result);
          return result; // Negativo porque EU DEVO
        }

        // Calcular divisão
        let sharedWith: string[] = [];
        if (transaction.sharedWith) {
          try {
            const parsed = typeof transaction.sharedWith === 'string'
              ? JSON.parse(transaction.sharedWith)
              : transaction.sharedWith;
            sharedWith = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            sharedWith = [];
          }
        }

        const totalParticipants = sharedWith.length + 1;
        const amountPerPerson = Math.abs(transaction.amount) / totalParticipants;
        const result = -amountPerPerson;
        console.log('🔴 [calculateSharedAmount] EU DEVO (calculado):', result);
        return result; // Negativo porque EU DEVO
      }

      // ✅ CASO 2: EU paguei (OUTROS ME DEVEM) → Valor POSITIVO
      let sharedWith: string[] = [];
      if (transaction.sharedWith) {
        try {
          const parsed = typeof transaction.sharedWith === 'string'
            ? JSON.parse(transaction.sharedWith)
            : transaction.sharedWith;
          sharedWith = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          sharedWith = [];
        }
      }

      // Se não tem compartilhamento, retorna 0
      if (sharedWith.length === 0) {
        console.log('⚪ [calculateSharedAmount] Sem compartilhamento, retornando 0');
        return 0;
      }

      // Calcula apenas a parte que outras pessoas devem (positivo)
      const totalParticipants = sharedWith.length + 1; // +1 para você
      const amountPerPerson = Math.abs(transaction.amount) / totalParticipants;
      const result = amountPerPerson * sharedWith.length;
      console.log('🟢 [calculateSharedAmount] ME DEVEM:', result);
      return result; // Positivo porque ME DEVEM
    };

    const totalRegular = regularExpenses.reduce((sum, t) => sum + calculateSharedAmount(t), 0);
    const totalTrip = tripExpenses.reduce((sum, t) => sum + calculateSharedAmount(t), 0);
    const totalAll = totalRegular + totalTrip;

    // Contar pessoas únicas envolvidas
    const allPeople = new Set<string>();
    [...regularExpenses, ...tripExpenses].forEach(t => {
      if (t.sharedWith) {
        try {
          const shared = typeof t.sharedWith === 'string' ? JSON.parse(t.sharedWith) : t.sharedWith;
          if (Array.isArray(shared)) {
            shared.forEach(p => allPeople.add(p));
          }
        } catch (e) {
          // Ignorar erros de parse
        }
      }
    });

    return {
      total: totalAll,
      regular: totalRegular,
      trip: totalTrip,
      people: allPeople.size,
      regularCount: regularExpenses.length,
      tripCount: tripExpenses.length,
    };
  };

  // Recalcular totais quando o período ou transações mudarem
  useEffect(() => {
    console.log('🔄 [SharedExpenses] Recalculando totais...', {
      mes: selectedMonth,
      ano: selectedYear,
      totalTransacoes: transactions.length,
      transacoesCompartilhadas: sharedTransactions.length
    });

    // DEBUG: Mostrar todas as transações compartilhadas
    console.log('📊 Transações compartilhadas:', sharedTransactions.length);

    const newTotals = calculateTotals();
        setTotals(newTotals);
  }, [sharedTransactions.length, selectedMonth, selectedYear, transactions.length]);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`bg-gradient-to-br ${
          totals.total >= 0
            ? 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800'
            : 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={`w-5 h-5 ${
                totals.total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`} />
              <span className={`text-sm font-medium ${
                totals.total >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>Total Compartilhado</span>
            </div>
            <p className={`text-2xl font-bold ${
              totals.total >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
            }`}>
              {totals.total >= 0 ? '+' : ''}R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-xs mt-1 ${
              totals.total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {totals.regularCount + totals.tripCount} transações
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          totals.regular >= 0
            ? 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800'
            : 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className={`w-5 h-5 ${
                totals.regular >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`} />
              <span className={`text-sm font-medium ${
                totals.regular >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>Despesas Regulares</span>
            </div>
            <p className={`text-2xl font-bold ${
              totals.regular >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
            }`}>
              {totals.regular >= 0 ? '+' : ''}R$ {totals.regular.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-xs mt-1 ${
              totals.regular >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {totals.regularCount} transações
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          totals.trip >= 0
            ? 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800'
            : 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Plane className={`w-5 h-5 ${
                totals.trip >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'
              }`} />
              <span className={`text-sm font-medium ${
                totals.trip >= 0 ? 'text-purple-700 dark:text-purple-300' : 'text-red-700 dark:text-red-300'
              }`}>Despesas de Viagem</span>
            </div>
            <p className={`text-2xl font-bold ${
              totals.trip >= 0 ? 'text-purple-900 dark:text-purple-100' : 'text-red-900 dark:text-red-100'
            }`}>
              {totals.trip >= 0 ? '+' : ''}R$ {totals.trip.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-xs mt-1 ${
              totals.trip >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {totals.tripCount} transações
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Pessoas Envolvidas</span>
            </div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {totals.people}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              membros da família
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Despesas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="regular" className="gap-2">
            <Receipt className="w-4 h-4" />
            Despesas Regulares
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              {totals.regularCount}
            </span>
          </TabsTrigger>
          <TabsTrigger value="trip" className="gap-2">
            <Plane className="w-4 h-4" />
            Despesas de Viagem
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              {totals.tripCount}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regular" className="space-y-6 mt-6">
          <SharedExpensesBilling mode="regular" />
        </TabsContent>

        <TabsContent value="trip" className="space-y-6 mt-6">
          <SharedExpensesBilling mode="trip" />
        </TabsContent>
      </Tabs>

      {/* Modal de Edição */}
      <AddTransactionModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        editingTransaction={editingTransaction}
        onSave={() => {
          setEditModalOpen(false);
          setEditingTransaction(null);
          // Recarregar dados
          window.location.reload();
        }}
      />
    </div>
  );
}
