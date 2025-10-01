'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  AlertTriangle,
  Target,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  PieChart,
  Filter,
  Plus,
  Search,
  Download,
  Upload,
  Activity,
  CreditCard,
  Repeat,
  Split,
  Edit,
  Trash2,
} from 'lucide-react';

// Contexto unificado baseado nos novos princípios
import { useUnified } from '@/contexts/unified-context-simple';
import { Transaction, TransactionType, TransactionStatus } from '@/types';
import { toast } from 'sonner';

// Dynamic imports para componentes
const ModernAppLayout = dynamic(
  () =>
    import('@/components/modern-app-layout').then((mod) => ({
      default: mod.ModernAppLayout,
    })),
  { ssr: false }
);

const OptimizedPageTransition = dynamic(
  () =>
    import('@/components/optimized-page-transition').then((mod) => ({
      default: mod.OptimizedPageTransition,
    })),
  { ssr: false }
);

const AddTransactionModal = dynamic(
  () =>
    import('@/components/modals/transactions/add-transaction-modal').then((mod) => ({
      default: mod.AddTransactionModal,
    })),
  { ssr: false }
);

const TransferModal = dynamic(
  () =>
    import('@/components/modals/transactions/transfer-modal').then((mod) => ({
      default: mod.TransferModal,
    })),
  { ssr: false }
);

const CreditCardModal = dynamic(
  () =>
    import('@/components/modals/transactions/credit-card-modal').then((mod) => ({
      default: mod.CreditCardModal,
    })),
  { ssr: false }
);

// Hook para performance
import { useRenderPerformance } from '@/components/optimized-page-transition';

// Componente para visualização hierárquica
import { TransactionHierarchyView } from '@/components/transaction-hierarchy-view';

