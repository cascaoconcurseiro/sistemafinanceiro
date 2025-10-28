'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsServices } from '@/hooks/use-analytics-services';
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface TrendData {
  category: string;
  average3Months: number;
  average6Months: number;
  average12Months: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

interface ForecastData {
  month: string;
  predictedBalance: number;
  predictedIncome: number;
  predictedExpenses: number;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  console.log('Session:', session); // Para evitar warning de variável não usada
  const { getTrends, getForecast, isLoading } = useAnalyticsServices();
  console.log('Loading:', isLoading); // Para evitar warning
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<3 | 6 | 12>(6);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      const [trendsData, forecastData] = await Promise.all([
        getTrends(selectedPeriod.toString()),
        getForecast('3'), // Próximos 3 meses
      ]);

      setTrends(trendsData || []);
      setForecast(forecastData || []);
    } catch (error) {
      toast.error('Erro ao carregar análises');
    }
  };

  const negativeBalanceMonths = forecast.filter(f => f.predictedBalance < 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análises e Tendências</h1>
          <p className="text-muted-foreground">
            Insights sobre seus gastos e previsões futuras
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod(3)}
            className={`px-4 py-2 rounded ${selectedPeriod === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            3 meses
          </button>
          <button
            onClick={() => setSelectedPeriod(6)}
            className={`px-4 py-2 rounded ${selectedPeriod === 6 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            6 meses
          </button>
          <button
            onClick={() => setSelectedPeriod(12)}
            className={`px-4 py-2 rounded ${selectedPeriod === 12 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            12 meses
          </button>
        </div>
      </div>

      {negativeBalanceMonths.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">
                  ⚠️ Alerta: Saldo Negativo Previsto
                </h3>
                <p className="text-red-800">
                  Baseado em suas receitas e despesas recorrentes, você pode ter saldo negativo em:
                </p>
                <ul className="mt-2 space-y-1">
                  {negativeBalanceMonths.map((month) => (
                    <li key={month.month} className="text-red-700">
                      • {month.month}: R$ {month.predictedBalance.toFixed(2)}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-red-700">
                  Considere reduzir despesas ou aumentar receitas para evitar problemas financeiros.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Previsão de Saldo (Próximos 3 Meses)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {forecast.map((month) => (
            <Card key={month.month}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {month.month}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Previsto</p>
                  <p className={`text-2xl font-bold ${month.predictedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {month.predictedBalance.toFixed(2)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Receitas</p>
                    <p className="font-semibold text-green-600">
                      +R$ {month.predictedIncome.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Despesas</p>
                    <p className="font-semibold text-red-600">
                      -R$ {month.predictedExpenses.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">
          Tendências de Gastos (Últimos {selectedPeriod} meses)
        </h2>
        <div className="grid gap-4">
          {trends.map((trend) => (
            <Card key={trend.category}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{trend.category}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Média 3 meses</p>
                        <p className="font-semibold">R$ {trend.average3Months.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Média 6 meses</p>
                        <p className="font-semibold">R$ {trend.average6Months.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Média 12 meses</p>
                        <p className="font-semibold">R$ {trend.average12Months.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {trend.trend === 'up' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <TrendingUp className="w-6 h-6" />
                        <div>
                          <p className="text-2xl font-bold">+{trend.percentage}%</p>
                          <p className="text-sm">Aumentando</p>
                        </div>
                      </div>
                    )}
                    {trend.trend === 'down' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <TrendingDown className="w-6 h-6" />
                        <div>
                          <p className="text-2xl font-bold">-{trend.percentage}%</p>
                          <p className="text-sm">Reduzindo</p>
                        </div>
                      </div>
                    )}
                    {trend.trend === 'stable' && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-6 h-6" />
                        <div>
                          <p className="text-2xl font-bold">~{trend.percentage}%</p>
                          <p className="text-sm">Estável</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {trends.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Não há dados suficientes para análise de tendências.
                  Continue registrando suas transações!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
