'use client';

import React, { useState, useEffect } from 'react';
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
import { TripModal } from '@/components/features/travel/trip-modal';
import { TravelExpenses } from '@/components/travel-expenses';
import { storage } from '@/lib/storage';

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: 'planejamento' | 'andamento' | 'concluida';
  expenses: Array<{
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
  plannedTrips: number;
  completedTrips: number;
}

export default function TravelPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState<TravelStats>({
    totalTrips: 0,
    totalSpent: 0,
    totalBudget: 0,
    activeTrips: 0,
    plannedTrips: 0,
    completedTrips: 0,
  });
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const response = await fetch('/api/trips', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar viagens: ${response.statusText}`);
      }

      const allTrips = await response.json();
      
      // Convert string values to numbers for calculations
      const processedTrips = allTrips.map((trip: any) => ({
        ...trip,
        budget: Number(trip.budget) || 0,
        spent: Number(trip.spent) || 0,
      }));
      
      setTrips(processedTrips);

      // Calculate statistics
      const totalSpent = processedTrips.reduce((sum: number, trip: any) => sum + trip.spent, 0);
      const totalBudget = processedTrips.reduce((sum: number, trip: any) => sum + trip.budget, 0);
      const activeTrips = processedTrips.filter(
        (trip: any) => trip.status === 'active'
      ).length;
      const plannedTrips = processedTrips.filter(
        (trip: any) => trip.status === 'planned'
      ).length;
      const completedTrips = processedTrips.filter(
        (trip: any) => trip.status === 'completed'
      ).length;

      setStats({
        totalTrips: processedTrips.length,
        totalSpent,
        totalBudget,
        activeTrips,
        plannedTrips,
        completedTrips,
      });
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
      // Fallback para localStorage se a API falhar
      const allTrips = storage.getTrips();
      setTrips(allTrips);

      // Calculate statistics with fallback data
      const totalSpent = allTrips.reduce((sum, trip) => sum + trip.spent, 0);
      const totalBudget = allTrips.reduce((sum, trip) => sum + trip.budget, 0);
      const activeTrips = allTrips.filter(
        (trip) => trip.status === 'andamento'
      ).length;
      const plannedTrips = allTrips.filter(
        (trip) => trip.status === 'planejamento'
      ).length;
      const completedTrips = allTrips.filter(
        (trip) => trip.status === 'finalizada'
      ).length;

      setStats({
        totalTrips: allTrips.length,
        totalSpent,
        totalBudget,
        activeTrips,
        plannedTrips,
        completedTrips,
      });
    }
  };

  const quickStats = [
    {
      title: 'Total de Viagens',
      value: stats.totalTrips.toString(),
      description: 'Viagens registradas',
      icon: Plane,
      color: 'text-blue-600',
    },
    {
      title: 'Gasto Total',
      value: `R$ ${stats.totalSpent.toFixed(2)}`,
      description: 'Em todas as viagens',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Viagens Ativas',
      value: stats.activeTrips.toString(),
      description: 'Acontecendo agora',
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      title: 'Taxa de Economia',
      value:
        stats.totalBudget > 0
          ? `${(((stats.totalBudget - stats.totalSpent) / stats.totalBudget) * 100).toFixed(1)}%`
          : '0%',
      description: 'Economia vs orçamento',
      icon: Target,
      color:
        stats.totalSpent <= stats.totalBudget
          ? 'text-green-600'
          : 'text-red-600',
    },
  ];

  if (!isClient) {
    return (
      <ModernAppLayout
        title="Viagens"
        subtitle="Planeje e gerencie os gastos das suas viagens"
      >
        <div className="p-4 md:p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ModernAppLayout>
    );
  }

  return (
    <ModernAppLayout
      title="Viagens"
      subtitle="Planeje e gerencie os gastos das suas viagens"
    >
      <div className="p-4 md:p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Gestão de Viagens
                </h1>
                <p className="text-muted-foreground">
                  Planeje, acompanhe e gerencie todas as suas viagens
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Viagem
                </Button>
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-600"
                >
                  <Plane className="w-4 h-4 mr-1" />
                  Sistema de Viagens
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Travel Management Tabs */}
          <Tabs defaultValue="trips" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="trips" className="flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Minhas Viagens
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Transações
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="planning" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Planejamento
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Análises
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trips" className="space-y-6">
              <TravelExpenses />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transações de Viagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Visualize e gerencie todas as transações relacionadas às suas viagens.
                  </p>
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Funcionalidade de transações em desenvolvimento
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo das Viagens</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Visão geral de todas as suas viagens planejadas, ativas e
                    concluídas.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.plannedTrips}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Planejadas
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.activeTrips}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Ativas
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {stats.completedTrips}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Concluídas
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="planning" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ferramentas de Planejamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Funcionalidades avançadas de planejamento em
                    desenvolvimento.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Roteiro Inteligente</h4>
                      <p className="text-sm text-muted-foreground">
                        Crie roteiros otimizados com base em suas preferências
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Checklist Automático</h4>
                      <p className="text-sm text-muted-foreground">
                        Lista de tarefas personalizada para cada viagem
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Travel Reports Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Relatórios de Viagem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Acesse relatórios detalhados de suas viagens, análises de
                    gastos e insights financeiros.
                  </p>
                  <Button
                    onClick={() => router.push('/reports')}
                    className="w-full"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Relatórios Completos
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Análises de Viagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Resumo Financeiro</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Orçamento Total:</span>
                          <span className="text-sm font-medium">
                            R$ {stats.totalBudget.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Gasto Total:</span>
                          <span className="text-sm font-medium">
                            R$ {stats.totalSpent.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Economia:</span>
                          <span
                            className={`text-sm font-medium ${
                              stats.totalSpent <= stats.totalBudget
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            R${' '}
                            {Math.abs(
                              stats.totalBudget - stats.totalSpent
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Status das Viagens</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Planejadas:</span>
                          <Badge variant="outline">{stats.plannedTrips}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Ativas:</span>
                          <Badge variant="default">{stats.activeTrips}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Concluídas:</span>
                          <Badge variant="secondary">
                            {stats.completedTrips}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Trip Modal */}
      <TripModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            loadTrips();
          }
        }}
        onSave={() => {
          setIsModalOpen(false);
          loadTrips();
        }}
      />
    </ModernAppLayout>
  );
}
