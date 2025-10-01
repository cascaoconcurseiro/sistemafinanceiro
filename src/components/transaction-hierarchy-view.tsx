'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronRight, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransactionHierarchyViewProps {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
}

interface TransactionGroup {
  parent: Transaction;
  children: Transaction[];
}

export function TransactionHierarchyView({ 
  transactions, 
  onTransactionClick 
}: TransactionHierarchyViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Agrupar transações por relacionamento pai-filho
  const transactionGroups = useMemo(() => {
    const groups: TransactionGroup[] = [];
    const childrenMap = new Map<string, Transaction[]>();
    const processedIds = new Set<string>();

    // Primeiro, mapear todas as transações filhas
    transactions.forEach(transaction => {
      if (transaction.parentTransactionId) {
        if (!childrenMap.has(transaction.parentTransactionId)) {
          childrenMap.set(transaction.parentTransactionId, []);
        }
        childrenMap.get(transaction.parentTransactionId)!.push(transaction);
      }
    });

    // Depois, criar grupos para transações pai que têm filhas
    transactions.forEach(transaction => {
      if (!transaction.parentTransactionId && childrenMap.has(transaction.id)) {
        const children = childrenMap.get(transaction.id)!;
        // Ordenar filhas por número da parcela
        children.sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));
        
        groups.push({
          parent: transaction,
          children
        });

        // Marcar como processadas
        processedIds.add(transaction.id);
        children.forEach(child => processedIds.add(child.id));
      }
    });

    return groups;
  }, [transactions]);

  // Transações individuais (não fazem parte de grupos)
  const individualTransactions = useMemo(() => {
    const processedIds = new Set<string>();
    
    // Marcar todas as transações que fazem parte de grupos
    transactionGroups.forEach(group => {
      processedIds.add(group.parent.id);
      group.children.forEach(child => processedIds.add(child.id));
    });

    return transactions.filter(transaction => !processedIds.has(transaction.id));
  }, [transactions, transactionGroups]);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.creditCardId) {
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    }
    return transaction.type === 'income' ? (
      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
        <span className="text-green-600 text-xs">↗</span>
      </div>
    ) : (
      <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
        <span className="text-red-600 text-xs">↘</span>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (transactionGroups.length === 0 && individualTransactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Nenhuma transação encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grupos de transações parceladas */}
      {transactionGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.parent.id);
        const totalAmount = group.children.reduce((sum, child) => sum + child.amount, 0);
        const completedCount = group.children.filter(child => child.status === 'completed').length;
        
        return (
          <Card key={group.parent.id} className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroup(group.parent.id)}
                    className="p-1 h-auto"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  {getTransactionIcon(group.parent)}
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {group.parent.description}
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {group.children.length}x Parcelado
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Total: {formatCurrency(totalAmount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(group.parent.date), 'MMM yyyy', { locale: ptBR })}
                      </span>
                      <span>
                        {completedCount}/{group.children.length} pagas
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatCurrency(group.parent.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">por parcela</p>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-2 ml-8">
                  {group.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onTransactionClick?.(child)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-medium">
                            {child.installmentNumber}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            Parcela {child.installmentNumber}/{child.totalInstallments}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              {format(new Date(child.date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            {child.dueDate && (
                              <span className="text-orange-600">
                                Venc: {format(new Date(child.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(child.status)}`}
                        >
                          {child.status === 'completed' ? 'Paga' : 
                           child.status === 'pending' ? 'Pendente' :
                           child.status === 'scheduled' ? 'Agendada' : 'Cancelada'}
                        </Badge>
                        <p className="font-bold">
                          {formatCurrency(child.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Transações individuais */}
      {individualTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transações Individuais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {individualTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onTransactionClick?.(transaction)}
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {transaction.dueDate && (
                          <span className="text-orange-600">
                            Venc: {format(new Date(transaction.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(transaction.status)}`}
                    >
                      {transaction.status === 'completed' ? 'Concluída' : 
                       transaction.status === 'pending' ? 'Pendente' :
                       transaction.status === 'scheduled' ? 'Agendada' : 'Cancelada'}
                    </Badge>
                    <p className={`font-bold ${(transaction.type === 'expense' || (transaction.type === 'shared' && transaction.amount < 0)) ? 'text-red-600' : 'text-green-600'}`}>
                      {(transaction.type === 'expense' || (transaction.type === 'shared' && transaction.amount < 0)) ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
