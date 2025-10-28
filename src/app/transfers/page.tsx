'use client';

import { useState } from 'react';
import { ModernAppLayout } from '@/components/modern-app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnified } from '@/contexts/unified-financial-context';
import { ArrowRightLeft, Plus } from 'lucide-react';

export default function TransfersPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: ''
  });

  const { accounts, loading: isLoading } = useUnified();
  const transfers: any[] = []; // Transferências serão implementadas quando necessário

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromAccountId || !formData.toAccountId || !formData.amount || !formData.description) {
      return;
    }

    try {
      // Transferências serão implementadas via API quando necessário
      await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fromAccountId: formData.fromAccountId,
          toAccountId: formData.toAccountId,
          amount: parseFloat(formData.amount),
          description: formData.description
        })
      });
      
      setFormData({ fromAccountId: '', toAccountId: '', amount: '', description: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao criar transferência:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <ModernAppLayout
      title="Transferências"
      subtitle="Movimente dinheiro entre suas contas"
    >
      <div className="container mx-auto p-6 space-y-6">
        
        <div className="flex justify-between items-center">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transferência
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Nova Transferência</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromAccount">Conta Origem</Label>
                    <Select value={formData.fromAccountId} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, fromAccountId: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} - {formatCurrency(account.balance || 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="toAccount">Conta Destino</Label>
                    <Select value={formData.toAccountId} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, toAccountId: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts
                          .filter(account => account.id !== formData.fromAccountId)
                          .map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} - {formatCurrency(account.balance || 0)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    placeholder="Descrição da transferência"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    Criar Transferência
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transferências</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Carregando transferências...</p>
              </div>
            ) : transfers.length === 0 ? (
              <div className="text-center py-8">
                <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma transferência encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transfers.map((transfer) => (
                  <div key={transfer.transferId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{transfer.description}</h3>
                        <p className="text-sm text-gray-600">
                          {transfer.fromAccount.name} → {transfer.toAccount.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">
                        {formatCurrency(transfer.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(transfer.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernAppLayout>
  );
}