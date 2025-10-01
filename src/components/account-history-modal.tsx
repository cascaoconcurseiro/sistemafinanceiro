'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  Search, 
  Calendar, 
  History, 
  Eye,
  Users,
  Circle
} from 'lucide-react';
import { useUnified } from '@/contexts/unified-context-fixed';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AccountHistoryModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TransactionWithBalance extends Transaction {
  runningBalance: number;
}

export function AccountHistoryModal({
  account,
  isOpen,
  onClose,
}: AccountHistoryModalProps) {
  const { transactions, getRunningBalance, getAccountBalance } = useUnified();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filtrar transações da conta - INCLUINDO transferências de entrada
  const accountTransactions = useMemo(() => {
    if (!account) return [];
    
    // Buscar TODAS as transações relacionadas à conta (saída E entrada)
    let filtered = transactions.filter(t => 
      t.accountId === account.id || t.toAccountId === account.id
    );
    
    // Aplicar filtro de tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(t => {
        if (filterType === 'transfer') {
          return t.type === 'transfer';
        }
        // Para income/expense, considerar a perspectiva da conta
        if (t.accountId === account.id) {
          return t.type === filterType;
        } else if (t.toAccountId === account.id && t.type === 'transfer') {
          // Transferência de entrada é vista como income para esta conta
          return filterType === 'income';
        }
        return false;
      });
    }
    
    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Ordenar por data
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  }, [account, transactions, filterType, searchTerm, sortOrder]);

  // Calcular transações com saldo corrente
  const transactionsWithBalance = useMemo(() => {
    if (!account) return [];
    
    const result: TransactionWithBalance[] = [];
    
    // Ordenar todas as transações da conta por data (mais antigas primeiro)
    const allAccountTransactions = transactions
      .filter(t => t.accountId === account.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calcular transações com saldo corrente
    accountTransactions.forEach(transaction => {
      const runningBalance = getRunningBalance(transaction.id, account.id);
      result.push({
        ...transaction,
        runningBalance
      });
    });
    
    return result;
  }, [account, accountTransactions, transactions, getRunningBalance]);

  // Estatísticas do período - CORRIGIDO para mostrar valores corretos nos totais
  const periodStats = useMemo(() => {
    if (!account) return { income: 0, expenses: 0, transfers: 0, net: 0, totalTransactions: 0 };
    
    // Buscar TODAS as transações relacionadas à conta (saída e entrada)
    const allRelatedTransactions = transactions.filter(t => 
      t.accountId === account.id || t.toAccountId === account.id
    );
    
    let income = 0;
    let expenses = 0;
    let transfersIn = 0;
    let transfersOut = 0;
    
    allRelatedTransactions.forEach(t => {
      if (t.accountId === account.id) {
        // Transações de saída da conta
        if (t.type === 'income') {
          income += t.amount;
        } else if (t.type === 'expense') {
          expenses += t.amount; // Mostrar como valor positivo no total
        } else if (t.type === 'transfer') {
          transfersOut += t.amount; // Transferência saindo
        }
      } else if (t.toAccountId === account.id && t.type === 'transfer') {
        // Transferências de entrada na conta
        transfersIn += t.amount; // Transferência entrando
      }
    });
    
    const netTransfers = transfersIn - transfersOut;
    
    console.log(`=== ESTATÍSTICAS PERÍODO - ${account.name} ===`);
    console.log('Transações relacionadas:', allRelatedTransactions);
    console.log('Receitas:', income);
    console.log('Despesas:', expenses);
    console.log('Transferências In:', transfersIn);
    console.log('Transferências Out:', transfersOut);
    console.log('Transferências Net:', netTransfers);
    console.log('=== FIM ESTATÍSTICAS ===');
    
    return {
      income,
      expenses,
      transfers: netTransfers,
      net: income - expenses + netTransfers,
      totalTransactions: allRelatedTransactions.length
    };
  }, [account, transactions]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'transfer':
        return <ArrowUpDown className="w-4 h-4 text-blue-600" />;
      default:
        return <ArrowUpDown className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string, transaction: any, account: any) => {
    if (transaction.accountId === account.id) {
      // Transação de saída da conta
      if (type === 'expense' || (type === 'shared' && transaction.amount < 0) || type === 'transfer') {
        return 'text-red-600';
      } else if (type === 'income' || (type === 'shared' && transaction.amount > 0)) {
        return 'text-green-600';
      }
    } else if (transaction.toAccountId === account.id && type === 'transfer') {
      // Transferência de entrada na conta
      return 'text-green-600';
    }
    return 'text-gray-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico da Conta - {account.name}
          </DialogTitle>
          <DialogDescription>
            Extrato detalhado de todas as transações da conta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cabeçalho do extrato */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Extrato da Conta</h3>
              <div className="text-sm text-gray-600">
                {formatDate(new Date().toISOString())}
              </div>
            </div>
            <div className="text-sm text-gray-700">
              <p><strong>Conta:</strong> {account?.name}</p>
              <p><strong>Período:</strong> Todas as transações</p>
            </div>
          </div>

          {/* Estatísticas do período */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Entradas</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(periodStats.income)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Saídas</p>
                    <p className="text-lg font-semibold text-red-600">
                      -{formatCurrency(periodStats.expenses)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Transferências</p>
                    <p className={`text-lg font-semibold ${periodStats.transfers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(periodStats.transfers)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Atual</p>
                    <p className={`text-lg font-semibold ${periodStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(periodStats.net)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e busca */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                Todas
              </Button>
              <Button
                variant={filterType === 'income' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('income')}
              >
                Entradas
              </Button>
              <Button
                variant={filterType === 'expense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('expense')}
              >
                Saídas
              </Button>
              <Button
                variant={filterType === 'transfer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('transfer')}
              >
                Transferências
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigas'}
            </Button>
          </div>

          {/* Lista de transações - Formato de extrato bancário */}
          {transactionsWithBalance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Cabeçalho da tabela */}
              <div className="bg-gray-50 px-4 py-3 border-b">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-2">Data</div>
                  <div className="col-span-4">Descrição</div>
                  <div className="col-span-2">Categoria</div>
                  <div className="col-span-2 text-right">Valor</div>
                  <div className="col-span-2 text-right">Saldo</div>
                </div>
              </div>

              {/* Linhas das transações */}
              <div className="divide-y">
                {transactionsWithBalance.map((transaction, index) => (
                  <div key={transaction.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      {/* Data */}
                      <div className="col-span-2 text-gray-600">
                        {formatDate(transaction.date)}
                      </div>

                      {/* Descrição */}
                      <div className="col-span-4">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type)}
                          <span className="font-medium">{transaction.description}</span>
                        </div>
                      </div>

                      {/* Categoria */}
                      <div className="col-span-2">
                        {transaction.category && (
                          <Badge variant="secondary" className="text-xs">
                            {transaction.category}
                          </Badge>
                        )}
                      </div>

                      {/* Valor */}
                      <div className="col-span-2 text-right">
                        <span className={`font-semibold ${getTransactionColor(transaction.type, transaction, account)}`}>
                          {(() => {
                            if (transaction.accountId === account.id) {
                              // Transação de saída da conta
                              if (transaction.type === 'expense' || (transaction.type === 'shared' && transaction.amount < 0)) {
                                return `-${formatCurrency(Math.abs(transaction.amount))}`;
                              } else if (transaction.type === 'income' || (transaction.type === 'shared' && transaction.amount > 0)) {
                                return `+${formatCurrency(Math.abs(transaction.amount))}`;
                              } else if (transaction.type === 'transfer') {
                                return `-${formatCurrency(Math.abs(transaction.amount))}`;
                              }
                            } else if (transaction.toAccountId === account.id && transaction.type === 'transfer') {
                              // Transferência de entrada na conta
                              return `+${formatCurrency(Math.abs(transaction.amount))}`;
                            }
                            return formatCurrency(Math.abs(transaction.amount));
                          })()}
                        </span>
                      </div>

                      {/* Saldo */}
                      <div className="col-span-2 text-right">
                        <span className={`font-semibold ${transaction.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(transaction.runningBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com informações */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              {periodStats.totalTransactions} transação(ões) encontrada(s)
            </span>
            <span>
              Saldo líquido do período: 
              <span className={`ml-1 font-semibold ${periodStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(periodStats.net)}
              </span>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
