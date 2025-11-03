'use client';

import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
  MapPin,
  CreditCard,
  Banknote,
  Users,
  Layers,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { parseNumber, isValidNumber } from '@/lib/utils/number-utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { canEditTransaction } from '@/lib/transaction-audit';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useRealTimeEvents } from '@/hooks/use-real-time-events';
import { usePeriod } from '@/contexts/period-context';
// Modal removido - transaÃ§Ãµes sÃ£o criadas apenas pelo dashboard

export function UnifiedTransactionList({
  onUpdate,
}: {
  onUpdate?: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Usar o contexto de perÃ­odo para filtrar transaÃ§Ãµes
  const { getPeriodDates } = usePeriod();
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({
    description: '',
    amount: 0,
    category: '',
    date: '',
    notes: '',
  });

  // Usar o hook do Unified Context
  const {
    transactions: allTransactions = [],
    accounts = [],
    loading,
    actions
  } = useUnifiedFinancial();

  // Conectar ao sistema de eventos em tempo real (desabilitado em desenvolvimento por padrÃ£o)
  const { isConnected, connectionError } = useRealTimeEvents({
    enableInDevelopment: false, // Pode ser alterado para true se necessÃ¡rio
    maxReconnectAttempts: 2
  });

  // Filtrar transaÃ§Ãµes pelo perÃ­odo selecionado
  const filteredTransactions = useMemo(() => {
    const { startDate, endDate } = getPeriodDates();

    return validTransactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [validTransactions, getPeriodDates]);

  // Aplicar paginaÃ§Ã£o manual - memoizado para evitar recÃ¡lculos
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredTransactions.length / 20);
    const startIndex = (currentPage - 1) * 20;
    const endIndex = startIndex + 20;
    const transactions = filteredTransactions.slice(startIndex, endIndex);

    return {
      transactions,
      pagination: {
        currentPage,
        totalPages,
        total: filteredTransactions.length,
        limit: 20,
        hasNextPage: endIndex < filteredTransactions.length,
        hasPrevPage: currentPage > 1,
      }
    };
  }, [filteredTransactions, currentPage]);

  const { transactions, pagination } = paginationData;
  // Buscar contas via API para evitar dependÃªncia do contexto
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await fetch('/api/accounts', { credentials: 'include' });
      const result = await response.json();
      return result.success ? result.data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Hook para buscar dados de viagens
  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await fetch('/api/trips', { credentials: 'include' });
      if (!response.ok) return [];
      const data = await response.json();
      return data.data?.trips || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Usar contas do Financial Engine
  const allAccounts = accounts.length > 0 ? accounts : (accountsData || []);

  // FunÃ§Ã£o para obter nome da conta
  const getAccountName = (account: string) => {
    const accountObj = allAccounts.find((acc) => acc.id === account);
    return accountObj?.name || null; // Retorna null se nÃ£o encontrar
  };

  // Filtrar transaÃ§Ãµes vÃ¡lidas (com conta existente e vencimento atÃ© hoje)
  const validTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia de hoje

    return allTransactions.filter(transaction => {
      // 1. ✅ NOVO: Filtrar transações pendentes (pago por outra pessoa)
      if (transaction.status === 'pending' || transaction.status === 'pending_payment') {
        console.log('⏳ Transação pendente ocultada (aguardando pagamento):', {
          id: transaction.id,
          description: transaction.description,
          status: transaction.status,
          paidBy: transaction.paidBy
        });
        return false; // Ocultar transações pendentes
      }

      // 2. Verificar se a conta existe
      const accountName = getAccountName(transaction.account);
      if (!accountName) {
        console.warn('âš ï¸ TransaÃ§Ã£o Ã³rfÃ£ detectada (conta nÃ£o existe):', {
          id: transaction.id,
          description: transaction.description,
          accountId: transaction.account
        });
        return false;
      }

      // 2. Verificar se Ã© uma parcela futura
      const transactionDate = new Date(transaction.date);
      if (transaction.installmentNumber && transactionDate > today) {
        console.log('ðŸ“… Parcela futura ocultada:', {
          description: transaction.description,
          parcela: `${transaction.installmentNumber}/${transaction.totalInstallments}`,
          vencimento: transactionDate.toLocaleDateString('pt-BR')
        });
        return false; // Ocultar parcelas futuras
      }

      return true;
    });
  }, [allTransactions, allAccounts]);

  // Contar parcelas futuras
  const futureInstallmentsCount = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return allTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.installmentNumber && transactionDate > today;
    }).length;
  }, [allTransactions]);

  // Debug: Logar transaÃ§Ãµes para verificar campos
  useEffect(() => {
    if (validTransactions.length > 0) {
      const firstTransaction = validTransactions[0];
      console.log('ðŸ” Exemplo de transaÃ§Ã£o:', {
        description: firstTransaction.description,
        totalInstallments: firstTransaction.totalInstallments,
        installmentNumber: firstTransaction.installmentNumber,
        isShared: firstTransaction.isShared,
        sharedWith: firstTransaction.sharedWith,
        tripId: firstTransaction.tripId,
        type: firstTransaction.type
      });
    }

    // Alertar sobre transaÃ§Ãµes Ã³rfÃ£s e parcelas futuras
    const orphanCount = allTransactions.length - validTransactions.length - futureInstallmentsCount;
    if (orphanCount > 0) {
      console.warn(`âš ï¸ ${orphanCount} transaÃ§Ãµes Ã³rfÃ£s detectadas (sem conta vÃ¡lida)`);
    }
    if (futureInstallmentsCount > 0) {
      console.log(`ðŸ“… ${futureInstallmentsCount} parcelas futuras ocultadas (ainda nÃ£o vencidas)`);
    }
  }, [validTransactions, allTransactions, futureInstallmentsCount]);

  // FunÃ§Ã£o para limpar transaÃ§Ãµes Ã³rfÃ£s
  const handleCleanupOrphans = async () => {
    if (!confirm('Deseja remover todas as transaÃ§Ãµes sem conta vÃ¡lida? Esta aÃ§Ã£o nÃ£o pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch('/api/transactions/cleanup-orphans', {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        actions.refresh(); // Atualizar lista
      } else {
        toast.error(result.error || 'Erro ao limpar transaÃ§Ãµes');
      }
    } catch (error) {
      console.error('Erro ao limpar transaÃ§Ãµes Ã³rfÃ£s:', error);
      toast.error('Erro ao limpar transaÃ§Ãµes Ã³rfÃ£s');
    }
  };

  // FunÃ§Ã£o para obter nome da viagem
  const getTripName = useCallback((tripId: string) => {
    const trip = trips.find((t: any) => t.id === tripId);
    return trip ? trip.name : 'Viagem nÃ£o encontrada';
  }, [trips]);

  // EXCLUSÃƒO USANDO UNIFIED CONTEXT
  const handleDeleteTransaction = async (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Tem certeza que deseja excluir esta transaÃ§Ã£o?')) {
      return;
    }

    try {
      console.log('ðŸ” Actions disponÃ­veis:', actions);
      console.log('ðŸ” Tentando deletar transaÃ§Ã£o:', id);

      if (!actions || !actions.deleteTransaction) {
        throw new Error('FunÃ§Ã£o deleteTransaction nÃ£o estÃ¡ disponÃ­vel');
      }

      await actions.deleteTransaction(id);
      toast.success('TransaÃ§Ã£o excluÃ­da com sucesso!');
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao excluir transaÃ§Ã£o:', error);
      toast.error(`Erro ao excluir transaÃ§Ã£o: ${error.message}`);
    }
  };

  // FunÃ§Ã£o para iniciar ediÃ§Ã£o de transaÃ§Ã£o
  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setEditFormData({
      description: transaction.description || '',
      amount: Math.abs(transaction.amount) || 0,
      category: transaction.category || '',
      date: transaction.date || '',
      notes: transaction.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // EDIÃ‡ÃƒO USANDO UNIFIED CONTEXT
  const handleSaveEdit = async () => {
    if (
      !editFormData.description ||
      !editFormData.amount ||
      !editFormData.category
    ) {
      toast.error('Preencha todos os campos obrigatÃ³rios');
      return;
    }

    // Validar o valor numÃ©rico
    const numericAmount = parseNumber(editFormData.amount);
    if (!isValidNumber(editFormData.amount) || numericAmount <= 0) {
      toast.error(
        'Por favor, insira um valor vÃ¡lido. Use vÃ­rgula para decimais (ex: 100,50)'
      );
      return;
    }

    // Preparar dados para atualizaÃ§Ã£o
    const updatedData = {
      description: editFormData.description,
      amount:
        editingTransaction.type === 'expense'
          ? -Math.abs(numericAmount)
          : Math.abs(numericAmount),
      category: editFormData.category,
      date: editFormData.date,
      notes: editFormData.notes || '',
    };

    try {
      console.log('ðŸ” Actions disponÃ­veis para ediÃ§Ã£o:', actions);
      console.log('ðŸ” Tentando editar transaÃ§Ã£o:', editingTransaction.id, updatedData);

      if (!actions || !actions.updateTransaction) {
        throw new Error('FunÃ§Ã£o updateTransaction nÃ£o estÃ¡ disponÃ­vel');
      }

      await actions.updateTransaction(editingTransaction.id, updatedData);

      toast.success('TransaÃ§Ã£o editada com sucesso!');

      // Limpar estado do modal
      setEditingTransaction(null);
      setIsEditModalOpen(false);
      setEditFormData({
        description: '',
        amount: 0,
        category: '',
        date: '',
        notes: '',
      });

      onUpdate?.();
    } catch (error) {
      console.error('Erro ao editar transaÃ§Ã£o:', error);
      toast.error('Erro ao editar transaÃ§Ã£o');
    }
  };

  // Debounce para busca
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset para primeira pÃ¡gina
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const formatAmount = (transaction: any) => {
    // ✅ CORREÇÃO: Para transações compartilhadas, mostrar apenas minha parte
    let amount = transaction.amount;
    const type = transaction.type;

    // Debug: Log para todas as transações compartilhadas
    if (transaction.isShared || type === 'shared') {
      console.log('🔍 [formatAmount] Transação compartilhada detectada:', {
        description: transaction.description,
        type: type,
        isShared: transaction.isShared,
        amount: transaction.amount,
        myShare: transaction.myShare,
        myShareType: typeof transaction.myShare,
        willUseMyShare: transaction.myShare !== null && transaction.myShare !== undefined
      });
    }

    // Se for compartilhada e tiver myShare definido, usar myShare
    // ✅ CORREÇÃO: Verificar se myShare existe e é diferente de null/undefined
    if ((transaction.isShared || type === 'shared') && 
        transaction.myShare !== null && 
        transaction.myShare !== undefined) {
      amount = transaction.myShare;
      console.log('✅ [formatAmount] Usando myShare:', {
        description: transaction.description,
        totalAmount: transaction.amount,
        myShare: transaction.myShare
      });
    }

    // Verificar se amount é válido
    if (amount === undefined || amount === null || isNaN(amount)) {
      return <span className="text-gray-500 font-semibold">R$ 0,00</span>;
    }

    const value = Math.abs(amount);
    const formatted = value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    if (type === 'income') {
      return <span className="text-green-600 font-semibold">+{formatted}</span>;
    } else {
      return <span className="text-red-600 font-semibold">-{formatted}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>TransaÃ§Ãµes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              Carregando transaÃ§Ãµes...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const orphanCount = allTransactions.length - validTransactions.length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>TransaÃ§Ãµes</CardTitle>
          {orphanCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanupOrphans}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar {orphanCount} Ã³rfÃ£s
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alerta sobre parcelas futuras */}
          {futureInstallmentsCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>{futureInstallmentsCount} parcelas futuras</strong> estÃ£o ocultas (ainda nÃ£o vencidas).
                Elas aparecerÃ£o automaticamente nas datas de vencimento.
              </div>
            </div>
          )}

          {/* Lista de TransaÃ§Ãµes */}
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transaÃ§Ã£o encontrada para o perÃ­odo selecionado
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            : transaction.type === 'shared'
                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                      >
                        {transaction.type === 'income' ? (
                          <span>â†—</span>
                        ) : transaction.type === 'shared' ? (
                          <span>âš¡</span>
                        ) : (
                          <span>â†˜</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">
                            {transaction.description}
                            {/* Mostrar parcelamento no nome */}
                            {transaction.installmentNumber && transaction.totalInstallments && (
                              <span className="text-blue-600 font-bold ml-1">
                                ({transaction.installmentNumber}/{transaction.totalInstallments})
                              </span>
                            )}
                          </h4>

                          {/* Categoria */}
                          {transaction.category && (
                            <Badge variant="secondary" className="text-xs">
                              {transaction.category}
                            </Badge>
                          )}

                          {/* Badge: Parcelada - Mostrar informaÃ§Ã£o completa */}
                          {transaction.totalInstallments && Number(transaction.totalInstallments) > 1 && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 flex items-center gap-1 font-semibold">
                              <Layers className="w-3 h-3" />
                              {transaction.installmentNumber ?
                                `Parcela ${transaction.installmentNumber}/${transaction.totalInstallments}` :
                                `Parcelada ${transaction.totalInstallments}x`
                              }
                            </Badge>
                          )}

                          {/* Badge: Compartilhada - APENAS quando EU paguei */}
                          {!transaction.paidBy && (transaction.isShared ||
                            transaction.type === 'shared' ||
                            (transaction.sharedWith && transaction.sharedWith.length > 0) ||
                            (typeof transaction.sharedWith === 'string' && transaction.sharedWith !== '[]' && transaction.sharedWith !== '')) && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 flex items-center gap-1 font-semibold">
                              <Users className="w-3 h-3" />
                              Compartilhada
                            </Badge>
                          )}

                          {/* Badge: Pago por [Nome] - APENAS quando OUTRA PESSOA pagou */}
                          {transaction.paidBy && (() => {
                            // Buscar nome da pessoa que pagou
                            const payer = contacts.find((c: any) => c.id === transaction.paidBy);
                            const payerName = payer?.name || transaction.paidBy;

                            return (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 flex items-center gap-1 font-semibold">
                                <Users className="w-3 h-3" />
                                Pago por {payerName}
                              </Badge>
                            );
                          })()}

                          {/* Badge: Viagem */}
                          {transaction.tripId && transaction.tripId !== '' && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-1 font-semibold">
                              <MapPin className="w-3 h-3" />
                              {getTripName(transaction.tripId)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                          {/* InformaÃ§Ãµes da Conta/CartÃ£o - Melhorado */}
                          <div className="flex items-center gap-1">
                            {transaction.creditCardId ? (
                              <CreditCard className="w-3 h-3" />
                            ) : (
                              <Banknote className="w-3 h-3" />
                            )}
                            <span>{getAccountName(transaction.account)}</span>
                          </div>

                          {/* Data da TransaÃ§Ã£o */}
                          <span>
                            {(() => {
                              try {
                                // Verificar se transaction.date Ã© vÃ¡lido
                                const dateValue = transaction.date;
                                let dateObj: Date;

                                if (dateValue instanceof Date) {
                                  dateObj = dateValue;
                                } else if (typeof dateValue === 'string') {
                                  dateObj = new Date(dateValue);
                                } else {
                                  console.warn('Formato de data invÃ¡lido:', typeof dateValue, dateValue);
                                  return 'Data invÃ¡lida';
                                }

                                // Verificar se a data Ã© vÃ¡lida
                                if (isNaN(dateObj.getTime())) {
                                  console.warn('Data invÃ¡lida detectada:', dateValue);
                                  return 'Data invÃ¡lida';
                                }

                                // Usar formataÃ§Ã£o mais robusta
                                const year = dateObj.getFullYear();
                                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                const day = String(dateObj.getDate()).padStart(2, '0');

                                return `${day}/${month}/${year}`;
                              } catch (error) {
                                console.warn('Erro ao formatar data da transaÃ§Ã£o:', error, transaction);
                                return 'Data invÃ¡lida';
                              }
                            })()}
                          </span>

                          {/* Data de Vencimento para CartÃ£o de CrÃ©dito */}
                          {transaction.dueDate && (
                            <span className="text-orange-600 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              Venc: {(() => {
                              try {
                                // Verificar se transaction.dueDate Ã© vÃ¡lido
                                const dueDateValue = transaction.dueDate;
                                let dateObj: Date;

                                if (dueDateValue instanceof Date) {
                                  dateObj = dueDateValue;
                                } else if (typeof dueDateValue === 'string') {
                                  dateObj = new Date(dueDateValue);
                                } else {
                                  console.warn('Formato de data de vencimento invÃ¡lido:', typeof dueDateValue, dueDateValue);
                                  return 'Data invÃ¡lida';
                                }

                                // Verificar se a data Ã© vÃ¡lida
                                if (isNaN(dateObj.getTime())) {
                                  console.warn('Data de vencimento invÃ¡lida detectada:', dueDateValue);
                                  return 'Data invÃ¡lida';
                                }

                                // Usar formataÃ§Ã£o mais robusta
                                const year = dateObj.getFullYear();
                                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                const day = String(dateObj.getDate()).padStart(2, '0');

                                return `${day}/${month}/${year}`;
                              } catch (error) {
                                console.warn('Erro ao formatar data de vencimento:', error, transaction);
                                return 'Data invÃ¡lida';
                              }
                            })()}
                            </span>
                          )}

                          {/* Status da TransaÃ§Ã£o */}
                          {transaction.status && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs flex items-center gap-1",
                                transaction.status === 'cleared' || transaction.status === 'completed'
                                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
                                  : transaction.status === 'pending'
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
                                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                              )}
                            >
                              {transaction.status === 'cleared' || transaction.status === 'completed' ? 'Efetivada' :
                               transaction.status === 'pending' ? 'Pendente' :
                               transaction.status === 'cancelled' ? 'Cancelada' :
                               transaction.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {formatAmount(transaction)}
                      {canEditTransaction(transaction) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTransaction(transaction)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* PaginaÃ§Ã£o */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Mostrando{' '}
                    {(pagination.currentPage - 1) * pagination.limit + 1} a{' '}
                    {Math.min(
                      pagination.currentPage * pagination.limit,
                      pagination.total
                    )}{' '}
                    de {pagination.total} transaÃ§Ãµes
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm">
                      PÃ¡gina {currentPage} de {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      PrÃ³xima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de ediÃ§Ã£o */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar TransaÃ§Ã£o</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">DescriÃ§Ã£o *</Label>
              <Input
                id="edit-description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                placeholder="DescriÃ§Ã£o da transaÃ§Ã£o"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Valor *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editFormData.amount}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, amount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoria *</Label>
              <Select
                value={editFormData.category}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AlimentaÃ§Ã£o">AlimentaÃ§Ã£o</SelectItem>
                  <SelectItem value="SalÃ¡rio">SalÃ¡rio</SelectItem>
                  <SelectItem value="Utilidades">Utilidades</SelectItem>
                  <SelectItem value="Transporte">Transporte</SelectItem>
                  <SelectItem value="Lazer">Lazer</SelectItem>
                  <SelectItem value="SaÃºde">SaÃºde</SelectItem>
                  <SelectItem value="EducaÃ§Ã£o">EducaÃ§Ã£o</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Data *</Label>
              <Input
                id="edit-date"
                type="date"
                value={editFormData.date}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">ObservaÃ§Ãµes</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, notes: e.target.value })
                }
                placeholder="ObservaÃ§Ãµes opcionais..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingTransaction(null);
                setEditFormData({
                  description: '',
                  amount: 0,
                  category: '',
                  date: '',
                  notes: '',
                });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Exportar componente memoizado para evitar re-renders desnecessÃ¡rios
export default memo(UnifiedTransactionList);

