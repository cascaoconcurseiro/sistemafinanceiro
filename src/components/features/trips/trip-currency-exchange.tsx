'use client';

import { useState, useEffect } from 'react';
import { databaseService } from '@/lib/services/database-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Calculator,
  Edit,
  Trash2,
  DollarSign,
} from 'lucide-react';
import type { Trip, CurrencyExchange } from '@/lib/storage';
import { toast } from 'sonner';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils/currency';

interface TripCurrencyExchangeProps {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

export function TripCurrencyExchange({
  trip,
  onUpdate,
}: TripCurrencyExchangeProps) {
  const [exchanges, setExchanges] = useState<CurrencyExchange[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExchange, setEditingExchange] =
    useState<CurrencyExchange | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amountBRL: '',
    amountForeign: '',
    exchangeRate: '',
    cet: '',
    location: '',
    notes: '',
  });

  // Dados agora vêm do banco de dados, não do localStorage
  useEffect(() => {
    loadExchanges();
  }, [trip.id]);

  const loadExchanges = async () => {
    try {
      const response = await fetch(`/api/currency-exchanges?tripId=${trip.id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar câmbios');
      }
      
      const tripExchanges = await response.json();
      setExchanges(tripExchanges);

      // Update trip's average exchange rate
      if (tripExchanges.length > 0) {
        const totalForeign = tripExchanges.reduce(
          (sum: number, ex: CurrencyExchange) => sum + ex.amountForeign,
          0
        );
        const totalBRL = tripExchanges.reduce(
          (sum: number, ex: CurrencyExchange) => sum + ex.amountBRL,
          0
        );
        const averageRate = totalBRL / totalForeign;

        if (trip.averageExchangeRate !== averageRate) {
          const updatedTrip = { ...trip, averageExchangeRate: averageRate };
          onUpdate(updatedTrip);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar câmbios:', error);
      toast.error('Erro ao carregar câmbios');
    }
  };

  const saveExchange = async () => {
    // Validação defensiva dos dados de entrada
    if (!formData.date?.trim()) {
      toast.error('Data é obrigatória');
      return;
    }

    if (!formData.amountBRL || Number.parseFloat(formData.amountBRL) <= 0) {
      toast.error('Valor em BRL deve ser maior que zero');
      return;
    }

    if (!formData.amountForeign || Number.parseFloat(formData.amountForeign) <= 0) {
      toast.error('Valor em moeda estrangeira deve ser maior que zero');
      return;
    }

    if (!formData.location?.trim()) {
      toast.error('Local é obrigatório');
      return;
    }

    // Guards defensivos para valores numéricos
    const amountBRL = Number.parseFloat(formData.amountBRL);
    const amountForeign = Number.parseFloat(formData.amountForeign);
    
    if (isNaN(amountBRL) || isNaN(amountForeign)) {
      toast.error('Valores devem ser números válidos');
      return;
    }

    if (amountBRL <= 0 || amountForeign <= 0) {
      toast.error('Valores devem ser positivos');
      return;
    }

    const exchangeRate = amountBRL / amountForeign;
    
    // Guard defensivo para taxa de câmbio
    if (!isFinite(exchangeRate) || exchangeRate <= 0) {
      toast.error('Taxa de câmbio inválida');
      return;
    }

    const exchange: CurrencyExchange = {
      id: editingExchange?.id || Date.now().toString(),
      tripId: trip.id,
      date: formData.date,
      amountBRL,
      amountForeign,
      exchangeRate,
      cet: 0, // Removido campo manual
      location: formData.location,
      notes: formData.notes || '', // Guard defensivo para notes
      createdAt: editingExchange?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const method = editingExchange ? 'PUT' : 'POST';
      const body = editingExchange 
        ? { ...exchange, id: editingExchange.id }
        : exchange;

      const response = await fetch('/api/currency-exchanges', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar câmbio');
      }

      await loadExchanges();
      resetForm();
      setShowAddModal(false);
      setEditingExchange(null);
      toast.success(
        editingExchange ? 'Câmbio atualizado!' : 'Câmbio adicionado!'
      );
    } catch (error) {
      console.error('Erro ao salvar câmbio:', error);
      toast.error('Erro ao salvar câmbio');
    }
  };

  const deleteExchange = async (id: string) => {
    if (!id?.trim()) {
      toast.error('ID do câmbio inválido');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este câmbio?')) return;

    try {
      const response = await fetch(`/api/currency-exchanges?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir câmbio');
      }

      await loadExchanges();
      toast.success('Câmbio excluído!');
    } catch (error) {
      console.error('Erro ao excluir câmbio:', error);
      toast.error('Erro ao excluir câmbio');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amountBRL: '',
      amountForeign: '',
      exchangeRate: '',
      cet: '',
      location: '',
      notes: '',
    });
    setEditingExchange(null);
  };

  const editExchange = (exchange: CurrencyExchange) => {
    setEditingExchange(exchange);
    setFormData({
      date: exchange.date,
      amountBRL: exchange.amountBRL.toString(),
      amountForeign: exchange.amountForeign.toString(),
      exchangeRate: exchange.exchangeRate.toString(),
      cet: exchange.cet.toString(),
      location: exchange.location || '',
      notes: exchange.notes || '',
    });
    setShowAddModal(true);
  };

  // Auto-calculate exchange rate when amounts change
  useEffect(() => {
    if (formData.amountBRL && formData.amountForeign) {
      const brl = parseFloat(formData.amountBRL);
      const foreign = parseFloat(formData.amountForeign);
      
      if (!isNaN(brl) && !isNaN(foreign) && foreign > 0) {
        const rate = brl / foreign;
        const rateStr = rate.toFixed(4);
        
        // Só atualizar se o valor mudou para evitar loop
        if (formData.exchangeRate !== rateStr) {
          setFormData((prev) => ({ ...prev, exchangeRate: rateStr }));
        }
      }
    }
  }, [formData.amountBRL, formData.amountForeign, formData.exchangeRate]);

  const getStats = () => {
    if (exchanges.length === 0) return null;

    const totalBRL = exchanges.reduce((sum, ex) => sum + ex.amountBRL, 0);
    const totalForeign = exchanges.reduce(
      (sum, ex) => sum + ex.amountForeign,
      0
    );
    const averageRate = totalBRL / totalForeign;
    const bestRate = Math.min(...exchanges.map((ex) => ex.exchangeRate));
    const worstRate = Math.max(...exchanges.map((ex) => ex.exchangeRate));

    return {
      totalBRL,
      totalForeign,
      averageRate,
      bestRate,
      worstRate,
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Controle de Câmbio</h3>
          <p className="text-muted-foreground">
            Registre suas compras de {trip.currency} e acompanhe a taxa média
          </p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setEditingExchange(null);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Câmbio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingExchange ? 'Editar' : 'Adicionar'} Câmbio
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    placeholder="Casa de câmbio, banco..."
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amountBRL">Valor pago (R$)</Label>
                  <Input
                    id="amountBRL"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.amountBRL}
                    onChange={(e) =>
                      setFormData({ ...formData, amountBRL: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amountForeign">
                    Valor recebido ({trip.currency})
                  </Label>
                  <Input
                    id="amountForeign"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.amountForeign}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amountForeign: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="exchangeRate">
                  Taxa de câmbio (calculada automaticamente)
                </Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.0001"
                  placeholder="Calculado automaticamente"
                  value={formData.exchangeRate}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fórmula: Valor pago (R$) ÷ Valor recebido ({trip.currency})
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Informações adicionais..."
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
                <Button onClick={saveExchange}>
                  {editingExchange ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Comprado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalForeign, trip.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalBRL, 'BRL')} investidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageRate.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                BRL por {trip.currency}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Melhor Taxa</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.bestRate.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Menor valor pago</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pior Taxa</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.worstRate.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Maior valor pago</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exchanges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Câmbio</CardTitle>
        </CardHeader>
        <CardContent>
          {exchanges.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Valor BRL</TableHead>
                  <TableHead>Valor {trip.currency}</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchanges.map((exchange) => (
                  <TableRow key={exchange.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(exchange.date).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {exchange.location || 'Não informado'}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(exchange.amountBRL, 'BRL')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(exchange.amountForeign, trip.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {Number(exchange.exchangeRate).toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editExchange(exchange)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteExchange(exchange.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum câmbio registrado ainda</p>
              <p className="text-sm">
                Adicione suas compras de moeda para acompanhar a taxa média
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
