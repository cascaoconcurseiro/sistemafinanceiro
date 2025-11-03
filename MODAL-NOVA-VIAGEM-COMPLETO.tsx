'use client';

import React, { useState, useEffect } from 'react';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Globe,
  Plus,
  X,
  AlertCircle,
  Info,
  Clock,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';

interface TripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  editingTrip?: any;
}

export function TripModal({
  open,
  onOpenChange,
  onSave,
  editingTrip,
}: TripModalProps) {
  // Estados principais
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    currency: 'BRL',
    status: 'planned' as 'planned' | 'active' | 'completed',
    participants: [] as string[],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  // Dados mockados (em um app real, viriam de APIs/contextos)
  const [familyMembers] = useState([
    { id: '1', name: 'João Silva', relationship: 'Cônjuge', email: 'joao@email.com' },
    { id: '2', name: 'Maria Silva', relationship: 'Filha', email: 'maria@email.com' },
    { id: '3', name: 'Pedro Silva', relationship: 'Filho', email: 'pedro@email.com' },
    { id: '4', name: 'Ana Costa', relationship: 'Mãe', email: 'ana@email.com' },
  ]);

  const currencies = [
    { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
    { code: 'USD', name: 'Dólar Americano', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
    { code: 'JPY', name: 'Iene Japonês', symbol: '¥' },
    { code: 'CAD', name: 'Dólar Canadense', symbol: 'C$' },
    { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$' },
    { code: 'CHF', name: 'Franco Suíço', symbol: 'CHF' },
  ];

  // Inicializar formulário com dados de edição
  useEffect(() => {
    if (editingTrip) {
      setFormData({
        name: editingTrip.name || '',
        destination: editingTrip.destination || '',
        description: editingTrip.description || '',
        startDate: editingTrip.startDate ? editingTrip.startDate.split('T')[0] : '',
        endDate: editingTrip.endDate ? editingTrip.endDate.split('T')[0] : '',
        budget: editingTrip.budget ? editingTrip.budget.toString() : '',
        currency: editingTrip.currency || 'BRL',
        status: editingTrip.status || 'planned',
        participants: editingTrip.participants || [],
      });
    } else {
      // Reset para nova viagem
      setFormData({
        name: '',
        destination: '',
        description: '',
        startDate: '',
        endDate: '',
        budget: '',
        currency: 'BRL',
        status: 'planned',
        participants: [],
      });
    }
  }, [editingTrip, open]);

  // Funções auxiliares
  const formatCurrency = (value: number, currencyCode: string = 'BRL'): string => {
    const currency = currencies.find(c => c.code === currencyCode);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(value);
  };

  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(',', '.')) || 0;
  };

  const calculateDuration = (): number => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const getDaysUntilTrip = (): number => {
    if (!formData.startDate) return 0;
    const today = new Date();
    const start = new Date(formData.startDate);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getAutoStatus = (): 'planned' | 'active' | 'completed' => {
    if (!formData.startDate || !formData.endDate) return 'planned';
    
    const today = new Date();
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    if (today < start) return 'planned';
    if (today >= start && today <= end) return 'active';
    return 'completed';
  };

  // Validar formulário
  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Nome da viagem é obrigatório';
    if (!formData.destination.trim()) return 'Destino é obrigatório';
    if (!formData.startDate) return 'Data de início é obrigatória';
    if (!formData.endDate) return 'Data de fim é obrigatória';
    if (!formData.budget || parseNumber(formData.budget) <= 0) return 'Orçamento deve ser maior que zero';
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) return 'Data de fim deve ser posterior à data de início';
    
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
      
      const tripData = {
        ...formData,
        budget: parseNumber(formData.budget),
        status: getAutoStatus(), // Status automático baseado nas datas
        participants: ['Você', ...formData.participants], // Sempre incluir "Você"
        id: editingTrip?.id || Date.now().toString(),
        spent: editingTrip?.spent || 0,
      };

      console.log('Dados da viagem:', tripData);
      
      toast.success(editingTrip ? 'Viagem atualizada!' : 'Viagem criada!');
      onSave?.();
      onOpenChange(false);
      
    } catch (error) {
      toast.error('Erro ao salvar viagem');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const duration = calculateDuration();
  const daysUntil = getDaysUntilTrip();
  const autoStatus = getAutoStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            {editingTrip ? 'Editar Viagem' : 'Nova Viagem'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Viagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome da Viagem */}
              <div>
                <Label htmlFor="name">Nome da Viagem *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Férias em Paris, Viagem de Negócios..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {/* Destino */}
              <div>
                <Label htmlFor="destination">Destino *</Label>
                <Input
                  id="destination"
                  placeholder="Ex: Paris, França"
                  value={formData.destination}
                  onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva sua viagem..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Datas e Duração */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Período da Viagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Data de Início */}
                <div>
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>

                {/* Data de Fim */}
                <div>
                  <Label htmlFor="endDate">Data de Fim *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Informações Calculadas */}
              {formData.startDate && formData.endDate && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Duração</span>
                    </div>
                    <div className="text-lg font-bold text-blue-900">
                      {duration} {duration === 1 ? 'dia' : 'dias'}
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Status</span>
                    </div>
                    <Badge 
                      className={
                        autoStatus === 'planned' ? 'bg-blue-100 text-blue-800' :
                        autoStatus === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {autoStatus === 'planned' ? 'Planejada' :
                       autoStatus === 'active' ? 'Em Andamento' :
                       'Concluída'}
                    </Badge>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-700">
                        {daysUntil > 0 ? 'Faltam' : daysUntil === 0 ? 'Hoje' : 'Passou'}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-yellow-900">
                      {daysUntil > 0 ? `${daysUntil} dias` :
                       daysUntil === 0 ? 'Hoje!' :
                       `${Math.abs(daysUntil)} dias atrás`}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orçamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Valor do Orçamento */}
                <div>
                  <Label htmlFor="budget">Orçamento Total *</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    required
                    className="text-right"
                  />
                </div>

                {/* Moeda */}
                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            {currency.symbol} {currency.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Estimativas */}
              {formData.budget && duration > 0 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium mb-2 text-green-800">Estimativas de Gasto</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Por dia:</span>
                      <span className="font-medium text-green-900">
                        {formatCurrency(parseNumber(formData.budget) / duration, formData.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Por pessoa/dia:</span>
                      <span className="font-medium text-green-900">
                        {formatCurrency(
                          parseNumber(formData.budget) / duration / (formData.participants.length + 1),
                          formData.currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participantes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Você (sempre incluído) */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-600 text-white font-bold">EU</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">Você</p>
                  <p className="text-xs text-gray-600">Organizador da viagem</p>
                </div>
                <Badge variant="default">Organizador</Badge>
              </div>

              {/* Membros da Família */}
              <div>
                <Label>Membros da Família</Label>
                <div className="space-y-2 mt-2">
                  {familyMembers.map(member => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        formData.participants.includes(member.id)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Checkbox
                        checked={formData.participants.includes(member.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({
                              ...prev,
                              participants: [...prev.participants, member.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              participants: prev.participants.filter(id => id !== member.id)
                            }));
                          }
                        }}
                      />
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-gray-600">{member.relationship}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo dos Participantes */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total de Participantes:</span>
                  <span className="font-bold text-lg">
                    {formData.participants.length + 1} {formData.participants.length === 0 ? 'pessoa' : 'pessoas'}
                  </span>
                </div>
              </div>

              {/* Aviso sobre Despesas Compartilhadas */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Importante:</p>
                  <p>
                    Os participantes selecionados aparecerão automaticamente nas opções de 
                    despesas compartilhadas desta viagem.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : editingTrip ? 'Atualizar Viagem' : 'Criar Viagem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}