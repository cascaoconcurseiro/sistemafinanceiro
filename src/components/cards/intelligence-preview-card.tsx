'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export function IntelligencePreviewCard() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      // Carregar resumo dos alertas
      const alertsRes = await fetch('/api/ml/alerts');
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setSummary({
          alerts: alertsData.summary?.total || 0,
          critical: alertsData.summary?.critical || 0,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Inteligência Financeira
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </CardTitle>
              <CardDescription>
                Previsões, alertas e sugestões personalizadas
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo rápido */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-white rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Previsões</p>
            <p className="text-sm font-bold">Ativas</p>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg">
            <Lightbulb className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Sugestões</p>
            <p className="text-sm font-bold">Disponíveis</p>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg relative">
            <AlertTriangle className="h-5 w-5 text-red-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Alertas</p>
            <p className="text-sm font-bold">{summary?.alerts || 0}</p>
            {summary?.critical > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {summary.critical}
              </Badge>
            )}
          </div>
        </div>

        {/* Recursos */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span>Categorização automática de transações</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span>Previsão de gastos futuros</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span>Sugestões de economia personalizadas</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span>Alertas inteligentes em tempo real</span>
          </div>
        </div>

        {/* Botão de ação */}
        <Button 
          onClick={() => router.push('/dashboard/intelligence')}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Ver Análise Completa
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