function TransactionsPageContent() {
  // Performance monitoring
  useRenderPerformance('TransactionsPage');

  // Contexto unificado - single source of truth
  const {
    accounts = [],
    transactions = [],
    categories = [],
    isLoading = false,
    createTransaction,
    updateTransaction,
    deleteTransaction: deleteTransactionEngine,
    getPeriodSummary,
    getRunningBalance,
    dashboardData
  } = useUnified();

  // DEBUG: Log das transações carregadas
  useEffect(() => {
    console.log('🔍 DEBUG TRANSAÇÕES - Total carregadas:', transactions.length);
    console.log('🔍 DEBUG TRANSAÇÕES - Dados:', transactions);
  }, [transactions]);

  // Hook específico para transações com método delete - removido pois agora usamos useUnified

  // Estados locais para UI e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');
  
  // Debug modal states
  useEffect(() => {
    console.log('Modal states changed:', {
      showCreateModal,
      showTransferModal,
      showCreditCardModal,
      showEditModal
    });
  }, [showCreateModal, showTransferModal, showCreditCardModal, showEditModal]);

  // Handlers para edição e exclusão
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (window.confirm(`Tem certeza que deseja excluir a transação "${transaction.description}"?`)) {
      try {
        await deleteTransactionEngine(transaction.id);
        toast.success('Transação excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        toast.error('Erro ao excluir transação');
      }
    }
  };

  const handleSaveTransaction = async () => {
    try {
      // A atualização já foi feita no modal, apenas fechamos e limpamos o estado
      setShowEditModal(false);
      setEditingTransaction(null);
      // O toast de sucesso já é mostrado no modal
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar transação');
    }
  };

  // Calcular período baseado na seleção
  const getPeriodDates = useCallback(() => {
    const now = new Date();
    let startDate: string, endDate: string;

    switch (selectedPeriod) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
        break;
      case 'current-year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
        break;
      case 'last-30-days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        endDate = now.toISOString().slice(0, 10);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    }

    return { startDate, endDate };
  }, [selectedPeriod]);

  // Filtrar transações baseado nos critérios
  const filteredTransactions = useMemo(() => {
    // Garantir que transactions seja sempre um array
    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    let filtered = [...transactionsArray];

    console.log('🔍 DEBUG FILTROS - Transações iniciais:', filtered.length);
    console.log('🔍 DEBUG FILTROS - Todas as transações:', filtered.map(t => ({
      id: t.id,
      description: t.description,
      date: t.date,
      dateType: typeof t.date,
      dateISO: new Date(t.date).toISOString(),
      dateSlice: new Date(t.date).toISOString().slice(0, 10)
    })));

    // Filtro por período
    const { startDate, endDate } = getPeriodDates();
    console.log('🔍 DEBUG FILTROS - Período:', { startDate, endDate });
    console.log('🔍 DEBUG FILTROS - Data início slice:', startDate.slice(0, 10));
    console.log('🔍 DEBUG FILTROS - Data fim slice:', endDate.slice(0, 10));
    
    filtered = filtered.filter(t => {
      // Normalizar datas para comparação (formato YYYY-MM-DD)
      let transactionDate: string;
      
      if (t.date.includes('T')) {
        // Data ISO (2025-09-30T00:00:00.000Z) -> extrair apenas a parte da data
        transactionDate = t.date.split('T')[0];
      } else if (t.date.includes('/')) {
        // Data DD/MM/YYYY -> YYYY-MM-DD
        transactionDate = t.date.split('/').reverse().join('-');
      } else {
        // Já está em YYYY-MM-DD
        transactionDate = t.date;
      }
      
      const matchesPeriod = transactionDate >= startDate && transactionDate <= endDate;
      
      console.log('🔍 DEBUG FILTROS - Verificando transação:', {
        id: t.id,
        description: t.description,
        originalDate: t.date,
        transactionDate,
        startDate,
        endDate,
        comparison: `${transactionDate} >= ${startDate} && ${transactionDate} <= ${endDate}`,
        matchesPeriod
      });
      
      return matchesPeriod;
    });

    console.log('🔍 DEBUG FILTROS - Após filtro período:', filtered.length);

    // Filtro por busca
    if (searchTerm) {
      console.log('🔍 DEBUG FILTROS - Termo de busca:', searchTerm);
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 DEBUG FILTROS - Após filtro busca:', filtered.length);
    }

    // Filtro por conta - INCLUINDO transferências recebidas (toAccountId)
    if (selectedAccount !== 'all') {
      console.log('🔍 DEBUG FILTROS - Conta selecionada:', selectedAccount);
      const beforeAccountFilter = filtered.length;
      filtered = filtered.filter(t => 
        t.accountId === selectedAccount || t.toAccountId === selectedAccount
      );
      console.log('🔍 DEBUG FILTROS - Após filtro conta:', filtered.length, 'de', beforeAccountFilter);
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      console.log('🔍 DEBUG FILTROS - Tipo selecionado:', selectedType);
      filtered = filtered.filter(t => t.type === selectedType);
      console.log('🔍 DEBUG FILTROS - Após filtro tipo:', filtered.length);
    }

    // Filtro por status
    if (selectedStatus !== 'all') {
      console.log('🔍 DEBUG FILTROS - Status selecionado:', selectedStatus);
      filtered = filtered.filter(t => t.status === selectedStatus);
      console.log('🔍 DEBUG FILTROS - Após filtro status:', filtered.length);
    }

    console.log('🔍 DEBUG FILTROS - Transações finais:', filtered.length);

    // Ordenar por data (mais recente primeiro)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, selectedAccount, selectedType, selectedStatus, getPeriodDates]);

  // Calcular resumo do período
  const periodSummary = useMemo(() => {
    const { startDate, endDate } = getPeriodDates();
    return getPeriodSummary(startDate, endDate);
  }, [getPeriodSummary, getPeriodDates]);

  // Calcular saldo apenas das transações do período selecionado
  const currentMonthBalance = useMemo(() => {
    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    const { startDate, endDate } = getPeriodDates();
    
    console.log('=== DEBUG SALDO TOTAL ===');
    console.log('Período selecionado:', selectedPeriod);
    console.log('Data início:', startDate);
    console.log('Data fim:', endDate);
    console.log('Total transações:', transactionsArray.length);
    
    // Filtrar apenas transações do período selecionado
    const currentPeriodTransactions = transactionsArray.filter(t => {
      // Normalizar datas para comparação (formato YYYY-MM-DD)
      const transactionDate = t.date.includes('/') 
        ? t.date.split('/').reverse().join('-') // DD/MM/YYYY -> YYYY-MM-DD
        : t.date; // Já está em YYYY-MM-DD
      
      const isInPeriod = transactionDate >= startDate && 
                        transactionDate <= endDate &&
                        (t.status === 'completed' || t.status === 'cleared');
      
      if (t.type === 'income') {
        console.log(`Transação: ${t.description} | Data: ${t.date} -> ${transactionDate} | Período: ${isInPeriod} | Valor: ${t.amount}`);
      }
      
      return isInPeriod;
    });

    console.log('Transações filtradas:', currentPeriodTransactions.length);

    // Usar dados do dashboard da API em vez de calcular no frontend
    const periodBalance = dashboardData?.periodBalance || 0;

    console.log('Saldo do período (API):', periodBalance);
    console.log('=== FIM DEBUG ===');

    return periodBalance;
  }, [transactions, getPeriodDates, dashboardData?.periodBalance]);

  // Funções de formatação
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.transferId) {
      return <Split className="h-4 w-4 text-blue-600" />;
    }
    if (transaction.creditCardId) {
      return <CreditCard className="h-4 w-4 text-purple-600" />;
    }
    if (transaction.recurringRuleId) {
      return <Repeat className="h-4 w-4 text-orange-600" />;
    }
    if (transaction.type === 'income') {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    } else if (transaction.type === 'expense') {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    } else {
      return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTransactionColor = (transaction: Transaction) => {
    // Para transações do tipo 'debit' (despesas), usar vermelho
    if (transaction.type === 'debit') return 'text-red-600';
    // Para transações do tipo 'credit' (receitas), usar verde
    if (transaction.type === 'credit') return 'text-green-600';
    // Para transações legadas que ainda usam 'income' e 'expense'
    if (transaction.type === 'income') return 'text-green-600';
    if (transaction.type === 'expense') return 'text-red-600';
    // Para transferências, usar azul
    return 'text-blue-600';
  };

  const getAccountName = (accountId: string) => {
    console.log('🔍 getAccountName - Buscando conta:', accountId);
    console.log('🔍 getAccountName - Contas disponíveis:', accounts.length);
    const account = accounts.find(a => a.id === accountId);
    const result = account?.name || 'Conta não encontrada';
    console.log('🔍 getAccountName - Resultado:', result);
    return result;
  };

  const getCategoryName = (category: string) => {
    console.log('🔍 getCategoryName - Categoria recebida:', category);
    // No schema atual, category é um campo string direto, não uma relação
    const result = category || 'Categoria não informada';
    console.log('🔍 getCategoryName - Resultado:', result);
    return result;
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      cleared: { label: 'Efetivada', variant: 'default' as const },
      completed: { label: 'Concluída', variant: 'default' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status];
    if (!config) {
      return <Badge variant="default">Status desconhecido</Badge>;
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <ModernAppLayout title="Transações" subtitle="Carregando...">
        <div className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ModernAppLayout>
    );
  }

  return (
    <ModernAppLayout
      title="Transações"
      subtitle="Sistema baseado em transações - Single Source of Truth"
    >
      <OptimizedPageTransition>
        <div className="p-4 md:p-6 space-y-6">
          {/* Header com ações */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
              <p className="text-muted-foreground">
                Todas as operações financeiras em um só lugar
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => {
                console.log('Transfer button clicked - setting showTransferModal to true');
                setShowTransferModal(true);
              }} variant="outline">
                <Split className="mr-2 h-4 w-4" />
                Transferência
              </Button>
              <Button onClick={() => {
                console.log('Credit card button clicked - setting showCreditCardModal to true');
                setShowCreditCardModal(true);
              }} variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Cartão de Crédito
              </Button>
              <Button onClick={() => {
                console.log('Create transaction button clicked - setting showCreateModal to true');
                setShowCreateModal(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Transação
              </Button>
            </div>
          </div>

          {/* Cards de Resumo - Calculados dinamicamente */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(periodSummary.income)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Período selecionado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(Math.abs(periodSummary.expenses))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Período selecionado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Período</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${periodSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(periodSummary.balance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {periodSummary.transactionCount} transações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${periodSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(periodSummary.balance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Saldo do período filtrado
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Descrição, notas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Mês Atual</SelectItem>
                      <SelectItem value="last-month">Mês Anterior</SelectItem>
                      <SelectItem value="last-30-days">Últimos 30 dias</SelectItem>
                      <SelectItem value="current-year">Ano Atual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Conta</label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as contas</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={selectedType} onValueChange={(value) => setSelectedType(value as TransactionType | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TransactionStatus | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ações</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Transações */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Transações ({filteredTransactions.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    Lista
                  </Button>
                  <Button
                    variant={viewMode === 'hierarchy' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('hierarchy')}
                  >
                    <Split className="h-4 w-4 mr-2" />
                    Hierarquia
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhuma transação encontrada para os filtros selecionados
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira transação
                  </Button>
                </div>
              ) : viewMode === 'hierarchy' ? (
                <TransactionHierarchyView 
                  transactions={filteredTransactions}
                  onTransactionClick={(transaction) => setSelectedTransaction(transaction)}
                />
              ) : (
                <div className="space-y-3">
                  {console.log('🔍 RENDERIZAÇÃO - Transações a serem renderizadas:', filteredTransactions.length)}
                  {console.log('🔍 RENDERIZAÇÃO - Dados das transações:', filteredTransactions.map(t => ({ id: t.id, description: t.description, date: t.date })))}
                  {filteredTransactions.map((transaction) => {
                      console.log('🔍 RENDERIZAÇÃO - Renderizando transação:', transaction.id, transaction.description);
                      try {
                        const runningBalance = getRunningBalance(transaction.id);
                        return (
                          <div key={transaction.id} data-testid="transaction-item" className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center space-x-4">
                              {getTransactionIcon(transaction)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{transaction.description}</p>
                                  {getStatusBadge(transaction.status)}
                                  {transaction.installmentNumber && (
                                    <Badge variant="outline">
                                      {transaction.installmentNumber}/{transaction.totalInstallments}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{getAccountName(transaction.accountId)}</span>
                                  <span>•</span>
                                  <span>{getCategoryName(transaction.category)}</span>
                                  <span>•</span>
                                  <span>{formatDate(transaction.date)}</span>
                                </div>
                                {transaction.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">{transaction.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className={`font-bold text-lg ${getTransactionColor(transaction)}`}>
                                  {(transaction.type === 'expense' || (transaction.type === 'shared' && transaction.amount < 0)) ? 
                                    `-${formatCurrency(Math.abs(transaction.amount))}` : 
                                    `+${formatCurrency(Math.abs(transaction.amount))}`
                                  }
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Saldo: {formatCurrency(runningBalance)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditTransaction(transaction)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTransaction(transaction)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      } catch (error) {
                        console.error('🚨 ERRO na renderização da transação:', transaction.id, error);
                        return (
                          <div key={transaction.id} className="p-4 border rounded-lg bg-red-50">
                            <p className="text-red-600">Erro ao renderizar transação: {transaction.description}</p>
                          </div>
                        );
                      }
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aviso sobre o Sistema */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-blue-900">Sistema Baseado em Transações</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Esta página mostra todas as transações que são a fonte única da verdade do sistema. 
                    Saldos, relatórios e dashboards são calculados dinamicamente a partir destas transações.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>
      </OptimizedPageTransition>

      {/* Modais */}
      <AddTransactionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
      
      <AddTransactionModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        editingTransaction={editingTransaction}
        onSave={handleSaveTransaction}
      />
      
      <TransferModal
        open={showTransferModal}
        onOpenChange={(open) => {
          console.log('TransferModal onOpenChange called with:', open);
          setShowTransferModal(open);
        }}
      />
      
      <CreditCardModal
        open={showCreditCardModal}
        onOpenChange={setShowCreditCardModal}
      />
    </ModernAppLayout>
  );
}

export default TransactionsPageContent;
