'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTrips } from '@/contexts/unified-financial-context';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Plane, MapPin, Calendar, DollarSign, Users } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  convertBRDateToISO,
  convertISODateToBR,
  getCurrentDateBR,
} from '@/lib/utils/date-utils';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function TripModal({ isOpen, onClose, initialData }: TripModalProps) {
  const [loading, setLoading] = useState(false);
  const { create: createTrip, update: updateTrip } = useTrips();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    destination: initialData?.destination || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    budget: initialData?.budget || '',
    spent: initialData?.spent || '0',
    currency: initialData?.currency || 'BRL',
    travelers: initialData?.travelers || '1',
    status: initialData?.status || 'planejamento',
    notes: initialData?.notes || '',
    categories: initialData?.categories || {
      accommodation: '',
      transport: '',
      food: '',
      activities: '',
      shopping: '',
      other: '',
    },
  });
  
  const [days, setDays] = useState(1);
  
  // Forçar re-render quando o componente monta
  useEffect(() => {
    console.log('🔍 Componente TripModal montado, days inicial:', days);
    
    // Se não há dados iniciais, definir datas padrão brasileiras
    if (!initialData && !formData.startDate && !formData.endDate) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const formatBRDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };
      
      setFormData(prev => ({
        ...prev,
        startDate: formatBRDate(today),
        endDate: formatBRDate(tomorrow)
      }));
    }
  }, []);

  // useEffect para atualizar dias quando datas mudarem - SEMPRE ATIVO
  useEffect(() => {
    console.log('🔍 Calculando dias - Start:', formData.startDate, 'End:', formData.endDate);
    
    // Se ambas as datas estão completas (10 caracteres)
    if (formData.startDate && formData.endDate && formData.startDate.length === 10 && formData.endDate.length === 10) {
      try {
        const [d1, m1, y1] = formData.startDate.split('/');
        const [d2, m2, y2] = formData.endDate.split('/');
        
        // Validar se as partes da data são válidas
        if (!d1 || !m1 || !y1 || !d2 || !m2 || !y2) {
          console.log('🔍 Partes da data inválidas');
          setDays(1);
          return;
        }
        
        const start = new Date(parseInt(y1), parseInt(m1) - 1, parseInt(d1));
        const end = new Date(parseInt(y2), parseInt(m2) - 1, parseInt(d2));
        
        console.log('🔍 Datas convertidas - Start:', start, 'End:', end);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          const calculatedDays = diffDays > 0 ? diffDays : 1;
          console.log('🔍 Dias calculados:', calculatedDays);
          setDays(calculatedDays);
        } else {
          console.log('🔍 Datas inválidas');
          setDays(1);
        }
      } catch (error) {
        console.log('❌ Erro ao calcular dias:', error);
        setDays(1);
      }
    } else {
      // Se as datas não estão completas, manter 1 dia como padrão
      console.log('🔍 Datas incompletas, mantendo 1 dia');
      setDays(1);
    }
  }, [formData.startDate, formData.endDate]);

  const statuses = [
    { value: 'planejamento', label: 'Planejamento', color: 'text-blue-600' },
    { value: 'andamento', label: 'Em Andamento', color: 'text-green-600' },
    { value: 'finalizada', label: 'Finalizada', color: 'text-gray-600' },
    { value: 'cancelada', label: 'Cancelada', color: 'text-red-600' },
  ];

  // Cálculo do orçamento diário
  const dailyBudget = useMemo(() => {
    const budget = parseFloat(formData.budget) || 0;
    return budget > 0 && days > 0 ? budget / days : 0;
  }, [formData.budget, days]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações básicas
      if (!formData.name.trim()) {
        toast.error('Nome da viagem é obrigatório');
        setLoading(false);
        return;
      }
      
      if (!formData.destination.trim()) {
        toast.error('Destino é obrigatório');
        setLoading(false);
        return;
      }
      
      // Validação básica - permitir criação mesmo com datas vazias
      console.log('🔍 Validando dados:', {
        name: formData.name,
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      
      // Usar sempre datas padrão para simplificar
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let startISO = today.toISOString().split('T')[0];
      let endISO = tomorrow.toISOString().split('T')[0];
      
      // Se as datas estão preenchidas e válidas, usar elas
      if (formData.startDate && formData.endDate && 
          formData.startDate.length === 10 && formData.endDate.length === 10) {
        try {
          const [d1, m1, y1] = formData.startDate.split('/');
          const [d2, m2, y2] = formData.endDate.split('/');
          
          const startDate = new Date(parseInt(y1), parseInt(m1) - 1, parseInt(d1));
          const endDate = new Date(parseInt(y2), parseInt(m2) - 1, parseInt(d2));
          
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
            startISO = `${y1}-${m1.padStart(2,'0')}-${d1.padStart(2,'0')}`;
            endISO = `${y2}-${m2.padStart(2,'0')}-${d2.padStart(2,'0')}`;
            console.log('✅ Usando datas do formulário');
          } else {
            console.log('⚠️ Datas inválidas, usando padrão');
          }
        } catch (error) {
          console.log('⚠️ Erro ao processar datas, usando padrão');
        }
      } else {
        console.log('⚠️ Datas incompletas, usando padrão');
      }
      

      // Preparar dados da viagem
      const tripData = {
        name: formData.name,
        destination: formData.destination,
        startDate: startISO,
        endDate: endISO,
        budget: parseFloat(formData.budget) || 0,
        spent: parseFloat(formData.spent) || 0,
        currency: formData.currency,
        participants: Array(parseInt(formData.travelers) || 1).fill(""), // Criando array com o número correto de elementos
        status: 'planned', // Sempre usar 'planned' para novas viagens
        description: formData.notes,
      };

      // Debug: Log dos dados da viagem
      console.log('🔍 Dados da viagem a serem enviados:', tripData);
      
      // Salvar viagem usando o contexto unificado
      if (initialData?.id) {
        console.log('🔍 Atualizando viagem existente:', initialData.id);
        await updateTrip(initialData.id, tripData);
        toast.success('Viagem atualizada com sucesso!');
      } else {
        console.log('🔍 Criando nova viagem');
        const result = await createTrip(tripData);
        console.log('✅ Viagem criada:', result);
        toast.success('Viagem criada com sucesso!');
      }

      onClose();
      setFormData({
        name: '',
        destination: '',
        startDate: '',
        endDate: '',
        budget: '',
        spent: '0',
        currency: 'BRL',
        travelers: '1',
        status: 'planejamento',
        notes: '',
        categories: {
          accommodation: '',
          transport: '',
          food: '',
          activities: '',
          shopping: '',
          other: '',
        },
      });
      // Removendo a chamada para onSave que não está definida nas props
    } catch (error) {
      console.error('Erro ao criar viagem:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBudgetUsed = () => {
    const budget = parseFloat(formData.budget) || 0;
    const spent = parseFloat(formData.spent) || 0;
    return budget > 0 ? (spent / budget) * 100 : 0;
  };

  const budgetUsed = calculateBudgetUsed();
  // dailyBudget já está definido acima com useMemo

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            Nova Viagem
          </DialogTitle>
          <DialogDescription>
            Planeje uma nova viagem e controle seus gastos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome da Viagem */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Viagem</Label>
            <Input
              id="name"
              placeholder="Ex: Férias em Paris, Viagem de Negócios SP"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          {/* Destino */}
          <div className="space-y-2">
            <Label htmlFor="destination">Destino</Label>
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

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início (DD/MM/AAAA)</Label>
              <Input
                id="startDate"
                type="text"
                placeholder="18/10/2025"
                value={formData.startDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) value = value.slice(0,2) + '/' + value.slice(2);
                  if (value.length >= 5) value = value.slice(0,5) + '/' + value.slice(5,9);
                  if (value.length > 10) value = value.slice(0, 10);
                  setFormData(prev => ({ ...prev, startDate: value }));
                }}
                maxLength={10}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Fim (DD/MM/AAAA)</Label>
              <Input
                id="endDate"
                type="text"
                placeholder="23/10/2025"
                value={formData.endDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) value = value.slice(0,2) + '/' + value.slice(2);
                  if (value.length >= 5) value = value.slice(0,5) + '/' + value.slice(5,9);
                  if (value.length > 10) value = value.slice(0, 10);
                  setFormData(prev => ({ ...prev, endDate: value }));
                }}
                maxLength={10}
                required
              />
            </div>
          </div>

          {/* Informações da Viagem - SEMPRE VISÍVEL */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Duração da Viagem</p>
                  <p className="text-2xl font-bold text-blue-900">{days} {days === 1 ? 'dia' : 'dias'}</p>
                  {formData.startDate.length === 10 && formData.endDate.length === 10 ? (
                    <p className="text-xs text-blue-600">
                      {formData.startDate} até {formData.endDate}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Preencha as datas para calcular automaticamente
                    </p>
                  )}
                  {/* Debug: Mostrar valores atuais */}
                  <p className="text-xs text-gray-400 mt-1">
                    Debug: Start="{formData.startDate}" End="{formData.endDate}" Days={days}
                  </p>
                </div>
              </div>
              {dailyBudget > 0 && (
                <div className="text-right">
                  <p className="text-xs text-blue-600 font-medium">Orçamento Diário</p>
                  <p className="text-xl font-bold text-blue-900">R$ {dailyBudget.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Moeda da Viagem */}
          <div className="space-y-2">
            <Label htmlFor="currency">Moeda da Viagem</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) =>
                setFormData({ ...formData, currency: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a moeda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">🇧🇷 Real (BRL)</SelectItem>
                <SelectItem value="USD">🇺🇸 Dólar (USD)</SelectItem>
                <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
                <SelectItem value="GBP">🇬🇧 Libra (GBP)</SelectItem>
                <SelectItem value="JPY">🇯🇵 Iene (JPY)</SelectItem>
                <SelectItem value="CAD">🇨🇦 Dólar Canadense (CAD)</SelectItem>
                <SelectItem value="AUD">🇦🇺 Dólar Australiano (AUD)</SelectItem>
                <SelectItem value="CHF">🇨🇭 Franco Suíço (CHF)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orçamento e Gastos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">
                Orçamento Total ({formData.currency})
              </Label>
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
            <div className="space-y-2">
              <Label htmlFor="spent">Gasto Atual ({formData.currency})</Label>
              <Input
                id="spent"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.spent}
                onChange={(e) =>
                  setFormData({ ...formData, spent: e.target.value })
                }
              />
            </div>
          </div>

          {/* Progresso do Orçamento */}
          {formData.budget && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Orçamento Usado</span>
                <span
                  className={`font-medium ${budgetUsed > 100 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {budgetUsed.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(budgetUsed, 100)} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>R$ {parseFloat(formData.spent || '0').toFixed(2)}</span>
                <span>R$ {parseFloat(formData.budget || '0').toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Número de Viajantes */}
          <div className="space-y-2">
            <Label htmlFor="travelers">Número de Viajantes</Label>
            <Input
              id="travelers"
              type="number"
              min="1"
              value={formData.travelers}
              onChange={(e) =>
                setFormData({ ...formData, travelers: e.target.value })
              }
              required
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status da Viagem</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <span className={status.color}>{status.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orçamento por Categoria */}
          <div className="space-y-3">
            <Label>Orçamento por Categoria (opcional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="accommodation" className="text-xs">
                  Hospedagem
                </Label>
                <Input
                  id="accommodation"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.categories.accommodation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categories: {
                        ...formData.categories,
                        accommodation: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="transport" className="text-xs">
                  Transporte
                </Label>
                <Input
                  id="transport"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.categories.transport}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categories: {
                        ...formData.categories,
                        transport: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="food" className="text-xs">
                  Alimentação
                </Label>
                <Input
                  id="food"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.categories.food}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categories: {
                        ...formData.categories,
                        food: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="activities" className="text-xs">
                  Atividades
                </Label>
                <Input
                  id="activities"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.categories.activities}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categories: {
                        ...formData.categories,
                        activities: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Roteiro, lembretes, informações importantes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Viagem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


