'use client';

import React, { useState, useEffect } from 'react';
import { logComponents, logError } from '../lib/logger';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lightbulb,
  BarChart3,
  LineChart,
  Zap,
  Star,
  ThumbsUp,
  ThumbsDown,
  Settings,
  RefreshCw,
  BarChart,
} from 'lucide-react';
import {
  advancedAIEngine,
  type FinancialInsight,
  type SpendingPattern,
  type BudgetRecommendation,
  type InvestmentSuggestion,
} from '../lib/financial/advanced-ai-engine';
import { formatCurrency } from '../lib/utils';

interface AIInsight {
  id: string;
  type: 'prediction' | 'pattern' | 'opportunity' | 'risk';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  category: string;
}

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  confidence: number;
  suggestedAmount: number;
  reasoning: string;
  impact: string;
  timeToSeeResults: string;
  actionPlan: string[];
}

interface AIPattern {
  id: string;
  category: string;
  frequency: string;
  averageAmount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}

interface AIInvestmentSuggestion {
  id: string;
  type: string;
  riskLevel: 'low' | 'medium' | 'high';
  allocation: number;
  expectedReturn: number;
  timeHorizon: string;
  reasoning: string;
  confidence: number;
}

export default function AdvancedAIDashboard() {
  const [activeTab, setActiveTab] = useState('insights');
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [patterns, setPatterns] = useState<AIPattern[]>([]);
  const [investmentSuggestions, setInvestmentSuggestions] = useState<AIInvestmentSuggestion[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const loadAIData = async () => {
      try {
        setIsLoading(true);
        
        // TODO: Implementar carregamento de dados de IA do banco de dados
        console.warn('advanced-ai-dashboard - Dados de IA devem vir do banco de dados');
        
        // Arrays vazios até implementar dados reais
        const insights: AIInsight[] = [];
        const recommendations: AIRecommendation[] = [];
        const patterns: AIPattern[] = [];
        const investments: AIInvestmentSuggestion[] = [];

        setInsights(insights);
        setRecommendations(recommendations);
        setPatterns(patterns);
        setInvestmentSuggestions(investments);
        
      } catch (error) {
        logError('Error loading AI data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAIData();
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadgeColor = (priority: number) => {
    if (priority === 1) return 'bg-red-100 text-red-800';
    if (priority === 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const handleRecommendationFeedback = (id: string, feedback: 'accepted' | 'rejected') => {
    console.log(`Feedback for recommendation ${id}: ${feedback}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Analisando seus dados financeiros...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de IA Avançada</h1>
          <p className="text-gray-600 mt-1">
            Insights inteligentes e recomendações personalizadas para suas finanças
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </div>

      {/* AI Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert key={alert.id} className={alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="patterns">Padrões</TabsTrigger>
          <TabsTrigger value="investments">Investimentos</TabsTrigger>
        </TabsList>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {insight.type === 'risk' && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                      {insight.type === 'opportunity' && (
                        <Lightbulb className="h-5 w-5 text-green-500" />
                      )}
                      {insight.type === 'pattern' && (
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                      )}
                      <span>{insight.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}
                      >
                        {insight.confidence}% confiança
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getImpactColor(insight.impact)}`}
                      >
                        {insight.impact === 'high'
                          ? 'Alto impacto'
                          : insight.impact === 'medium'
                            ? 'Médio impacto'
                            : 'Baixo impacto'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum insight disponível no momento.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recommendations.map((recommendation) => (
                <Card key={recommendation.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {recommendation.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {recommendation.description}
                        </CardDescription>
                      </div>
                      <Badge
                        className={getPriorityBadgeColor(recommendation.priority)}
                      >
                        Prioridade {recommendation.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">
                        Categoria: {recommendation.category}
                      </h4>
                      <p className="text-sm text-blue-800">
                        {recommendation.reasoning}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Valor Sugerido:</span>
                        <div className="font-medium text-green-600">
                          {formatCurrency(recommendation.suggestedAmount)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Confiança:</span>
                        <div className="font-medium">
                          {recommendation.confidence}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-sm ${getConfidenceColor(recommendation.confidence)}`}
                        >
                          {recommendation.confidence}% confiança
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRecommendationFeedback(
                              recommendation.id,
                              'rejected'
                            )
                          }
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Não Útil
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleRecommendationFeedback(
                              recommendation.id,
                              'accepted'
                            )
                          }
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma recomendação disponível no momento.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          {patterns.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {patterns.map((pattern) => (
                <Card key={pattern.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>{pattern.category}</span>
                    </CardTitle>
                    <CardDescription>
                      Padrão identificado nos seus gastos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Frequência:</span>
                          <div className="font-medium">{pattern.frequency}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Valor Médio:</span>
                          <div className="font-medium text-green-600">
                            {formatCurrency(pattern.averageAmount)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Tendência:</span>
                        <div className={`font-medium ${
                          pattern.trend === 'increasing' ? 'text-red-600' : 
                          pattern.trend === 'decreasing' ? 'text-green-600' : 
                          'text-gray-600'
                        }`}>
                          {pattern.trend === 'increasing' ? 'Aumentando' : 
                           pattern.trend === 'decreasing' ? 'Diminuindo' : 
                           'Estável'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Confiança:</span>
                        <div className={`font-medium ${getConfidenceColor(pattern.confidence)}`}>
                          {pattern.confidence}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum padrão identificado ainda.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-4">
          {investmentSuggestions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {investmentSuggestions.map((investment) => (
                <Card key={investment.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{investment.type}</span>
                      <Badge
                        className={`${
                          investment.riskLevel === 'low'
                            ? 'bg-green-100 text-green-800'
                            : investment.riskLevel === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {investment.riskLevel === 'low'
                          ? 'Baixo Risco'
                          : investment.riskLevel === 'medium'
                            ? 'Médio Risco'
                            : 'Alto Risco'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Alocação Sugerida:</span>
                        <div className="font-medium text-green-600">
                          {investment.allocation}%
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Retorno Esperado:</span>
                        <div className="font-medium">
                          {investment.expectedReturn}% a.a.
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-600 text-sm">Horizonte de Tempo:</span>
                      <div className="font-medium">{investment.timeHorizon}</div>
                    </div>

                    <div>
                      <span className="text-gray-600 text-sm">Justificativa:</span>
                      <p className="text-sm mt-1">{investment.reasoning}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <span
                        className={`text-sm ${getConfidenceColor(investment.confidence)}`}
                      >
                        {investment.confidence}% confiança
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma sugestão de investimento disponível no momento.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


