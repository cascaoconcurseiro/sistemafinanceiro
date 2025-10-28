'use client';

import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  FileText,
  Settings,
  Filter,
  Download,
  AlertTriangle,
  DollarSign,
  Target,
  Calendar,
  Building2,
} from 'lucide-react';
import { useOptimizedInvestments } from '@/hooks/useOptimizedInvestments';
import { useSafeTheme } from '@/hooks/use-safe-theme';
import { InvestmentList } from './investment-list';
import { InvestmentOperationModal } from './investment-operation-modal';
import { InvestmentReports } from './investment-reports';
// import { InvestmentHistory } from './investment-history'; // Componente não existe
import { DividendModal } from './dividend-modal';
import { InvestmentSaleModal } from './investment-sale-modal';
import { InvestmentIRReport } from './investment-ir-report';

// Função para calcular valor atual
function calculateCurrentValue(investment) {
  if (!investment) return 0;
  const currentPrice = investment.currentPrice || investment.averagePrice || 0;
  const quantity = investment.totalQuantity || investment.quantity || 0;
  return currentPrice * quantity;
}

// Função para calcular distribuição de ativos
function calculateAssetDistribution(investments) {
  if (!Array.isArray(investments)) return [];

  const distribution = {};
  investments.forEach((inv) => {
    if (!inv || !inv.assetType) return;
    const type = inv.assetType;
    const value = calculateCurrentValue(inv);
    distribution[type] = (distribution[type] || 0) + value;
  });

  return Object.entries(distribution).map(([type, value]) => ({
    type,
    value,
    percentage: 0, // Será calculado depois
  }));
}

const InvestmentDashboardComponent = memo(function InvestmentDashboard() {
  const router = useRouter();
  const { settings } = useSafeTheme();
  
  // Modal states
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [operationType, setOperationType] = useState<'buy' | 'sell'>('buy');
  const [showFilters, setShowFilters] = useState(false);
  const [showBrokerManagement, setShowBrokerManagement] = useState(false);
  const [showDividendModal, setShowDividendModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  
  // Tab state
  const [selectedTab, setSelectedTab] = useState('portfolio');
  const [error, setError] = useState(null);

  // Use optimized investments hook
  const { investments, portfolio: portfolioSummary, isLoading, error: investmentError } = useOptimizedInvestments();

  // Only log when data actually changes
  useEffect(() => {
    if (investments.length > 0) {
      console.log('📊 [InvestmentDashboard] Dados carregados:', {
        investmentsCount: investments.length,
        portfolioValue: portfolioSummary.currentValue
      });
    }
  }, [investments.length, portfolioSummary.currentValue]);

  // Memoized callback functions to prevent unnecessary re-renders
  const handleBuyClick = useCallback(() => {
    setOperationType('buy');
    setShowOperationModal(true);
  }, []);

  const handleSellClick = useCallback(() => {
    setShowSaleModal(true);
  }, []);

  const handleDividendClick = useCallback(() => {
    setShowDividendModal(true);
  }, []);

  const handleFiltersClick = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Verificações de segurança
  const safeInvestments = investments
  const safeActiveInvestments = safeInvestments.filter(
    (inv) => inv && inv.status === 'active'
  )

  // Calcular distribuição de ativos baseada nos investimentos reais
  const assetDistribution = useMemo(() => {
    const distribution: Record<string, { value: number; count: number; percentage: number }> = {}
    
    safeActiveInvestments.forEach((investment) => {
      const type = investment.type || 'Outros'
      const value = (investment.currentPrice || investment.purchasePrice) * investment.quantity
      
      if (!distribution[type]) {
        distribution[type] = { value: 0, count: 0, percentage: 0 }
      }
      
      distribution[type].value += value
      distribution[type].count += 1
    })

    // Calcular percentuais
    const totalValue = Object.values(distribution).reduce((sum, item) => sum + item.value, 0)
    Object.keys(distribution).forEach((type) => {
      distribution[type].percentage = totalValue > 0 ? (distribution[type].value / totalValue) * 100 : 0
    })

    // Convert object to array for .map() usage
    return Object.entries(distribution).map(([type, data]) => ({
      type,
      ...data
    }))
  }, [safeActiveInvestments])

  // Calcular distribuição de corretoras baseada nos investimentos reais
  const brokerDistribution = useMemo(() => {
    const distribution: Record<string, { value: number; count: number; percentage: number }> = {}
    
    safeActiveInvestments.forEach((investment) => {
      const broker = investment.broker || 'Não informado'
      const value = (investment.currentPrice || investment.purchasePrice) * investment.quantity
      
      if (!distribution[broker]) {
        distribution[broker] = { value: 0, count: 0, percentage: 0 }
      }
      
      distribution[broker].value += value
      distribution[broker].count += 1
    })

    // Calcular percentuais
    const totalValue = Object.values(distribution).reduce((sum, item) => sum + item.value, 0)
    Object.keys(distribution).forEach((broker) => {
      distribution[broker].percentage = totalValue > 0 ? (distribution[broker].value / totalValue) * 100 : 0
    })

    return distribution
  }, [safeActiveInvestments])

  // Preparar dados para gráficos
  const brokerChartData = Object.entries(brokerDistribution).map(
    ([name, data]) => ({
      name,
      value: data.value,
      percentage: data.percentage,
    })
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Erro ao carregar investimentos
          </h3>
          <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFiltersClick}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDividendClick}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Dividendo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBuyClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Comprar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSellClick}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Vender
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(portfolioSummary.currentValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioSummary.totalGainLoss >= 0 ? '+' : ''}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(portfolioSummary.totalGainLoss)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Investido
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(portfolioSummary.totalInvested)}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioSummary.totalGainLossPercentage.toFixed(2)}% de retorno
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos Ativos</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeInvestments.filter((inv) => inv.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {assetDistribution?.length || 0} tipos diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corretoras</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brokerChartData.length}</div>
            <p className="text-xs text-muted-foreground">
              Distribuídas entre corretoras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="portfolio">Carteira</TabsTrigger>
          <TabsTrigger value="dividends">Dividendos</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="ir-report">Relatório IR</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          <InvestmentList investments={safeInvestments} />
        </TabsContent>

        <TabsContent value="dividends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Dividendos Recebidos
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">Este ano</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Dividend Yield
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0,00%</div>
                <p className="text-xs text-muted-foreground">
                  Rendimento anual
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Próximos Pagamentos
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Dividendos</CardTitle>
              <CardDescription>
                Acompanhe os dividendos recebidos dos seus investimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum dividendo registrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Use o botão "Dividendo" para registrar os proventos recebidos
                </p>
                <Button onClick={handleDividendClick}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Dividendo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Distribuição por Tipo de Ativo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição por Tipo
                </CardTitle>
                <CardDescription>
                  Alocação da carteira por tipo de ativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assetDistribution.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium capitalize">
                        {item.type.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-16 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por Corretora */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Distribuição por Corretora
                </CardTitle>
                <CardDescription>
                  Alocação da carteira por corretora
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {brokerChartData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-16 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <InvestmentReports />
        </TabsContent>

        <TabsContent value="ir-report" className="space-y-4">
          <InvestmentIRReport />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <InvestmentOperationModal
        open={showOperationModal}
        onOpenChange={setShowOperationModal}
        operationType={operationType}
      />

      <DividendModal
        open={showDividendModal}
        onOpenChange={setShowDividendModal}
      />

      <InvestmentSaleModal
        open={showSaleModal}
        onOpenChange={setShowSaleModal}
      />
    </div>
  );
});

export { InvestmentDashboardComponent as InvestmentDashboard };
export default InvestmentDashboardComponent;

