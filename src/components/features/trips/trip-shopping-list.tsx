'use client';

import { useState, useEffect } from 'react';
import { clientDatabaseService } from '@/lib/services/client-database-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  ShoppingCart,
  Check,
  X,
  Edit,
  Trash2,
  Package,
  Tag,
} from 'lucide-react';
import type { Trip } from '@/lib/config/storage';
import { toast } from 'sonner';

interface ShoppingItem {
  id: string;
  tripId: string;
  name: string;
  category: string;
  quantity: number;
  estimatedPrice: number;
  actualPrice?: number;
  isPurchased: boolean;
  notes?: string;
  purchaseDate?: string;
  purchaseLocation?: string;
  createdAt: string;
  updatedAt: string;
}

interface TripShoppingListProps {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

const SHOPPING_CATEGORIES = [
  'Roupas',
  'Eletrônicos',
  'Souvenirs',
  'Medicamentos',
  'Cosméticos',
  'Acessórios',
  'Livros',
  'Comida',
  'Bebidas',
  'Outros',
];

export function TripShoppingList({ trip, onUpdate }: TripShoppingListProps) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '1',
    estimatedPrice: '',
    notes: '',
  });
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchasingItem, setPurchasingItem] = useState<ShoppingItem | null>(null);
  const [purchaseData, setPurchaseData] = useState({
    actualPrice: '',
    purchaseLocation: '',
  });

  const loadShoppingList = async () => {
    try {
            const response = await fetch(`/api/shopping-items?tripId=${trip.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
                setItems(data);
      } else {
        console.error('❌ [ShoppingList] Erro ao carregar:', response.statusText);
        setItems([]);
      }
    } catch (error) {
      console.error('❌ [ShoppingList] Erro ao carregar lista de compras:', error);
      setItems([]);
    }
  };

  useEffect(() => {
    loadShoppingList();
  }, [trip.id]);

  const saveItem = async () => {
    if (!formData.name || !formData.category) {
      toast.error('Preencha nome e categoria');
      return;
    }

    const itemData = {
      tripId: trip.id,
      name: formData.name,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 1,
      estimatedPrice: parseFloat(formData.estimatedPrice) || 0,
      notes: formData.notes || null,
    };

    try {
      const url = editingItem
        ? '/api/shopping-items'
        : '/api/shopping-items';

      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { ...itemData, id: editingItem.id }
        : itemData;

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await loadShoppingList();
        resetForm();
        setShowAddModal(false);
        setEditingItem(null);
        toast.success(editingItem ? 'Item atualizado!' : 'Item adicionado!');
      } else {
        throw new Error('Erro ao salvar item');
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast.error('Erro ao salvar item');
    }
  };

  const togglePurchased = async (item: ShoppingItem) => {
    // Se está marcando como comprado, abrir dialog para informar valor
    if (!item.isPurchased) {
      setPurchasingItem(item);
      setPurchaseData({
        actualPrice: item.estimatedPrice.toString(),
        purchaseLocation: '',
      });
      setShowPurchaseDialog(true);
      return;
    }

    // Se está desmarcando, apenas atualizar
    try {
      const response = await fetch('/api/shopping-items', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          isPurchased: false,
          purchaseDate: null,
          actualPrice: null,
          purchaseLocation: null,
        }),
      });

      if (response.ok) {
        await loadShoppingList();
        toast.success('Item desmarcado');
      } else {
        throw new Error('Erro ao atualizar item');
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  const confirmPurchase = async () => {
    if (!purchasingItem) return;

    try {
      const response = await fetch('/api/shopping-items', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: purchasingItem.id,
          isPurchased: true,
          purchaseDate: new Date().toISOString(),
          actualPrice: parseFloat(purchaseData.actualPrice) || purchasingItem.estimatedPrice,
          purchaseLocation: purchaseData.purchaseLocation || null,
        }),
      });

      if (response.ok) {
        await loadShoppingList();
        setShowPurchaseDialog(false);
        setPurchasingItem(null);
        toast.success('Item marcado como comprado!');
      } else {
        throw new Error('Erro ao atualizar item');
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const response = await fetch(`/api/shopping-items?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await loadShoppingList();
        toast.success('Item excluído!');
      } else {
        throw new Error('Erro ao excluir item');
      }
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      toast.error('Erro ao excluir item');
    }
  };

  const editItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      estimatedPrice: item.estimatedPrice.toString(),
      notes: item.notes || '',
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: '1',
      estimatedPrice: '',
      notes: '',
    });
  };

  const getFilteredItems = () => {
    return items.filter((item) => {
      const categoryMatch =
        filterCategory === 'all' || item.category === filterCategory;
      const statusMatch =
        filterStatus === 'all' ||
        (filterStatus === 'purchased' && item.isPurchased) ||
        (filterStatus === 'pending' && !item.isPurchased);

      return categoryMatch && statusMatch;
    });
  };

  const getStats = () => {
    const total = items.length;
    const purchased = items.filter((item) => item.isPurchased).length;
    const pending = total - purchased;
    const totalEstimated = items.reduce(
      (sum, item) => sum + (Number(item.estimatedPrice) || 0),
      0
    );
    const totalSpent = items.reduce(
      (sum, item) => sum + (Number(item.actualPrice) || 0),
      0
    );

    return {
      total,
      purchased,
      pending,
      totalEstimated: Number(totalEstimated) || 0,
      totalSpent: Number(totalSpent) || 0,
      completionPercent: total > 0 ? Math.round((purchased / total) * 100) : 0,
    };
  };

  const filteredItems = getFilteredItems();
  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Lista de Compras</h3>
          <p className="text-muted-foreground">
            Organize o que você quer comprar em {trip.destination}
          </p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setEditingItem(null);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar' : 'Adicionar'} Item
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Item</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Camiseta, Tênis..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHOPPING_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedPrice">
                    Preço Estimado ({trip.currency})
                  </Label>
                  <Input
                    id="estimatedPrice"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.estimatedPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedPrice: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Cor, tamanho, marca..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={saveItem}>
                  {editingItem ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Aviso Informativo */}
      <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Como funciona:</p>
          <p>
            Ao marcar um item como comprado (✓), você poderá informar o <strong>valor real pago</strong> e
            o local da compra. Isso permite comparar o valor estimado com o real e acompanhar seus gastos.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Itens
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.purchased} comprados, {stats.pending} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionPercent}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.purchased} de {stats.total} itens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalEstimated.toFixed(2)} {trip.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimado para compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Real</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSpent.toFixed(2)} {trip.currency}
            </div>
            <p className="text-xs text-muted-foreground">Valor já gasto</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {SHOPPING_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os itens</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="purchased">Comprados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shopping List */}
      <Card>
        <CardHeader>
          <CardTitle>Itens para Comprar</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg ${
                    item.isPurchased
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <Checkbox
                    checked={item.isPurchased}
                    onCheckedChange={() => togglePurchased(item)}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-medium ${item.isPurchased ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {item.name}
                      </h4>
                      <Badge variant="secondary">{item.category}</Badge>
                      {item.quantity > 1 && (
                        <Badge variant="outline">x{item.quantity}</Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground mt-1">
                      {item.isPurchased && item.actualPrice ? (
                        <>
                          <span className="font-medium text-green-600">
                            Pago: {Number(item.actualPrice).toFixed(2)} {trip.currency}
                          </span>
                          {item.actualPrice !== item.estimatedPrice && (
                            <span className="ml-2">
                              (Estimado: {Number(item.estimatedPrice || 0).toFixed(2)} {trip.currency})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          Preço estimado: {Number(item.estimatedPrice || 0).toFixed(2)}{' '}
                          {trip.currency}
                        </>
                      )}
                      {item.notes && ` • ${item.notes}`}
                    </div>

                    {item.isPurchased && item.purchaseDate && (
                      <div className="text-xs text-green-600 mt-1">
                        Comprado em{' '}
                        {new Date(item.purchaseDate).toLocaleDateString('pt-BR')}
                        {item.purchaseLocation && ` • ${item.purchaseLocation}`}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editItem(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum item na lista ainda</p>
              <p className="text-sm">
                Adicione itens que você quer comprar na viagem
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Compra */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Item: <strong>{purchasingItem?.name}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Preço estimado: {Number(purchasingItem?.estimatedPrice || 0).toFixed(2)} {trip.currency}
              </p>
            </div>

            <div>
              <Label htmlFor="actualPrice">Valor Real Pago *</Label>
              <Input
                id="actualPrice"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={purchaseData.actualPrice}
                onChange={(e) =>
                  setPurchaseData({ ...purchaseData, actualPrice: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="purchaseLocation">Local da Compra (opcional)</Label>
              <Input
                id="purchaseLocation"
                placeholder="Ex: Loja X, Shopping Y..."
                value={purchaseData.purchaseLocation}
                onChange={(e) =>
                  setPurchaseData({ ...purchaseData, purchaseLocation: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPurchaseDialog(false);
                  setPurchasingItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={confirmPurchase}>
                <Check className="w-4 h-4 mr-2" />
                Confirmar Compra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
