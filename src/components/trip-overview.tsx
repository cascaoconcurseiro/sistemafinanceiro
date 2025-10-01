'use client';

import { useState, useEffect } from 'react';
import { databaseService } from '../lib/services/database-service';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Route,
} from 'lucide-react';
import type { Trip } from '../lib/storage';
import {
  useAccounts,
  useTransactions,
  useGoals,
  useContacts,
} from '../contexts/unified-context-simple';

interface TripOverviewProps {
  trip: Trip;
}

export function TripOverview({ trip }: TripOverviewProps) {
  const { transactions } = useTransactions();
  const [expenses, setExpenses] = useState(0);
  const [documentsProgress, setDocumentsProgress] = useState(0);
  const [checklistProgress, setChecklistProgress] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);
  const [itineraryCount, setItineraryCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && transactions.length >= 0) {
      loadTripData();
    }
  }, [trip.id, isMounted, transactions]);

  const loadTripData = async () => {
    // Carregar gastos
    const tripExpenses = transactions.filter(
      (t) => (t as any).tripId === trip.id
    );
    const totalExpenses = tripExpenses.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    setExpenses(totalExpenses);

    // Carregar dados do itinerário via API
    try {
      const response = await fetch(`/api/itinerary?tripId=${trip.id}`);
      if (response.ok) {
        const itineraryData = await response.json();
        setItineraryCount(itineraryData.length);
      } else {
        console.error('Erro ao carregar itinerário:', response.statusText);
        setItineraryCount(0);
      }
    } catch (error) {
      console.error('Erro ao carregar itinerário:', error);
      setItineraryCount(0);
    }

    // TODO: Implementar APIs para documentos, checklist e fotos
    // Por enquanto, usar valores padrão
    setDocumentsProgress(0);
    setChecklistProgress(0);
    setPhotosCount(0);
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

  const getTripDuration = () => {
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      
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

  const getDaysUntilTrip = () => {
    const today = new Date();
    const start = new Date(trip.startDate);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBudgetProgress = () => {
    return Math.min((expenses / trip.budget) * 100, 100);
  };

  const daysUntil = getDaysUntilTrip();
  const duration = getTripDuration();
  const budgetProgress = getBudgetProgress();

  return (
    <div className="space-y-6">
      {/* Header da Viagem */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Plane className="w-8 h-8 text-blue-600" />
                {trip.name}
              </CardTitle>
              <div className="flex items-center gap-4 mt-3">
                <Badge
                  className={getStatusColor(trip.status)}
                  variant="secondary"
                >
                  {getStatusText(trip.status)}
                </Badge>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-100">
                  <MapPin className="w-4 h-4" />
                  <span>{trip.destination}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-100">
                  <Clock className="w-4 h-4" />
                  <span>{duration} dias</span>
                </div>
              </div>
            </div>
            {trip.status === 'planned' && daysUntil > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {daysUntil}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-100">
                  dias restantes
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <div className="font-medium">Período</div>
                <div className="text-sm text-gray-600 dark:text-gray-100">
                  {new Date(trip.startDate).toLocaleDateString('pt-BR')} -{' '}
                  {new Date(trip.endDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <div className="font-medium">Participantes</div>
                <div className="text-sm text-gray-600 dark:text-gray-100">
                  {(Array.isArray(trip.participants) ? trip.participants : ['Você']).length} pessoa
              {(Array.isArray(trip.participants) ? trip.participants : ['Você']).length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <div className="font-medium">Orçamento</div>
                <div className="text-sm text-gray-600 dark:text-gray-100">
                  {trip.currency} {Number(trip.budget).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          {trip.description && (
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-700 dark:text-gray-100">{trip.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gasto</p>
                <p className="text-xl font-bold text-red-600">
                  {trip.currency} {expenses.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Documentos</p>
                <p className="text-xl font-bold text-blue-600">
                  {documentsProgress.toFixed(0)}%
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checklist</p>
                <p className="text-xl font-bold text-green-600">
                  {checklistProgress.toFixed(0)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Roteiro</p>
                <p className="text-xl font-bold text-purple-600">
                  {itineraryCount} itens
                </p>
              </div>
              <Route className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso do Orçamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Controle de Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Progresso dos Gastos</span>
            <span className="text-sm text-gray-600 dark:text-gray-100">
              {trip.currency} {expenses.toFixed(2)} / {Number(trip.budget).toFixed(2)}
            </span>
          </div>
          <Progress value={budgetProgress} className="h-3" />
          <div className="flex justify-between text-sm">
            <span
              className={
                budgetProgress > 100 ? 'text-red-600' : 'text-gray-600 dark:text-gray-100'
              }
            >
              {budgetProgress.toFixed(1)}% utilizado
            </span>
            <span
              className={
                expenses > trip.budget ? 'text-red-600' : 'text-green-600'
              }
            >
              {expenses <= trip.budget
                ? 'Dentro do orçamento'
                : `Excedeu em ${trip.currency} ${(expenses - trip.budget).toFixed(2)}`}
            </span>
          </div>
          {expenses > trip.budget && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">Atenção: Orçamento excedido!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progresso das Tarefas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Progresso</span>
                <span className="text-sm text-gray-600 dark:text-gray-100">
                  {documentsProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={documentsProgress} className="h-2" />
              <p className="text-sm text-gray-600 dark:text-gray-100">
                {documentsProgress === 100
                  ? 'Todos os documentos prontos!'
                  : 'Alguns documentos ainda precisam ser preparados'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Progresso</span>
                <span className="text-sm text-gray-600 dark:text-gray-100">
                  {checklistProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={checklistProgress} className="h-2" />
              <p className="text-sm text-gray-600 dark:text-gray-100">
                {checklistProgress === 100
                  ? 'Checklist completo!'
                  : 'Ainda há itens pendentes no checklist'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participantes da Viagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(Array.isArray(trip.participants) ? trip.participants : ['Você']).map((participant, index) => (
              <div
                key={`participant-${participant}-${index}`}
                className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                    {participant === 'Você'
                      ? 'EU'
                      : participant
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{participant}</span>
                {participant === 'Você' && (
                  <Badge variant="outline" className="text-xs">
                    Organizador
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
