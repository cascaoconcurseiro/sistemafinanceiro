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
  CreditCard,
  Calendar,
  DollarSign,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Download,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  PieChart,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { CreditCardNotifications } from './credit-card-notifications';
import { usePeriod } from '@/contexts/period-context';
import { toast } from 'sonner';

interface CreditCardData {
  id: string;
  name: string;
  limit: number;
  currentBalance: number;
  dueDay: number;
  closingDay: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  installmentNumber?: number;
  totalInstallments?: number;
  isInstallment: boolean;
}

interface Invoice {
  id: string;
  month: number;
  year: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  isPaid: boolean;
  transactions: Transaction[];
}

export function CreditCardBills() {
  const { selectedMonth, selectedYear } = usePeriod();
  const [creditCards, setCreditCards] = useState<CreditCardData[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para funcionalidades
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Estados para criação de cartão
  const [showCreateCardDialog, setShowCreateCardDialog] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('');
  const [newCardDueDay, setNewCardDueDay] = useState('');
  const [newCardClosingDay, setNewCardClosingDay] = useState('');

  // Estados para edição de cartão
  const [showEditCardDialog, setShowEditCardDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardData | null>(null);
  const [editCardName, setEditCardName] = useState('');
  const [editCardLimit, setEditCardLimit] = useState('');
  const [editCardDueDay, setEditCardDueDay] = useState('');
  const [editCardClosingDay, setEditCardClosingDay] = useState('');

  // Carregar cartões disponíveis e contas
  useEffect(() => {
    loadCreditCards();
    loadAccounts();
  }, []);

  // Carregar fatura quando cartão ou mês mudar
  useEffect(() => {
    if (selectedCardId) {
      loadInvoice();
    }
  }, [selectedCardId, selectedMonth, selectedYear]);

  const loadCreditCards = async () => {
    try {
      const response = await fetch('/api/credit-cards', { credentials: 'include' });
      const result = await response.json();
      
      if (result.success && result.data) {
        setCreditCards(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
      toast.error('Erro ao carregar cartões de crédito');
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/accounts', { credentials: 'include' });
      const result = await response.json();
      
      if (Array.isArray(result)) {
        setAccounts(result.filter(acc => acc.isActive));
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas');
    }
  };

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const month = selectedMonth + 1; // selectedMonth é 0-11
      const year = selectedYear;

      const response = await fetch(
        `/api/credit-cards/${selectedCardId}/invoices?month=${month}&year=${year}`,
        { credentials: 'include' }
      );
      const result = await response.json();

      if (result.success) {
        setInvoice(result.data);
      } else {
        setInvoice(null);
      }
    } catch (error) {
      console.error('Erro ao carregar fatura:', error);
      toast.error('Erro ao carregar fatura');
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  // Função para criar novo cartão
  const handleCreateCard = async () => {
    if (!newCardName.trim()) {
      toast.error('Nome do cartão é obrigatório');
      return;
    }

    const limit = parseFloat(newCardLimit);
    const dueDay = parseInt(newCardDueDay);
    const closingDay = parseInt(newCardClosingDay);

    if (isNaN(limit) || limit <= 0) {
      toast.error('Limite deve ser maior que zero');
      return;
    }

    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      toast.error('Dia de vencimento deve ser entre 1 e 31');
      return;
    }

    if (isNaN(closingDay) || closingDay < 1 || closingDay > 31) {
      toast.error('Dia de fechamento deve ser entre 1 e 31');
      return;
    }

    try {
      const response = await fetch('/api/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newCardName.trim(),
          limit: limit,
          dueDay: dueDay,
          closingDay: closingDay
        })
      });
      
      if (response.ok) {
        toast.success('Cartão criado com sucesso!');
        setShowCreateCardDialog(false);
        setNewCardName('');
        setNewCardLimit('');
        setNewCardDueDay('');
        setNewCardClosingDay('');
        loadCreditCards();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar cartão');
      }
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      toast.error('Erro ao criar cartão');
    }
  };

  // Função para abrir modal de edição
  const openEditCardModal = (card: CreditCardData) => {
    setEditingCard(card);
    setEditCardName(card.name);
    setEditCardLimit(card.limit.toString());
    setEditCardDueDay(card.dueDay.toString());
    setEditCardClosingDay(card.closingDay.toString());
    setShowEditCardDialog(true);
  };

  // Função para editar cartão
  const handleEditCard = async () => {
    if (!editingCard) return;

    if (!editCardName.trim()) {
      toast.error('Nome do cartão é obrigatório');
      return;
    }

    const limit = parseFloat(editCardLimit);
    const dueDay = parseInt(editCardDueDay);
    const closingDay = parseInt(editCardClosingDay);

    if (isNaN(limit) || limit <= 0) {
      toast.error('Limite deve ser maior que zero');
      return;
    }

    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      toast.error('Dia de vencimento deve ser entre 1 e 31');
      return;
    }

    if (isNaN(closingDay) || closingDay < 1 || closingDay > 31) {
      toast.error('Dia de fechamento deve ser entre 1 e 31');
      return;
    }

    try {
      const response = await fetch('/api/credit-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: editingCard.id,
          name: editCardName.trim(),
          limit: limit,
          dueDay: dueDay,
          closingDay: closingDay
        })
      });
      
      if (response.ok) {
        toast.success('Cartão atualizado com sucesso!');
        setShowEditCardDialog(false);
        setEditingCard(null);
        setEditCardName('');
        setEditCardLimit('');
        setEditCardDueDay('');
        setEditCardClosingDay('');
        loadCreditCards();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar cartão');
      }
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error);
      toast.error('Erro ao atualizar cartão');
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

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  // Se nenhum cartão selecionado, mostrar seletor
  if (!selectedCardId) {
    return (
      <>
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-end">
            <Button
              onClick={() => setShowCreateCardDialog(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Cartão
            </Button>
          </div>

          {/* Notificações de Faturas */}
          <CreditCardNotifications />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Selecione um Cartão de Crédito
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creditCards.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhum cartão de crédito cadastrado
                  </p>
                  <Button onClick={() => setShowCreateCardDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Cartão
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {creditCards.map((card) => (
                    <Card
                      key={card.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedCardId(card.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <CreditCard className="w-8 h-8 text-primary" />
                          <Badge variant="outline">
                            Vence dia {card.dueDay}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{card.name}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Limite Total:</span>
                            <span className="font-medium">{formatCurrency(card.limit)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Utilizado:</span>
                            <span className="font-medium text-orange-600">
                              {formatCurrency(card.currentBalance)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Disponível:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(card.limit - card.currentBalance)}
                            </span>
                          </div>
                          {/* Barra de progresso do limite */}
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Uso do Limite</span>
                              <span className="font-medium">
                                {((card.currentBalance / card.limit) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  (card.currentBalance / card.limit) * 100 > 80
                                    ? 'bg-red-600'
                                    : (card.currentBalance / card.limit) * 100 > 50
                                    ? 'bg-orange-500'
                                    : 'bg-green-600'
                                }`}
                                style={{
                                  width: `${Math.min((card.currentBalance / card.limit) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCardId(card.id);
                            }}
                          >
                            Ver Faturas
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditCardModal(card);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`Tem certeza que deseja excluir o cartão "${card.name}"?`)) {
                                try {
                                  const response = await fetch(`/api/credit-cards?id=${card.id}`, {
                                    method: 'DELETE',
                                    credentials: 'include'
                                  });
                                  
                                  if (response.ok) {
                                    toast.success('Cartão excluído!');
                                    loadCreditCards();
                                  } else {
                                    toast.error('Erro ao excluir cartão');
                                  }
                                } catch (error) {
                                  toast.error('Erro ao excluir cartão');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modais */}
        <Dialog open={showCreateCardDialog} onOpenChange={setShowCreateCardDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cartão de Crédito</DialogTitle>
              <DialogDescription>
                Crie um novo cartão de crédito para gerenciar suas faturas.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="card-name">Nome do Cartão</Label>
                <Input
                  id="card-name"
                  placeholder="Ex: Cartão Principal"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-limit">Limite (R$)</Label>
                <Input
                  id="card-limit"
                  type="number"
                  step="0.01"
                  placeholder="5000.00"
                  value={newCardLimit}
                  onChange={(e) => setNewCardLimit(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="card-due-day">Dia Vencimento</Label>
                  <Input
                    id="card-due-day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    value={newCardDueDay}
                    onChange={(e) => setNewCardDueDay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-closing-day">Dia Fechamento</Label>
                  <Input
                    id="card-closing-day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="10"
                    value={newCardClosingDay}
                    onChange={(e) => setNewCardClosingDay(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateCardDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateCard}
                disabled={!newCardName.trim() || !newCardLimit || !newCardDueDay || !newCardClosingDay}
              >
                Criar Cartão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditCardDialog} onOpenChange={setShowEditCardDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cartão de Crédito</DialogTitle>
              <DialogDescription>
                Edite as informações do seu cartão de crédito.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-card-name">Nome do Cartão</Label>
                <Input
                  id="edit-card-name"
                  placeholder="Ex: Cartão Principal"
                  value={editCardName}
                  onChange={(e) => setEditCardName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-card-limit">Limite (R$)</Label>
                <Input
                  id="edit-card-limit"
                  type="number"
                  step="0.01"
                  placeholder="5000.00"
                  value={editCardLimit}
                  onChange={(e) => setEditCardLimit(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-card-due-day">Dia Vencimento</Label>
                  <Input
                    id="edit-card-due-day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    value={editCardDueDay}
                    onChange={(e) => setEditCardDueDay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-card-closing-day">Dia Fechamento</Label>
                  <Input
                    id="edit-card-closing-day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="10"
                    value={editCardClosingDay}
                    onChange={(e) => setEditCardClosingDay(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditCardDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleEditCard}
                disabled={!editCardName.trim() || !editCardLimit || !editCardDueDay || !editCardClosingDay}
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Mostrar fatura do cartão selecionado
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedCardId('')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Cartões
          </Button>
        </div>
        <Button
          onClick={() => setShowCreateCardDialog(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Cartão
        </Button>
      </div>

      {/* Informações do Cartão Selecionado */}
      {(() => {
        const selectedCard = creditCards.find(c => c.id === selectedCardId);
        if (!selectedCard) return null;
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {selectedCard.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Limite</p>
                  <p className="text-lg font-semibold">{formatCurrency(selectedCard.limit)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disponível</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedCard.limit - selectedCard.currentBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="text-lg font-semibold">Dia {selectedCard.dueDay}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fechamento</p>
                  <p className="text-lg font-semibold">Dia {selectedCard.closingDay}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Fatura Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Fatura de {getMonthName(selectedMonth + 1)} {selectedYear}
            </div>
            {invoice && (
              <Badge variant={invoice.isPaid ? "default" : "destructive"}>
                {invoice.isPaid ? "Paga" : "Em Aberto"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando fatura...</p>
            </div>
          ) : !invoice ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                Nenhuma fatura encontrada para este período
              </p>
              <p className="text-sm text-muted-foreground">
                As transações aparecerão aqui quando forem realizadas
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo da Fatura */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(invoice.totalAmount)}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="text-lg font-semibold">
                    {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Receipt className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Transações</p>
                  <p className="text-2xl font-bold">{invoice.transactions.length}</p>
                </div>
              </div>

              {/* Ações da Fatura */}
              {!invoice.isPaid && invoice.totalAmount > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setPaymentAmount(invoice.totalAmount.toString());
                      setShowPaymentDialog(true);
                    }}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Pagar Fatura Total
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPaymentAmount('');
                      setShowPaymentDialog(true);
                    }}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Pagamento Parcial
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Baixar PDF
                  </Button>
                </div>
              )}

              {/* Lista de Transações */}
              {invoice.transactions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Transações da Fatura</h3>
                  <div className="space-y-2">
                    {invoice.transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                            <span>{transaction.category}</span>
                            {transaction.isInstallment && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.installmentNumber}/{transaction.totalInstallments}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Pagamento */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Fatura</DialogTitle>
            <DialogDescription>
              Registre o pagamento da fatura do cartão de crédito
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Valor do Pagamento</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              {invoice && (
                <p className="text-sm text-muted-foreground">
                  Valor da fatura: {formatCurrency(invoice.totalAmount)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-date">Data do Pagamento</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-account">Conta para Débito</Label>
              <Select value={selectedPaymentAccount} onValueChange={setSelectedPaymentAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {formatCurrency(account.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                if (!paymentAmount || !selectedPaymentAccount) {
                  toast.error('Preencha todos os campos');
                  return;
                }
                
                if (!invoice) {
                  toast.error('Fatura não encontrada');
                  return;
                }
                
                try {
                  const response = await fetch(`/api/credit-cards/${selectedCardId}/invoices/${invoice.id}/pay`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      amount: parseFloat(paymentAmount),
                      paymentDate: paymentDate,
                      accountId: selectedPaymentAccount,
                      fullPayment: parseFloat(paymentAmount) >= invoice.totalAmount
                    })
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    toast.success(result.message || 'Pagamento registrado com sucesso!');
                    setShowPaymentDialog(false);
                    setPaymentAmount('');
                    setSelectedPaymentAccount('');
                    loadInvoice(); // Recarregar fatura
                  } else {
                    const error = await response.json();
                    toast.error(error.error || 'Erro ao registrar pagamento');
                  }
                } catch (error) {
                  console.error('Erro ao registrar pagamento:', error);
                  toast.error('Erro ao registrar pagamento');
                }
              }}
              disabled={!paymentAmount || !selectedPaymentAccount}
            >
              Registrar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}