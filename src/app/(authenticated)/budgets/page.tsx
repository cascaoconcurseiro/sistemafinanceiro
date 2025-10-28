'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BudgetIndicator } from '@/components/ui/budget-indicator';
import { useBudgetServices } from '@/hooks/use-budget-services';
import { Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'yearly';
  alertThreshold: number;
}

interface Category {
  id: string;
  name: string;
}

export default function BudgetsPage() {
  const { data: session } = useSession();
  console.log('Session:', session); // Para evitar warning
  const { getBudgetUsage, isLoading } = useBudgetServices();
  console.log('Loading:', isLoading); // Para evitar warning
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'yearly',
    alertThreshold: '80',
  });

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, []);

  const loadBudgets = async () => {
    try {
      const response = await fetch('/api/budgets');
      if (response.ok) {
        const data = await response.json();
        
        // Carregar uso de cada orçamento
        const budgetsWithUsage = await Promise.all(
          data.map(async (budget: any) => {
            const usage = await getBudgetUsage(budget.id, (new Date().getMonth() + 1).toString());
            return {
              ...budget,
              spent: (usage as any)?.spent || 0,
            };
          })
        );
        
        setBudgets(budgetsWithUsage);
      }
    } catch (error) {
      toast.error('Erro ao carregar orçamentos');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar categorias');
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: formData.categoryId,
          amount: parseFloat(formData.amount),
          period: formData.period,
          alertThreshold: parseInt(formData.alertThreshold),
          startDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('Orçamento criado com sucesso!');
        setIsDialogOpen(false);
        setFormData({
          categoryId: '',
          amount: '',
          period: 'monthly',
          alertThreshold: '80',
        });
        loadBudgets();
      } else {
        throw new Error('Erro ao criar orçamento');
      }
    } catch (error) {
      toast.error('Erro ao criar orçamento');
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Deseja realmente excluir este orçamento?')) return;

    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Orçamento excluído!');
        loadBudgets();
      }
    } catch (error) {
      toast.error('Erro ao excluir orçamento');
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgets.filter(b => (b.spent / b.amount) * 100 > 100).length;
  const warningCount = budgets.filter(b => {
    const percentage = (b.spent / b.amount) * 100;
    return percentage >= b.alertThreshold && percentage <= 100;
  }).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">
            Gerencie seus orçamentos por categoria
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Orçamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <Label>Categoria</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valor do Orçamento</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Período</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value: 'monthly' | 'yearly') =>
                    setFormData({ ...formData, period: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Alerta em (%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.alertThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, alertThreshold: e.target.value })
                  }
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Você será alertado ao atingir este percentual
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Criar Orçamento
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Orçamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalBudget.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Total Gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {totalSpent.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% do orçamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">
                {overBudgetCount}
              </div>
              <p className="text-sm text-muted-foreground">
                Acima do orçamento
              </p>
              {warningCount > 0 && (
                <p className="text-sm text-yellow-600">
                  {warningCount} próximos do limite
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {budgets.map((budget) => (
          <Card key={budget.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{budget.categoryName}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBudget(budget.id)}
                  >
                    Excluir
                  </Button>
                </div>
                <BudgetIndicator
                  spent={budget.spent}
                  budget={budget.amount}
                  categoryName={budget.categoryName}


                />
              </div>
            </CardContent>
          </Card>
        ))}

        {budgets.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum orçamento cadastrado. Crie seu primeiro orçamento!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
