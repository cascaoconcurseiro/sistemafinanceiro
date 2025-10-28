'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  MapPin, 
  TrendingUp,
  Calendar
} from 'lucide-react';

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

interface ItineraryProgressProps {
  itinerary: ItineraryItem[];
  tripStartDate?: string;
  tripEndDate?: string;
}

export function ItineraryProgress({ 
  itinerary, 
  tripStartDate, 
  tripEndDate 
}: ItineraryProgressProps) {
  const totalItems = itinerary.length;
  const completedItems = itinerary.filter(item => item.completed).length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Estatísticas por tipo
  const typeStats = itinerary.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = { total: 0, completed: 0 };
    }
    acc[item.type].total++;
    if (item.completed) {
      acc[item.type].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  // Estatísticas por data
  const dateStats = itinerary.reduce((acc, item) => {
    const date = item.date.split('T')[0];
    if (!acc[date]) {
      acc[date] = { total: 0, completed: 0 };
    }
    acc[date].total++;
    if (item.completed) {
      acc[date].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const getTypeLabel = (type: string) => {
    const labels = {
      attraction: 'Atrações',
      restaurant: 'Restaurantes',
      hotel: 'Hotéis',
      transport: 'Transporte',
      activity: 'Atividades'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      attraction: 'bg-blue-100 text-blue-800',
      restaurant: 'bg-orange-100 text-orange-800',
      hotel: 'bg-purple-100 text-purple-800',
      transport: 'bg-green-100 text-green-800',
      activity: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Progresso do Roteiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progresso Geral */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-sm text-gray-600">
              {completedItems}/{totalItems} itens
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Estatísticas por Tipo */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Por Categoria
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(typeStats).map(([type, stats]) => (
              <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge className={`${getTypeColor(type)} text-xs`}>
                    {getTypeLabel(type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span>{stats.completed}/{stats.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estatísticas por Data */}
        {Object.keys(dateStats).length > 1 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Por Dia
            </h4>
            <div className="space-y-2">
              {Object.entries(dateStats)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, stats]) => {
                  const dayProgress = (stats.completed / stats.total) * 100;
                  return (
                    <div key={date} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">
                          {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </span>
                        <span className="text-gray-600">
                          {stats.completed}/{stats.total}
                        </span>
                      </div>
                      <Progress value={dayProgress} className="h-1" />
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Resumo de Status */}
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
          <div className="flex items-center gap-2">
            {progressPercentage === 100 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Clock className="w-5 h-5 text-blue-600" />
            )}
            <span className="font-medium">
              {progressPercentage === 100 
                ? 'Roteiro Completo!' 
                : `${totalItems - completedItems} itens restantes`
              }
            </span>
          </div>
          <Badge 
            variant={progressPercentage === 100 ? "default" : "secondary"}
            className={progressPercentage === 100 ? "bg-green-600" : ""}
          >
            {Math.round(progressPercentage)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}