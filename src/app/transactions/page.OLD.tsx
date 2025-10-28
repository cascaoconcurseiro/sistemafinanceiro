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
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { usePeriod } from '@/contexts/period-context';
import { Transaction, TransactionType, TransactionStatus } from '@/types';
import { toast } from 'sonner';

// Regular imports to fix webpack factory function errors
import { ModernAppLayout } from '@/components/modern-app-layout';
import { OptimizedPageTransition } from '@/components/optimized-page-transition';
import { AddTransactionModal } from '@/components/modals/transactions/add-transaction-modal';
import { TransferModal } from '@/components/modals/transactions/transfer-modal';
import { CreditCardModal } from '@/components/modals/transactions/credit-card-modal';


// Hook para performance
import { useRenderPerformance } from '@/components/optimized-page-transition';

// Componente para visualização hierárquica
import { TransactionHierarchyView } from '@/components/transaction-hierarchy-view';

function TransactionsPageContent() {
  // Performance monitoring
  useRenderPerformance('TransactionsPage');

  // ✅ CORREÇÃO: Usar dados diretos do contexto unificado
  const {
    accounts: accountsData,
    transactions: transactionsData,
    categories: categoriesData,
    isLoading,
    error,
    actions,
  } = useUnifiedFinancial();

  // Manter compatibilidade com código existente
  const accounts = { data: accountsData || [] };
  const transactions = { data: transactionsData || [] };
  const categories = { data: categoriesData || [] };
  
  console.log('📊 [TransactionsPage] Dados carregados:', {
    accounts: accounts.data.length,
    transactions: transactions.data.length,
    categories: categories.data.length,
    isLoading
  });

  // ✅ Helper para calcular o valor correto de uma transação
  // Se EU paguei uma despesa compartilhada, usar o valor TOTAL
  // Se OUTRO pagou, usar apenas minha parte (myShare)
  const getTransactionAmount = useCallback((transaction: any): number => {
    const amount = Math.abs(transaction.amount);
    
    // Se não é compartilhada, retornar o valor total
    if (!transaction.isShared) {
      return amount;
    }
    
    // Se é compartilhada e tem myShare
    if (transaction.myShare !== undefined && transaction.myShare !== null) {
      const myShare = Math.abs(Number(transaction.myShare));
      
      // Se myShare é igual ao amount, significa que EU paguei tudo
      // Retornar o valor total
      if (myShare === amount) {
        return amount;
      }
      
      // Se myShare é menor que amount, significa que foi dividido
      // Verificar se EU paguei ou OUTRO pagou
      const paidBy = transaction.paidBy;
      const isPaidByOther = paidBy && paidBy !== 'current_user'; // TODO: comparar com ID real
      
      // Se outro pagou, retornar apenas minha parte
      if (isPaidByOther) {
        return myShare;
      }
      
      // Se EU paguei, retornar o valor total
      return amount;
    }
    
    // Fallback: retornar o valor total
    return amount;
  }, []);

  // Função para calcular saldo corrente (corrigida)
  const getRunningBalance = useCallback((transactionId: string) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Filtrar apenas transações válidas (não futuras e não órfãs)
    const validTransactions = transactions.data.filter(t => {
      // Normalizar a data da transação
      let transactionDate: Date;
      if (typeof t.date === 'string') {
        // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
        if (t.date.includes('/')) {
          const [day, month, year] = t.date.split('/');
          transactionDate = new Date(`${year}-${month}-${day}`);
        } else {
          transactionDate = new Date(t.date);
        }
      } else {
        transactionDate = new Date(t.date);
      }
      
      // Ocultar parcelas futuras
      if (t.installmentNumber && transactionDate > today) {
        return false;
      }
      return true;
    });
    
    // ✅ CORREÇÃO CRÍTICA: Ordenar SEMPRE por createdAt (ordem cronológica de criação)
    const sortedTransactions = [...validTransactions].sort((a, b) => {
      // Prioridade 1: Ordenar por createdAt
      if (a.createdAt && b.createdAt) {
        const createdA = new Date(a.createdAt).getTime();
        const createdB = new Date(b.createdAt).getTime();
        if (createdA !== createdB) {
          return createdA - createdB;
        }
      }
      
      // Fallback 1: Se só um tem createdAt, priorizar o que tem
      if (a.createdAt && !b.createdAt) return -1;
      if (!a.createdAt && b.createdAt) return 1;
      
      // Fallback 2: Ordenar por data da transação
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      // Fallback 3: ordenar por ID (IDs mais antigos primeiro)
      return a.id.localeCompare(b.id);
    });
    
    console.log('💰 [getRunningBalance] Transações ordenadas:', sortedTransactions.map((t, idx) => ({
      index: idx,
      id: t.id.substring(0, 8),
      description: t.description,
      date: t.date,
      createdAt: t.createdAt,
      amount: t.amount,
      type: t.type
    })));
    
    const transactionIndex = sortedTransactions.findIndex(t => t.id === transactionId);
    if (transactionIndex === -1) {
      console.warn('⚠️ [getRunningBalance] Transação não encontrada:', transactionId);
      return 0;
    }
    
    console.log('💰 [getRunningBalance] Calculando saldo para transação:', {
      id: transactionId,
      index: transactionIndex,
      totalTransactions: sortedTransactions.length
    });
    
    // Calcular saldo acumulado até esta transação
    const finalBalance = sortedTransactions
      .slice(0, transactionIndex + 1)
      .reduce((balance, t, index) => {
        // ✅ CORREÇÃO CRÍTICA: SEMPRE usar o valor TOTAL (amount), NÃO o myShare
        // Motivo: O saldo da conta reflete o movimento real de dinheiro
        // Se você pagou R$ 100 por outra pessoa, R$ 100 saiu da sua conta
        const amount = Math.abs(Number(t.amount));
        
        let newBalance = balance;
        // Aceitar ambos os formatos: income/RECEITA e expense/DESPESA
        if (t.type === 'income' || t.type === 'RECEITA') {
          newBalance = balance + amount;
        } else if (t.type === 'expense' || t.type === 'DESPESA') {
          newBalance = balance - amount;
        }
        
        console.log(`💰 [getRunningBalance] Transação ${index + 1}/${transactionIndex + 1}:`, {
          description: t.description,
          type: t.type,
          amount,
          balanceBefore: balance,
          balanceAfter: newBalance
        });
        
        return newBalance;
      }, 0);
    
    console.log('💰 [getRunningBalance] Saldo final calculado:', finalBalance);
    return finalBalance;
  }, [transactions.data]);

  // DEBUG: Log das transações carregadas
  useEffect(() => {
    console.log('🔍 DEBUG TRANSAÇÕES - Total carregadas:', transactions.data?.length || 0);
    console.log('🔍 DEBUG TRANSAÇÕES - Dados:', transactions.data);
    console.log('🔍 DEBUG TRANSAÇÕES - isLoading:', isLoading);
    console.log('🔍 DEBUG TRANSAÇÕES - error:', error);
  }, [transactions.data, isLoading, error]);

  // Hook específico para transações com método delete - removido pois agora usamos useUnified

  // Estados locais para UI e filtros
  const { getPeriodDates: getGlobalPeriodDates, getMonthYearLabel } = usePeriod();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');
  
  // Filtros básicos
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterTrip, setFilterTrip] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Função para limpar dados inválidos
  const handleCleanupInvalidData = async () => {
    if (!confirm('Deseja limpar todas as transações inválidas (sem conta, sem categoria, parcelas futuras)? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const results = [];
      
      // 1. Limpar transações órfãs (sem conta válida)
      const orphansResponse = await fetch('/api/transactions/cleanup-orphans', {
        method: 'DELETE',
        credentials: 'include',
      });
      const orphansResult = await orphansResponse.json();
      results.push(`Órfãs: ${orphansResult.deleted || 0}`);
      
      // 2. Limpar transações sem categoria
      const noCategoryResponse = await fetch('/api/transactions/cleanup-no-category', {
        method: 'DELETE',
        credentials: 'include',
      });
      const noCategoryResult = await noCategoryResponse.json();
      results.push(`Sem categoria: ${noCategoryResult.deleted || 0}`);
      
      toast.success(`Limpeza concluída! ${results.join(', ')} transações removidas.`);
      
      // Atualizar dados
      actions.refresh();
      
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      toast.error('Erro ao limpar dados inválidos');
    }
  };

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
    // ✅ NOVO: Mensagem diferente para transações parceladas
    let confirmMessage = `Tem certeza que deseja excluir a transação "${transaction.description}"?`;
    
    if (transaction.isInstallment && transaction.totalInstallments && transaction.totalInstallments > 1) {
      confirmMessage = `⚠️ ATENÇÃO: Esta é uma transação parcelada!\n\n` +
        `Ao excluir esta parcela, TODAS as ${transaction.totalInstallments} parcelas do grupo serão excluídas.\n\n` +
        `Parcela: ${transaction.installmentNumber}/${transaction.totalInstallments}\n` +
        `Descrição: "${transaction.description}"\n\n` +
        `Deseja continuar e excluir TODAS as parcelas?`;
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        await actions.deleteTransaction(transaction.id);
        
        if (transaction.isInstallment && transaction.totalInstallments && transaction.totalInstallments > 1) {
          toast.success(`✅ Todas as ${transaction.totalInstallments} parcelas foram excluídas!`);
        } else {
          toast.success('Transação excluída com sucesso!');
        }
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

  // Usar o período do seletor global
  const getPeriodDates = useCallback(() => {
    const globalDates = getGlobalPeriodDates();
    return {
      startDate: globalDates.startDate.toISOString().slice(0, 10),
      endDate: globalDates.endDate.toISOString().slice(0, 10)
    };
  }, [getGlobalPeriodDates]);

  // Filtrar transações baseado nos critérios
  const filteredTransactions = useMemo(() => {
    // Garantir que transactions seja sempre um array
    const transactionsArray = Array.isArray(transactions.data) ? transactions.data : [];
    
    // Filtrar parcelas futuras
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    console.log('📅 Data de hoje para filtro:', today.toISOString());
    
    let filtered = transactionsArray.filter(t => {
      // VALIDAÇÃO 1: Permitir transações sem categoria (será mostrado como "Sem categoria")
      // Removido filtro que excluía transações sem categoryId
      
      // VALIDAÇÃO 2: Normalizar a data da transação
      let transactionDate: Date;
      if (typeof t.date === 'string') {
        // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
        if (t.date.includes('/')) {
          const [day, month, year] = t.date.split('/');
          transactionDate = new Date(`${year}-${month}-${day}`);
        } else {
          transactionDate = new Date(t.date);
        }
      } else {
        transactionDate = new Date(t.date);
      }
      
      // Não filtrar parcelas futuras - elas devem aparecer no mês correspondente
      return true;
    });

    console.log('🔍 DEBUG FILTROS - Transações iniciais:', filtered.length);
    console.log('🔍 DEBUG FILTROS - Todas as transações:', filtered.map(t => ({
      id: t.id,
      description: t.description,
      date: t.date,
      dateType: typeof t.date,
      dateISO: new Date(t.date).toISOString(),
      dateSlice: new Date(t.date).toISOString().slice(0, 10)
    })));

    // Filtrar pelo período apenas se não estiver mostrando todas
    if (!showAllTransactions) {
      const { startDate, endDate } = getPeriodDates();
      filtered = filtered.filter(t => {
        const transactionDate = t.date.includes('/') 
          ? t.date.split('/').reverse().join('-')
          : t.date.split('T')[0];
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    // Aplicar filtros básicos
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.categoryId === filterCategory);
    }

    if (filterAccount !== 'all') {
      filtered = filtered.filter(t => t.accountId === filterAccount);
    }

    if (filterTrip !== 'all') {
      if (filterTrip === 'trip') {
        filtered = filtered.filter(t => t.tripId);
      } else if (filterTrip === 'no-trip') {
        filtered = filtered.filter(t => !t.tripId);
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    console.log('🔍 DEBUG FILTROS - Transações filtradas:', filtered.length);

    // ✅ CORREÇÃO CRÍTICA: Ordenar SEMPRE por createdAt (ordem cronológica de criação)
    const sorted = filtered.sort((a, b) => {
      // Prioridade 1: Ordenar por createdAt
      if (a.createdAt && b.createdAt) {
        const createdA = new Date(a.createdAt).getTime();
        const createdB = new Date(b.createdAt).getTime();
        if (createdA !== createdB) {
          return createdA - createdB;
        }
      }
      
      // Fallback 1: Se só um tem createdAt, priorizar o que tem
      if (a.createdAt && !b.createdAt) return -1;
      if (!a.createdAt && b.createdAt) return 1;
      
      // Fallback 2: Ordenar por data da transação
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      // Fallback 3: ordenar por ID (IDs mais antigos primeiro)
      return a.id.localeCompare(b.id);
    });
    
    console.log('🔍 DEBUG FILTROS - Transações ORDENADAS para exibição:');
    sorted.forEach((t, idx) => {
      console.log(`  ${idx + 1}. ${t.description}`, {
        id: t.id,
        idPrefix: t.id.substring(0, 10),
        date: t.date,
        createdAt: t.createdAt,
        amount: t.amount,
        hasCreatedAt: !!t.createdAt
      });
    });
    
    console.log('🔍 Comparação de IDs:');
    console.log('  Depósito:', 'cmh8egkmn000bhaxc386aagti'.substring(0, 10));
    console.log('  Despesa:', 'cmh91vb5m00073gdfkdxqtz4z'.substring(0, 10));
    console.log('  Recebimento:', 'cmh9erp5r0015a7eq0srwoq1u'.substring(0, 10));
    
    return sorted;
  }, [transactions.data, getPeriodDates, showAllTransactions, filterType, filterCategory, filterAccount, filterTrip, searchQuery]);

  // Calcular saldo apenas das transações do período selecionado
  const currentMonthBalance = useMemo(() => {
    const transactionsArray = Array.isArray(transactions.data) ? transactions.data : [];
    const { startDate, endDate } = getPeriodDates();
    
    console.log('=== DEBUG SALDO TOTAL ===');
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

    // ✅ CORREÇÃO: Calcular saldo do período localmente
    const periodBalance = currentPeriodTransactions.reduce((sum, t) => {
      const amount = Math.abs(Number(t.amount) || 0);
      if (t.type === 'income' || t.type === 'RECEITA') {
        return sum + amount;
      } else if (t.type === 'expense' || t.type === 'DESPESA') {
        return sum - amount;
      }
      return sum;
    }, 0);

    console.log('Saldo do período (API):', periodBalance);
    console.log('=== FIM DEBUG ===');

    return periodBalance;
  }, [transactions.data, getPeriodDates]);

  // Calcular resumo do período para os cards
  const periodSummary = useMemo(() => {
    const transactionsArray = Array.isArray(transactions.data) ? transactions.data : [];
    const { startDate, endDate } = getPeriodDates();
    
    console.log('📊 [PeriodSummary] Calculando resumo do período:', { startDate, endDate });
    console.log('📊 [PeriodSummary] Total de transações:', transactionsArray.length);
    
    // Filtrar transações do período selecionado
    const periodTransactions = transactionsArray.filter(t => {
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
      
      // ✅ CORREÇÃO CRÍTICA: Incluir transações PENDENTES nos cálculos
      // Apenas excluir transações CANCELADAS ou DELETADAS
      const isValidStatus = t.status !== 'cancelled' && !t.deletedAt;
      const isInPeriod = transactionDate >= startDate && transactionDate <= endDate;
      
      if (isInPeriod) {
        console.log('📊 [PeriodSummary] Transação no período:', {
          description: t.description,
          amount: t.amount,
          type: t.type,
          status: t.status,
          isValidStatus
        });
      }
      
      return isInPeriod && isValidStatus;
    });
    
    console.log('📊 [PeriodSummary] Transações filtradas:', periodTransactions.length);

    // Calcular totais - aceitar ambos os formatos (income/RECEITA e expense/DESPESA)
    const income = periodTransactions
      .filter(t => t.type === 'income' || t.type === 'RECEITA')
      .reduce((sum, t) => sum + getTransactionAmount(t), 0);

    const expenses = periodTransactions
      .filter(t => t.type === 'expense' || t.type === 'DESPESA')
      .reduce((sum, t) => sum + getTransactionAmount(t), 0);

    const balance = income - expenses;
    const transactionCount = periodTransactions.length;

    return {
      income,
      expenses,
      balance,
      transactionCount
    };
  }, [transactions.data, getPeriodDates]);

  // Funções de formatação
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatDate = (date: string | Date) => {
    try {
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        console.warn('Formato de data inválido:', typeof date, date);
        return 'Data inválida';
      }
      
      if (isNaN(dateObj.getTime())) {
        console.warn('Data inválida detectada:', date);
        return 'Data inválida';
      }
      
      // Usar formatação mais robusta
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.warn('Erro ao formatar data:', error, date);
      return 'Data inválida';
    }
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
    if (transaction.type === 'income' || transaction.type === 'RECEITA') {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    } else if (transaction.type === 'expense' || transaction.type === 'DESPESA') {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    } else {
      return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTransactionColor = (transaction: Transaction) => {
    // Para transações do tipo 'expense' ou 'DESPESA' (despesas), usar vermelho
    if (transaction.type === 'expense' || transaction.type === 'DESPESA') return 'text-red-600';
    // Para transações do tipo 'income' ou 'RECEITA' (receitas), usar verde
    if (transaction.type === 'income' || transaction.type === 'RECEITA') return 'text-green-600';
    // Para transferências, usar azul
    if (transaction.type === 'transfer') return 'text-blue-600';
    // Fallback para outros tipos
    return 'text-blue-600';
  }

  const getAccountName = (accountId: string | null, creditCardId?: string | null) => {
    // Se tem accountId, buscar conta
    if (accountId) {
      const account = accounts.data?.find(a => a.id === accountId);
      if (account) {
        // Mapeamento de tipos de conta para nomes legíveis
        const typeNames: Record<string, string> = {
          'checking': 'Conta Corrente',
          'savings': 'Poupança',
          'investment': 'Investimento',
          'credit_card': 'Cartão de Crédito',
          'wallet': 'Carteira',
          'other': 'Outra',
          'ATIVO': 'Conta',
          'PASSIVO': 'Dívida',
          'RECEITA': 'Receita',
          'DESPESA': 'Despesa'
        };
        
        // Adicionar emoji baseado no tipo da conta
        const typeEmoji: Record<string, string> = {
          'checking': '🏦',
          'savings': '💰',
          'investment': '📈',
          'credit_card': '💳',
          'wallet': '👛',
          'other': '📊',
          'ATIVO': '🏦',
          'PASSIVO': '💳',
          'RECEITA': '💵',
          'DESPESA': '💸'
        };
        
        const emoji = typeEmoji[account.type] || '💼';
        const typeName = typeNames[account.type] || account.type;
        
        // Se o nome da conta for genérico (Teste, Conta, etc), mostrar o tipo
        const genericNames = ['teste', 'conta', 'account', 'bank'];
        const isGenericName = genericNames.some(g => account.name.toLowerCase().includes(g));
        
        if (isGenericName) {
          return `${emoji} ${typeName}`;
        }
        
        return `${emoji} ${account.name}`;
      }
      return '❓ Conta não encontrada';
    }
    
    // Se não tem accountId mas tem creditCardId, buscar cartão
    if (creditCardId) {
      // Tentar encontrar o cartão de várias formas
      // 1. Com prefixo "card-"
      const cardIdWithPrefix = `card-${creditCardId}`;
      let card = accounts.data?.find(a => a.id === cardIdWithPrefix && a.type === 'credit_card');
      
      // 2. Sem prefixo
      if (!card) {
        card = accounts.data?.find(a => a.id === creditCardId && a.type === 'credit_card');
      }
      
      // 3. Procurar em qualquer conta com esse ID
      if (!card) {
        card = accounts.data?.find(a => a.id === creditCardId);
      }
      
      if (card) {
        return `💳 ${card.name}`;
      }
      return '❓ Cartão não encontrado';
    }
    
    return '⚠️ Conta não informada';
  };

  const getCategoryName = (categoryId: string | null | undefined, transaction?: any) => {
    // ✅ CORREÇÃO: Se não tem categoria, detectar automaticamente pelo padrão da descrição
    if (!categoryId && transaction?.description) {
      const desc = transaction.description.toLowerCase();
      
      // Recebimento de fatura
      if (desc.includes('recebimento') && desc.includes('fatura')) {
        return '💰 Recebimento de Fatura';
      }
      
      // Pagamento de fatura
      if (desc.includes('pagamento') && desc.includes('fatura')) {
        return '💳 Pagamento de Fatura';
      }
      
      // Pagamento de dívida
      if (desc.includes('pagamento de dívida') || desc.includes('pagamento -')) {
        return '💸 Pagamento de Dívida';
      }
      
      // Recebimento de dívida (alguém te pagou)
      if (desc.includes('recebimento -') && !desc.includes('fatura')) {
        return '💵 Recebimento de Dívida';
      }
      
      // Transferência entre contas
      if (desc.includes('transferência') || desc.includes('transferencia')) {
        return '🔄 Transferência';
      }
      
      // Depósito inicial
      if (desc.includes('depósito inicial') || desc.includes('deposito inicial')) {
        return '💵 Depósito Inicial';
      }
      
      // Saque
      if (desc.includes('saque')) {
        return '💸 Saque';
      }
      
      // Investimento
      if (desc.includes('investimento') || desc.includes('aplicação')) {
        return '📈 Investimento';
      }
      
      // Resgate
      if (desc.includes('resgate')) {
        return '💰 Resgate';
      }
    }
    
    if (!categoryId) {
      return '❓ Categoria não informada';
    }
    
    const category = categories.data?.find(c => c.id === categoryId);
    if (category) {
      // Adicionar emoji da categoria se existir
      const emoji = category.icon || '📁';
      return `${emoji} ${category.name}`;
    }
    
    return '❓ Categoria não encontrada';
  };

  const getTripName = (tripId: string | null | undefined) => {
    if (!tripId) return null;
    
    // Por enquanto, retornar um nome genérico
    // Em uma implementação completa, buscaríamos da API de trips
    return 'Viagem';
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
      <ModernAppLayout title="Transações">
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
      subtitle="Todas as operações financeiras em um só lugar"
    >
      <OptimizedPageTransition>
        <div className="p-4 md:p-6 space-y-6">
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
                  {getMonthYearLabel()}
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
                  {getMonthYearLabel()}
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
                  {getMonthYearLabel()} • {periodSummary.transactionCount} transações
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
                  {getMonthYearLabel()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Transações */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
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

              {/* Filtros Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4 border-t">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Select value={filterType} onValueChange={(value) => setFilterType(value as TransactionType | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                    <SelectItem value="transfer">Transferências</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {categories.data?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterAccount} onValueChange={setFilterAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {accounts.data?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={showAllTransactions ? 'default' : 'outline'}
                  onClick={() => setShowAllTransactions(!showAllTransactions)}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showAllTransactions ? 'Todas' : getMonthYearLabel()}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma transação encontrada para os filtros selecionados
                  </p>
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
                                  
                                  {/* Badge de Receita/Despesa */}
                                  {(transaction.type === 'income' || transaction.type === 'RECEITA') && (
                                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                      Receita
                                    </Badge>
                                  )}
                                  {(transaction.type === 'expense' || transaction.type === 'DESPESA') && (
                                    <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                                      Despesa
                                    </Badge>
                                  )}
                                  
                                  {transaction.isInstallment && (
                                    <>
                                      <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                                        {transaction.status === 'completed' || transaction.status === 'cleared' ? '✓' : '○'} Parcela {transaction.installmentNumber}/{transaction.totalInstallments}
                                      </Badge>
                                      {/* ✅ NOVO: Mostrar quem deve se for compartilhado */}
                                      {transaction.isShared && (() => {
                                        try {
                                          const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : null;
                                          const paidBy = (transaction as any).paidBy;
                                          const personName = metadata?.paidByName;
                                          
                                          if (paidBy && personName) {
                                            return (
                                              <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                                                👤 {personName} deve esta parcela
                                              </Badge>
                                            );
                                          }
                                        } catch (e) {
                                          return null;
                                        }
                                        return null;
                                      })()}
                                    </>
                                  )}
                                  {transaction.isShared && (
                                    <>
                                      {/* ✅ NOVO: Verificar se é "Pago por outra pessoa" usando paidBy */}
                                      {transaction.paidBy ? (
                                        <>
                                          <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                                            💳 Pago por outra pessoa
                                          </Badge>
                                          {(() => {
                                            try {
                                              const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : null;
                                              const personName = metadata?.paidByName;
                                              if (personName) {
                                                return (
                                                  <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                                                    📊 Dívida com {personName}
                                                  </Badge>
                                                );
                                              }
                                            } catch (e) {
                                              return null;
                                            }
                                            return null;
                                          })()}
                                        </>
                                      ) : (
                                        <>
                                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                            Compartilhada
                                          </Badge>

                                        </>
                                      )}
                                    </>
                                  )}
                                  {transaction.tripId && (
                                    <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-medium">
                                      🧳 Viagem
                                      {transaction.tripExpenseType && transaction.tripExpenseType === 'shared' && (
                                        <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">
                                          Compartilhada
                                        </span>
                                      )}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{getAccountName(transaction.accountId, transaction.creditCardId)}</span>
                                  <span>•</span>
                                  <span>{getCategoryName(transaction.categoryId, transaction)}</span>
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
                                  {(() => {
                                    // ✅ CORREÇÃO: Mostrar valor total quando EU paguei, myShare quando OUTRO pagou
                                    let displayAmount = Math.abs(transaction.amount);
                                    
                                    console.log('💰 [Display] Transação:', {
                                      id: transaction.id,
                                      description: transaction.description,
                                      amount: transaction.amount,
                                      myShare: transaction.myShare,
                                      isShared: transaction.isShared,
                                      paidBy: (transaction as any).paidBy
                                    });
                                    
                                    // Se é compartilhada E outra pessoa pagou, mostrar apenas minha parte
                                    // Se EU paguei, mostrar o valor total
                                    const paidBy = (transaction as any).paidBy;
                                    const isPaidByOther = paidBy && paidBy !== 'current_user'; // TODO: comparar com ID real do usuário
                                    
                                    if (transaction.isShared && transaction.myShare && isPaidByOther) {
                                      displayAmount = Math.abs(Number(transaction.myShare));
                                      console.log('✅ [Display] Usando myShare (pago por outro):', displayAmount);
                                    } else {
                                      displayAmount = Math.abs(transaction.amount);
                                      console.log('✅ [Display] Usando amount (eu paguei):', displayAmount);
                                    }
                                    
                                    const isExpense = transaction.type === 'expense' || transaction.type === 'DESPESA' || (transaction.type === 'shared' && transaction.amount < 0);
                                    return isExpense ? `-${formatCurrency(displayAmount)}` : `+${formatCurrency(displayAmount)}`;
                                  })()}
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
