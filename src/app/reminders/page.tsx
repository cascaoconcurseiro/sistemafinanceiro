'use client';

import { useState } from 'react';
import { Plus, Calendar, Bell, CheckCircle2, Clock, AlertCircle, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReminders, useCreateReminder, useUpdateReminder, useDeleteReminder } from '@/hooks/queries/use-reminders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ModernAppLayout } from '@/components/modern-app-layout';

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);

  const { data: remindersData, isLoading } = useReminders(activeTab);
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const reminders = remindersData?.data || [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      dueDate: formData.get('dueDate') as string,
      category: formData.get('category') as string,
      priority: formData.get('priority') as string,
      recurring: formData.get('recurring') === 'true',
      frequency: formData.get('frequency') as string || undefined,
      amount: formData.get('amount') ? parseFloat(formData.get('amount') as string) : undefined,
    };

    if (editingReminder) {
      await updateReminder.mutateAsync({ ...data, id: editingReminder.id });
    } else {
      await createReminder.mutateAsync(data);
    }

    setIsDialogOpen(false);
    setEditingReminder(null);
  };

  const handleEdit = (reminder: any) => {
    setEditingReminder(reminder);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lembrete?')) {
      await deleteReminder.mutateAsync(id);
    }
  };

  const handleComplete = async (reminder: any) => {
    await updateReminder.mutateAsync({
      id: reminder.id,
      status: reminder.status === 'completed' ? 'pending' : 'completed'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bill': return '💳';
      case 'goal': return '🎯';
      case 'investment': return '📈';
      case 'subscription': return '🔄';
      default: return '📌';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'overdue': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const stats = {
    total: reminders.length,
    pending: reminders.filter((r: any) => r.status === 'pending').length,
    completed: reminders.filter((r: any) => r.status === 'completed').length,
    overdue: reminders.filter((r: any) => r.status === 'overdue').length,
  };

  return (
    <ModernAppLayout
      title="Lembretes"
      subtitle="Gerencie seus lembretes e notificações"
    >
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingReminder(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lembrete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingReminder ? 'Editar' : 'Novo'} Lembrete</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingReminder?.title}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingReminder?.description}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Data de Vencimento</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="datetime-local"
                    defaultValue={editingReminder?.dueDate ? format(new Date(editingReminder.dueDate), "yyyy-MM-dd'T'HH:mm") : ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Valor (opcional)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={editingReminder?.amount}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select name="category" defaultValue={editingReminder?.category || 'general'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="bill">Conta</SelectItem>
                      <SelectItem value="goal">Meta</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="subscription">Assinatura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select name="priority" defaultValue={editingReminder?.priority || 'medium'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurring">Recorrente</Label>
                  <Select name="recurring" defaultValue={editingReminder?.recurring ? 'true' : 'false'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Não</SelectItem>
                      <SelectItem value="true">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="frequency">Frequência</Label>
                  <Select name="frequency" defaultValue={editingReminder?.frequency || 'none'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingReminder ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="completed">Concluídos</TabsTrigger>
          <TabsTrigger value="overdue">Atrasados</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Carregando...</p>
              </CardContent>
            </Card>
          ) : reminders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Nenhum lembrete encontrado</p>
              </CardContent>
            </Card>
          ) : (
            reminders.map((reminder: any) => (
              <Card key={reminder.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(reminder.status)}
                        <span className="text-2xl">{getCategoryIcon(reminder.category)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{reminder.title}</h3>
                          <Badge variant={getPriorityColor(reminder.priority)}>
                            {reminder.priority === 'high' ? 'Alta' : reminder.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                          {reminder.recurring && (
                            <Badge variant="outline">
                              🔄 {reminder.frequency === 'daily' ? 'Diário' : 
                                  reminder.frequency === 'weekly' ? 'Semanal' : 
                                  reminder.frequency === 'monthly' ? 'Mensal' : 'Anual'}
                            </Badge>
                          )}
                        </div>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground mb-2">{reminder.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(reminder.dueDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </div>
                          {reminder.amount && (
                            <div className="font-semibold text-foreground">
                              R$ {Number(reminder.amount).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={reminder.status === 'completed' ? 'default' : 'outline'}
                        onClick={() => handleComplete(reminder)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(reminder)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(reminder.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
      </div>
    </ModernAppLayout>
  );
}
