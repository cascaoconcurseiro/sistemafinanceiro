'use client';

import { useState, useEffect } from 'react';
import { clientDatabaseService } from '@/lib/services/client-database-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Eye,
  Filter,
} from 'lucide-react';
import { type Trip } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { TripModal } from '@/components/features/travel/trip-modal';
import { useClientOnly } from '@/hooks/use-client-only';
import { useRouter } from 'next/navigation';
import { CustomDateFilter, filterByPeriod } from '@/components/ui/custom-date-filter';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';

export function TravelExpenses() {
  // ✅ CORREÇÃO: Usar contexto unificado diretamente
  const { data, isLoading: contextLoading } = useUnifiedFinancial();
  const { transactions = [], accounts = [] } = data || {};
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showTripModal, setShowTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  const isClient = useClientOnly();
  const { toast } = useToast();
  const router = useRouter();

  // Financial context state
  const [financialContext, setFinancialContext] = useState<any>(null);



  useEffect(() => {
    loadTrips();
  }, []);

  // ✅ NOVO: Recarregar viagens quando transações mudarem
  useEffect(() => {
    console.log('🔄 [TravelExpenses] Transações mudaram:', {
      totalTransactions: transactions?.length || 0,
      trips: trips.length
    });
    
    if (trips.length > 0 && Array.isArray(transactions) && transactions.length > 0) {
      // Recalcular spent das viagens quando transações mudarem
      const updatedTrips = trips.map((trip: any) => {
        const tripTransactions = transactions.filter((t: any) => t.tripId === trip.id);
        const realSpent = tripTransactions.reduce((sum: number, t: any) => {
          return sum + Math.abs(Number(t.amount));
        }, 0);
        
        console.log(`💰 [TravelExpenses] Recalculando viagem ${trip.name}:`, {
          tripId: trip.id,
          transactionsCount: tripTransactions.length,
          spent: realSpent
        });
        
        return {
          ...trip,
          spent: realSpent
        };
      });
      
      setTrips(updatedTrips);
    }
  }, [transactions, trips.length]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      console.log('🔄 [TravelExpenses] Carregando viagens...');
      
      const response = await fetch('/api/trips', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar viagens');
      }
      const responseData = await response.json();
      
      // Extrair o array de trips da resposta da API
      const tripsData = responseData.data?.trips || [];
      console.log('📊 [TravelExpenses] Viagens recebidas:', tripsData.length);
      console.log('📋 [TravelExpenses] Dados das viagens:', tripsData);
      
      // Processar participants e calcular spent real das transações
      const processedTrips = tripsData.map((trip: any) => {
        // ✅ CORREÇÃO: Verificar se transactions está disponível
        const tripTransactions = Array.isArray(transactions) 
          ? transactions.filter((t: any) => t.tripId === trip.id)
          : [];
        
        const realSpent = tripTransactions.reduce((sum: number, t: any) => {
          return sum + Math.abs(Number(t.amount));
        }, 0);
        
        console.log(`💰 [TravelExpenses] Viagem ${trip.name}: ${tripTransactions.length} transações, gasto real: R$ ${realSpent}`);
        
        return {
          ...trip,
          participants: typeof trip.participants === 'string' 
            ? JSON.parse(trip.participants) 
            : (trip.participants || []),
          spent: realSpent // ✅ Usar gasto real calculado das transações
        };
      });
      
      console.log('✅ [TravelExpenses] Viagens processadas:', processedTrips.length);
      setTrips(processedTrips);
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar viagens do banco de dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter trips by date period
  const getFilteredTrips = () => {
    const allTrips = trips;

    if (selectedPeriod === 'all') return allTrips;

    // Convert trips to have date field for filtering
    const tripsWithDate = allTrips.map((trip) => ({
      ...trip,
      date: trip.startDate, // Use start date for filtering
    }));

    const filtered = filterByPeriod(
      tripsWithDate,
      selectedPeriod,
      customStartDate,
      customEndDate
    );
    return filtered;
  };

  const handleSave = async () => {
    // Recarregar viagens após salvar
    await loadTrips();
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setShowTripModal(true);
  };

  const handleDelete = async (trip: Trip) => {
    if (confirm(`Tem certeza que deseja excluir a viagem "${trip.name}"?`)) {
      try {
        const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

        if (!response.ok) {
          throw new Error('Erro ao excluir viagem');
        }

        await loadTrips();

        toast({
          title: 'Sucesso',
          description: 'Viagem excluída com sucesso!',
        });
      } catch (error) {
        console.error('Erro ao excluir viagem:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao excluir viagem',
          variant: 'destructive',
        });
      }
    }
  };

  const handleViewTrip = (trip: Trip) => {
    router.push(`/travel/${trip.id}`);
  };

  const updateTripStatus = async (trip: Trip) => {
    const today = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    let newStatus: Trip['status'];
    if (today < startDate) {
      newStatus = 'planned';
    } else if (today >= startDate && today <= endDate) {
      newStatus = 'active';
    } else {
      newStatus = 'completed';
    }

    if (newStatus !== trip.status) {
      try {
        const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'PUT',
        credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...trip, status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar status da viagem');
        }

        await loadTrips();
      } catch (error) {
        console.error('Erro ao atualizar status da viagem:', error);
      }
    }
  };

  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Trip['status']) => {
    switch (status) {
      case 'planned':
        return 'Planejada';
      case 'active':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      default:
        return 'Desconhecido';
    }
  };

  const getDaysUntilTrip = (startDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTripDuration = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }
      
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Retornar pelo menos 1 dia se as datas são válidas e a data final é >= data inicial
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      console.error('Erro ao calcular duração da viagem:', error);
      return 0;
    }
  };

  const getBudgetProgress = (spent: number | string, budget: number | string) => {
    const spentNum = Number(spent);
    const budgetNum = Number(budget);
    return Math.min((spentNum / budgetNum) * 100, 100);
  };

  const filteredTrips = getFilteredTrips();

  // Agrupar viagens baseado nas datas, não apenas no status
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const groupedTrips = {
    planned: filteredTrips.filter((t) => {
      if (t.startDate && t.endDate) {
        const startDate = new Date(t.startDate);
        startDate.setHours(0, 0, 0, 0);
        // Planejada = ainda não começou
        return now < startDate;
      }
      return t.status === 'planned';
    }),
    active: filteredTrips.filter((t) => {
      if (t.startDate && t.endDate) {
        const startDate = new Date(t.startDate);
        const endDate = new Date(t.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        // Ativa = está no período
        return now >= startDate && now <= endDate;
      }
      return t.status === 'active';
    }),
    completed: filteredTrips.filter((t) => {
      if (t.startDate && t.endDate) {
        const endDate = new Date(t.endDate);
        endDate.setHours(23, 59, 59, 999);
        // Concluída = já passou
        return now > endDate;
      }
      return t.status === 'completed';
    }),
  };

  // Auto-update trip statuses - REMOVIDO para evitar loop infinito
  // O status das viagens será atualizado quando necessário através de outros mecanismos
  // useEffect(() => {
  //   trips.forEach(updateTripStatus);
  // }, [trips]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Controle de Viagens
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Planeje e acompanhe suas viagens
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button
            onClick={() => setShowTripModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Viagem
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <CustomDateFilter
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartDateChange={setCustomStartDate}
              onCustomEndDateChange={setCustomEndDate}
              className="mb-4"
            />
          </CardContent>
        </Card>
      )}

      {trips.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Plane className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma viagem planejada
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Comece planejando sua próxima aventura!
            </p>
            <Button
              onClick={() => setShowTripModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Planejar Primeira Viagem
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">
              Em Andamento ({groupedTrips.active.length})
            </TabsTrigger>
            <TabsTrigger value="planned">
              Planejadas ({groupedTrips.planned.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídas ({groupedTrips.completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {groupedTrips.active.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma viagem em andamento
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {groupedTrips.active.map((trip) => (
                  <Card
                    key={trip.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewTrip(trip)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Plane className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            {trip.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusColor(trip.status)}>
                              {getStatusText(trip.status)}
                            </Badge>
                            <Badge variant="outline">
                              {getTripDuration(trip.startDate, trip.endDate)}{' '}
                              dias
                            </Badge>
                          </div>
                        </div>
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTrip(trip)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(trip)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{trip.destination}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString('pt-BR')}{' '}
                          - {new Date(trip.endDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Users className="w-4 h-4" />
                        <span>
                          {trip.participants?.length || 0} participante
                          {(trip.participants?.length || 0) > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Orçamento</span>
                          <span className="text-sm">
                            {trip.currency} {Number(trip.spent).toFixed(2)} /{' '}
                            {Number(trip.budget).toFixed(2)}
                          </span>
                        </div>
                        <Progress
                          value={getBudgetProgress(trip.spent, trip.budget)}
                          className="h-2"
                        />
                        {Number(trip.spent) > Number(trip.budget) && (
                          <div className="flex items-center gap-1 text-red-600 text-sm">
                            <AlertCircle className="w-3 h-3" />
                            Orçamento excedido
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="planned" className="space-y-4">
            {groupedTrips.planned.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma viagem planejada
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {groupedTrips.planned.map((trip) => {
                  const daysUntil = getDaysUntilTrip(trip.startDate);
                  return (
                    <Card
                      key={trip.id}
                      className="border-blue-500 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-900 hover:shadow-xl transition-all cursor-pointer"
                      onClick={() => handleViewTrip(trip)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-white">
                              <Plane className="w-5 h-5 text-white" />
                              {trip.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-white/20 text-white border-white/30">
                                {getStatusText(trip.status)}
                              </Badge>
                              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                                {getTripDuration(trip.startDate, trip.endDate)}{' '}
                                dias
                              </Badge>
                              {daysUntil > 0 && (
                                <Badge className="bg-yellow-400 text-blue-900 border-yellow-500 font-bold">
                                  {daysUntil} dia{daysUntil > 1 ? 's' : ''}{' '}
                                  restante{daysUntil > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div
                            className="flex gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/20"
                              onClick={() => handleViewTrip(trip)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/20"
                              onClick={() => handleEdit(trip)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-red-500/30"
                              onClick={() => handleDelete(trip)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-white">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{trip.destination}</span>
                        </div>

                        <div className="flex items-center gap-2 text-white/90">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(trip.startDate).toLocaleDateString(
                              'pt-BR'
                            )}{' '}
                            -{' '}
                            {new Date(trip.endDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-white/90">
                          <Users className="w-4 h-4" />
                          <span>
                            {trip.participants?.length || 0} participante
                            {(trip.participants?.length || 0) > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-white/90">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            Orçamento: {trip.currency} {Number(trip.budget).toFixed(2)}
                          </span>
                        </div>

                        {trip.description && (
                          <p className="text-sm text-white/80">
                            {trip.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {groupedTrips.completed.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma viagem concluída
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {groupedTrips.completed.map((trip) => (
                  <Card
                    key={trip.id}
                    className="border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewTrip(trip)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Plane className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            {trip.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusColor(trip.status)}>
                              {getStatusText(trip.status)}
                            </Badge>
                            <Badge variant="outline">
                              {getTripDuration(trip.startDate, trip.endDate)}{' '}
                              dias
                            </Badge>
                          </div>
                        </div>
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTrip(trip)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(trip)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{trip.destination}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString('pt-BR')}{' '}
                          - {new Date(trip.endDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Gasto Total
                          </span>
                          <span className="text-sm font-medium">
                            {trip.currency} {Number(trip.spent).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Orçamento
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {trip.currency} {Number(trip.budget).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {Number(trip.spent) <= Number(trip.budget) ? 'Economia' : 'Excesso'}
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              Number(trip.spent) <= Number(trip.budget)
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {trip.currency}{' '}
                            {Math.abs(trip.budget - trip.spent).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Modals */}
      {showTripModal && (
        <TripModal
          open={showTripModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowTripModal(false);
              setEditingTrip(null);
              // Recarregar trips após fechar modal
              loadTrips();
            }
          }}
          trip={editingTrip || null}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
