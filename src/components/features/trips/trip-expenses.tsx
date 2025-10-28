'use client';
import { useState, useEffect } from 'react';
import type { Trip } from '@/lib/storage';
import { TripExpenseReport } from './trip-expense-report';
import { TripSharedExpenses } from './trip-shared-expenses';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, Users, DollarSign } from 'lucide-react';

interface TripExpensesProps {
  trip: Trip;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  tripExpenseType?: string;
  isShared?: boolean;
  myShare?: number;
}

export function TripExpenses({ trip }: TripExpensesProps) {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      console.log('🔍 [TripExpenses] Carregando despesas para viagem:', trip.id);
      const response = await fetch(`/api/transactions?tripId=${trip.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [TripExpenses] Despesas carregadas:', data.transactions?.length || 0);
        console.log('📊 [TripExpenses] Dados:', data.transactions);
        setExpenses(data.transactions || []);
      } else {
        console.error('❌ [TripExpenses] Erro na resposta:', response.status);
      }
    } catch (error) {
      console.error('❌ [TripExpenses] Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trip.id) {
      loadExpenses();
    }
  }, [trip.id, refreshKey]);

  // ✅ Listener para atualizar quando transação for criada, editada ou deletada
  useEffect(() => {
    const handleTransactionUpdate = (event?: CustomEvent) => {
      console.log('🔄 [TripExpenses] Evento de transação recebido:', event?.type);
      setRefreshKey(prev => prev + 1);
    };

    // Escutar todos os eventos de transação
    window.addEventListener('transactionCreated', handleTransactionUpdate);
    window.addEventListener('transactionUpdated', handleTransactionUpdate);
    window.addEventListener('transactionDeleted', handleTransactionUpdate);
    window.addEventListener('TRANSACTION_UPDATED', handleTransactionUpdate);
    window.addEventListener('TRANSACTION_DELETED', handleTransactionUpdate);
    
    return () => {
      window.removeEventListener('transactionCreated', handleTransactionUpdate);
      window.removeEventListener('transactionUpdated', handleTransactionUpdate);
      window.removeEventListener('transactionDeleted', handleTransactionUpdate);
      window.removeEventListener('TRANSACTION_UPDATED', handleTransactionUpdate);
      window.removeEventListener('TRANSACTION_DELETED', handleTransactionUpdate);
    };
  }, []);

  // ✅ CORRIGIDO: Filtros corretos
  // Individuais: Apenas DESPESAS (mostrando minha parte nas compartilhadas)
  const individualExpenses = expenses.filter(e => e.type === 'DESPESA');
  // Compartilhadas: Despesas compartilhadas
  const sharedExpenses = expenses.filter(e => e.isShared && e.type === 'DESPESA');

  // Calcular totais para aba Individual (considerando myShare para compartilhadas)
  // ✅ CORREÇÃO: RECEITAS devem SUBTRAIR do total (reembolsos)
  const individualTotal = individualExpenses.reduce((sum, e) => {
    const value = e.isShared && e.myShare !== null && e.myShare !== undefined
      ? Math.abs(Number(e.myShare))
      : Math.abs(Number(e.amount));
    
    // ✅ RECEITA subtrai (reembolso), DESPESA soma
    const isIncome = e.type === 'RECEITA' || e.type === 'income';
    const adjustment = isIncome ? -value : value;
    
    console.log('💰 [TripExpenses] Calculando total:', {
      description: e.description,
      type: e.type,
      isShared: e.isShared,
      amount: e.amount,
      myShare: e.myShare,
      valueUsed: value,
      adjustment,
      runningTotal: sum + adjustment
    });
    
    return sum + adjustment;
  }, 0);
  const individualCount = individualExpenses.length;
  
  console.log('📊 [TripExpenses] Total Individual Final:', individualTotal);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            Todas ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="trip">
            <Plane className="w-4 h-4 mr-2" />
            Individuais ({individualExpenses.length})
          </TabsTrigger>
          <TabsTrigger value="shared">
            <Users className="w-4 h-4 mr-2" />
            Compartilhadas ({sharedExpenses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {/* ✅ Aba Todas: Apenas lista simples, sem cards de resumo */}
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-gray-500">Carregando...</p>
              ) : expenses.length === 0 ? (
                <p className="text-center text-gray-500">
                  Nenhuma despesa encontrada
                </p>
              ) : (
                <div className="space-y-2">
                  {expenses.map(expense => {
                    // ✅ Determinar cor e tipo baseado no tipo da transação
                    const isIncome = expense.type === 'RECEITA' || expense.type === 'income';
                    const colorClass = isIncome ? 'text-green-600' : 'text-red-600';
                    
                    return (
                      <div key={expense.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">
                            {expense.description}
                            {/* Badge de tipo (Receita ou Despesa) */}
                            {isIncome ? (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Receita
                              </span>
                            ) : (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Despesa
                              </span>
                            )}
                            {/* Badge de compartilhada */}
                            {expense.isShared && (
                              <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                Compartilhada
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(expense.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className={`font-bold ${colorClass}`}>
                          {isIncome && '+'} R$ {Math.abs(Number(expense.amount)).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trip" className="space-y-4 mt-4">
          {/* ✅ Cards de Resumo - Apenas para gastos individuais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Gasto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trip.currency} {individualTotal.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {trip.budget > 0 ? `${((individualTotal / trip.budget) * 100).toFixed(1)}% do orçamento` : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Média Diária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trip.currency} {individualCount > 0 ? (individualTotal / individualCount).toFixed(2) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Orçamento diário: {trip.currency} {trip.budget > 0 ? (trip.budget / Math.max(1, Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2) : '0.00'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maior Gasto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trip.currency} {individualExpenses.length > 0 ? Math.max(...individualExpenses.map(e => {
                    // ✅ Considerar myShare para compartilhadas
                    if (e.isShared && e.myShare !== null && e.myShare !== undefined) {
                      return Math.abs(Number(e.myShare));
                    }
                    return Math.abs(Number(e.amount));
                  })).toFixed(2) : '0.00'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Restante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trip.currency} {(trip.budget - individualTotal).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sugestão diária: {trip.currency} {trip.budget > 0 ? ((trip.budget - individualTotal) / Math.max(1, Math.ceil((new Date(trip.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2) : '0.00'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de despesas individuais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Despesas Individuais
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-gray-500">Carregando...</p>
              ) : individualExpenses.length === 0 ? (
                <p className="text-center text-gray-500">
                  Nenhuma despesa encontrada
                </p>
              ) : (
                <div className="space-y-2">
                  {individualExpenses.map(expense => {
                    // ✅ Se compartilhada, mostrar MINHA parte (myShare)
                    // Se não compartilhada, mostrar valor total
                    let displayAmount = Math.abs(Number(expense.amount));
                    const isIncome = expense.type === 'RECEITA' || expense.type === 'income';
                    const colorClass = isIncome ? 'text-green-600' : 'text-red-600';
                    
                    if (expense.isShared) {
                      if (expense.myShare !== null && expense.myShare !== undefined) {
                        displayAmount = Math.abs(Number(expense.myShare));
                      } else {
                        // Fallback: calcular metade
                        displayAmount = Math.abs(Number(expense.amount)) / 2;
                      }
                    }
                    
                    return (
                      <div key={expense.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">
                            {expense.description}
                            {/* Badge de tipo (Receita ou Despesa) */}
                            {isIncome ? (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Receita
                              </span>
                            ) : (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Despesa
                              </span>
                            )}
                            {/* Badge de compartilhada */}
                            {expense.isShared && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Minha Parte
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(expense.date).toLocaleDateString('pt-BR')}
                            {expense.isShared && (
                              <span className="ml-2 text-xs text-gray-400">
                                (Total: R$ {Math.abs(Number(expense.amount)).toFixed(2)})
                              </span>
                            )}
                          </p>
                        </div>
                        <p className={`font-bold ${colorClass}`}>
                          {isIncome && '+'} R$ {displayAmount.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4 mt-4">
          <TripSharedExpenses 
            tripId={trip.id} 
            sharedExpenses={sharedExpenses} 
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
