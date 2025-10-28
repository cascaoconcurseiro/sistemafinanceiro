'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';

interface SimpleTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleTripModal({ isOpen, onClose }: SimpleTripModalProps) {
  const { actions } = useUnifiedFinancial();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
  });

  // Calcular dias automaticamente
  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      try {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return diffDays > 0 ? diffDays : 1;
        }
      } catch (error) {
        console.log('Erro ao calcular dias:', error);
      }
    }
    return 1;
  };

  const days = calculateDays();

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 [SimpleTripModal] handleSubmit iniciado');
    e.preventDefault();
    console.log('✅ [SimpleTripModal] preventDefault executado');
    setLoading(true);

    try {
      console.log('📝 [SimpleTripModal] Validando dados:', formData);
      
      if (!formData.name.trim()) {
        console.log('❌ [SimpleTripModal] Nome vazio');
        toast.error('Nome da viagem é obrigatório');
        setLoading(false);
        return;
      }

      if (!formData.destination.trim()) {
        console.log('❌ [SimpleTripModal] Destino vazio');
        toast.error('Destino é obrigatório');
        setLoading(false);
        return;
      }
      
      console.log('✅ [SimpleTripModal] Validação passou');

      // Usar datas padrão se não preenchidas
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tripData = {
        name: formData.name,
        destination: formData.destination,
        startDate: formData.startDate || today.toISOString().split('T')[0],
        endDate: formData.endDate || tomorrow.toISOString().split('T')[0],
        budget: parseFloat(formData.budget) || 0,
        spent: 0,
        currency: 'BRL',
        status: 'planned',
        description: '',
        participants: [''],
      };

      console.log('🔍 [SimpleTripModal] Criando viagem simples:', tripData);
      console.log('📞 [SimpleTripModal] Chamando actions.createTrip...');
      
      await actions.createTrip(tripData);
      
      console.log('✅ [SimpleTripModal] Viagem criada com sucesso!');
      toast.success('Viagem criada com sucesso!');
      
      // Limpar formulário
      setFormData({
        name: '',
        destination: '',
        startDate: '',
        endDate: '',
        budget: '',
      });
      
      onClose();
      // Não precisa de refresh manual - contexto faz automaticamente!
    } catch (error) {
      console.error('Erro ao criar viagem:', error);
      toast.error('Erro ao criar viagem: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Viagem</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Viagem *</Label>
            <Input
              id="name"
              placeholder="Ex: Férias em Paris"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destino *</Label>
            <Input
              id="destination"
              placeholder="Ex: Paris, França"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Mostrar duração calculada */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Duração:</strong> {days} {days === 1 ? 'dia' : 'dias'}
            </p>
            {formData.startDate && formData.endDate && (
              <p className="text-xs text-blue-600 mt-1">
                De {new Date(formData.startDate).toLocaleDateString('pt-BR')} até {new Date(formData.endDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Orçamento (R$)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar Viagem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}