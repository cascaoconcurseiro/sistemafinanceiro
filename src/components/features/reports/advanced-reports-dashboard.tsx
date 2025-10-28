'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  FileText,
  Download,
  Printer,
  Share2,
  TrendingUp,
  TrendingDown,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { usePeriod } from '@/contexts/period-context';
import { toast } from 'sonner';
import { translateAccountType } from '@/lib/translations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InstallmentsReport } from './installments-report';

const AdvancedReportsDashboard = () => {
  const [selectedReport, setSelectedReport] = useState('summary');
  
  // Usar o contexto de período global
  const { startDate: globalStartDate, endDate: globalEndDate } = usePeriod();
  
  // Valores padrão caso o contexto não esteja pronto (memoizados)
  const defaultStartDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);
  
  const defaultEndDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }, []);
  
  // Estado local para filtro customizado
  const [useCustomFilter, setUseCustomFilter] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date>(globalStartDate || defaultStartDate);
  const [customEndDate, setCustomEndDate] = useState<Date>(globalEndDate || defaultEndDate);
  
  // Usar período global ou customizado (com fallback)
  const startDate = useCustomFilter ? customStartDate : (globalStartDate || defaultStartDate);
  const endDate = useCustomFilter ? customEndDate : (globalEndDate || defaultEndDate);

  // Usar contexto unificado para dados consistentes
  const { data, isLoading, actions } = useUnifiedFinancial();
  const transactions = data?.transactions || [];
  
  // Memoizar função para atualizar relatórios
  const refreshReports = useCallback(() => {
    if (actions?.refresh) {
      actions.refresh();
    }
  }, [actions]);

  // Calcular dados do relatório baseado nas transações do contexto unificado
  const safeReportData = useMemo(() => {
    // Filtrar transações por período selecionado
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Calcular totais - aceitar ambos os formatos
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income' || t.type === 'RECEITA')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense' || t.type === 'DESPESA')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Debug: verificar transações e categorias
    console.log('📊 [Reports] Transações filtradas:', filteredTransactions.length);
    console.log('📊 [Reports] Exemplo de transação:', filteredTransactions[0]);
    console.log('📊 [Reports] Categorias disponíveis:', data?.categories?.length || 0);
    
    // Agrupar por categoria com mapeamento correto
    const categoryMap = new Map<string, number>();
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense' || t.type === 'DESPESA');
    
    console.log('📊 [Reports] Despesas encontradas:', expenseTransactions.length);
    
    expenseTransactions.forEach(t => {
      // ✅ CORREÇÃO: Buscar nome da categoria pelo categoryId
      let categoryName = 'Sem Categoria';
      
      if (t.categoryId) {
        const category = data?.categories?.find((c: any) => c.id === t.categoryId);
        categoryName = category?.name || 'Categoria não encontrada';
      } else if (t.category) {
        // Fallback para transações antigas que podem ter category em vez de categoryId
        categoryName = t.category;
      }
      
      // ✅ CORREÇÃO: Detectar categorias especiais por descrição
      if (!t.categoryId && t.description) {
        const desc = t.description.toLowerCase();
        
        if (desc.includes('recebimento') && desc.includes('fatura')) {
          categoryName = 'Recebimento de Fatura';
        } else if (desc.includes('pagamento') && desc.includes('fatura')) {
          categoryName = 'Pagamento de Fatura';
        } else if (desc.includes('pagamento de dívida') || desc.includes('pagamento -')) {
          categoryName = 'Pagamento de Dívida';
        } else if (desc.includes('recebimento -') && !desc.includes('fatura')) {
          categoryName = 'Recebimento de Dívida';
        } else if (desc.includes('transferência') || desc.includes('transferencia')) {
          categoryName = 'Transferência';
        } else if (desc.includes('depósito inicial') || desc.includes('deposito inicial')) {
          categoryName = 'Depósito Inicial';
        }
      }
      
      console.log('📊 [Reports] Transação:', {
        description: t.description,
        categoryId: t.categoryId,
        categoryName,
        amount: t.amount
      });
      
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + Math.abs(t.amount));
    });
    
    console.log('📊 [Reports] Categorias agrupadas:', Array.from(categoryMap.entries()));

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      amount: value,
      value,
      percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    }));

    // Agrupar por mês
    const monthMap = new Map<string, { income: number; expenses: number }>();
    filteredTransactions.forEach(t => {
      const month = new Date(t.date).toISOString().slice(0, 7);
      const current = monthMap.get(month) || { income: 0, expenses: 0 };
      if (t.type === 'income' || t.type === 'RECEITA') {
        current.income += Math.abs(t.amount);
      } else {
        current.expenses += t.amount;
      }
      monthMap.set(month, current);
    });

    const monthlyData = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        netFlow: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      monthlyData,
      categoryBreakdown,
      netFlow: totalIncome - totalExpenses,
    };
  }, [transactions, startDate, endDate]);

  // Aplicar filtro customizado
  const applyCustomFilter = useCallback(() => {
    setUseCustomFilter(true);
    const start = customStartDate.toLocaleDateString('pt-BR');
    const end = customEndDate.toLocaleDateString('pt-BR');
    toast.success(`Relatório filtrado do período: ${start} até ${end}`);
  }, [customStartDate, customEndDate]);
  
  // Limpar filtro customizado (voltar ao período global)
  const clearCustomFilter = useCallback(() => {
    setUseCustomFilter(false);
    setCustomStartDate(globalStartDate || defaultStartDate);
    setCustomEndDate(globalEndDate || defaultEndDate);
    toast.info('Filtro removido. Usando período global do seletor.');
  }, [globalStartDate, globalEndDate, defaultStartDate, defaultEndDate]);

  // Memoizar função de exportação
  const exportReport = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const data = {
        cashFlow: cashFlowQuery.data,
        categorySpending: categorySpendingQuery.data,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        generatedAt: new Date().toISOString(),
      };

      if (format === 'csv') {
        // Exportar como CSV
        const csvContent = generateCSV(safeReportData);
        downloadFile(
          csvContent,
          `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.csv`,
          'text/csv'
        );
      } else if (format === 'excel') {
        // Simular exportação Excel
        toast.info('Funcionalidade Excel em desenvolvimento');
      } else if (format === 'pdf') {
        // Simular exportação PDF
        toast.info('Funcionalidade PDF em desenvolvimento');
      }

      toast.success(`Relatório ${format.toUpperCase()} baixado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    }
  }, [safeReportData]);



  const handleReportChange = useCallback((report: string) => {
    setSelectedReport(report);
  }, []);

  // Usar dados dos hooks refatorados que já calculam tudo baseado em transações
  // Remover finalReportData - usar safeReportData diretamente

  // Função auxiliar para gerar CSV
  const generateCSV = useCallback((data: any) => {
    // Implementação básica de CSV
    const headers = ['Data', 'Categoria', 'Valor', 'Tipo'];
    const rows = data.monthlyData?.map((item: any) => 
      [item.month, item.category || 'Geral', item.value, item.type || 'Receita']
    ) || [];
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }, []);

  // Função auxiliar para download
  const downloadFile = useCallback((content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  if (isLoading) {
    return <div>Carregando relatórios...</div>;
  }

  const printReport = () => {
    window.print();
  };

  const shareReport = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Relatório Financeiro',
        text: 'Confira meu relatório financeiro',
        url: window.location.href,
      });
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        {useCustomFilter && (
          <Badge 
            variant="secondary" 
            className="text-xs font-normal"
          >
            Filtro Customizado Ativo
          </Badge>
        )}

        <div className="flex flex-wrap gap-3 items-end">
          {/* Campos de Data */}
          <div className="flex gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="start-date" className="text-sm font-medium">
                Data Início
              </Label>
              <Input
                id="start-date"
                type="date"
                value={
                  useCustomFilter 
                    ? (customStartDate?.toISOString().split('T')[0] || '')
                    : ((globalStartDate || defaultStartDate)?.toISOString().split('T')[0] || '')
                }
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    setCustomStartDate(newDate);
                  }
                }}
                className="w-[160px]"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="end-date" className="text-sm font-medium">
                Data Final
              </Label>
              <Input
                id="end-date"
                type="date"
                value={
                  useCustomFilter 
                    ? (customEndDate?.toISOString().split('T')[0] || '')
                    : ((globalEndDate || defaultEndDate)?.toISOString().split('T')[0] || '')
                }
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    setCustomEndDate(newDate);
                  }
                }}
                className="w-[160px]"
              />
            </div>
            
            {!useCustomFilter ? (
              <Button
                variant="default"
                onClick={applyCustomFilter}
              >
                <Eye className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={clearCustomFilter}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Usar Período Global
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={refreshReports}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </Button>

            <Button variant="outline" onClick={() => exportReport('pdf')}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>

            <Button variant="outline" onClick={printReport}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>

            <Button variant="outline" onClick={shareReport}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">
                  Receitas Totais
                </p>
                <p className="text-2xl font-bold text-green-700">
                  R${' '}
                  {safeReportData.totalIncome.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">
                  Despesas Totais
                </p>
                <p className="text-2xl font-bold text-red-700">
                  R${' '}
                  {safeReportData.totalExpenses.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <ArrowDownRight className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-r ${safeReportData.balance >= 0 ? 'from-blue-50 to-cyan-50 border-blue-200' : 'from-orange-50 to-red-50 border-orange-200'}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Fluxo Líquido
                </p>
                <p
                  className={`text-2xl font-bold ${safeReportData.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}
                >
                  R${' '}
                  {safeReportData.balance.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              {safeReportData.balance >= 0 ? (
                <TrendingUp className="w-8 h-8 text-blue-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Taxa de Economia
                </p>
                <p className="text-2xl font-bold text-purple-700">
                  {safeReportData.totalIncome > 0
                    ? (
                        (safeReportData.balance / safeReportData.totalIncome) *
                        100
                      ).toFixed(1)
                    : '0.0'}
                  %
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="installments">Parcelamentos</TabsTrigger>
        </TabsList>

        {/* Resumo */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fluxo de Caixa Mensal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Fluxo de Caixa Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safeReportData.monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={safeReportData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [
                          `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                          'Valor',
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#10B981" name="Receitas" />
                      <Bar dataKey="expenses" fill="#EF4444" name="Despesas" />
                      <Line
                        type="monotone"
                        dataKey="netFlow"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        name="Fluxo Líquido"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Dados insuficientes para o período selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribuição de Gastos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  Distribuição de Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safeReportData.categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={safeReportData.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) =>
                          `${name} ${percentage.toFixed(1)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {safeReportData.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                          'Valor',
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PieChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma despesa encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Breakdown de Contas - Temporariamente removido até implementar dados de contas */}
            {/* 
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-green-600" />
                  Breakdown de Contas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Dados de contas não disponíveis no momento</p>
                </div>
              </CardContent>
            </Card>
            */}
        </TabsContent>

        {/* Tendências */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Análise de Tendências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={safeReportData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor',
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Receitas"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="2"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.6}
                    name="Despesas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categorias */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                Análise Detalhada por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {safeReportData.categoryBreakdown.map((category, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <h3 className="font-semibold">{category.name}</h3>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          R${' '}
                          {category.amount.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <Badge variant="outline">
                          {category.percentage.toFixed(1)}% do total
                        </Badge>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parcelamentos */}
        <TabsContent value="installments" className="space-y-6">
          <InstallmentsReport startDate={startDate} endDate={endDate} />
        </TabsContent>
      </Tabs>

      {/* Insights Finais */}
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Insights do Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                💰 Performance Financeira
              </h4>
              <p className="text-sm text-blue-700">
                {safeReportData.balance >= 0
                  ? `Excelente! Você teve um saldo positivo de R$ ${safeReportData.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : `Atenção: Déficit de R$ ${Math.abs(safeReportData.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Revise seus gastos.`}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                📈 Maior Categoria
              </h4>
              <p className="text-sm text-green-700">
                {safeReportData.categoryBreakdown.length > 0
                  ? `${safeReportData.categoryBreakdown[0]?.name || 'Categoria'} representa ${(safeReportData.categoryBreakdown[0]?.percentage || 0).toFixed(1)}% dos seus gastos`
                  : 'Nenhuma categoria de gastos identificada'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(AdvancedReportsDashboard);
