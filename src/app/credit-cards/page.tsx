'use client';

import { useState, useEffect } from 'react';
import { ModernAppLayout } from '@/components/layout/modern-app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface CreditCard {
  id: string;
  name: string;
  limit: number;
  currentBalance: number;
  dueDay: number;
  closingDay: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  monthlySpent?: number;
  monthlyPayments?: number;
  nextDueDate?: string;
  transactionCount?: number;
  utilizationPercentage?: number;
}

interface CreditCardFormData {
  name: string;
  limit: string;
  dueDay: string;
  closingDay: string;
}

export default function CreditCardsPage() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [showBalances, setShowBalances] = useState(true);
  const [formData, setFormData] = useState<CreditCardFormData>({
    name: '',
    limit: '',
    dueDay: '',
    closingDay: ''
  });

  // Fetch credit cards
  const fetchCreditCards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/credit-cards', { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao buscar cartões');

      const result = await response.json();
      
      if (result.success) {
        setCreditCards(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
      toast.error('Erro ao carregar cartões de crédito');
    } finally {
      setLoading(false);
    }
  };

  // Create credit card
  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/credit-cards', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          limit: parseFloat(formData.limit),
          dueDay: parseInt(formData.dueDay),
          closingDay: parseInt(formData.closingDay)
        })
      });

      if (!response.ok) throw new Error('Erro ao criar cartão');

      const result = await response.json();
      if (result.success) {
        toast.success('Cartão criado com sucesso!');
        setIsCreateModalOpen(false);
        setFormData({ name: '', limit: '', dueDay: '', closingDay: '' });
        fetchCreditCards();
      }
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      toast.error('Erro ao criar cartão de crédito');
    }
  };

  // Update credit card
  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    try {
      const response = await fetch('/api/credit-cards', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCard.id,
          name: formData.name,
          limit: parseFloat(formData.limit),
          dueDay: parseInt(formData.dueDay),
          closingDay: parseInt(formData.closingDay)
        })
      });

      if (!response.ok) throw new Error('Erro ao atualizar cartão');

      const result = await response.json();
      if (result.success) {
        toast.success('Cartão atualizado com sucesso!');
        setIsEditModalOpen(false);
        setEditingCard(null);
        setFormData({ name: '', limit: '', dueDay: '', closingDay: '' });
        fetchCreditCards();
      }
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error);
      toast.error('Erro ao atualizar cartão de crédito');
    }
  };

  // Delete credit card
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return;

    try {
      const response = await fetch(`/api/credit-cards?id=${cardId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao excluir cartão');

      const result = await response.json();
      if (result.success) {
        toast.success(result.message || 'Cartão excluído com sucesso!');
        fetchCreditCards();
      }
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      toast.error('Erro ao excluir cartão de crédito');
    }
  };

  // Open edit modal
  const openEditModal = (card: CreditCard) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      limit: card.limit.toString(),
      dueDay: card.dueDay.toString(),
      closingDay: card.closingDay.toString()
    });
    setIsEditModalOpen(true);
  };

  // Calculate next due date
  const getNextDueDate = (dueDay: number) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let dueDate = new Date(currentYear, currentMonth, dueDay);

    if (dueDate <= today) {
      dueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }

    return dueDate.toLocaleDateString('pt-BR');
  };

  // Get utilization color
  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  useEffect(() => {
    fetchCreditCards();
  }, []);

  const totalLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
  const totalBalance = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
  const totalUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  return (
    <ModernAppLayout
      title="Cartões de Crédito"
      subtitle="Gerencie seus cartões e acompanhe limites"
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cartões</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditCards.length}</div>
              <p className="text-xs text-muted-foreground">
                {creditCards.filter(c => c.isActive).length} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Limite Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalances ? `R$ ${totalLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••••'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalances ? `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••••'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilização</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${getUtilizationColor(totalUtilization)}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getUtilizationColor(totalUtilization)}`}>
                {totalUtilization.toFixed(1)}%
              </div>
              <Progress value={totalUtilization} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={() => setShowBalances(!showBalances)} variant="outline" size="sm">
              {showBalances ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showBalances ? 'Ocultar Valores' : 'Mostrar Valores'}
            </Button>
            {/* Debug info */}
            {loading && (
              <Badge variant="secondary" className="text-xs">
                ⏳ Carregando...
              </Badge>
            )}
          </div>

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cartão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Cartão</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCard} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Cartão</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Cartão Principal"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="limit">Limite (R$)</Label>
                  <Input
                    id="limit"
                    type="number"
                    step="0.01"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                    placeholder="5000.00"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dueDay">Dia Vencimento</Label>
                    <Input
                      id="dueDay"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dueDay}
                      onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                      placeholder="15"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="closingDay">Dia Fechamento</Label>
                    <Input
                      id="closingDay"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.closingDay}
                      onChange={(e) => setFormData({ ...formData, closingDay: e.target.value })}
                      placeholder="10"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Cartão</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Credit Cards List */}
        {/* Temporariamente removido loading para debug */}
        {/* {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : */ }
        {creditCards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cartão encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comece criando seu primeiro cartão de crédito
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Cartão
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map((card) => (
              <Card key={card.id} className={`${!card.isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">{card.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(card)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Limite</span>
                      <span className="font-semibold">
                        {showBalances ? `R$ ${card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••••'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Saldo Atual</span>
                      <span className="font-semibold">
                        {showBalances ? `R$ ${card.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••••'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Utilização</span>
                      <span className={`font-semibold ${getUtilizationColor(card.utilizationPercentage || 0)}`}>
                        {(card.utilizationPercentage || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <Progress value={card.utilizationPercentage || 0} />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Vencimento</span>
                      <div className="font-medium">Dia {card.dueDay}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fechamento</span>
                      <div className="font-medium">Dia {card.closingDay}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <Badge variant={card.isActive ? "default" : "secondary"}>
                      {card.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {getNextDueDate(card.dueDay)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cartão</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateCard} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Cartão</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-limit">Limite (R$)</Label>
                <Input
                  id="edit-limit"
                  type="number"
                  step="0.01"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-dueDay">Dia Vencimento</Label>
                  <Input
                    id="edit-dueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDay}
                    onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-closingDay">Dia Fechamento</Label>
                  <Input
                    id="edit-closingDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.closingDay}
                    onChange={(e) => setFormData({ ...formData, closingDay: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ModernAppLayout>
  );
}
