'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Route,
  Edit,
  UserPlus,
  Info,
  X,
  Save,
} from 'lucide-react';
import type { Trip } from '@/lib/storage';
import {
  useAccounts,
  useTransactions,
  useGoals,
  useContacts,
} from '@/contexts/unified-financial-context';
import { toast } from 'sonner';
import { storage } from '@/lib/storage';

interface TripOverviewProps {
  trip: Trip;
  onUpdate?: (trip: Trip) => void;
}

export function TripOverview({ trip, onUpdate }: TripOverviewProps) {
  const transactions = useTransactions();
  const contacts = useContacts();
  const [expenses, setExpenses] = useState(0);
  const [documentsProgress, setDocumentsProgress] = useState(0);
  const [checklistProgress, setChecklistProgress] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);
  const [itineraryCount, setItineraryCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    budget: trip.budget,
    currency: trip.currency,
    description: trip.description || '',
    status: trip.status,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && transactions && Array.isArray(transactions)) {
      loadTripData();
    }
  }, [trip.id, isMounted, transactions]);

  // ✅ Listener para atualizar quando transação for criada, editada ou deletada
  useEffect(() => {
    const handleTransactionUpdate = (event?: CustomEvent) => {
      console.log('🔄 [TripOverview] Evento de transação recebido:', event?.type);
      if (isMounted && transactions && Array.isArray(transactions)) {
        loadTripData();
      }
    };

    // Escutar todos os eventos de transação
    window.addEventListener('transactionCreated', handleTransactionUpdate);
    window.addEventListener('transactionUpdated', handleTransactionUpdate);
    window.addEventListener('transactionDeleted', handleTransactionUpdate);
    window.addEventListener('TRANSACTION_UPDATED', handleTransactionUpdate);
    window.addEventListener('TRANSACTION_DELETED', handleTransactionUpdate);
    
    return () => {
      window.removeEventListener('transactionCreated', handleTransactionUpdate);
      window.removeEventListener('transactionUpdated', handleTransactionUpdate);
      window.removeEventListener('transactionDeleted', handleTransactionUpdate);
      window.removeEventListener('TRANSACTION_UPDATED', handleTransactionUpdate);
      window.removeEventListener('TRANSACTION_DELETED', handleTransactionUpdate);
    };
  }, [isMounted, transactions]);

  const loadTripData = async () => {
    // Carregar gastos
    const tripExpenses = transactions.filter(
      (t) => (t as any).tripId === trip.id
    );
    
    // ✅ CORREÇÃO: Considerar receitas como negativas (reembolsos)
    const totalExpenses = tripExpenses.reduce((sum, t) => {
      const amount = Math.abs(t.amount);
      const isIncome = t.type === 'RECEITA' || t.type === 'income';
      
      // Para compartilhadas, usar myShare
      const value = (t as any).isShared && (t as any).myShare !== null && (t as any).myShare !== undefined
        ? Math.abs(Number((t as any).myShare))
        : amount;
      
      // RECEITA subtrai (reembolso), DESPESA soma
      return isIncome ? sum - value : sum + value;
    }, 0);
    
    console.log('💰 [TripOverview] Total calculado:', {
      transactionsCount: tripExpenses.length,
      totalExpenses,
      transactions: tripExpenses.map(t => ({
        description: t.description,
        type: t.type,
        amount: t.amount,
        myShare: (t as any).myShare
      }))
    });
    
    setExpenses(totalExpenses);

    // Carregar dados do itinerário via API
    try {
      const response = await fetch(`/api/itinerary?tripId=${trip.id}`, { credentials: 'include' });
      if (response.ok) {
        const itineraryData = await response.json();
        setItineraryCount(itineraryData.length);
      } else {
        console.error('Erro ao carregar itinerário:', response.statusText);
        setItineraryCount(0);
      }
    } catch (error) {
      console.error('Erro ao carregar itinerário:', error);
      setItineraryCount(0);
    }

    // TODO: Implementar APIs para documentos, checklist e fotos
    // Por enquanto, usar valores padrão
    setDocumentsProgress(0);
    setChecklistProgress(0);
    setPhotosCount(0);
  };

  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Trip['status']) => {
    switch (status) {
      case 'planned':
        return 'Planejada';
      case 'active':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      default:
        return 'Desconhecido';
    }
  };

  const getTripDuration = () => {
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }
      
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Retornar pelo menos 1 dia se as datas são válidas e a data final é >= data inicial
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      console.error('Erro ao calcular duração da viagem:', error);
      return 0;
    }
  };

  const getDaysUntilTrip = () => {
    const today = new Date();
    const start = new Date(trip.startDate);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBudgetProgress = () => {
    return trip.budget && trip.budget > 0 
      ? Math.min((expenses / trip.budget) * 100, 100)
      : 0;
  };

  const daysUntil = getDaysUntilTrip();
  const duration = getTripDuration();
  const budgetProgress = getBudgetProgress();

  const handleOpenParticipantsDialog = () => {
    // Inicializar com participantes atuais (exceto "Você")
    const currentParticipants = Array.isArray(trip.participants) 
      ? trip.participants.filter(p => p !== 'Você')
      : [];
    setSelectedParticipants(currentParticipants);
    setShowParticipantsDialog(true);
  };

  const handleSaveParticipants = async () => {
    try {
      setIsUpdating(true);
      
      // Sempre incluir "Você" como primeiro participante
      const updatedParticipants = ['Você', ...selectedParticipants];
      
      // Atualizar via API usando PUT (não PATCH)
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: trip.name,
          destination: trip.destination,
          status: trip.status,
          startDate: trip.startDate,
          endDate: trip.endDate,
          budget: trip.budget,
          currency: trip.currency,
          description: trip.description,
          spent: trip.spent || 0,
          participants: updatedParticipants,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar participantes');
      }

      // Atualizar storage local
      storage.updateTrip(trip.id, { participants: updatedParticipants });
      
      // Notificar componente pai
      if (onUpdate) {
        onUpdate({ ...trip, participants: updatedParticipants });
      }

      toast.success('Participantes atualizados com sucesso!');
      setShowParticipantsDialog(false);
      
      // Recarregar dados
      loadTripData();
    } catch (error) {
      console.error('Erro ao atualizar participantes:', error);
      toast.error('Erro ao atualizar participantes. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleParticipant = (contactName: string) => {
    setSelectedParticipants(prev => 
      prev.includes(contactName)
        ? prev.filter(p => p !== contactName)
        : [...prev, contactName]
    );
  };

  // Mostrar TODOS os contatos (não apenas família)
  // Isso permite adicionar qualquer pessoa cadastrada na viagem
  const familyContacts = contacts || [];

  const handleOpenEditDialog = () => {
    setEditForm({
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget,
      currency: trip.currency,
      description: trip.description || '',
      status: trip.status,
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      setIsUpdating(true);

      // Validações
      if (!editForm.name.trim()) {
        toast.error('Nome da viagem é obrigatório');
        return;
      }
      if (!editForm.destination.trim()) {
        toast.error('Destino é obrigatório');
        return;
      }
      if (!editForm.startDate || !editForm.endDate) {
        toast.error('Datas são obrigatórias');
        return;
      }
      if (new Date(editForm.endDate) < new Date(editForm.startDate)) {
        toast.error('Data final deve ser maior que data inicial');
        return;
      }

      // Atualizar via API usando PUT (não PATCH)
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editForm.name,
          destination: editForm.destination,
          status: editForm.status,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          budget: editForm.budget,
          currency: editForm.currency,
          description: editForm.description,
          spent: trip.spent || 0,
          participants: trip.participants || ['Você'],
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar viagem');
      }

      // Atualizar storage local
      await storage.updateTrip(trip.id, editForm);

      // Notificar componente pai
      if (onUpdate) {
        onUpdate({ ...trip, ...editForm });
      }

      toast.success('Viagem atualizada com sucesso!');
      setShowEditDialog(false);

      // Recarregar dados
      loadTripData();
    } catch (error) {
      console.error('Erro ao atualizar viagem:', error);
      toast.error('Erro ao atualizar viagem. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const removeParticipant = (participantName: string) => {
    if (participantName === 'Você') {
      toast.error('Você não pode se remover da viagem!');
      return;
    }
    setSelectedParticipants(prev => prev.filter(p => p !== participantName));
  };

  return (
    <div className="space-y-6">
      {/* Header da Viagem */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 border-blue-500 shadow-xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <Plane className="w-8 h-8 text-white" />
                {trip.name}
              </CardTitle>
              <div className="flex items-center gap-4 mt-3">
                <Badge
                  className="bg-white/20 text-white border-white/30"
                  variant="secondary"
                >
                  {getStatusText(trip.status)}
                </Badge>
                <div className="flex items-center gap-1 text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{trip.destination}</span>
                </div>
                <div className="flex items-center gap-1 text-white/90">
                  <Clock className="w-4 h-4" />
                  <span>{duration} dias</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 self-end"
                onClick={handleOpenEditDialog}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Viagem
              </Button>
              {trip.status === 'planned' && daysUntil > 0 && (
                <div className="text-right bg-yellow-400 px-4 py-2 rounded-lg">
                  <div className="text-3xl font-bold text-blue-900">
                    {daysUntil}
                  </div>
                  <div className="text-sm font-semibold text-blue-900">
                    dias restantes
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5" />
              <div>
                <div className="font-semibold">Período</div>
                <div className="text-sm text-white/90">
                  {new Date(trip.startDate).toLocaleDateString('pt-BR')} -{' '}
                  {new Date(trip.endDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5" />
              <div className="flex-1">
                <div className="font-semibold">Participantes</div>
                <div className="text-sm text-white/90">
                  {(Array.isArray(trip.participants) ? trip.participants : ['Você']).length} pessoa
              {(Array.isArray(trip.participants) ? trip.participants : ['Você']).length > 1 ? 's' : ''}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={handleOpenParticipantsDialog}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-white">
              <DollarSign className="w-5 h-5" />
              <div>
                <div className="font-semibold">Orçamento</div>
                <div className="text-sm text-white/90">
                  {trip.currency} {Number(trip.budget).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          {trip.description && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <p className="text-white">{trip.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meu Gasto</p>
                <p className="text-xl font-bold text-red-600">
                  {trip.currency} {expenses.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Individual</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Documentos</p>
                <p className="text-xl font-bold text-blue-600">
                  {documentsProgress.toFixed(0)}%
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checklist</p>
                <p className="text-xl font-bold text-green-600">
                  {checklistProgress.toFixed(0)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Roteiro</p>
                <p className="text-xl font-bold text-purple-600">
                  {itineraryCount} itens
                </p>
              </div>
              <Route className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso do Orçamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Controle de Orçamento
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Valores baseados na sua parte individual dos gastos
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Progresso dos Gastos (Individual)</span>
            <span className="text-sm text-gray-600 dark:text-gray-100">
              {trip.currency} {expenses.toFixed(2)} / {Number(trip.budget).toFixed(2)}
            </span>
          </div>
          <Progress value={budgetProgress} className="h-3" />
          <div className="flex justify-between text-sm">
            <span
              className={
                budgetProgress > 100 ? 'text-red-600' : 'text-gray-600 dark:text-gray-100'
              }
            >
              {budgetProgress.toFixed(1)}% utilizado
            </span>
            <span
              className={
                expenses > trip.budget ? 'text-red-600' : 'text-green-600'
              }
            >
              {expenses <= trip.budget
                ? `Falta: ${trip.currency} ${(trip.budget - expenses).toFixed(2)}`
                : `Excedeu em ${trip.currency} ${(expenses - trip.budget).toFixed(2)}`}
            </span>
          </div>
          {expenses > trip.budget && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">Atenção: Orçamento excedido!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progresso das Tarefas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Progresso</span>
                <span className="text-sm text-gray-600 dark:text-gray-100">
                  {documentsProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={documentsProgress} className="h-2" />
              <p className="text-sm text-gray-600 dark:text-gray-100">
                {documentsProgress === 100
                  ? 'Todos os documentos prontos!'
                  : 'Alguns documentos ainda precisam ser preparados'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Progresso</span>
                <span className="text-sm text-gray-600 dark:text-gray-100">
                  {checklistProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={checklistProgress} className="h-2" />
              <p className="text-sm text-gray-600 dark:text-gray-100">
                {checklistProgress === 100
                  ? 'Checklist completo!'
                  : 'Ainda há itens pendentes no checklist'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participantes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participantes da Viagem
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenParticipantsDialog}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Gerenciar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(Array.isArray(trip.participants) ? trip.participants : ['Você']).map((participant, index) => (
              <div
                key={`participant-${participant}-${index}`}
                className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                    {participant === 'Você'
                      ? 'EU'
                      : participant
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{participant}</span>
                {participant === 'Você' && (
                  <Badge variant="outline" className="text-xs">
                    Organizador
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Participantes */}
      <Dialog open={showParticipantsDialog} onOpenChange={setShowParticipantsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciar Participantes
            </DialogTitle>
            <DialogDescription>
              Selecione os membros da família que participarão desta viagem
            </DialogDescription>
          </DialogHeader>

          {/* Aviso sobre despesas compartilhadas */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Importante:</p>
              <p>
                Os participantes devem estar cadastrados na página <strong>Família</strong> para 
                aparecerem em despesas compartilhadas.
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {/* Você (sempre incluído) */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-blue-200">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">EU</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Você</p>
                <p className="text-xs text-gray-600">Organizador da viagem</p>
              </div>
              <Badge variant="default">Incluído</Badge>
            </div>

            {/* Contatos da família */}
            {familyContacts.length > 0 ? (
              familyContacts.map((contact) => {
                const isSelected = selectedParticipants.includes(contact.name);
                return (
                  <div
                    key={contact.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedParticipants(prev => [...prev, contact.name]);
                        } else {
                          setSelectedParticipants(prev => prev.filter(p => p !== contact.name));
                        }
                      }}
                    />
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-600">
                        {contact.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-xs text-gray-600">Membro da família</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Nenhum contato cadastrado</p>
                <p className="text-sm text-gray-500">
                  Cadastre membros da família na página <strong>Família</strong>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowParticipantsDialog(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveParticipants} disabled={isUpdating}>
              {isUpdating ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição da Viagem */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Informações da Viagem
            </DialogTitle>
            <DialogDescription>
              Atualize as informações da sua viagem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nome da Viagem */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Viagem *</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Ex: Férias em Paris"
              />
            </div>

            {/* Destino */}
            <div className="space-y-2">
              <Label htmlFor="destination">Destino *</Label>
              <Input
                id="destination"
                value={editForm.destination}
                onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                placeholder="Ex: Paris, França"
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Término *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Orçamento e Moeda */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Orçamento *</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  value={editForm.budget}
                  onChange={(e) => setEditForm({ ...editForm, budget: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <Select
                  value={editForm.currency}
                  onValueChange={(value) => setEditForm({ ...editForm, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL - Real</SelectItem>
                    <SelectItem value="USD">USD - Dólar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - Libra</SelectItem>
                    <SelectItem value="JPY">JPY - Iene</SelectItem>
                    <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value: 'planned' | 'active' | 'completed') => 
                  setEditForm({ ...editForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planejada</SelectItem>
                  <SelectItem value="active">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Adicione detalhes sobre a viagem..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
