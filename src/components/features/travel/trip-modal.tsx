'use client';

import React, { useState, useEffect } from 'react';
import { databaseService } from '../../../lib/services/database-service';
import { logComponents, logError } from '../../../lib/logger';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import {
  Plane,
  Plus,
  X,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  CalendarIcon,
} from 'lucide-react';
import { type Trip } from '../../../lib/storage/storage';
import { useToast } from '../../../hooks/use-toast';
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  validateBRDate,
  getCurrentDateBR,
} from '../../../lib/utils/date-utils';
import { useTrips } from '../../../contexts/unified-context-simple';
import { DatePicker } from '../../ui/date-picker';

interface TripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: Trip;
  onSave?: () => void;
}

export function TripModal({
  open,
  onOpenChange,
  trip,
  onSave,
}: TripModalProps) {
  const { toast } = useToast();

  // Estado de montagem para evitar problemas de hidratação
  const [isMounted, setIsMounted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: getCurrentDateBR(),
    endDate: getCurrentDateBR(),
    budget: '',
    currency: 'BRL',
    participants: ['Você'],
    description: '',
    accommodation: '',
    transportation: '',
    activities: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showFamilySelector, setShowFamilySelector] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  // Use unified trip system
  const { create: createTrip, update: updateTrip } = useTrips();

  // Carregar membros da família
  const loadFamilyMembers = async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const response = await fetch('/api/family');
      if (response.ok) {
        const familyMembers = await response.json();
        setFamilyMembers(Array.isArray(familyMembers) ? familyMembers : []);
      } else {
        console.error('Failed to load family members');
        setFamilyMembers([]);
      }
    } catch (error) {
      logComponents.error('Error loading family members:', error);
      setFamilyMembers([]);
    }
  };

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  useEffect(() => {
    if (trip) {
      setFormData({
        name: trip.name,
        destination: trip.destination,
        startDate: convertISODateToBR(trip.startDate),
        endDate: convertISODateToBR(trip.endDate),
        budget: trip.budget.toString(),
        currency: trip.currency,
        participants: trip.participants,
        description: trip.description || '',
        accommodation: '',
        transportation: '',
        activities: '',
      });
    }
  }, [trip?.id]); // Only depend on trip.id to avoid infinite loops

  const currencies = [
    { value: 'BRL', label: 'Real (R$)' },
    { value: 'USD', label: 'Dólar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'Libra (£)' },
  ];

  const removeParticipant = (participant: string) => {
    if (participant !== 'Você') {
      setFormData({
        ...formData,
        participants: formData.participants.filter((p) => p !== participant),
      });
    }
  };

  const addFamilyMember = (memberName: string) => {
    if (!formData.participants.includes(memberName)) {
      setFormData({
        ...formData,
        participants: [...formData.participants, memberName],
      });
    }
  };

  // Definir estado de montagem após hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Guards defensivos para validação de dados de entrada
      if (!formData.name?.trim()) {
        toast({
          title: 'Erro',
          description: 'Por favor, insira o nome da viagem',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!formData.destination?.trim()) {
        toast({
          title: 'Erro',
          description: 'Por favor, insira o destino da viagem',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Guard defensivo para moeda
      if (!formData.currency?.trim()) {
        toast({
          title: 'Erro',
          description: 'Por favor, selecione uma moeda',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Validação de datas com guards defensivos
      if (!formData.startDate?.trim() || !validateBRDate(formData.startDate)) {
        toast({
          title: 'Erro',
          description:
            'Por favor, insira uma data de início válida no formato dd/mm/aaaa',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!formData.endDate?.trim() || !validateBRDate(formData.endDate)) {
        toast({
          title: 'Erro',
          description:
            'Por favor, insira uma data de fim válida no formato dd/mm/aaaa',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Guards defensivos para orçamento
      const budgetStr = formData.budget?.trim();
      if (!budgetStr) {
        toast({
          title: 'Erro',
          description: 'Por favor, insira um orçamento',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const budget = Number.parseFloat(budgetStr);

      if (isNaN(budget) || budget <= 0 || !isFinite(budget)) {
        toast({
          title: 'Erro',
          description: 'Por favor, insira um orçamento válido e positivo',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Guard defensivo para conversão de datas
      let startDateISO: string;
      let endDateISO: string;
      
      try {
        startDateISO = convertBRDateToISO(formData.startDate);
        endDateISO = convertBRDateToISO(formData.endDate);
        
        // Verificação adicional das conversões
        if (!startDateISO || !endDateISO) {
          throw new Error('Falha na conversão das datas');
        }
        
        // Validação das datas convertidas
        const startDate = new Date(startDateISO);
        const endDate = new Date(endDateISO);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Datas inválidas após conversão');
        }
        
        // Verificação se data de início não é posterior à data de fim
        if (startDate > endDate) {
          toast({
            title: 'Erro',
            description: 'A data de início não pode ser posterior à data de fim',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
      } catch (error) {
        console.error('Erro na conversão de datas:', error);
        toast({
          title: 'Erro',
          description: 'Erro na conversão de datas. Verifique o formato dd/mm/aaaa',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Guard defensivo para participantes
      if (!Array.isArray(formData.participants)) {
        console.warn('participants não é um array, inicializando como array vazio');
        formData.participants = [];
      }

      const tripData = {
        name: formData.name.trim(),
        destination: formData.destination.trim(),
        startDate: startDateISO,
        endDate: endDateISO,
        budget,
        currency: formData.currency.trim(),
        participants: formData.participants,
        description: formData.description?.trim() || '', // Guard defensivo para description
        status: trip?.status || ('planned' as const),
        spent: trip?.spent || 0,
      };

      if (trip) {
        // Guard defensivo para ID da viagem
        if (!trip.id?.trim()) {
          toast({
            title: 'Erro',
            description: 'ID da viagem inválido para atualização',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        console.log('Atualizando viagem:', trip.id, tripData);
        
        // Update trip using API
        const response = await fetch('/api/trips', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: trip.id,
            ...tripData,
            updatedAt: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar viagem');
        }

        const updatedTrip = await response.json();
        
        console.log('Viagem atualizada com sucesso');
        toast({
          title: 'Sucesso',
          description: 'Viagem atualizada com sucesso!',
        });
      } else {
        console.log('Criando nova viagem:', tripData);
        
        // Create trip using API
        const tripDataWithId = {
          ...tripData,
          id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const response = await fetch('/api/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tripDataWithId),
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar viagem');
        }

        const newTrip = await response.json();
        
        // Guard defensivo para verificar se a viagem foi criada
        if (!newTrip || !newTrip.id) {
          toast({
            title: 'Erro',
            description: 'Falha ao criar viagem - resposta inválida',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        console.log('Nova viagem criada:', newTrip);

        toast({
          title: 'Sucesso',
          description: 'Viagem criada com sucesso!',
        });
      }

      // Chamar callback se fornecido
      if (onSave && typeof onSave === 'function') {
        try {
          onSave();
        } catch (callbackError) {
          console.warn('Erro no callback onSave:', callbackError);
          // Não falha a operação principal se o callback falhar
        }
      }

      onOpenChange(false);
    } catch (error) {
      logError.ui('Erro no handleSubmit:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar viagem',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDuration = () => {
    // Verificações defensivas
    if (!formData.startDate?.trim() || !formData.endDate?.trim()) {
      return '';
    }

    // Validação das datas
    if (!validateBRDate(formData.startDate) || !validateBRDate(formData.endDate)) {
      return '';
    }

    try {
      const startISO = convertBRDateToISO(formData.startDate);
      const endISO = convertBRDateToISO(formData.endDate);
      
      // Verificação adicional das conversões
      if (!startISO || !endISO) {
        return '';
      }

      const start = new Date(startISO);
      const end = new Date(endISO);
      
      // Verificação se as datas são válidas
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return '';
      }

      // Cálculo da diferença em dias
      const timeDiff = end.getTime() - start.getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
      
      // Log para debug (remover em produção)
      console.log('getDuration:', {
        startDate: formData.startDate,
        endDate: formData.endDate,
        startISO,
        endISO,
        timeDiff,
        days
      });
      
      return days > 0 ? `${days} dia${days > 1 ? 's' : ''}` : '';
    } catch (error) {
      console.error('Erro no cálculo de duração:', error);
      return '';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-600" />
              {trip ? 'Editar Viagem' : 'Planejar Nova Viagem'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Informações Básicas
              </h3>

              <div>
                <Label htmlFor="name">Nome da Viagem *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Férias em Paris, Final de semana em Gramado..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="destination">Destino *</Label>
                <Input
                  id="destination"
                  placeholder="Ex: Paris, França"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva sua viagem, objetivos, pontos de interesse..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Datas */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Período da Viagem
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <DatePicker
                    id="startDate"
                    value={convertBRDateToISO(formData.startDate)}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        startDate: convertISODateToBR(value),
                      })
                    }
                    placeholder="Selecionar data de início"
                    required
                    maxDate={
                      formData.endDate && validateBRDate(formData.endDate)
                        ? new Date(convertBRDateToISO(formData.endDate))
                        : undefined
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data de Fim *</Label>
                  <DatePicker
                    id="endDate"
                    value={convertBRDateToISO(formData.endDate)}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        endDate: convertISODateToBR(value),
                      })
                    }
                    placeholder="Selecionar data de fim"
                    required
                    minDate={
                      formData.startDate && validateBRDate(formData.startDate)
                        ? new Date(convertBRDateToISO(formData.startDate))
                        : undefined
                    }
                  />
                </div>
              </div>

              {/* Exibição da duração da viagem */}
              {formData.startDate && formData.endDate && getDuration() && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Duração da Viagem
                  </p>
                  <p className="text-lg font-semibold text-blue-700">{getDuration()}</p>
                </div>
              )}
            </div>

            {/* Orçamento */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Orçamento
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Orçamento Total *</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies
                        .filter(
                          (currency) =>
                            currency.value && currency.value.trim() !== ''
                        )
                        .map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Participantes */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Participantes da Família
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFamilySelector(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar da Família
                </Button>
              </div>

              {/* Lista de membros da família disponíveis */}
              {familyMembers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Membros da família disponíveis:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {familyMembers.map((member) => (
                      <Button
                        key={member.id || member.name}
                        type="button"
                        variant={
                          formData.participants.includes(member.name)
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => {
                          if (formData.participants.includes(member.name)) {
                            removeParticipant(member.name);
                          } else {
                            addFamilyMember(member.name);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="w-4 h-4">
                          <AvatarFallback
                            className="text-xs"
                            style={{
                              backgroundColor: member.color || '#3B82F6',
                            }}
                          >
                            {member.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Participantes selecionados */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Participantes selecionados:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.participants.map((participant) => (
                    <Badge
                      key={participant}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">
                          {participant === 'Você'
                            ? 'EU'
                            : participant
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {participant}
                      {participant !== 'Você' && (
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-600"
                          onClick={() => removeParticipant(participant)}
                        />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {familyMembers.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum membro da família encontrado</p>
                  <p className="text-xs">
                    Vá para a página Família para adicionar membros
                  </p>
                </div>
              )}
            </div>

            {/* Planejamento Detalhado */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">
                Planejamento Detalhado (Opcional)
              </h3>

              <div>
                <Label htmlFor="accommodation">Hospedagem</Label>
                <Textarea
                  id="accommodation"
                  placeholder="Hotéis, pousadas, Airbnb..."
                  value={formData.accommodation}
                  onChange={(e) =>
                    setFormData({ ...formData, accommodation: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="transportation">Transporte</Label>
                <Textarea
                  id="transportation"
                  placeholder="Voos, ônibus, aluguel de carro..."
                  value={formData.transportation}
                  onChange={(e) =>
                    setFormData({ ...formData, transportation: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="activities">
                  Atividades e Pontos Turísticos
                </Label>
                <Textarea
                  id="activities"
                  placeholder="Museus, restaurantes, passeios..."
                  value={formData.activities}
                  onChange={(e) =>
                    setFormData({ ...formData, activities: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Salvando...'
                  : `${trip ? 'Atualizar' : 'Criar'} Viagem`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para adicionar novo membro da família */}
      {showFamilySelector && (
        <Dialog open={showFamilySelector} onOpenChange={setShowFamilySelector}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Adicionar Membro da Família</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Para adicionar novos membros da família, vá para a página{' '}
                <strong>Família</strong> no menu principal.
              </p>
              <div className="flex justify-end">
                <Button onClick={() => setShowFamilySelector(false)}>
                  Entendi
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}


