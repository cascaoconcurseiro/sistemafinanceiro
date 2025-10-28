'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Minus, ArrowRightLeft, History, Trash2 } from 'lucide-react';
import { type Goal, type Account } from '@/lib/data-layer/types';
import {
  useAccounts,
  useTransactions,
  useGoals,
  useContacts,
  useUnifiedFinancial,
} from '@/contexts/unified-financial-context';
// import { transactionManager } from '@/lib/transaction-manager'; // Removido

import { toast } from 'sonner';

interface GoalMoneyManagerProps {
  goal: Goal;
  onClose: () => void;
  onUpdate: () => void;
}

interface GoalTransaction {
  id: string;
  type: 'add' | 'withdraw' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string;
  date: string;
  fromAccount?: string;
  toAccount?: string;
  fromGoal?: string;
  toGoal?: string;
}

export function GoalMoneyManager({
  goal,
  onClose,
  onUpdate,
}: GoalMoneyManagerProps) {
  const accountsData = useAccounts();
  const goalsData = useGoals();
  const { actions } = useUnifiedFinancial();
  
  // Garantir que sempre temos arrays válidos
  // accountsData pode ser um objeto {accounts: [], loading: false} ou um array
  console.log('🔍 [GoalMoneyManager] accountsData type:', typeof accountsData);
  console.log('🔍 [GoalMoneyManager] accountsData isArray:', Array.isArray(accountsData));
  console.log('🔍 [GoalMoneyManager] accountsData?.accounts:', accountsData?.accounts);
  
  const accounts = Array.isArray(accountsData) 
    ? accountsData 
    : (accountsData?.accounts || []);
  const goals = Array.isArray(goalsData) ? goalsData : [];
  
  const [localAccounts, setLocalAccounts] = useState<Account[]>([]);
  const [localGoals, setLocalGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<GoalTransaction[]>([]);
  const [activeTab, setActiveTab] = useState('add');
  
  // Debug logs melhorados
  console.log('🎯 [GoalMoneyManager] Raw accounts data:', accountsData);
  console.log('🎯 [GoalMoneyManager] Raw goals data:', goalsData);
  console.log('🎯 [GoalMoneyManager] Processed accounts:', accounts.length);
  console.log('🎯 [GoalMoneyManager] Processed accounts array:', accounts);
  console.log('🎯 [GoalMoneyManager] Processed goals:', goals.length);
  console.log('🎯 [GoalMoneyManager] Current goal:', goal.name);

  const [addData, setAddData] = useState({
    amount: '',
    fromAccount: '',
    description: '',
  });

  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    toAccount: '',
    description: '',
  });

  const [transferData, setTransferData] = useState({
    amount: '',
    toGoal: '',
    description: '',
  });

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await actions.deleteTransaction(transactionId);
      toast.success('Transação excluída com sucesso!');
      await loadGoalTransactions(); // Recarregar histórico
      onUpdate(); // Atualizar dados da meta
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  const loadGoalTransactions = async () => {
    console.log('🎯 [loadGoalTransactions] Carregando transações para meta:', goal.id);
    
    try {
      const response = await fetch(`/api/transactions?goalId=${goal.id}`, {
        credentials: 'include',
      });
      
      console.log('🎯 [loadGoalTransactions] Resposta:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🎯 [loadGoalTransactions] Dados recebidos:', result);
        
        const goalTransactions = (result.transactions || []).map((t: any) => ({
          id: t.id,
          type: t.amount > 0 ? 'add' : 'withdraw',
          amount: Math.abs(Number(t.amount)),
          description: t.description,
          date: t.date,
          fromAccount: t.account?.name,
          toAccount: t.account?.name,
        }));
        
        console.log('🎯 [loadGoalTransactions] Transações processadas:', goalTransactions);
        setTransactions(goalTransactions);
      } else {
        const errorData = await response.json();
        console.error('❌ [loadGoalTransactions] Erro:', errorData);
      }
    } catch (error) {
      console.error('❌ [loadGoalTransactions] Erro ao carregar transações:', error);
    }
  };

  useEffect(() => {
    console.log('🎯 [useEffect] Carregando transações para meta:', goal.id);
    loadGoalTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.id]); // Apenas quando o goal.id mudar

  // Atualizar dados locais quando accounts ou goals mudarem
  useEffect(() => {
    console.log('🎯 [useEffect] Atualizando dados locais...');
    console.log('🎯 [useEffect] Accounts recebidas:', accounts.length);
    console.log('🎯 [useEffect] Goals recebidas:', goals.length);
    
    setLocalAccounts(accounts);
    setLocalGoals(goals.filter((g) => g.id !== goal.id));
    
    if (accounts.length > 0) {
      console.log('✅ [GoalMoneyManager] Contas carregadas:', accounts.map(a => ({ id: a.id, name: a.name })));
    }
    if (goals.length > 0) {
      console.log('✅ [GoalMoneyManager] Metas carregadas:', goals.map(g => ({ id: g.id, name: g.name })));
    }
  }, [accounts.length, goals.length]); // Usar apenas os comprimentos para evitar loops

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const saveGoalTransaction = (transaction: Omit<GoalTransaction, 'id'>) => {
    console.log(
      'saveGoalTransaction foi removida - localStorage não é mais usado'
    );
    const newTransaction: GoalTransaction = {
      ...transaction,
      id: Date.now().toString(),
    };

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    // localStorage removido - dados agora são salvos no banco via DataService
  };

  const handleAddMoney = async () => {
    console.log('🎯 [handleAddMoney] Iniciando...', addData);
    
    try {
      const amount = Number.parseFloat(addData.amount);
      console.log('🎯 [handleAddMoney] Amount parsed:', amount);

      if (amount <= 0) {
        console.log('❌ [handleAddMoney] Valor inválido');
        toast.error('Valor deve ser maior que zero');
        return;
      }

      if (!addData.fromAccount || addData.fromAccount === 'no-accounts') {
        console.log('❌ [handleAddMoney] Conta não selecionada');
        toast.error('Selecione uma conta de origem');
        return;
      }

      if (!addData.description.trim()) {
        console.log('❌ [handleAddMoney] Descrição vazia');
        toast.error('Descrição é obrigatória');
        return;
      }

      console.log('🎯 [handleAddMoney] Procurando conta:', addData.fromAccount);
      console.log('🎯 [handleAddMoney] Contas disponíveis:', accounts.map(a => ({ id: a.id, name: a.name })));
      
      const fromAccount = accounts.find(
        (a) => String(a.id) === addData.fromAccount
      );
      
      console.log('🎯 [handleAddMoney] Conta encontrada:', fromAccount);
      
      if (!fromAccount) {
        console.log('❌ [handleAddMoney] Conta não encontrada');
        toast.error('Conta de origem não encontrada');
        return;
      }

      if ((fromAccount.balance || 0) < amount) {
        console.log('❌ [handleAddMoney] Saldo insuficiente:', fromAccount.balance, '<', amount);
        toast.error('Saldo insuficiente na conta');
        return;
      }

      // Criar transação de débito na conta
      console.log('🎯 [handleAddMoney] Criando transação...');
      
      const transactionData = {
        accountId: fromAccount.id,
        amount: amount, // Valor positivo, o tipo DESPESA já indica que é saída
        description: `Aplicação na meta: ${goal.name} - ${addData.description}`,
        type: 'DESPESA', // API espera em maiúsculas
        category: 'Metas', // Categoria será criada automaticamente se não existir
        date: new Date().toISOString().split('T')[0],
        goalId: goal.id,
      };
      
      console.log('🎯 [handleAddMoney] Dados da transação:', transactionData);
      
      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      console.log('🎯 [handleAddMoney] Resposta da transação:', transactionResponse.status);

      if (!transactionResponse.ok) {
        const errorData = await transactionResponse.json();
        console.error('❌ [handleAddMoney] Erro na transação:', errorData);
        throw new Error(errorData.error || 'Erro ao criar transação');
      }

      // Atualizar meta
      console.log('🎯 [handleAddMoney] Atualizando meta...');
      
      const newAmount = (Number(goal.currentAmount) || 0) + amount;
      console.log('🎯 [handleAddMoney] Novo valor da meta:', goal.currentAmount, '+', amount, '=', newAmount);
      
      const goalResponse = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAmount: newAmount,
        }),
      });

      console.log('🎯 [handleAddMoney] Resposta da meta:', goalResponse.status);

      if (!goalResponse.ok) {
        const errorData = await goalResponse.json();
        console.error('❌ [handleAddMoney] Erro na meta:', errorData);
        throw new Error(errorData.error || 'Erro ao atualizar meta');
      }

      toast.success('Dinheiro adicionado à meta com sucesso!');
      setAddData({ amount: '', fromAccount: '', description: '' });
      
      // Recarregar dados
      await loadGoalTransactions();
      onUpdate();
    } catch (error) {
      console.error('Erro ao adicionar dinheiro à meta:', error);
      toast.error('Erro ao processar operação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleWithdrawMoney = async () => {
    try {
      const amount = Number.parseFloat(withdrawData.amount);

      if (amount <= 0) {
        toast.error('Valor deve ser maior que zero');
        return;
      }

      if (!withdrawData.toAccount || withdrawData.toAccount === 'no-accounts-withdraw') {
        toast.error('Selecione uma conta de destino');
        return;
      }

      if (!withdrawData.description.trim()) {
        toast.error('Descrição é obrigatória');
        return;
      }

      if ((Number(goal.currentAmount) || 0) < amount) {
        toast.error('Valor insuficiente na meta');
        return;
      }

      const toAccount = (accounts || []).find((a) => String(a.id) === withdrawData.toAccount);
      if (!toAccount) {
        toast.error('Conta de destino não encontrada');
        return;
      }

      // Criar transação de crédito na conta
      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: toAccount.id,
          amount: amount,
          description: `Resgate da meta: ${goal.name} - ${withdrawData.description}`,
          type: 'RECEITA', // API espera em maiúsculas
          category: 'Metas', // Categoria será criada automaticamente se não existir
          date: new Date().toISOString().split('T')[0],
          goalId: goal.id,
        }),
      });

      if (!transactionResponse.ok) {
        throw new Error('Erro ao criar transação');
      }

      // Atualizar meta
      const goalResponse = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAmount: (Number(goal.currentAmount) || 0) - amount,
        }),
      });

      if (!goalResponse.ok) {
        throw new Error('Erro ao atualizar meta');
      }

      toast.success('Dinheiro retirado da meta com sucesso!');
      setWithdrawData({ amount: '', toAccount: '', description: '' });
      
      // Recarregar dados
      await loadGoalTransactions();
      onUpdate();
    } catch (error) {
      console.error('Erro ao retirar dinheiro da meta:', error);
      toast.error('Erro ao processar operação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleTransferBetweenGoals = async () => {
    try {
      const amount = Number.parseFloat(transferData.amount);

      if (amount <= 0) {
        toast.error('Valor deve ser maior que zero');
        return;
      }

      if (!transferData.toGoal || transferData.toGoal === 'no-goals') {
        toast.error('Selecione uma meta de destino');
        return;
      }

      if (!transferData.description.trim()) {
        toast.error('Descrição é obrigatória');
        return;
      }

      if ((Number(goal.currentAmount) || 0) < amount) {
        toast.error('Valor insuficiente na meta de origem');
        return;
      }

      const toGoal = (goals || []).find((g) => String(g.id) === transferData.toGoal);
      if (!toGoal) {
        toast.error('Meta de destino não encontrada');
        return;
      }

      // Atualizar meta de origem (reduzir)
      const sourceGoalResponse = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAmount: (Number(goal.currentAmount) || 0) - amount,
        }),
      });

      if (!sourceGoalResponse.ok) {
        throw new Error('Erro ao atualizar meta de origem');
      }

      // Atualizar meta de destino (aumentar)
      const targetGoalResponse = await fetch(`/api/goals/${toGoal.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAmount: (Number(toGoal.currentAmount) || 0) + amount,
        }),
      });

      if (!targetGoalResponse.ok) {
        throw new Error('Erro ao atualizar meta de destino');
      }

      toast.success('Transferência entre metas realizada com sucesso!');
      setTransferData({ amount: '', toGoal: '', description: '' });
      
      // Recarregar dados
      await loadGoalTransactions();
      onUpdate();
    } catch (error) {
      console.error('Erro ao transferir entre metas:', error);
      toast.error('Erro ao processar transferência: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const progress = goal.targetAmount > 0 ? ((Number(goal.currentAmount) || 0) / Number(goal.targetAmount)) * 100 : 0;
  const remaining = Number(goal.targetAmount) - (Number(goal.currentAmount) || 0);

  // Verificar se os dados estão carregando
  const isLoading = accountsData?.loading || goalsData === undefined;
  
  console.log('🎯 [GoalMoneyManager] Loading state:', { 
    isLoading, 
    accountsData: accountsData,
    goalsData: goalsData,
    accountsLength: accounts.length,
    goalsLength: goals.length
  });

  const getTransactionIcon = (type: GoalTransaction['type']) => {
    switch (type) {
      case 'add':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'withdraw':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'transfer_in':
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      case 'transfer_out':
        return <ArrowRightLeft className="w-4 h-4 text-orange-600" />;
    }
  };

  const getTransactionLabel = (type: GoalTransaction['type']) => {
    switch (type) {
      case 'add':
        return 'Adição';
      case 'withdraw':
        return 'Retirada';
      case 'transfer_in':
        return 'Transferência Recebida';
      case 'transfer_out':
        return 'Transferência Enviada';
    }
  };

  // Mostrar loading se os dados não estiverem prontos
  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Gerenciar Dinheiro - {goal.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Gerenciar Dinheiro - {goal.name}
          </DialogTitle>
        </DialogHeader>

        {/* Goal Summary */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Valor Atual</p>
                  <p className="text-2xl font-bold text-green-600">
                    R${' '}
                    {(Number(goal.currentAmount) || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Meta</p>
                  <p className="text-lg font-semibold">
                    R${' '}
                    {(Number(goal.targetAmount) || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Faltam: R${' '}
                  {remaining.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <Badge variant="outline">{goal.priority}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="add">Adicionar</TabsTrigger>
            <TabsTrigger value="withdraw">Retirar</TabsTrigger>
            <TabsTrigger value="transfer">Transferir</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-600" />
                  Adicionar Dinheiro à Meta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fluxo Visual */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">Conta de Origem</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>→</span>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Meta: {goal.name}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fromAccount">Conta de Origem *</Label>
                  <Select
                    value={addData.fromAccount}
                    onValueChange={(value) => {
                      console.log('🎯 [Select] Conta selecionada:', value);
                      console.log('🎯 [Select] Contas disponíveis:', accounts);
                      setAddData({ ...addData, fromAccount: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {!accounts || accounts.length === 0 ? (
                        <SelectItem value="no-accounts" disabled>
                          {isLoading ? 'Carregando contas...' : 'Nenhuma conta disponível'}
                        </SelectItem>
                      ) : (
                        accounts
                          .filter(
                            (account) =>
                              account && 
                              account.id && 
                              String(account.id).trim() !== '' &&
                              account.type === 'ATIVO' // ✅ Apenas contas bancárias (não cartões)
                          )
                          .map((account) => (
                            <SelectItem key={account.id} value={String(account.id)}>
                              {account.name} - R$ {(Number(account.balance) || 0).toFixed(2)}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    💰 O dinheiro será transferido desta conta para a meta
                  </p>
                </div>

                <div>
                  <Label htmlFor="addAmount">Valor *</Label>
                  <Input
                    id="addAmount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={addData.amount}
                    onChange={(e) => {
                      console.log('🎯 [Input] Valor digitado:', e.target.value);
                      setAddData({ ...addData, amount: e.target.value });
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="addDescription">Descrição *</Label>
                  <Textarea
                    id="addDescription"
                    placeholder="Motivo da aplicação..."
                    value={addData.description}
                    onChange={(e) => {
                      console.log('🎯 [Textarea] Descrição digitada:', e.target.value);
                      setAddData({ ...addData, description: e.target.value });
                    }}
                  />
                </div>

                <Button
                  onClick={() => {
                    console.log('🎯 [Button] Clique em Adicionar à Meta');
                    console.log('🎯 [Button] Estado atual:', addData);
                    console.log('🎯 [Button] Disabled?', !addData.fromAccount || !addData.amount || !addData.description);
                    handleAddMoney();
                  }}
                  className="w-full"
                  disabled={
                    !addData.fromAccount ||
                    !addData.amount ||
                    !addData.description
                  }
                >
                  Adicionar à Meta
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Minus className="w-5 h-5 text-red-600" />
                  Retirar Dinheiro da Meta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fluxo Visual */}
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Meta: {goal.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>→</span>
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium">Conta de Destino</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="toAccount">Conta de Destino *</Label>
                  <Select
                    value={withdrawData.toAccount}
                    onValueChange={(value) =>
                      setWithdrawData({ ...withdrawData, toAccount: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {!accounts || accounts.length === 0 ? (
                        <SelectItem value="no-accounts-withdraw" disabled>
                          {isLoading ? 'Carregando contas...' : 'Nenhuma conta disponível'}
                        </SelectItem>
                      ) : (
                        accounts
                          .filter(
                            (account) =>
                              account && 
                              account.id && 
                              String(account.id).trim() !== '' &&
                              account.type === 'ATIVO' // ✅ Apenas contas bancárias (não cartões)
                          )
                          .map((account) => (
                            <SelectItem
                              key={account.id}
                              value={String(account.id)}
                            >
                              {account.name} - R$ {(account.balance || 0).toFixed(2)}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    💸 O dinheiro será transferido da meta para esta conta
                  </p>
                </div>

                <div>
                  <Label htmlFor="withdrawAmount">Valor *</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    max={Number(goal.currentAmount) || 0}
                    value={withdrawData.amount}
                    onChange={(e) =>
                      setWithdrawData({
                        ...withdrawData,
                        amount: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Disponível: R$ {(Number(goal.currentAmount) || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="withdrawDescription">Descrição *</Label>
                  <Textarea
                    id="withdrawDescription"
                    placeholder="Motivo da retirada..."
                    value={withdrawData.description}
                    onChange={(e) =>
                      setWithdrawData({
                        ...withdrawData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <Button
                  onClick={handleWithdrawMoney}
                  className="w-full"
                  disabled={
                    !withdrawData.toAccount ||
                    !withdrawData.amount ||
                    !withdrawData.description
                  }
                >
                  Retirar da Meta
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                  Transferir entre Metas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="toGoal">Meta de Destino *</Label>
                  <Select
                    value={transferData.toGoal}
                    onValueChange={(value) =>
                      setTransferData({ ...transferData, toGoal: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a meta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {!goals || goals.filter((g) => g && g.id && g.id !== goal.id).length === 0 ? (
                        <SelectItem value="no-goals" disabled>
                          {isLoading ? 'Carregando metas...' : 'Nenhuma outra meta disponível'}
                        </SelectItem>
                      ) : (
                        goals
                          .filter((g) => g && g.id && g.id !== goal.id && String(g.id).trim() !== '')
                          .map((g) => (
                            <SelectItem key={g.id} value={String(g.id)}>
                              {g.name} - R$ {(Number(g.currentAmount) || Number(g.current) || 0).toFixed(2)} / R${' '}
                              {(Number(g.targetAmount) || Number(g.target) || 0).toFixed(2)}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="transferAmount">Valor *</Label>
                  <Input
                    id="transferAmount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    max={Number(goal.currentAmount) || Number(goal.current) || 0}
                    value={transferData.amount}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        amount: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Disponível: R$ {(Number(goal.currentAmount) || Number(goal.current) || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="transferDescription">Descrição *</Label>
                  <Textarea
                    id="transferDescription"
                    placeholder="Motivo da transferência..."
                    value={transferData.description}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <Button
                  onClick={handleTransferBetweenGoals}
                  className="w-full"
                  disabled={
                    !transferData.toGoal ||
                    !transferData.amount ||
                    !transferData.description
                  }
                >
                  Transferir entre Metas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma movimentação realizada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transactions
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )
                      .map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <p className="font-medium">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(transaction.date).toLocaleDateString(
                                  'pt-BR'
                                )}{' '}
                                às{' '}
                                {new Date(transaction.date).toLocaleTimeString(
                                  'pt-BR'
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {getTransactionLabel(transaction.type)}
                                {transaction.fromAccount &&
                                  ` • De: ${transaction.fromAccount}`}
                                {transaction.toAccount &&
                                  ` • Para: ${transaction.toAccount}`}
                                {transaction.fromGoal &&
                                  ` • De: ${transaction.fromGoal}`}
                                {transaction.toGoal &&
                                  ` • Para: ${transaction.toGoal}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p
                                className={`font-semibold ${
                                  transaction.type === 'add' ||
                                  transaction.type === 'transfer_in'
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {transaction.type === 'add' ||
                                transaction.type === 'transfer_in'
                                  ? '+'
                                  : '-'}
                                R$ {transaction.amount.toFixed(2)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default GoalMoneyManager;
