'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  DollarSign,
  Users,
  Plus,
  Plane,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  X,
  Calculator,
  Percent,
  Equal,
  MapPin,
  CreditCard,
  Calendar,
  Repeat,
  Split,
  UserPlus,
  Trash2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  editingTransaction?: any;
  tripId?: string;
}

export function AddTransactionModal({
  open,
  onOpenChange,
  onSave,
  editingTransaction,
  tripId,
}: AddTransactionModalProps) {
  // Estados principais
  const [formData, setFormData] = useState({
    // Campos básicos
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    account: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    
    // Compartilhamento
    isShared: false,
    selectedContacts: [] as string[],
    sharedPercentages: {} as Record<string, number>,
    divisionMethod: 'equal' as 'equal' | 'percentage' | 'amount',
    isPaidBy: false,
    paidByPerson: '',
    
    // Parcelamento
    isInstallment: false,
    installments: 2,
    firstDueDate: new Date().toISOString().split('T')[0],
    frequency: 'monthly' as 'monthly' | 'weekly',
    
    // Viagem
    isLinkedToTrip: false,
    tripId: tripId || '',
    originalCurrency: 'BRL',
    exchangeRate: 1,
    convertedAmount: '',
    
    // Recorrência
    isRecurring: false,
    recurringFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurringEndType: 'never' as 'never' | 'date' | 'occurrences',
    recurringEndDate: '',
    recurringOccurrences: 12,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Dados mockados (em um app real, viriam de APIs/contextos)
  const [accounts] = useState([
    { id: '1', name: 'Nubank', type: 'ATIVO', balance: 2500.00 },
    { id: '2', name: 'Itaú', type: 'ATIVO', balance: 1200.00 },
    { id: 'card-1', name: 'Cartão Nubank', type: 'PASSIVO', limit: 5000, currentBalance: 1200 },
    { id: 'card-2', name: 'Cartão Itaú', type: 'PASSIVO', limit: 3000, currentBalance: 800 },
  ]);

  const [categories] = useState([
    { id: '1', name: 'Alimentação', type: 'DESPESA' },
    { id: '2', name: 'Transporte', type: 'DESPESA' },
    { id: '3', name: 'Moradia', type: 'DESPESA' },
    { id: '4', name: 'Lazer', type: 'DESPESA' },
    { id: '5', name: 'Saúde', type: 'DESPESA' },
    { id: '6', name: 'Salário', type: 'RECEITA' },
    { id: '7', name: 'Freelance', type: 'RECEITA' },
    { id: '8', name: 'Investimentos', type: 'RECEITA' },
  ]);

  const [contacts] = useState([
    { id: '1', name: 'João Silva', email: 'joao@email.com' },
    { id: '2', name: 'Maria Santos', email: 'maria@email.com' },
    { id: '3', name: 'Pedro Costa', email: 'pedro@email.com' },
  ]);

  const [trips] = useState([
    { id: '1', name: 'Férias em Paris', destination: 'Paris, França', currency: 'EUR', budget: 5000, spent: 2300 },
    { id: '2', name: 'Viagem SP', destination: 'São Paulo, SP', currency: 'BRL', budget: 2000, spent: 800 },
  ]);

  // Funções auxiliares
  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(',', '.')) || 0;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Renderizar opções de contas
  const renderAccountOptions = () => {
    const bankAccounts = accounts.filter(acc => acc.type === 'ATIVO');
    const creditCards = accounts.filter(acc => acc.type === 'PASSIVO');
    const isIncome = formData.type === 'income';

    return (
      <>
        {/* Contas Bancárias */}
        {bankAccounts.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b">
              💰 Contas Bancárias
            </div>
            {bankAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name} - {formatCurrency(account.balance)}
              </SelectItem>
            ))}
          </>
        )}

        {/* Cartões de Crédito (apenas para despesas) */}
        {!isIncome && creditCards.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b">
              💳 Cartões de Crédito
            </div>
            {creditCards.map((card) => {
              const available = (card as any).limit - (card as any).currentBalance;
              return (
                <SelectItem key={card.id} value={card.id}>
                  {card.name} - Disponível: {formatCurrency(available)}
                </SelectItem>
              );
            })}
          </>
        )}
      </>
    );
  };

  // Calcular percentuais de divisão
  const calculatePercentages = useCallback(() => {
    if (!formData.isShared || formData.selectedContacts.length === 0) return;

    const totalParticipants = formData.selectedContacts.length + 1; // +1 para você
    const equalPercentage = Math.floor(100 / totalParticipants);
    const remainder = 100 - (equalPercentage * totalParticipants);

    const newPercentages: Record<string, number> = {
      user: equalPercentage + remainder, // Resto vai para você
    };

    formData.selectedContacts.forEach((contactId) => {
      newPercentages[contactId] = equalPercentage;
    });

    setFormData(prev => ({
      ...prev,
      sharedPercentages: newPercentages,
    }));
  }, [formData.selectedContacts, formData.isShared]);

  // Atualizar percentuais quando contatos mudarem
  useEffect(() => {
    if (formData.divisionMethod === 'equal') {
      calculatePercentages();
    }
  }, [formData.selectedContacts, formData.divisionMethod, calculatePercentages]);

  // Calcular valor por pessoa
  const getAmountPerPerson = (contactId: string): number => {
    const amount = parseNumber(formData.amount);
    const percentage = formData.sharedPercentages[contactId] || 0;
    return (amount * percentage) / 100;
  };

  // Calcular total das percentagens
  const getTotalPercentage = (): number => {
    return Object.values(formData.sharedPercentages).reduce((sum, p) => sum + p, 0);
  };

  // Validar formulário
  const validateForm = (): string | null => {
    if (!formData.description.trim()) return 'Descrição é obrigatória';
    if (!formData.amount || parseNumber(formData.amount) <= 0) return 'Valor deve ser maior que zero';
    if (!formData.category) return 'Categoria é obrigatória';
    if (!formData.isPaidBy && !formData.account) return 'Conta é obrigatória';
    if (formData.isShared && formData.selectedContacts.length === 0) return 'Selecione pelo menos uma pessoa para compartilhar';
    if (formData.isShared && Math.abs(getTotalPercentage() - 100) > 0.01) return 'A divisão deve somar 100%';
    if (formData.isInstallment && formData.installments < 2) return 'Número de parcelas deve ser maior que 1';
    
    return null;
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setIsLoading(true);

    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const transactionData = {
        ...formData,
        amount: parseNumber(formData.amount),
        id: editingTransaction?.id || Date.now().toString(),
      };

      console.log('Dados da transação:', transactionData);
      
      toast.success(editingTransaction ? 'Transação atualizada!' : 'Transação criada!');
      onSave?.();
      onOpenChange(false);
      
      // Reset form se não estiver editando
      if (!editingTransaction) {
        setFormData({
          description: '',
          amount: '',
          type: 'expense',
          category: '',
          account: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
          isShared: false,
          selectedContacts: [],
          sharedPercentages: {},
          divisionMethod: 'equal',
          isPaidBy: false,
          paidByPerson: '',
          isInstallment: false,
          installments: 2,
          firstDueDate: new Date().toISOString().split('T')[0],
          frequency: 'monthly',
          isLinkedToTrip: false,
          tripId: tripId || '',
          originalCurrency: 'BRL',
          exchangeRate: 1,
          convertedAmount: '',
          isRecurring: false,
          recurringFrequency: 'monthly',
          recurringEndType: 'never',
          recurringEndDate: '',
          recurringOccurrences: 12,
        });
      }
    } catch (error) {
      toast.error('Erro ao salvar transação');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Transação */}
          <Tabs value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'income' | 'expense' }))}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="income" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Receita
              </TabsTrigger>
              <TabsTrigger value="expense" className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Despesa
              </TabsTrigger>
            </TabsList>

            <TabsContent value={formData.type} className="mt-6">
              {/* Abas de Configuração */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="sharing">Compartilhar</TabsTrigger>
                  <TabsTrigger value="installment">Parcelar</TabsTrigger>
                  <TabsTrigger value="trip">Viagem</TabsTrigger>
                </TabsList>

                {/* Aba Básico */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Descrição */}
                      <div>
                        <Label htmlFor="description">Descrição *</Label>
                        <Input
                          id="description"
                          placeholder="Ex: Supermercado, Salário, Combustível..."
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Valor */}
                        <div>
                          <Label htmlFor="amount">Valor *</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                            required
                            className="text-right"
                          />
                        </div>

                        {/* Data */}
                        <div>
                          <Label htmlFor="date">Data *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Categoria */}
                        <div>
                          <Label htmlFor="category">Categoria *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {categories
                                .filter(cat => cat.type === (formData.type === 'income' ? 'RECEITA' : 'DESPESA'))
                                .map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Conta/Cartão */}
                        <div>
                          <Label htmlFor="account">
                            {formData.type === 'income' ? 'Conta de Destino' : 'Conta/Cartão'} *
                          </Label>
                          <Select
                            value={formData.account}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, account: value }))}
                            disabled={formData.isPaidBy}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={formData.isPaidBy ? "Pago por outra pessoa" : "Selecione..."} />
                            </SelectTrigger>
                            <SelectContent>
                              {renderAccountOptions()}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Observações */}
                      <div>
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          placeholder="Notas adicionais..."
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Compartilhar */}
                <TabsContent value="sharing" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Compartilhar Despesa
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Toggle Compartilhar */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Dividir esta despesa</Label>
                          <p className="text-sm text-gray-600">Compartilhar com outras pessoas</p>
                        </div>
                        <Switch
                          checked={formData.isShared}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isShared: checked }))}
                        />
                      </div>

                      {formData.isShared && (
                        <>
                          {/* Seleção de Pessoas */}
                          <div>
                            <Label>Pessoas Envolvidas</Label>
                            <div className="space-y-2 mt-2">
                              {contacts.map(contact => (
                                <div key={contact.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={contact.id}
                                    checked={formData.selectedContacts.includes(contact.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormData(prev => ({
                                          ...prev,
                                          selectedContacts: [...prev.selectedContacts, contact.id]
                                        }));
                                      } else {
                                        setFormData(prev => ({
                                          ...prev,
                                          selectedContacts: prev.selectedContacts.filter(id => id !== contact.id)
                                        }));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={contact.id} className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs">
                                        {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {contact.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {formData.selectedContacts.length > 0 && (
                            <>
                              {/* Método de Divisão */}
                              <div>
                                <Label>Método de Divisão</Label>
                                <RadioGroup
                                  value={formData.divisionMethod}
                                  onValueChange={(value) => setFormData(prev => ({ ...prev, divisionMethod: value as any }))}
                                  className="mt-2"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="equal" id="equal" />
                                    <Label htmlFor="equal" className="flex items-center gap-2">
                                      <Equal className="w-4 h-4" />
                                      Dividir Igualmente
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="percentage" id="percentage" />
                                    <Label htmlFor="percentage" className="flex items-center gap-2">
                                      <Percent className="w-4 h-4" />
                                      Por Percentual
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </div>

                              {/* Divisão Detalhada */}
                              <div className="space-y-3">
                                <Label>Divisão dos Valores</Label>
                                
                                {/* Você */}
                                <div className="p-3 bg-blue-50 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-blue-600 text-white">EU</AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">Você</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {formData.divisionMethod === 'percentage' && (
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={formData.sharedPercentages.user || 0}
                                          onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            sharedPercentages: {
                                              ...prev.sharedPercentages,
                                              user: parseFloat(e.target.value) || 0
                                            }
                                          }))}
                                          className="w-16 text-center"
                                        />
                                      )}
                                      <span className="text-sm text-gray-600">
                                        {formData.sharedPercentages.user || 0}%
                                      </span>
                                      <span className="font-medium">
                                        {formatCurrency(getAmountPerPerson('user'))}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Outras Pessoas */}
                                {formData.selectedContacts.map(contactId => {
                                  const contact = contacts.find(c => c.id === contactId);
                                  if (!contact) return null;

                                  return (
                                    <div key={contactId} className="p-3 bg-gray-50 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="w-8 h-8">
                                            <AvatarFallback>
                                              {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="font-medium">{contact.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {formData.divisionMethod === 'percentage' && (
                                            <Input
                                              type="number"
                                              min="0"
                                              max="100"
                                              value={formData.sharedPercentages[contactId] || 0}
                                              onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                sharedPercentages: {
                                                  ...prev.sharedPercentages,
                                                  [contactId]: parseFloat(e.target.value) || 0
                                                }
                                              }))}
                                              className="w-16 text-center"
                                            />
                                          )}
                                          <span className="text-sm text-gray-600">
                                            {formData.sharedPercentages[contactId] || 0}%
                                          </span>
                                          <span className="font-medium">
                                            {formatCurrency(getAmountPerPerson(contactId))}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Total */}
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">Total</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                        {getTotalPercentage().toFixed(1)}%
                                      </span>
                                      <span className="font-medium">
                                        {formatCurrency(parseNumber(formData.amount))}
                                      </span>
                                    </div>
                                  </div>
                                  {getTotalPercentage() !== 100 && (
                                    <p className="text-sm text-red-600 mt-1">
                                      A divisão deve somar 100%
                                    </p>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          <Separator />

                          {/* Pago por Outra Pessoa */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Pago por outra pessoa</Label>
                                <p className="text-sm text-gray-600">Esta despesa foi paga por outra pessoa</p>
                              </div>
                              <Switch
                                checked={formData.isPaidBy}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPaidBy: checked }))}
                              />
                            </div>

                            {formData.isPaidBy && (
                              <div>
                                <Label>Quem pagou?</Label>
                                <Select
                                  value={formData.paidByPerson}
                                  onValueChange={(value) => setFormData(prev => ({ ...prev, paidByPerson: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {contacts.map(contact => (
                                      <SelectItem key={contact.id} value={contact.id}>
                                        {contact.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm text-yellow-800">
                                      Esta despesa não será debitada da sua conta
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Parcelar */}
                <TabsContent value="installment" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Parcelamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Toggle Parcelar */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Parcelar esta compra</Label>
                          <p className="text-sm text-gray-600">Dividir em várias parcelas</p>
                        </div>
                        <Switch
                          checked={formData.isInstallment}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isInstallment: checked }))}
                        />
                      </div>

                      {formData.isInstallment && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Número de Parcelas */}
                            <div>
                              <Label>Número de Parcelas</Label>
                              <Input
                                type="number"
                                min="2"
                                max="48"
                                value={formData.installments}
                                onChange={(e) => setFormData(prev => ({ ...prev, installments: parseInt(e.target.value) || 2 }))}
                              />
                            </div>

                            {/* Frequência */}
                            <div>
                              <Label>Frequência</Label>
                              <Select
                                value={formData.frequency}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value as any }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="weekly">Semanal</SelectItem>
                                  <SelectItem value="monthly">Mensal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Data Primeira Parcela */}
                          <div>
                            <Label>Data da Primeira Parcela</Label>
                            <Input
                              type="date"
                              value={formData.firstDueDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, firstDueDate: e.target.value }))}
                            />
                          </div>

                          {/* Resumo do Parcelamento */}
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-medium mb-2">Resumo do Parcelamento</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Valor total:</span>
                                <span className="font-medium">{formatCurrency(parseNumber(formData.amount))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Parcelas:</span>
                                <span className="font-medium">
                                  {formData.installments}x de {formatCurrency(parseNumber(formData.amount) / formData.installments)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Primeira parcela:</span>
                                <span className="font-medium">
                                  {new Date(formData.firstDueDate).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Viagem */}
                <TabsContent value="trip" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Plane className="w-5 h-5" />
                        Vincular à Viagem
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Toggle Viagem */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Vincular a uma viagem</Label>
                          <p className="text-sm text-gray-600">Associar esta despesa a uma viagem</p>
                        </div>
                        <Switch
                          checked={formData.isLinkedToTrip}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isLinkedToTrip: checked }))}
                        />
                      </div>

                      {formData.isLinkedToTrip && (
                        <>
                          {/* Selecionar Viagem */}
                          <div>
                            <Label>Selecionar Viagem</Label>
                            <Select
                              value={formData.tripId}
                              onValueChange={(value) => {
                                const trip = trips.find(t => t.id === value);
                                setFormData(prev => ({
                                  ...prev,
                                  tripId: value,
                                  originalCurrency: trip?.currency || 'BRL'
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma viagem..." />
                              </SelectTrigger>
                              <SelectContent>
                                {trips.map(trip => (
                                  <SelectItem key={trip.id} value={trip.id}>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4" />
                                      {trip.name} - {trip.destination}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Conversão de Moeda */}
                          {formData.tripId && (() => {
                            const selectedTrip = trips.find(t => t.id === formData.tripId);
                            return selectedTrip && selectedTrip.currency !== 'BRL' && (
                              <div className="space-y-3">
                                <Label>Conversão de Moeda</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Valor em {selectedTrip.currency}</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0,00"
                                      value={formData.amount}
                                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label>Taxa de Câmbio</Label>
                                    <Input
                                      type="number"
                                      step="0.0001"
                                      placeholder="1,0000"
                                      value={formData.exchangeRate}
                                      onChange={(e) => setFormData(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 1 }))}
                                    />
                                  </div>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-green-700">Valor em BRL:</span>
                                    <span className="font-medium text-green-800">
                                      {formatCurrency(parseNumber(formData.amount) * formData.exchangeRate)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Progresso da Viagem */}
                          {formData.tripId && (() => {
                            const selectedTrip = trips.find(t => t.id === formData.tripId);
                            if (!selectedTrip) return null;

                            const progress = (selectedTrip.spent / selectedTrip.budget) * 100;
                            const remaining = selectedTrip.budget - selectedTrip.spent;

                            return (
                              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <Plane className="w-4 h-4" />
                                  {selectedTrip.name}
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Orçamento:</span>
                                    <span>{formatCurrency(selectedTrip.budget)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Gasto:</span>
                                    <span>{formatCurrency(selectedTrip.spent)}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className={progress > 100 ? 'text-red-600' : 'text-gray-600'}>
                                      {progress.toFixed(1)}% utilizado
                                    </span>
                                    <span className={remaining < 0 ? 'text-red-600' : 'text-green-600'}>
                                      {remaining >= 0 ? 'Restam' : 'Excedeu'} {formatCurrency(Math.abs(remaining))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : editingTransaction ? 'Atualizar' : 'Criar Transação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}