'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Trip } from '@/types';
import { clientDatabaseService } from '@/lib/services/client-database-service';

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: 'before' | 'during' | 'after';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  dueDate?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
}

interface TripChecklistProps {
  trip: Trip;
}

export default function TripChecklist({ trip }: TripChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'before' as 'before' | 'during' | 'after',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    assignedTo: '',
    notes: '',
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadChecklist();
      initializeDefaultItems();
    }
  }, [trip.id, isMounted]);

  const loadChecklist = () => {
    if (typeof window === 'undefined') return;
    // TODO: Implementar carregamento do checklist via DatabaseService
    console.warn('Carregamento de checklist temporariamente desabilitado - use DatabaseService');
    setChecklist([]);
  };

  const saveChecklist = (items: ChecklistItem[]) => {
    // TODO: Implementar salvamento do checklist via DatabaseService
    console.warn('Salvamento de checklist temporariamente desabilitado - use DatabaseService');
    setChecklist(items);
  };

  const initializeDefaultItems = () => {
    if (typeof window === 'undefined') return;
    // TODO: Implementar verificação de checklist existente via DatabaseService
    console.warn('Inicialização de checklist padrão temporariamente desabilitada - use DatabaseService');
    // const existing = []; // localDataService.getStorageData(`trip-checklist-${trip.id}`);
    // if (!existing) {
      const defaultItems: ChecklistItem[] = [
        // Antes da viagem
        {
          id: '1',
          title: 'Verificar validade do passaporte',
          category: 'before',
          priority: 'high',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Solicitar visto (se necessário)',
          category: 'before',
          priority: 'high',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Reservar acomodação',
          category: 'before',
          priority: 'high',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          title: 'Comprar passagens aéreas',
          category: 'before',
          priority: 'high',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '5',
          title: 'Contratar seguro viagem',
          category: 'before',
          priority: 'medium',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '6',
          title: 'Fazer check-in online',
          category: 'before',
          priority: 'medium',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '7',
          title: 'Preparar documentos de viagem',
          category: 'before',
          priority: 'high',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '8',
          title: 'Fazer as malas',
          category: 'before',
          priority: 'medium',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        // Durante a viagem
        {
          id: '9',
          title: 'Fazer check-in no hotel',
          category: 'during',
          priority: 'high',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '10',
          title: 'Visitar principais atrações',
          category: 'during',
          priority: 'medium',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        // Após a viagem
        {
          id: '11',
          title: 'Organizar fotos e memórias',
          category: 'after',
          priority: 'low',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];

      setChecklist(defaultItems);
      saveChecklist(defaultItems);
    // }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'before':
        return 'Antes da Viagem';
      case 'during':
        return 'Durante a Viagem';
      case 'after':
        return 'Após a Viagem';
      default:
        return category;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    // Validar data se fornecida
    if (formData.dueDate && !isValidDate(formData.dueDate)) {
      toast.error('Data limite inválida. Use o formato dd/mm/aaaa');
      return;
    }

    const newItem: ChecklistItem = {
      id: editingItem?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description || undefined,
      category: formData.category,
      priority: formData.priority,
      completed: editingItem?.completed || false,
      dueDate: formData.dueDate || undefined,
      assignedTo: formData.assignedTo || undefined,
      notes: formData.notes || undefined,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };

    let updatedChecklist;
    if (editingItem) {
      updatedChecklist = checklist.map(item =>
        item.id === editingItem.id ? newItem : item
      );
    } else {
      updatedChecklist = [...checklist, newItem];
    }

    setChecklist(updatedChecklist);
    saveChecklist(updatedChecklist);

    toast.success(editingItem ? 'Item atualizado!' : 'Item adicionado!');

    // Reset form
    setFormData({
      title: '',
      description: '',
      category: 'before',
      priority: 'medium',
      dueDate: '',
      assignedTo: '',
      notes: '',
    });
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleToggleComplete = (id: string) => {
    const updatedChecklist = checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updatedChecklist);
    saveChecklist(updatedChecklist);
  };

  const handleEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category,
      priority: item.priority,
      dueDate: item.dueDate || '',
      assignedTo: item.assignedTo || '',
      notes: item.notes || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    const updatedChecklist = checklist.filter(item => item.id !== id);
    setChecklist(updatedChecklist);
    saveChecklist(updatedChecklist);
    toast.success('Item excluído!');
  };

  const isValidDate = (dateString: string) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(dateString);
  };

  const getStats = () => {
    const total = checklist.length;
    const completed = checklist.filter(item => item.completed).length;
    const pending = total - completed;

    return { total, completed, pending };
  };

  const stats = getStats();
  const groupedItems = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  if (!isMounted) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Checklist da Viagem</h2>
          <p className="text-muted-foreground">
            {stats.completed}/{stats.total} concluídos
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de itens agrupados por categoria */}
      <div className="space-y-6">
        {(['before', 'during', 'after'] as const).map(category => {
          const items = groupedItems[category] || [];
          if (items.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {getCategoryLabel(category)}
                  <Badge variant="outline">{items.length} itens</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        item.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-white dark:bg-gray-800'
                      }`}
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleToggleComplete(item.id)}
                        className="mt-1"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              item.completed ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-2 mt-2">
                              <Badge className={getPriorityColor(item.priority)}>
                                {item.priority === 'high' ? 'Alta' :
                                 item.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>

                              {item.dueDate && (
                                <Badge variant="outline">
                                  {item.dueDate}
                                </Badge>
                              )}

                              {item.assignedTo && (
                                <Badge variant="secondary">
                                  {item.assignedTo}
                                </Badge>
                              )}
                            </div>

                            {item.notes && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {item.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {checklist.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum item no checklist</h3>
            <p className="text-muted-foreground mb-4">
              Adicione itens para organizar sua viagem
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Item
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de adicionar/editar */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Item' : 'Adicionar Item'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Verificar passaporte"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes opcionais..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  >
                    <option value="before">Antes da Viagem</option>
                    <option value="during">Durante a Viagem</option>
                    <option value="after">Após a Viagem</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Data Limite</Label>
                  <Input
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    placeholder="dd/mm/aaaa"
                  />
                </div>

                <div>
                  <Label htmlFor="assignedTo">Responsável</Label>
                  <Input
                    id="assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    placeholder="Nome da pessoa"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Observações adicionais..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingItem ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
