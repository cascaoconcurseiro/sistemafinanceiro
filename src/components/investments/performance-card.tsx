'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PerformanceData, InvestmentType, INVESTMENT_TYPE_LABELS } from '@/types/investment';
import { formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceCardProps {
  performance?: PerformanceData;
}

export function PerformanceCard({ performance }: PerformanceCardProps) {
  if (!performance) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Sem dados de performance</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Comparação com Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Comparação com Benchmarks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BenchmarkBar
            label="Seu Portfólio"
            value={performance.annualReturn}
            color="blue"
          />
          <BenchmarkBar
            label="CDI"
            value={performance.cdiBenchmark}
            color="gray"
          />
          <BenchmarkBar
            label="Ibovespa"
            value={performance.ibovBenchmark}
            color="green"
          />
          <BenchmarkBar
            label="IPCA"
            value={performance.ipcaBenchmark}
            color="red"
          />
          
          {performance.annualReturn > performance.cdiBenchmark && (
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                🎉 <strong>Parabéns!</strong> Seu portfólio está batendo o CDI em{' '}
                {formatPercent(performance.annualReturn - performance.cdiBenchmark)}!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Performance por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Performance por Classe de Ativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(performance.performanceByType).map(([type, perf]) => {
            if (perf.return === 0) return null;
            
            const isOutperforming = perf.diff > 0;
            
            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {INVESTMENT_TYPE_LABELS[type as InvestmentType]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isOutperforming ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(perf.return)}
                    </span>
                    {isOutperforming ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Benchmark: {formatPercent(perf.benchmark)}</span>
                  <span className={isOutperforming ? 'text-green-600' : 'text-red-600'}>
                    ({isOutperforming ? '+' : ''}{formatPercent(perf.diff)})
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {generateInsights(performance).map((insight, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-lg">{insight.icon}</span>
              <p className="text-sm">{insight.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BenchmarkBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    red: 'bg-red-500'
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-bold">{formatPercent(value)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color as keyof typeof colorClasses]} transition-all`}
          style={{ width: `${Math.min(value * 5, 100)}%` }}
        />
      </div>
    </div>
  );
}

function generateInsights(performance: PerformanceData) {
  const insights = [];
  
  // Comparação com CDI
  if (performance.annualReturn > performance.cdiBenchmark) {
    insights.push({
      icon: '🎉',
      message: `Seu portfólio está superando o CDI! Continue assim.`
    });
  } else {
    insights.push({
      icon: '⚠️',
      message: `Seu portfólio está abaixo do CDI. Considere revisar sua estratégia.`
    });
  }
  
  // Performance de ações
  const stockPerf = performance.performanceByType[InvestmentType.STOCK];
  if (stockPerf && stockPerf.diff > 5) {
    insights.push({
      icon: '📈',
      message: `Suas ações estão performando muito bem! ${formatPercent(stockPerf.diff)} acima do Ibovespa.`
    });
  }
  
  // Renda Fixa
  const fixedPerf = performance.performanceByType[InvestmentType.FIXED_INCOME];
  if (fixedPerf && fixedPerf.diff > 0) {
    insights.push({
      icon: '💰',
      message: `Sua renda fixa está batendo o CDI. Ótima escolha de ativos!`
    });
  }
  
  // Cripto
  const cryptoPerf = performance.performanceByType[InvestmentType.CRYPTO];
  if (cryptoPerf && cryptoPerf.return < -10) {
    insights.push({
      icon: '⚠️',
      message: `Criptomoedas estão com performance negativa. Considere reduzir exposição.`
    });
  }
  
  return insights;
}
