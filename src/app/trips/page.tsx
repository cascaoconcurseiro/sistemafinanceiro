'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModernAppLayout } from '@/components/modern-app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Target,
} from 'lucide-react';
import { TripModal } from '@/components/modals/trip-modal';
import { TravelExpenses } from '@/components/travel-expenses';
import { useTrips, useUnifiedFinancial } from '@/contexts/unified-financial-context';

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: 'planejamento' | 'andamento' | 'concluida' | 'planned' | 'active' | 'completed';
  expenses?: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
}

interface TravelStats {
  totalTrips: number;
  totalSpent: number;
  totalBudget: number;
  activeTrips: number;
  completedTrips: number;
  averageSpent: number;
  budgetUtilization: number;
}

export default function TripsPage() {
  const router = useRouter();
  const { trips } = useTrips(); // ✅ CORREÇÃO: Desestruturar o objeto retornado
  const { loading, transactions } = useUnifiedFinancial();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // ✅ CORREÇÃO: Função para determinar status baseado nas datas
  const getTripStatus = useCallback((startDate: string, endDate: string): 'planejamento' | 'andamento' | 'concluida' => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalizar para início do dia
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Fim do dia
    
    if (now < start) return 'planejamento';
    if (now >= start && now <= end) return 'andamento';
    return 'concluida';
  }, []);

  // ✅ CORREÇÃO: Calcular gastos reais da viagem a partir das transações
  const calculateTripSpent = useCallback((tripId: string): number => {
    return transactions
      .filter(t => t.tripId === tripId && t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  }, [transactions]);

  // ✅ CORREÇÃO: Atualizar trips com status e gastos calculados
  const tripsWithCalculatedData = useMemo(() => {
    return trips.map(trip => {
      const calculatedSpent = calculateTripSpent(trip.id);
      const calculatedStatus = getTripStatus(trip.startDate, trip.endDate);
      
      return {
        ...trip,
        spent: calculatedSpent,
        status: calculatedStatus
      };
    });
  }, [trips, calculateTripSpent, getTripStatus]);

  // ✅ AUTO-VINCULAR: Vincular transações automaticamente ao carregar
  useEffect(() => {
    const autoLinkAllTrips = async () => {
      for (const trip of trips) {
        const spent = calculateTripSpent(trip.id);
        
        // Se a viagem não tem gastos, tentar vincular automaticamente
        if (spent === 0) {
          try {
            console.log(`🔗 [TripsPage] Auto-vinculando transações para viagem: ${trip.name}`);
            
            const startDate = new Date(trip.startDate);
            const endDate = new Date(trip.endDate);
            
            const toLink = transactions
              .filter(t => {
                const transDate = new Date(t.date);
                return (
                  !t.tripId && 
                  t.type === 'expense' && 
                  transDate >= startDate && 
                  transDate <= endDate
                );
              })
              .map(t => t.id);
            
            if (toLink.length > 0) {
              const response = await fetch(`/api/trips/${trip.id}/link-transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ transactionIds: toLink }),
              });
              
              if (response.ok) {
                const result = await response.json();
                console.log(`✅ [TripsPage] ${result.linkedCount} transações vinculadas para ${trip.name}`);
                // Forçar atualização do contexto
                window.dispatchEvent(new CustomEvent('trip-updated'));
              }
            }
          } catch (error) {
            console.error(`❌ [TripsPage] Erro ao vincular transações para ${trip.name}:`, error);
          }
        }
      }
    };
    
    if (trips.length > 0 && transactions.length > 0) {
      autoLinkAllTrips();
    }
  }, [trips, transactions, calculateTripSpent]);

  // Calcular stats localmente usando useMemo
  const stats = useMemo<TravelStats>(() => {
    const totalTrips = tripsWithCalculatedData.length;
    const totalSpent = tripsWithCalculatedData.reduce((sum, trip) => sum + (Number(trip.spent) || 0), 0);
    const totalBudget = tripsWithCalculatedData.reduce((sum, trip) => sum + (Number(trip.budget) || 0), 0);
    
    // Normalizar status para comparação
    const normalizeStatus = (status: string) => {
      if (status === 'andamento' || status === 'active') return 'active';
      if (status === 'concluida' || status === 'completed') return 'completed';
      if (status === 'planejamento' || status === 'planned') return 'planned';
      return status;
    };
    
    const activeTrips = tripsWithCalculatedData.filter(trip => normalizeStatus(trip.status) === 'active').length;
    const completedTrips = tripsWithCalculatedData.filter(trip => normalizeStatus(trip.status) === 'completed').length;
    const averageSpent = totalTrips > 0 ? totalSpent / totalTrips : 0;
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalTrips,
      totalSpent,
      totalBudget,
      activeTrips,
      completedTrips,
      averageSpent,
      budgetUtilization,
    };
  }, [tripsWithCalculatedData]);

  const handleCreateTrip = () => {
    setSelectedTrip(null);
    setIsModalOpen(true);
  };

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsModalOpen(true);
  };

  const handleTripSaved = () => {
    setIsModalOpen(false);
    // Não precisa de loadTrips() - contexto atualiza automaticamente!
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejamento':
        return 'bg-blue-100 text-blue-800';
      case 'andamento':
        return 'bg-green-100 text-green-800';
      case 'concluida':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planejamento':
        return 'Planejamento';
      case 'andamento':
        return 'Em Andamento';
      case 'concluida':
        return 'Concluída';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <ModernAppLayout
      title="Gestão de Viagens"
      subtitle="Planeje e acompanhe suas viagens e gastos"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Button onClick={handleCreateTrip} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Nova Viagem
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Viagens</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plane className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Gasto</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalSpent)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orçamento Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalBudget)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilização do Orçamento</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.budgetUtilization.toFixed(1)}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trips List */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Todas as Viagens</TabsTrigger>
            <TabsTrigger value="planning">Planejamento</TabsTrigger>
            <TabsTrigger value="active">Em Andamento</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {tripsWithCalculatedData.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma viagem encontrada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comece criando sua primeira viagem para acompanhar gastos e planejamento.
                  </p>
                  <Button onClick={handleCreateTrip}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Viagem
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tripsWithCalculatedData.map((trip) => (
                  <Card key={trip.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{trip.name}</CardTitle>
                          <div className="flex items-center text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm">{trip.destination}</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(trip.status)}>
                          {getStatusText(trip.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Gasto</span>
                            <span className="font-medium">{formatCurrency(trip.spent)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Orçamento</span>
                            <span className="font-medium">{formatCurrency(trip.budget)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((trip.spent / trip.budget) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>
                              {((trip.spent / trip.budget) * 100).toFixed(1)}% utilizado
                            </span>
                            <span>
                              {formatCurrency(trip.budget - trip.spent)} restante
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTrip(trip)}
                            className="flex-1"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/travel/${trip.id}`)}
                            className="flex-1"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="planning">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tripsWithCalculatedData
                .filter((trip) => trip.status === 'planejamento')
                .map((trip) => (
                  <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{trip.name}</CardTitle>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{trip.destination}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Orçamento:</span>
                          <span className="font-medium">{formatCurrency(trip.budget)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tripsWithCalculatedData
                .filter((trip) => trip.status === 'andamento')
                .map((trip) => (
                  <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{trip.name}</CardTitle>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{trip.destination}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Gasto:</span>
                          <span className="font-medium">{formatCurrency(trip.spent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Orçamento:</span>
                          <span className="font-medium">{formatCurrency(trip.budget)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tripsWithCalculatedData
                .filter((trip) => trip.status === 'concluida')
                .map((trip) => (
                  <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{trip.name}</CardTitle>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{trip.destination}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Total Gasto:</span>
                          <span className="font-medium">{formatCurrency(trip.spent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Orçamento:</span>
                          <span className="font-medium">{formatCurrency(trip.budget)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {trip.spent <= trip.budget ? (
                            <span className="text-green-600">✓ Dentro do orçamento</span>
                          ) : (
                            <span className="text-red-600">
                              ⚠ {formatCurrency(trip.spent - trip.budget)} acima do orçamento
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Trip Modal */}
      <TripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trip={selectedTrip}
        onSave={handleTripSaved}
      />
    </ModernAppLayout>
  );
}
