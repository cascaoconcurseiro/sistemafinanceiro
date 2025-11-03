'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  DollarSign,
  Calendar,
  Info
} from 'lucide-react';

interface IntelligenceDashboardProps {
  userId: string;
}

export function IntelligenceDashboard({ userId }: IntelligenceDashboardProps) {
  const [predictions, setPredictions] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntelligenceData();
  }, [userId]);

  const loadIntelligenceData = async () => {
    try {
      setLoading(true);

      // Carregar previsões
      const predRes = await fetch('/api/ml/predict-spending');
      if (predRes.ok) {
        const predData = await predRes.json();
        setPredictions(predData.prediction);
      }

      // Carregar alertas
      const alertRes = await fetch('/api/ml/alerts');
      if (alertRes.ok) {
        const alertData = await alertRes.json();
        setAlerts(alertData.alerts || []);
      }

      // Carregar sugestões
      const suggRes = await fetch('/api/ml/savings-suggestions');
      if (suggRes.ok) {
        const suggData = await suggRes.json();
        setSuggestions(suggData.suggestions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de inteligência:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas Inteligentes */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Inteligentes
            </CardTitle>
            <CardDescription>
              {alerts.length} alerta{alerts.length > 1 ? 's' : ''} requer{alerts.length > 1 ? 'em' : ''} sua atenção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <Alert 
                key={index}
                variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                className="border-l-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <AlertTitle className="flex items-center gap-2">
                      {alert.severity === 'critical' && <AlertTriangle className="h-4 w-4" />}
                      {alert.severity === 'warning' && <Info className="h-4 w-4" />}
                      {alert.title}
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      {alert.message}
                    </AlertDescription>
                    {alert.suggestedActions && alert.suggestedActions.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-medium">Ações sugeridas:</p>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {alert.suggestedActions.map((action: string, i: number) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Previsão de Gastos */}
      {predictions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Previsão de Gastos - {predictions.month} {predictions.year}
            </CardTitle>
            <CardDescription>
              Baseado no seu histórico de gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Previsto</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {predictions.totalPredicted.toFixed(2)}
                  </p>
                </div>
                <Badge variant="secondary">
                  {(predictions.confidence * 100).toFixed(0)}% confiança
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Por Categoria:</h4>
                {predictions.byCategory.slice(0, 5).map((cat: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{cat.category}</p>
                      <p className="text-sm text-gray-600">
                        R$ {cat.predictedAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {cat.trend === 'increasing' && (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                      {cat.trend === 'decreasing' && (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm text-gray-500">
                        {cat.trendPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sugestões de Economia */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Sugestões de Economia
            </CardTitle>
            <CardDescription>
              Economize até R$ {suggestions.reduce((sum, s) => sum + s.potentialSavings, 0).toFixed(2)}/mês
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}>
                      {suggestion.priority}
                    </Badge>
                    <Badge variant="outline">
                      {suggestion.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">
                      R$ {suggestion.potentialSavings.toFixed(2)}/mês
                    </span>
                  </div>
                  <span className="text-gray-500">
                    ({suggestion.savingsPercentage.toFixed(0)}% de economia)
                  </span>
                </div>

                {suggestion.actionSteps && suggestion.actionSteps.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Como fazer:</p>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600">
                      {suggestion.actionSteps.slice(0, 3).map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
