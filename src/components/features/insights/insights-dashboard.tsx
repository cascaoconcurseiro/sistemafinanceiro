'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { generateInsights, predictNextMonthExpenses, type Insight } from '@/lib/insights/insights-generator'
import { formatCurrency } from '@/lib/utils'

interface InsightsDashboardProps {
  transactions: any[]
  categories: any[]
}

export function InsightsDashboard({ transactions, categories }: InsightsDashboardProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      setLoading(true)
      
      // Gerar insights
      const generatedInsights = generateInsights(transactions, categories)
      setInsights(generatedInsights)
      
      // Gerar previsão
      const nextMonthPrediction = predictNextMonthExpenses(transactions)
      setPrediction(nextMonthPrediction)
      
      setLoading(false)
    }
  }, [transactions, categories])

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'danger':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getInsightBadgeVariant = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'default'
      case 'warning':
        return 'warning'
      case 'danger':
        return 'destructive'
      case 'info':
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Insights Inteligentes
          </CardTitle>
          <CardDescription>Analisando seus dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Previsão do Próximo Mês */}
      {prediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Previsão para o Próximo Mês
            </CardTitle>
            <CardDescription>
              Baseado nos últimos 3 meses de gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Gasto Previsto</p>
                <p className="text-3xl font-bold">{formatCurrency(prediction.predicted)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Confiança: {Math.round(prediction.confidence * 100)}%
                </p>
              </div>
              
              {prediction.breakdown.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Por Categoria:</p>
                  {prediction.breakdown.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{item.category}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Insights Inteligentes
          </CardTitle>
          <CardDescription>
            {insights.length} insight{insights.length !== 1 ? 's' : ''} encontrado{insights.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum insight disponível no momento.</p>
              <p className="text-sm mt-2">Continue usando o app para gerar insights!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.message}
                        </p>
                      </div>
                      <Badge variant={getInsightBadgeVariant(insight.type) as any}>
                        {insight.category}
                      </Badge>
                    </div>
                    
                    {insight.action && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => window.location.href = insight.action!.url}
                      >
                        {insight.action.label}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
