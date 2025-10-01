'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useUnified } from '@/contexts/unified-context-simple';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import {
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { parseNumber, isValidNumber } from '../lib/utils/number-utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { AdvancedFilters } from './ui/advanced-filters';
import { useRealTimeEvents } from '../hooks/use-real-time-events';
// Modal removido - transações são criadas apenas pelo dashboard

export function UnifiedTransactionList({
  onUpdate,
}: {
  onUpdate?: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
  } = useUnified();

  // Conectar ao sistema de eventos em tempo real (desabilitado em desenvolvimento por padrão)
  const { isConnected, connectionError } = useRealTimeEvents({
    enableInDevelopment: false, // Pode ser alterado para true se necessário
    maxReconnectAttempts: 2
  });

  // Estado dos dados filtrados
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [activeFilters, setActiveFilters] = useState<any>({});

  // Aplicar filtros usando o componente AdvancedFilters
  const handleFiltersChange = useCallback((filtered: any[], filters: any) => {
    // Ordenar por data (mais recente primeiro)
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setFilteredData(sorted);
    setActiveFilters(filters);
  }, []);

  // Se não há filtros ativos, usar todas as transações
  const filteredTransactions = useMemo(() => {
    // Se há filtros ativos ou dados filtrados, usar dados filtrados
    if (activeFilters.count > 0 && filteredData.length >= 0) {
      return filteredData;
    }
    // Caso contrário, usar todas as transações ordenadas
    return [...allTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredData, allTransactions, activeFilters.count]);

  // Aplicar paginação manual
  const totalPages = Math.ceil(filteredTransactions.length / 20);
  const startIndex = (currentPage - 1) * 20;
  const endIndex = startIndex + 20;
  const transactions = filteredTransactions.slice(startIndex, endIndex);

  const pagination = {
    currentPage,
    totalPages,
    total: filteredTransactions.length,
    limit: 20,
    hasNextPage: endIndex < filteredTransactions.length,
    hasPrevPage: currentPage > 1,
  };
  // Buscar contas via API para evitar dependência do contexto  
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await fetch('/api/accounts');
      const result = await response.json();
      return result.success ? result.data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Usar contas do Financial Engine
  const allAccounts = accounts.length > 0 ? accounts : (accountsData || []);

  // Função para obter nome da conta
  const getAccountName = (account: string) => {
    const accountObj = allAccounts.find((acc) => acc.id === account);
    return accountObj?.name || 'Conta não encontrada';
  };

  // EXCLUSÃO USANDO UNIFIED CONTEXT
  const handleDeleteTransaction = async (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Tem certeza que deseja excluir esta transação?')) {
      return;
    }

    try {
      await actions.removeTransaction(id);
      toast.success('Transação excluída com sucesso!');
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  // Função para iniciar edição de transação
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

  // EDIÇÃO USANDO UNIFIED CONTEXT
  const handleSaveEdit = async () => {
    if (
      !editFormData.description ||
      !editFormData.amount ||
      !editFormData.category
    ) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar o valor numérico
    const numericAmount = parseNumber(editFormData.amount);
    if (!isValidNumber(editFormData.amount) || numericAmount <= 0) {
      toast.error(
        'Por favor, insira um valor válido. Use vírgula para decimais (ex: 100,50)'
      );
      return;
    }

    // Preparar dados para atualização
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
      await actions.updateTransaction(editingTransaction.id, updatedData);

      toast.success('Transação editada com sucesso!');

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
      console.error('Erro ao editar transação:', error);
      toast.error('Erro ao editar transação');
    }
  };

  // Debounce para busca
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset para primeira página
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const formatAmount = (amount: number, type: string) => {
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
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              Carregando transações...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filtros Avançados */}
          <AdvancedFilters
            data={allTransactions}
            onFiltersChange={handleFiltersChange}
            enableSearch={true}
            enableDateRange={true}
            enableAmountRange={true}
            enableCategory={true}
            enableType={true}
            enableStatus={false}
            title="Filtrar Transações"
            compactMode={true}
          />

          {/* Lista de Transações */}
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedType || selectedCategory
                ? 'Nenhuma transação encontrada com os filtros aplicados'
                : 'Nenhuma transação encontrada'}
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
                          <span>↗</span>
                        ) : transaction.type === 'shared' ? (
                          <span>⚡</span>
                        ) : (
                          <span>↘</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {transaction.description}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {transaction.category}
                          </Badge>
                          {/* Exibir informações de parcelas */}
                          {transaction.installmentNumber && transaction.totalInstallments && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {transaction.installmentNumber}/{transaction.totalInstallments}
                            </Badge>
                          )}
                          {/* Indicador de transação pai (parcelada) */}
                          {transaction.totalInstallments && !transaction.parentTransactionId && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              Parcelado
                            </Badge>
                          )}
                          {/* Indicador de transação compartilhada */}
                          {transaction.type === 'shared' && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              Compartilhada
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{getAccountName(transaction.account)}</span>
                          <span>
                            {format(new Date(transaction.date), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </span>
                          {/* Exibir data de vencimento para cartão de crédito */}
                          {transaction.dueDate && (
                            <span className="text-orange-600">
                              Venc: {format(new Date(transaction.dueDate), 'dd/MM/yyyy', {
                                locale: ptBR,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {formatAmount(transaction.amount, transaction.type)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTransaction(transaction)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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

              {/* Paginação */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Mostrando{' '}
                    {(pagination.currentPage - 1) * pagination.limit + 1} a{' '}
                    {Math.min(
                      pagination.currentPage * pagination.limit,
                      pagination.total
                    )}{' '}
                    de {pagination.total} transações
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
                      Página {currentPage} de {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição *</Label>
              <Input
                id="edit-description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Descrição da transação"
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
                  <SelectItem value="Alimentação">Alimentação</SelectItem>
                  <SelectItem value="Salário">Salário</SelectItem>
                  <SelectItem value="Utilidades">Utilidades</SelectItem>
                  <SelectItem value="Transporte">Transporte</SelectItem>
                  <SelectItem value="Lazer">Lazer</SelectItem>
                  <SelectItem value="Saúde">Saúde</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
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
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, notes: e.target.value })
                }
                placeholder="Observações opcionais..."
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
