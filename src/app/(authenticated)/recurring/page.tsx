'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Repeat, Pause, Play, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  occurrences?: number;
  isActive: boolean;
  lastGenerated?: string;
  nextGeneration: string;
  categoryName: string;
  accountName: string;
}

export default function RecurringTransactionsPage() {
  const { data: session } = useSession();
  console.log('Session:', session); // Para evitar warning
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringTransaction | null>(null);
  console.log('Selected recurring:', selectedRecurring); // Para evitar warning
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadRecurring();
  }, []);

  const loadRecurring = async () => {
    try {
      const response = await fetch('/api/transactions/recurring');
      if (response.ok) {
        const data = await response.json();
        setRecurring(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar transações recorrentes');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/transactions/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(isActive ? 'Recorrência pausada' : 'Recorrência ativada');
        loadRecurring();
      }
    } catch (error) {
      toast.error('Erro ao atualizar recorrência');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta recorrência? As transações já geradas não serão afetadas.')) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/recurring/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Recorrência excluída');
        loadRecurring();
      }
    } catch (error) {
      toast.error('Erro ao excluir recorrência');
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      daily: 'Diária',
      weekly: 'Semanal',
      monthly: 'Mensal',
      yearly: 'Anual',
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const activeRecurring = recurring.filter(r => r.isActive);
  const pausedRecurring = recurring.filter(r => !r.isActive);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transações Recorrentes</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas automáticas
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeRecurring.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receitas Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              R${' '}
              {activeRecurring
                .filter(r => r.type === 'income' && r.frequency === 'monthly')
                .reduce((sum, r) => sum + r.amount, 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Despesas Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              R${' '}
              {activeRecurring
                .filter(r => r.type === 'expense' && r.frequency === 'monthly')
                .reduce((sum, r) => sum + r.amount, 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Recorrências Ativas</h2>
        <div className="grid gap-4">
          {activeRecurring.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{item.description}</h3>
                      <Badge variant={item.type === 'income' ? 'default' : 'destructive'}>
                        {item.type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                      <Badge variant="outline">
                        <Repeat className="w-3 h-3 mr-1" />
                        {getFrequencyLabel(item.frequency)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p>Valor</p>
                        <p className={`text-lg font-semibold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {item.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p>Próxima Geração</p>
                        <p className="text-lg font-semibold">
                          {new Date(item.nextGeneration).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p>Categoria</p>
                        <p className="font-medium">{item.categoryName}</p>
                      </div>
                      <div>
                        <p>Conta</p>
                        <p className="font-medium">{item.accountName}</p>
                      </div>
                    </div>
                    {item.lastGenerated && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Última geração: {new Date(item.lastGenerated).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(item.id, item.isActive)}
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRecurring(item);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {activeRecurring.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Repeat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Nenhuma transação recorrente ativa.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Crie transações recorrentes ao adicionar uma nova transação e marcar a opção "Recorrente".
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {pausedRecurring.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Recorrências Pausadas</h2>
          <div className="grid gap-4">
            {pausedRecurring.map((item) => (
              <Card key={item.id} className="opacity-60">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{item.description}</h3>
                        <Badge variant="secondary">Pausada</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getFrequencyLabel(item.frequency)} • R$ {item.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(item.id, item.isActive)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Recorrência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Funcionalidade de edição em desenvolvimento.
              Por enquanto, você pode pausar ou excluir a recorrência.
            </p>
            <Button onClick={() => setIsDialogOpen(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
