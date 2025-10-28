'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  ArrowRightLeft,
  Plus,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  ArrowLeft,
  Edit,
} from 'lucide-react';
import { usePeriod } from '@/contexts/period-context';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { toast } from 'sonner';
import { translateAccountType } from '@/lib/translations';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isActive: boolean;
  transactionCount: number;
}

// Usar o tipo Transaction do contexto unificado
interface LocalTransaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string | Date;
  accountId: string;
  category: string;
  status?: string;
  sharedWith?: string[];
  tripId?: string;
  isTransfer?: boolean;
  transferType?: string;
  transferId?: string;
  isShared?: boolean;
  myShare?: number;
  totalSharedAmount?: number;
}

export function EnhancedAccountsManager() {
  const { selectedMonth, selectedYear } = usePeriod();
  // ✅ CORREÇÃO: Usar contexto unificado
  const { data } = useUnifiedFinancial();
  const { accounts: contextAccounts = [], transactions: allTransactions = [] } = data || {};
  
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<LocalTransaction[]>([]);
  const loading = false; // Usando contexto unificado, não precisa de loading local
  
  // Converter contas do contexto para o formato esperado
  const accounts = contextAccounts.map(acc => ({
    id: acc.id,
    name: acc.name,
    type: acc.type,
    balance: acc.balance || 0,
    currency: acc.currency || 'BRL',
    isActive: acc.isActive !== false,
    transactionCount: allTransactions.filter(t => t.accountId === acc.id).length
  }));
  
  // Estados para transferência
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);

  // Estados para operações de conta (Adicionar/Retirar)
  const [showOperationDialog, setShowOperationDialog] = useState(false);
  const [operationType, setOperationType] = useState<'add' | 'withdraw'>('add');
  const [operationAccountId, setOperationAccountId] = useState('');
  const [operationAmount, setOperationAmount] = useState('');
  const [operationDescription, setOperationDescription] = useState('');
  const [operationDate, setOperationDate] = useState(new Date().toISOString().split('T')[0]);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Estados para criação de conta
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('checking');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  // Estados para edição de conta
  const [showEditAccountDialog, setShowEditAccountDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountType, setEditAccountType] = useState('checking');

  // ✅ CORREÇÃO: Filtrar E ORDENAR transações quando a conta ou período mudar
  useEffect(() => {
    if (selectedAccount) {
      const filtered = allTransactions.filter(t => {
        if (t.accountId !== selectedAccount.id) return false;
        
        const transDate = new Date(t.date);
        return transDate.getMonth() === selectedMonth && 
               transDate.getFullYear() === selectedYear;
      });
      
      // ✅ CORREÇÃO: Ordenar SEMPRE por createdAt (ordem cronológica de criação)
      const sorted = filtered.sort((a, b) => {
        const aCreatedAt = (a as any).createdAt;
        const bCreatedAt = (b as any).createdAt;
        
        // Se ambos têm createdAt, ordenar por ele
        if (aCreatedAt && bCreatedAt) {
          const createdA = new Date(aCreatedAt).getTime();
          const createdB = new Date(bCreatedAt).getTime();
          if (createdA !== createdB) {
            return createdA - createdB;
          }
        }
        
        // Fallback 1: Se só um tem createdAt, priorizar o que tem
        if (aCreatedAt && !bCreatedAt) return -1;
        if (!aCreatedAt && bCreatedAt) return 1;
        
        // Fallback 2: Ordenar por data da transação
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        
        // Fallback 3: ordenar por ID (IDs mais antigos primeiro)
        return a.id.localeCompare(b.id);
      });
      
      setAccountTransactions(sorted as LocalTransaction[]);
    }
  }, [selectedAccount, selectedMonth, selectedYear, allTransactions]);

  // ✅ REMOVIDO: loadAccountTransactions - agora usa contexto unificado

  const handleTransfer = async () => {
    if (!fromAccountId || !toAccountId || !transferAmount || !transferDescription) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (fromAccountId === toAccountId) {
      toast.error('Conta origem e destino não podem ser iguais');
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    try {
      const response = await fetch('/api/accounts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount,
          description: transferDescription,
          date: transferDate,
        }),
      });

      if (response.ok) {
        await response.json();
        toast.success('Transferência realizada com sucesso!');
        setShowTransferDialog(false);
        setFromAccountId('');
        setToAccountId('');
        setTransferAmount('');
        setTransferDescription('');
        // ✅ CORREÇÃO: Recarregar página para atualizar contexto unificado
        setTimeout(() => window.location.reload(), 500);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao realizar transferência');
      }
    } catch (error) {
      console.error('Erro ao realizar transferência:', error);
      toast.error('Erro ao processar transferência');
    }
  };

  // Função para adicionar ou retirar dinheiro da conta
  const handleAccountOperation = async () => {
    if (!operationAccountId || !operationAmount || !operationDescription) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const amount = parseFloat(operationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accountId: operationAccountId,
          amount: operationType === 'add' ? amount : -amount,
          description: operationDescription,
          type: operationType === 'add' ? 'income' : 'expense',
          date: operationDate,
          category: operationType === 'add' ? 'Depósito' : 'Saque',
        }),
      });

      if (response.ok) {
        const operationLabel = operationType === 'add' ? 'Depósito' : 'Saque';
        toast.success(`${operationLabel} realizado com sucesso!`);
        setShowOperationDialog(false);
        setOperationAccountId('');
        setOperationAmount('');
        setOperationDescription('');
        setTimeout(() => window.location.reload(), 500); // Recarregar contas para atualizar saldos
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao realizar operação');
      }
    } catch (error) {
      console.error('Erro ao realizar operação:', error);
      toast.error('Erro ao processar operação');
    }
  };

  // Função para criar nova conta
  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error('Nome da conta é obrigatório');
      return;
    }

    const balance = parseFloat(newAccountBalance) || 0;

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newAccountName.trim(),
          type: newAccountType,
          initialBalance: balance
        })
      });
      
      if (response.ok) {
        toast.success('Conta criada com sucesso!');
        setShowCreateAccountDialog(false);
        setNewAccountName('');
        setNewAccountType('checking');
        setNewAccountBalance('');
        setTimeout(() => window.location.reload(), 500);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast.error('Erro ao criar conta');
    }
  };

  // Função para abrir modal de edição de conta
  const openEditAccountModal = (account: Account) => {
    setEditingAccount(account);
    setEditAccountName(account.name);
    setEditAccountType(account.type);
    setShowEditAccountDialog(true);
  };

  // Função para editar conta
  const handleEditAccount = async () => {
    if (!editingAccount) return;

    if (!editAccountName.trim()) {
      toast.error('Nome da conta é obrigatório');
      return;
    }

    try {
      const response = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editAccountName.trim(),
          type: editAccountType
        })
      });
      
      if (response.ok) {
        toast.success('Conta atualizada com sucesso!');
        setShowEditAccountDialog(false);
        setEditingAccount(null);
        setEditAccountName('');
        setEditAccountType('checking');
        setTimeout(() => window.location.reload(), 500);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar conta');
      }
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast.error('Erro ao atualizar conta');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  };

  const getTransactionIcon = (type: string, isTransfer: boolean) => {
    if (isTransfer) {
      return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
    }
    
    switch (type) {
      case 'income':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: string, isTransfer: boolean) => {
    if (isTransfer) return 'text-blue-600';
    
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Filtrar transações
  const filteredTransactions = accountTransactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  // Se nenhuma conta selecionada, mostrar lista de contas
  if (!selectedAccount) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateAccountDialog(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Conta
            </Button>
            <Button
              onClick={() => setShowTransferDialog(true)}
              className="gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Nova Transferência
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Carregando contas...</p>
            </CardContent>
          </Card>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma conta cadastrada
              </p>
              <Button onClick={() => window.location.href = '/accounts'}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Conta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card
                key={account.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedAccount(account)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <Building2 className="w-8 h-8 text-primary" />
                    <Badge variant="outline">
                      {translateAccountType(account.type)}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{account.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saldo:</span>
                      <span className={`font-medium ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transações:</span>
                      <span className="font-medium">{account.transactionCount}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAccount(account);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditAccountModal(account);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
                          try {
                            const response = await fetch(`/api/accounts/${account.id}`, {
                              method: 'DELETE',
                              credentials: 'include'
                            });
                            
                            if (response.ok) {
                              toast.success('Conta excluída!');
                              setTimeout(() => window.location.reload(), 500);
                            } else {
                              toast.error('Erro ao excluir conta');
                            }
                          } catch (error) {
                            toast.error('Erro ao excluir conta');
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      🗑️
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Transferência */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Transferência</DialogTitle>
              <DialogDescription>
                Transfira dinheiro entre suas contas bancárias.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="from-account">Conta Origem</Label>
                <Select value={fromAccountId} onValueChange={setFromAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-account">Conta Destino</Label>
                <Select value={toAccountId} onValueChange={setToAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter(account => account.id !== fromAccountId)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{account.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {formatCurrency(account.balance)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-amount">Valor</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-description">Descrição</Label>
                <Input
                  id="transfer-description"
                  placeholder="Motivo da transferência"
                  value={transferDescription}
                  onChange={(e) => setTransferDescription(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transfer-date">Data</Label>
                <Input
                  id="transfer-date"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleTransfer}
                disabled={!fromAccountId || !toAccountId || !transferAmount || !transferDescription}
              >
                Realizar Transferência
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Criação de Conta */}
        <Dialog open={showCreateAccountDialog} onOpenChange={setShowCreateAccountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conta</DialogTitle>
              <DialogDescription>
                Crie uma nova conta bancária para gerenciar suas finanças.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="account-name">Nome da Conta</Label>
                <Input
                  id="account-name"
                  placeholder="Ex: Conta Corrente Principal"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-type">Tipo de Conta</Label>
                <Select value={newAccountType} onValueChange={setNewAccountType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-balance">Saldo Inicial (opcional)</Label>
                <Input
                  id="account-balance"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={newAccountBalance}
                  onChange={(e) => setNewAccountBalance(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateAccountDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateAccount}
                disabled={!newAccountName.trim()}
              >
                Criar Conta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição de Conta */}
        <Dialog open={showEditAccountDialog} onOpenChange={setShowEditAccountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Conta</DialogTitle>
              <DialogDescription>
                Edite as informações da sua conta bancária.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-account-name">Nome da Conta</Label>
                <Input
                  id="edit-account-name"
                  placeholder="Ex: Conta Corrente Principal"
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-account-type">Tipo de Conta</Label>
                <Select value={editAccountType} onValueChange={setEditAccountType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditAccountDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleEditAccount}
                disabled={!editAccountName.trim()}
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Mostrar detalhes da conta selecionada
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedAccount(null)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar às Contas
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOperationType('add');
              setOperationAccountId(selectedAccount.id);
              setShowOperationDialog(true);
            }}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Adicionar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setOperationType('withdraw');
              setOperationAccountId(selectedAccount.id);
              setShowOperationDialog(true);
            }}
            className="gap-2"
          >
            <TrendingDown className="w-4 h-4" />
            Retirar
          </Button>
          <Button
            onClick={() => setShowTransferDialog(true)}
            className="gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transferir
          </Button>
        </div>
      </div>

      {/* Informações da Conta */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedAccount.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {translateAccountType(selectedAccount.type)} • {selectedAccount.currency}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Saldo Atual</p>
              <p className={`text-2xl font-bold ${selectedAccount.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(selectedAccount.balance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Transações - {getMonthName(selectedMonth)} de {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Entradas</SelectItem>
                <SelectItem value="expense">Saídas</SelectItem>
                <SelectItem value="transfer">Transferências</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando transações...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all' 
                  ? 'Nenhuma transação encontrada com os filtros aplicados'
                  : 'Nenhuma transação neste período'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type, transaction.isTransfer || false)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{transaction.category || 'Sem categoria'}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.date.toString())}</span>
                        {transaction.isTransfer && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                              Transferência
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-lg ${getTransactionColor(transaction.type, transaction.isTransfer || false)}`}>
                      {(() => {
                        // ✅ CORREÇÃO: SEMPRE mostrar o valor TOTAL quando vinculado a uma conta
                        // Motivo: Se você pagou R$ 100 por outra pessoa, R$ 100 saiu da sua conta
                        const displayAmount = Math.abs(transaction.amount);
                        
                        return (transaction.type === 'RECEITA' || transaction.type === 'income') 
                          ? `+${formatCurrency(displayAmount)}` 
                          : `-${formatCurrency(displayAmount)}`;
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Transferência */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Transferência</DialogTitle>
            <DialogDescription>
              Transfira dinheiro entre suas contas bancárias.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="from-account">Conta Origem</Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta origem" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{account.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-account">Conta Destino</Label>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta destino" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter(account => account.id !== fromAccountId)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Valor</Label>
              <Input
                id="transfer-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-description">Descrição</Label>
              <Input
                id="transfer-description"
                placeholder="Motivo da transferência"
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transfer-date">Data</Label>
              <Input
                id="transfer-date"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleTransfer}
              disabled={!fromAccountId || !toAccountId || !transferAmount || !transferDescription}
            >
              Realizar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Operações de Conta (Adicionar/Retirar) */}
      <Dialog open={showOperationDialog} onOpenChange={setShowOperationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {operationType === 'add' ? 'Adicionar Dinheiro' : 'Retirar Dinheiro'}
            </DialogTitle>
            <DialogDescription>
              {operationType === 'add' 
                ? 'Adicione dinheiro à sua conta (depósito, transferência recebida, etc.)'
                : 'Retire dinheiro da sua conta (saque, pagamento em dinheiro, etc.)'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="operation-account">Conta</Label>
              <Select value={operationAccountId} onValueChange={setOperationAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{account.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operation-amount">Valor</Label>
              <Input
                id="operation-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={operationAmount}
                onChange={(e) => setOperationAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operation-description">Descrição</Label>
              <Input
                id="operation-description"
                placeholder={operationType === 'add' ? 'Ex: Depósito em dinheiro' : 'Ex: Saque no caixa eletrônico'}
                value={operationDescription}
                onChange={(e) => setOperationDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="operation-date">Data</Label>
              <Input
                id="operation-date"
                type="date"
                value={operationDate}
                onChange={(e) => setOperationDate(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOperationDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAccountOperation}
              disabled={!operationAccountId || !operationAmount || !operationDescription}
            >
              {operationType === 'add' ? 'Adicionar Dinheiro' : 'Retirar Dinheiro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

