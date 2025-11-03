'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Link, Calendar, DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: string;
  tripId?: string | null;
}

interface LinkTransactionsToTripProps {
  tripId: string;
  tripName: string;
  tripStartDate: string;
  tripEndDate: string;
  onLinked: () => void;
}

export function LinkTransactionsToTrip({
  tripId,
  tripName,
  tripStartDate,
  tripEndDate,
  onLinked,
}: LinkTransactionsToTripProps) {
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);

  const loadUnlinkedTransactions = async () => {
    setLoading(true);
    try {
            
      // Buscar transações sem tripId no período da viagem
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const allTransactions = data.transactions || [];
        console.log(`📊 [LinkTransactions] Total de transações no sistema: ${allTransactions.length}`);

        // Filtrar transações sem tripId e dentro do período da viagem
        const startDate = new Date(tripStartDate);
        const endDate = new Date(tripEndDate);

                const unlinked = allTransactions.filter((t: Transaction) => {
          const transDate = new Date(t.date);
          const hasNoTripId = !t.tripId;
          const isDespesa = t.type === 'DESPESA';
          const isInPeriod = transDate >= startDate && transDate <= endDate;

          if (hasNoTripId && isDespesa && isInPeriod) {
            console.log('✅ [LinkTransactions] Transação encontrada:', {
              id: t.id,
              description: t.description,
              amount: t.amount,
              date: t.date,
              type: t.type,
              tripId: t.tripId
            });
          }

          return hasNoTripId && isDespesa && isInPeriod;
        });

        setTransactions(unlinked);
        console.log(`✅ [LinkTransactions] ${unlinked.length} transações não vinculadas encontradas no período`);

        if (unlinked.length === 0) {
          console.warn('⚠️ [LinkTransactions] Nenhuma transação encontrada. Verificando motivos...');

          const withoutTripId = allTransactions.filter((t: Transaction) => !t.tripId);
          console.log(`  - Transações sem tripId: ${withoutTripId.length}`);

          const despesas = allTransactions.filter((t: Transaction) => t.type === 'DESPESA');
          console.log(`  - Transações do tipo DESPESA: ${despesas.length}`);

          const inPeriod = allTransactions.filter((t: Transaction) => {
            const transDate = new Date(t.date);
            return transDate >= startDate && transDate <= endDate;
          });
          console.log(`  - Transações no período: ${inPeriod.length}`);
        }
      }
    } catch (error) {
      console.error('❌ [LinkTransactions] Erro ao carregar transações:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadUnlinkedTransactions();
    }
  }, [open]);

  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    }
  };

  const handleLink = async () => {
    if (selectedIds.size === 0) {
      toast.error('Selecione pelo menos uma transação');
      return;
    }

    setLinking(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/link-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transactionIds: Array.from(selectedIds) }),
      });

      if (response.ok) {
        const result = await response.json();
                toast.success(result.message || `${result.linkedCount} transação(ões) vinculada(s) à viagem!`);
        onLinked();
        setOpen(false);
        setSelectedIds(new Set());
      } else {
        const error = await response.json();
        console.error('❌ [LinkTransactions] Erro na resposta:', error);
        toast.error(error.error || 'Erro ao vincular transações');
      }
    } catch (error) {
      console.error('❌ [LinkTransactions] Erro ao vincular transações:', error);
      toast.error('Erro ao vincular transações');
    } finally {
      setLinking(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const totalSelected = Array.from(selectedIds).reduce((sum, id) => {
    const transaction = transactions.find(t => t.id === id);
    return sum + (transaction ? Math.abs(transaction.amount) : 0);
  }, 0);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Link className="w-4 h-4" />
        Vincular Transações Existentes
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vincular Transações à Viagem: {tripName}</DialogTitle>
            <p className="text-sm text-gray-600">
              Período: {formatDate(tripStartDate)} - {formatDate(tripEndDate)}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Carregando transações...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Nenhuma transação não vinculada encontrada no período da viagem.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.size === transactions.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="font-medium">
                      Selecionar todas ({transactions.length})
                    </span>
                  </div>
                  {selectedIds.size > 0 && (
                    <div className="text-sm text-gray-600">
                      {selectedIds.size} selecionada(s) - Total: {formatCurrency(totalSelected)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleToggle(transaction.id)}
                    >
                      <Checkbox
                        checked={selectedIds.has(transaction.id)}
                        onCheckedChange={() => handleToggle(transaction.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(transaction.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {transaction.category}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-red-600">
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={linking}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleLink}
                    disabled={selectedIds.size === 0 || linking}
                  >
                    {linking ? 'Vinculando...' : `Vincular ${selectedIds.size} Transação(ões)`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
