'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
// import dynamic from 'next/dynamic'; // Não usado
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Wallet,
  Building2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit,
  Trash2,
  Copy,
  Filter,
  BarChart3,
  DollarSign,
  Calculator,
  AlertTriangle,
  History,
} from 'lucide-react';

// Importações do contexto
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { Account, AccountType } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Modal de criação removido - usar formulário de nova transação
import { EditAccountModal } from '@/components/edit-account-modal';
import { DeleteAccountModal } from '@/components/modals/delete-account-modal';
import { AccountHistoryModal } from '@/components/account-history-modal';

// Regular imports to fix webpack factory function errors
import { ModernAppLayout } from '@/components/modern-app-layout';
import { OptimizedPageTransition } from '@/components/optimized-page-transition';

// Hook de performance
import { useRenderPerformance } from '@/components/optimized-page-transition';

// Regular component to fix webpack factory function errors
const AccountsPageContent = AccountsPageContentComponent;

function AccountsPageContentComponent() {
  // Performance monitoring
  useRenderPerformance('AccountsPage');

  // Estado de montagem para evitar erros de hidratação
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Contexto unificado - usar useUnifiedFinancial com filtros de data
  const {
    accounts,
    transactions,
    balances,
    loading,
    // createTransaction, // Não existe no contexto
    // updateTransaction, // Não existe no contexto
    // deleteTransaction, // Não existe no contexto
    // getTransactionsByAccount, // Não existe no contexto
    actions,
    // dashboardData // Não existe no contexto
  } = useUnifiedFinancial();

  // Estados de loading
  const isLoading = !isMounted || loading;
  
  // Debug loading state
  useEffect(() => {
    console.log('🔍 [Accounts] Debug loading:', {
      isMounted,
      loading,
      isLoading,
      accountsLength: accounts?.length || 0
    });
  }, [isMounted, loading, isLoading, accounts]);

  const { toast } = useToast();

  // Estados locais para UI e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<AccountType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'type' | 'transactions'>('name');
  // Estado removido - não usar mais modal de criar conta
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Filtrar e ordenar contas usando useMemo para evitar problemas de inicialização
  const filteredAndSortedAccounts = useMemo(() => {
    // Verificações de segurança para evitar erros de inicialização
    if (!isMounted || !accounts || !Array.isArray(accounts)) {
      return [];
    }
    
    try {
      // Filtrar apenas contas (excluir cartões de crédito)
      let filtered = accounts.filter(account => account.type !== 'credit');

      // Filtro por busca
      if (searchTerm) {
        filtered = filtered.filter(account => 
          account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (account as any).description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filtro por tipo
      if (selectedType !== 'all') {
        filtered = filtered.filter(account => account.type === selectedType);
      }

      // Ordenação
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'balance':
            // Use account's own balance property to avoid circular dependency
            const aBalance = Number(a.balance) || 0;
            const bBalance = Number(b.balance) || 0;
            return bBalance - aBalance;
          case 'type':
            return (a.type || '').localeCompare(b.type || '');
          case 'transactions':
            // Função comentada - não disponível no contexto
            return 0;
          default:
            return 0;
        }
      });

      return filtered;
    } catch (error) {
      console.warn('Error filtering and sorting accounts:', error);
      return [];
    }
  }, [isMounted, accounts, searchTerm, selectedType, sortBy]);

  // Calcular estatísticas das contas usando useUnified
  const accountStats = useMemo(() => {
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return {
        totalBalance: 0,
        activeAccounts: 0,
        totalAccounts: 0,
        totalTransactions: 0,
        balancesByType: {},
        positiveBalance: 0,
        negativeBalance: 0,
      };
    }

    // Usar dados da API em vez de calcular no frontend
    const totalBalance = balances?.totalBalance || 0;
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    const activeAccounts = safeAccounts.filter(account => (account as any).status === 'active').length;
    const totalTransactions = transactions?.length || 0;
    
    const balancesByType = safeAccounts.reduce((acc, account) => {
      const type = account.type;
      if (!type) return acc;
      
      if (!acc[type]) {
        acc[type] = { balance: 0, count: 0 };
      }
      acc[type].balance += balances?.accountBalances?.[account.id] || 0;
      acc[type].count += 1;
      return acc;
    }, {} as Record<string, { balance: number; count: number }>);

    const positiveBalance = Object.values(balancesByType).reduce((sum, type) => 
      sum + (type.balance > 0 ? type.balance : 0), 0
    );
    const negativeBalance = Object.values(balancesByType).reduce((sum, type) => 
      sum + (type.balance < 0 ? Math.abs(type.balance) : 0), 0
    );

    return {
      totalBalance,
      activeAccounts,
      totalAccounts: safeAccounts.length,
      totalTransactions,
      balancesByType,
      positiveBalance,
      negativeBalance,
    };
  }, [accounts, balances]);

  // Funções de formatação
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'checking':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'savings':
        return <PiggyBank className="h-5 w-5 text-green-600" />;
      case 'credit':
        return <CreditCard className="h-5 w-5 text-purple-600" />;
      case 'investment':
        return <TrendingUp className="h-5 w-5 text-orange-600" />;
      case 'cash':
        return <Wallet className="h-5 w-5 text-gray-600" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getAccountTypeName = (type: AccountType) => {
    const typeNames = {
      checking: 'Conta Corrente',
      savings: 'Poupança',
      credit: 'Cartão de Crédito',
      investment: 'Investimento',
      cash: 'Dinheiro',
    };
    return typeNames[type] || 'Conta';
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const handleCopyAccountId = useCallback(async (accountId: string) => {
    try {
      await navigator.clipboard.writeText(accountId);
      toast({
        title: 'Sucesso',
        description: 'ID da conta copiado para a área de transferência.',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao copiar ID da conta.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleEditAccount = useCallback((account: Account) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  }, []);

  // Função para abrir o modal de histórico
  const handleViewHistory = (account: Account) => {
    setSelectedAccount(account);
    setShowHistoryModal(true);
  };

  // Função para fechar o modal de histórico
  const handleCloseHistory = () => {
    setShowHistoryModal(false);
    setSelectedAccount(null);
  };

  // Função para lidar com a atualização de uma conta
  const handleAccountUpdated = useCallback(async () => {
    setShowEditModal(false);
    setSelectedAccount(null);
    await actions?.refresh?.();
    toast({
      title: 'Sucesso',
      description: 'Conta atualizada com sucesso.',
    });
  }, [actions?.refresh, toast]);

  const handleDeleteAccount = useCallback(async (accountId: string, deleteTransactions?: boolean) => {
    try {
      // Se deleteTransactions for false e houver transações, apenas excluir a conta
      // Se deleteTransactions for true, excluir conta e transações
      const response = await fetch(`/api/accounts?id=${accountId}&deleteTransactions=${deleteTransactions || false}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir conta');
      }

      await actions?.refresh?.();
      toast({
        title: 'Sucesso',
        description: deleteTransactions 
          ? 'Conta e transações excluídas com sucesso.'
          : 'Conta excluída com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir conta.',
        variant: 'destructive',
      });
    }
  }, [toast, actions?.refresh]);

  const handleDeleteClick = useCallback((account: Account) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  }, []);

  // Temporariamente removido para debug - sempre mostrar a página
  // if (isLoading) {
  //   return (
  //     <ModernAppLayout title="Contas">
  //       <div className="p-6 space-y-6">
  //         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  //           {[...Array(4)].map((_, i) => (
  //             <Card key={i}>
  //               <CardContent className="p-6">
  //                 <div className="animate-pulse">
  //                   <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  //                   <div className="h-8 bg-gray-200 rounded w-1/2"></div>
  //                 </div>
  //               </CardContent>
  //             </Card>
  //           ))}
  //         </div>
  //       </div>
  //     </ModernAppLayout>
  //   );
  // }

  return (
    <ModernAppLayout
      title="Contas"
      subtitle="Gerencie suas contas bancárias"
    >
      <OptimizedPageTransition>
        <div className="p-4 md:p-6 space-y-6">
          {/* Header com ações */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {isLoading && (
              <div className="text-xs text-yellow-600">
                ⏳ Carregando dados... (isMounted: {isMounted.toString()}, loading: {loading.toString()})
              </div>
            )}
            <div className="flex-1"></div>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      name: `Nova Conta ${Date.now()}`,
                      type: 'checking',
                      initialBalance: 0
                    })
                  });
                  
                  if (response.ok) {
                    toast({
                      title: 'Sucesso',
                      description: 'Conta criada com sucesso!'
                    });
                    actions?.refresh?.();
                  } else {
                    const error = await response.json();
                    toast({
                      title: 'Erro',
                      description: error.error || 'Erro ao criar conta',
                      variant: 'destructive'
                    });
                  }
                } catch (error) {
                  toast({
                    title: 'Erro',
                    description: 'Erro ao criar conta',
                    variant: 'destructive'
                  });
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>

          {/* Cards de Resumo - Calculados dinamicamente */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getBalanceColor(accountStats.totalBalance)}`}>
                  {formatCurrency(accountStats.totalBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {accountStats.totalAccounts} contas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldos Positivos</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(accountStats.positiveBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ativos disponíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldos Negativos</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(accountStats.negativeBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Passivos pendentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transações</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {accountStats.totalTransactions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de movimentações
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros e Ordenação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome, descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={selectedType} onValueChange={(value) => setSelectedType(value as AccountType | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="checking">Conta Corrente</SelectItem>
                      <SelectItem value="savings">Poupança</SelectItem>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenar por</label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="balance">Saldo</SelectItem>
                      <SelectItem value="type">Tipo</SelectItem>
                      <SelectItem value="transactions">Transações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estatísticas</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Contas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full text-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando contas...</p>
              </div>
            ) : filteredAndSortedAccounts.length === 0 ? (
              <div className="col-span-full text-center p-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma conta encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedType !== 'all' 
                    ? 'Nenhuma conta corresponde aos filtros selecionados.'
                    : 'Você ainda não possui contas cadastradas.'}
                </p>
                {/* Botão removido - usar formulário de nova transação */}
              </div>
            ) : (
              filteredAndSortedAccounts.map((account) => {
                // Verificar se account existe antes de acessar suas propriedades
                if (!account || !account.id) {
                  return null;
                }
                
                // Usar saldo da conta diretamente
                const balance = account.balance || 0;
                const accountTransactions = transactions.filter(t => t.accountId === account.id);
                const recentTransactions = accountTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 3);
                
                return (
                  <Card key={account.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getAccountIcon(account.type)}
                          <div>
                            <CardTitle className="text-lg">{account.name}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {getAccountTypeName(account.type)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getBalanceColor(balance)}`}>
                            {formatCurrency(balance)}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            {balance > 0 ? (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            ) : balance < 0 ? (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            ) : null}
                            {accountTransactions.length} transações
                          </div>
                        </div>
                      </div>
                      {account.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {account.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">

                      {/* Transações recentes */}
                      {recentTransactions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Transações Recentes</p>
                          {recentTransactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between text-sm">
                              <span className="truncate">{transaction.description}</span>
                              <span className={getBalanceColor(
                                transaction.type === 'income' ? transaction.amount : 
                                (transaction.type === 'shared' && transaction.amount > 0) ? transaction.amount : 
                                -transaction.amount
                              )}>
                                {formatCurrency(
                                  transaction.type === 'income' ? transaction.amount : 
                                  (transaction.type === 'shared' && transaction.amount > 0) ? transaction.amount : 
                                  -transaction.amount
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(showDetails === account.id ? null : account.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(account)}
                            title="Ver histórico de transações"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAccount(account)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyAccountId(account.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(account)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Detalhes expandidos */}
                      {showDetails === account.id && (
                        <div className="pt-4 border-t space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">ID:</span>
                              <p className="font-mono text-xs">{account.id}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Moeda:</span>
                              <p>{account.currency || 'BRL'}</p>
                            </div>
                            {account.type === 'credit' && (
                              <>
                                <div>
                                  <span className="text-muted-foreground">Fechamento:</span>
                                  <p>Dia {account.closingDay || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Vencimento:</span>
                                  <p>Dia {account.dueDay || 'N/A'}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Aviso sobre o Sistema */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-blue-900">Sistema Baseado em Transações</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Os saldos das contas são calculados dinamicamente a partir das transações. 
                    Não há saldo fixo armazenado - tudo é derivado das movimentações financeiras.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </OptimizedPageTransition>
      
      {/* Modal de criação removido - usar formulário de nova transação */}
      
        {/* Modal de histórico de transações */}
        <AccountHistoryModal
          account={selectedAccount}
          isOpen={showHistoryModal}
          onClose={handleCloseHistory}
        />

        {/* Modal de exclusão de conta */}
        <DeleteAccountModal
          account={selectedAccount}
          transactions={transactions}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedAccount(null);
          }}
          onConfirm={handleDeleteAccount}
        />

        {/* Modal de edição de conta */}
        {showEditModal && selectedAccount && (
          <EditAccountModal
            account={selectedAccount}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedAccount(null);
            }}
            onAccountUpdated={handleAccountUpdated}
          />
        )}
    </ModernAppLayout>
  );
}

export default AccountsPageContent;
