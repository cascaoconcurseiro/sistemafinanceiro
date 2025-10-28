'use client';

import { useState, useEffect, useMemo } from 'react';
import { clientDatabaseService } from '@/lib/services/client-database-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Plus,
  Route,
  MapPin,
  Clock,
  Camera,
  Utensils,
  Building,
  Navigation,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import type { Trip } from '@/lib/storage';
import { QuickItineraryCreator } from './quick-itinerary-creator';
import { ItineraryProgress } from './itinerary-progress';

interface ItineraryItem {
  id: string;
  date: string;
  time?: string;
  title: string;
  description: string;
  location: string;
  type: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'activity';
  duration?: number;
  cost?: number;
  notes?: string;
  order: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

interface TripItineraryProps {
  trip: Trip;
  onUpdate?: () => void;
}

export function TripItinerary({ trip, onUpdate }: TripItineraryProps) {
  const [showQuickCreator, setShowQuickCreator] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(() => {
    if (trip.startDate) {
      const startDateStr = typeof trip.startDate === 'string' 
        ? trip.startDate.split('T')[0] 
        : new Date(trip.startDate).toISOString().split('T')[0];
      console.log('🎯 [TripItinerary] Data inicial definida:', startDateStr);
      return startDateStr;
    }
    const today = new Date().toISOString().split('T')[0];
    console.log('🎯 [TripItinerary] Usando data atual:', today);
    return today;
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    if (trip.startDate) {
      const startDateStr = typeof trip.startDate === 'string' 
        ? trip.startDate.split('T')[0] 
        : new Date(trip.startDate).toISOString().split('T')[0];
      return startDateStr;
    }
    return new Date().toISOString().split('T')[0];
  });
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadItinerary();
    }
  }, [trip.id, isMounted]);

  const loadItinerary = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      console.log('🔄 [TripItinerary] Carregando itinerário para trip:', trip.id);
      const response = await fetch(`/api/itinerary?tripId=${trip.id}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [TripItinerary] Itinerário carregado:', data.length, 'itens');
        
        // Verificar se há dados locais salvos
        const localKey = `itinerary_${trip.id}`;
        const localData = localStorage.getItem(localKey);
        
        if (localData) {
          try {
            const localItinerary = JSON.parse(localData);
            console.log('📱 [TripItinerary] Dados locais encontrados, mesclando...');
            
            // Mesclar dados da API com alterações locais
            const mergedData = data.map((apiItem: ItineraryItem) => {
              const localItem = localItinerary.find((local: ItineraryItem) => local.id === apiItem.id);
              return localItem || apiItem;
            });
            
            setItinerary(mergedData);
          } catch (parseError) {
            console.error('❌ Erro ao parsear dados locais:', parseError);
            setItinerary(data);
          }
        } else {
          setItinerary(data);
        }
      } else {
        console.error('❌ [TripItinerary] Erro ao carregar itinerário:', response.statusText);
        setItinerary([]);
      }
    } catch (error) {
      console.error('❌ [TripItinerary] Erro ao carregar itinerário:', error);
      setItinerary([]);
    }
  };

  const getTypeIcon = (type: ItineraryItem['type']) => {
    switch (type) {
      case 'attraction':
        return <Camera className="w-4 h-4" />;
      case 'restaurant':
        return <Utensils className="w-4 h-4" />;
      case 'hotel':
        return <Building className="w-4 h-4" />;
      case 'transport':
        return <Navigation className="w-4 h-4" />;
      case 'activity':
        return <MapPin className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: ItineraryItem['type']) => {
    switch (type) {
      case 'attraction':
        return 'bg-blue-100 text-blue-800';
      case 'restaurant':
        return 'bg-orange-100 text-orange-800';
      case 'hotel':
        return 'bg-purple-100 text-purple-800';
      case 'transport':
        return 'bg-green-100 text-green-800';
      case 'activity':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDatesInRange = useMemo(() => {
    // Se há datas de início e fim da viagem, usar esse período
    if (trip.startDate && trip.endDate) {
      // Converter as datas corretamente
      const startDate = typeof trip.startDate === 'string' 
        ? trip.startDate.split('T')[0] 
        : new Date(trip.startDate).toISOString().split('T')[0];
      const endDate = typeof trip.endDate === 'string' 
        ? trip.endDate.split('T')[0] 
        : new Date(trip.endDate).toISOString().split('T')[0];
        
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      const dates = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }
      
      return dates;
    }
    
    // Caso contrário, usar as datas dos itens existentes
    if (itinerary.length === 0) {
      return [];
    }
    
    // Extrair datas únicas dos itens
    const uniqueDates = [...new Set(itinerary.map(item => {
      const itemDate = typeof item.date === 'string' 
        ? item.date.split('T')[0] 
        : new Date(item.date).toISOString().split('T')[0];
      return itemDate;
    }))].sort();
    
    return uniqueDates;
  }, [trip.startDate, trip.endDate, itinerary.length]);

  // Atualizar data atual quando itinerário carregar
  useEffect(() => {
    if (getDatesInRange.length > 0) {
      // Se a data atual não está nas datas disponíveis, usar a primeira data disponível
      if (!getDatesInRange.includes(currentViewDate)) {
        setCurrentViewDate(getDatesInRange[0]);
      }
    }
  }, [getDatesInRange, currentViewDate]);

  const getItemsByDate = (date: string) => {
    const items = itinerary.filter((item) => {
      // Normalizar as datas para comparação
      const itemDate = typeof item.date === 'string' 
        ? item.date.split('T')[0] 
        : new Date(item.date).toISOString().split('T')[0];
      
      return itemDate === date;
    });
    
    return items.sort((a, b) => {
      // Primeiro ordena por order, depois por time
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const handleEditItem = (item: ItineraryItem) => {
    // TODO: Implementar edição inline ou modal simples
    console.log('Editar item:', item);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/itinerary?id=${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Recarregar itinerário da API
        await loadItinerary();
        onUpdate?.();
      } else {
        const errorData = await response.json();
        console.error('Erro ao deletar item:', errorData.error);
      }
    } catch (error) {
      console.error('Erro ao deletar item:', error);
    }
  };

  const moveItemUp = async (itemId: string, date: string) => {
    const dayItems = getItemsByDate(date);
    const itemIndex = dayItems.findIndex((item) => item.id === itemId);

    if (itemIndex > 0) {
      const currentItem = dayItems[itemIndex];
      const previousItem = dayItems[itemIndex - 1];

      try {
        // Atualizar ordem do item atual
        await fetch(`/api/itinerary?id=${currentItem.id}`, {
        method: 'PUT',
        credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tripId: trip.id,
            date: currentItem.date,
            title: currentItem.title,
            description: currentItem.description,
            location: currentItem.location,
            type: currentItem.type,
            time: currentItem.time,
            duration: currentItem.duration,
            cost: currentItem.cost,
            notes: currentItem.notes,
            order: previousItem.order,
          }),
        });

        // Atualizar ordem do item anterior
        await fetch(`/api/itinerary?id=${previousItem.id}`, {
        method: 'PUT',
        credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tripId: trip.id,
            date: previousItem.date,
            title: previousItem.title,
            description: previousItem.description,
            location: previousItem.location,
            type: previousItem.type,
            time: previousItem.time,
            duration: previousItem.duration,
            cost: previousItem.cost,
            notes: previousItem.notes,
            order: currentItem.order,
          }),
        });

        // Recarregar itinerário
        await loadItinerary();
        onUpdate?.();
      } catch (error) {
        console.error('Erro ao mover item para cima:', error);
      }
    }
  };

  const moveItemDown = async (itemId: string, date: string) => {
    const dayItems = getItemsByDate(date);
    const itemIndex = dayItems.findIndex((item) => item.id === itemId);

    if (itemIndex < dayItems.length - 1) {
      const currentItem = dayItems[itemIndex];
      const nextItem = dayItems[itemIndex + 1];

      try {
        // Atualizar ordem do item atual
        await fetch(`/api/itinerary?id=${currentItem.id}`, {
        method: 'PUT',
        credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tripId: trip.id,
            date: currentItem.date,
            title: currentItem.title,
            description: currentItem.description,
            location: currentItem.location,
            type: currentItem.type,
            time: currentItem.time,
            duration: currentItem.duration,
            cost: currentItem.cost,
            notes: currentItem.notes,
            order: nextItem.order,
          }),
        });

        // Atualizar ordem do próximo item
        await fetch(`/api/itinerary?id=${nextItem.id}`, {
        method: 'PUT',
        credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tripId: trip.id,
            date: nextItem.date,
            title: nextItem.title,
            description: nextItem.description,
            location: nextItem.location,
            type: nextItem.type,
            time: nextItem.time,
            duration: nextItem.duration,
            cost: nextItem.cost,
            notes: nextItem.notes,
            order: currentItem.order,
          }),
        });

        // Recarregar itinerário
        await loadItinerary();
        onUpdate?.();
      } catch (error) {
        console.error('Erro ao mover item para baixo:', error);
      }
    }
  };

  const toggleItemCompleted = async (itemId: string) => {
    // Evitar cliques duplos
    if (loadingItems.has(itemId)) {
      console.log('⏳ Item já está sendo processado:', itemId);
      return;
    }

    try {
      const item = itinerary.find(i => i.id === itemId);
      if (!item) {
        console.error('❌ Item não encontrado:', itemId);
        return;
      }

      const newCompletedStatus = !item.completed;
      console.log('🔄 [Frontend] Toggle local:', {
        id: itemId,
        title: item.title,
        currentStatus: item.completed,
        newStatus: newCompletedStatus
      });

      // Atualizar estado local imediatamente
      const updatedItinerary = itinerary.map(i => 
        i.id === itemId 
          ? { 
              ...i, 
              completed: newCompletedStatus, 
              completedAt: newCompletedStatus ? new Date().toISOString() : undefined 
            }
          : i
      );
      setItinerary(updatedItinerary);
      
      // Salvar no localStorage para persistir
      const localKey = `itinerary_${trip.id}`;
      localStorage.setItem(localKey, JSON.stringify(updatedItinerary));
      
      console.log('✅ [Frontend] Estado local e localStorage atualizados');
      
      // Chamar onUpdate para atualizar outros componentes
      onUpdate?.();

      // Tentar sincronizar com API em background (sem bloquear UI)
      try {
        const response = await fetch(`/api/itinerary-simple`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: itemId,
            completed: newCompletedStatus,
          }),
        });

        if (response.ok) {
          console.log('✅ [Frontend] Sincronizado com API');
          // Limpar dados locais após sincronização bem-sucedida
          localStorage.removeItem(localKey);
        } else {
          console.log('⚠️ [Frontend] API falhou, mantendo dados locais');
        }
      } catch (apiError) {
        console.log('⚠️ [Frontend] Erro de API, mantendo dados locais:', apiError);
      }
      
    } catch (error) {
      console.error('❌ [Frontend] Erro no toggle local:', error);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentIndex = getDatesInRange.indexOf(currentViewDate);
    
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentViewDate(getDatesInRange[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < getDatesInRange.length - 1) {
      setCurrentViewDate(getDatesInRange[currentIndex + 1]);
    }
  };

  const getCurrentDayNumber = () => {
    return getDatesInRange.indexOf(currentViewDate) + 1;
  };

  const canNavigatePrev = () => {
    return getDatesInRange.indexOf(currentViewDate) > 0;
  };

  const canNavigateNext = () => {
    const currentIndex = getDatesInRange.indexOf(currentViewDate);
    return currentIndex < getDatesInRange.length - 1;
  };



  return (
    <div className="space-y-6">
      {/* Componente de Progresso */}
      <ItineraryProgress 
        itinerary={itinerary}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
      />
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Roteiro da Viagem ({itinerary.length} itens)
              {itinerary.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {itinerary.filter(item => item.completed).length}/{itinerary.length} concluídos
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowQuickCreator(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Verificar se há período definido para a viagem */}
          {!trip.startDate || !trip.endDate ? (
            <Card className="p-6 border-dashed border-yellow-300 bg-yellow-50">
              <div className="text-center py-4 text-yellow-700">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-yellow-900 mb-2">
                  Período da viagem não definido
                </h3>
                <p className="text-sm text-yellow-700 mb-4">
                  Para usar o roteiro, defina as datas de início e fim da viagem nas configurações.
                </p>
                <Button
                  onClick={() => {
                    // Aqui você pode implementar navegação para configurações
                    console.log('Navegar para configurações da viagem');
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar Datas
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Navegação de Datas - Sempre mostrar se há datas disponíveis */}
              {getDatesInRange.length > 0 && (
            <div className="space-y-4">
              {/* Seletor de Data */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Visualizar dia:</label>
                    <select
                      value={currentViewDate}
                      onChange={(e) => setCurrentViewDate(e.target.value)}
                      className="ml-2 px-3 py-1 border rounded-md text-sm bg-white"
                    >
                      {getDatesInRange.map((date, index) => {
                        const dayItems = getItemsByDate(date);
                        const dayNumber = index + 1;
                        return (
                          <option key={date} value={date}>
                            Dia {dayNumber} - {formatDate(date)} ({dayItems.length} {dayItems.length === 1 ? 'item' : 'itens'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                
                {getDatesInRange.length > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('prev')}
                      disabled={!canNavigatePrev()}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate('next')}
                      disabled={!canNavigateNext()}
                      className="flex items-center gap-2"
                    >
                      Próximo
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Título do Dia Atual */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="px-3 py-1">
                    Dia {getCurrentDayNumber()}
                  </Badge>
                  <h3 className="font-semibold text-xl capitalize">
                    {formatDate(currentViewDate)}
                  </h3>
                  <Badge variant="secondary" className="px-2 py-1">
                    {getItemsByDate(currentViewDate).length} {getItemsByDate(currentViewDate).length === 1 ? 'item' : 'itens'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Roteiro do Dia Atual */}
          <div className="space-y-6">
            {(() => {
              const dayItems = getItemsByDate(currentViewDate);
              
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDate(currentViewDate);
                        setShowQuickCreator(true);
                      }}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar Item
                    </Button>
                  </div>

                  {dayItems.length === 0 ? (
                    <Card className="p-6 border-dashed border-gray-300">
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhuma atividade planejada para este dia
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Comece a planejar suas atividades para {formatDate(currentViewDate)}
                        </p>
                        <Button
                          onClick={() => {
                            setSelectedDate(currentViewDate);
                            setShowQuickCreator(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeira Atividade
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {dayItems.map((item, index) => (
                        <Card key={item.id} className={`p-4 ${item.completed ? 'bg-green-50 border-green-200' : ''}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleItemCompleted(item.id)}
                                className="h-6 w-6 p-0 mt-1"
                                disabled={loadingItems.has(item.id)}
                                title={
                                  loadingItems.has(item.id) 
                                    ? "Processando..." 
                                    : item.completed 
                                      ? "Marcar como não concluído" 
                                      : "Marcar como concluído"
                                }
                              >
                                {loadingItems.has(item.id) ? (
                                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                ) : item.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400 hover:text-green-500" />
                                )}
                              </Button>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={getTypeColor(item.type)}>
                                    {getTypeIcon(item.type)}
                                    <span className="ml-1 capitalize">
                                      {item.type}
                                    </span>
                                  </Badge>
                                  {item.time && (
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <Clock className="w-3 h-3" />
                                      {item.time}
                                    </div>
                                  )}
                                  {item.duration && (
                                    <span className="text-sm text-gray-500">
                                      {item.duration}h
                                    </span>
                                  )}
                                  {item.completed && (
                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                      <Check className="w-3 h-3 mr-1" />
                                      Concluído
                                    </Badge>
                                  )}
                                </div>
                                <h5 className={`font-medium mb-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                                  {item.title}
                                </h5>
                                {item.location && (
                                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className={item.completed ? 'text-gray-400' : ''}>{item.location}</span>
                                  </div>
                                )}
                                {item.description && (
                                  <p className={`text-sm mb-2 ${item.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {item.description}
                                  </p>
                                )}
                                {item.cost && typeof item.cost === 'number' && item.cost > 0 && (
                                  <div className={`text-sm font-medium ${item.completed ? 'text-gray-400' : 'text-green-600'}`}>
                                    R$ {item.cost.toFixed(2)}
                                  </div>
                                )}
                                {item.notes && (
                                  <p className={`text-xs mt-2 italic ${item.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {item.notes}
                                  </p>
                                )}
                                {item.completed && item.completedAt && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Concluído em {new Date(item.completedAt).toLocaleString('pt-BR')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 ml-4">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveItemUp(item.id, item.date)}
                                  disabled={index === 0}
                                  className="h-6 w-6 p-0"
                                  title="Mover para cima"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    moveItemDown(item.id, item.date)
                                  }
                                  disabled={index === dayItems.length - 1}
                                  className="h-6 w-6 p-0"
                                  title="Mover para baixo"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditItem(item)}
                                  className="h-6 w-6 p-0"
                                  title="Editar"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          </>
          )}


        </CardContent>
      </Card>

      {showQuickCreator && (
        <QuickItineraryCreator
          trip={trip}
          selectedDate={selectedDate}
          onClose={() => setShowQuickCreator(false)}
          onUpdate={() => {
            loadItinerary();
            onUpdate?.();
          }}
        />
      )}
    </div>
  );
}
