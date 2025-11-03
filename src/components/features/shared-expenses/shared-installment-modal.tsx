'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Users, CreditCard, Plane, Calculator, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { sharedInstallmentManager } from '@/lib/shared-installment-manager';

interface SharedInstallmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export function SharedInstallmentModal({
  open,
  onOpenChange,
  onSave
}: SharedInstallmentModalProps) {
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    installments: 2,
    participants: [] as Array<{ id: string; name: string; percentage: number }>,
    paidBy: '',
    linkToTrip: false,
    tripId: '',
    account: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([]);
  const [trips, setTrips] = useState<Array<{ id: string; name: string; destination: string }>>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar dados necessários
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      // Carregar contatos
      const contactsResponse = await fetch('/api/family', { credentials: 'include' });
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setContacts(contactsData);
      }

      // Carregar viagens ativas
      const tripsResponse = await fetch('/api/trips?status=active', { credentials: 'include' });
      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json();
        setTrips(tripsData.data?.trips || []);
      }

      // Carregar contas
      const accountsResponse = await fetch('/api/accounts', { credentials: 'include' });
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        setAccounts(accountsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const addParticipant = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const isAlreadyAdded = formData.participants.some(p => p.id === contactId);
    if (isAlreadyAdded) return;

    const totalParticipants = formData.participants.length + 2; // +1 para o novo, +1 para o usuário
    const equalPercentage = Math.floor(100 / totalParticipants);
    const remainder = 100 - (equalPercentage * totalParticipants);

    // Redistribuir percentuais igualmente
    const updatedParticipants = [
      ...formData.participants.map(p => ({ ...p, percentage: equalPercentage })),
      { id: contactId, name: contact.name, percentage: equalPercentage + remainder }
    ];

    setFormData(prev => ({
      ...prev,
      participants: updatedParticipants
    }));
  };

  const removeParticipant = (contactId: string) => {
    const updatedParticipants = formData.participants.filter(p => p.id !== contactId);

    // Redistribuir percentuais
    if (updatedParticipants.length > 0) {
      const totalParticipants = updatedParticipants.length + 1; // +1 para o usuário
      const equalPercentage = Math.floor(100 / totalParticipants);
      const remainder = 100 - (equalPercentage * totalParticipants);

      updatedParticipants.forEach((p, index) => {
        p.percentage = equalPercentage + (index === 0 ? remainder : 0);
      });
    }

    setFormData(prev => ({
      ...prev,
      participants: updatedParticipants
    }));
  };

  const updateParticipantPercentage = (contactId: string, percentage: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.id === contactId ? { ...p, percentage } : p
      )
    }));
  };

  const getTotalPercentage = () => {
    const participantsTotal = formData.participants.reduce((sum, p) => sum + p.percentage, 0);
    const userPercentage = 100 - participantsTotal;
    return { participantsTotal, userPercentage, total: participantsTotal + userPercentage };
  };

  const getInstallmentPreview = () => {
    if (!formData.totalAmount || formData.installments < 2) return null;

    const totalAmount = parseFloat(formData.totalAmount);
    const installmentAmount = totalAmount / formData.installments;
    const { userPercentage } = getTotalPercentage();
    const userAmountPerInstallment = (installmentAmount * userPercentage) / 100;

    return {
      totalAmount,
      installmentAmount,
      userAmountPerInstallment,
      userTotalAmount: userAmountPerInstallment * formData.installments
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações
      if (!formData.description || !formData.totalAmount || !formData.account) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      if (formData.participants.length === 0) {
        toast.error('Adicione pelo menos um participante');
        return;
      }

      const { total } = getTotalPercentage();
      if (Math.abs(total - 100) > 0.01) {
        toast.error(`A soma dos percentuais deve ser 100%. Atual: ${total.toFixed(1)}%`);
        return;
      }

      if (!formData.paidBy) {
        toast.error('Selecione quem pagou a despesa');
        return;
      }

      // Preparar dados para o sistema
      const { userPercentage } = getTotalPercentage();
      const allParticipants = [
        { id: 'current-user', name: 'Você', percentage: userPercentage },
        ...formData.participants
      ];

      const config = {
        transactionId: `temp_${Date.now()}`,
        totalAmount: parseFloat(formData.totalAmount),
        installments: formData.installments,
        participants: allParticipants,
        tripId: formData.linkToTrip ? formData.tripId : undefined,
        paidBy: formData.paidBy,
        startDate: new Date(formData.startDate)
      };

      // Criar parcelamento compartilhado
      const result = await sharedInstallmentManager.createSharedInstallment(config);

      toast.success(`Parcelamento compartilhado criado com sucesso! ${result.debts.length} dívidas geradas.`);

      // Notificar sobre integração com viagem
      if (formData.linkToTrip && formData.tripId) {
        const trip = trips.find(t => t.id === formData.tripId);
        toast.info(`Parcelamento vinculado à viagem: ${trip?.name}`);
      }

      onSave?.();
      onOpenChange(false);
      resetForm();

    } catch (error) {
      console.error('Erro ao criar parcelamento compartilhado:', error);
      toast.error('Erro ao criar parcelamento compartilhado');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      totalAmount: '',
      installments: 2,
      participants: [],
      paidBy: '',
      linkToTrip: false,
      tripId: '',
      account: '',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const preview = getInstallmentPreview();
  const { userPercentage, total } = getTotalPercentage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Novo Parcelamento Compartilhado
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Despesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  placeholder="Ex: Jantar no restaurante, Compra do supermercado..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalAmount">Valor Total *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="installments">Parcelas *</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="2"
                    max="60"
                    value={formData.installments}
                    onChange={(e) => setFormData(prev => ({ ...prev, installments: parseInt(e.target.value) || 2 }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Data Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="account">Pago com *</Label>
                <Select
                  value={formData.account}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, account: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Participantes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Participantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Adicionar Participantes</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {contacts.map(contact => (
                    <Button
                      key={contact.id}
                      type="button"
                      variant={formData.participants.some(p => p.id === contact.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (formData.participants.some(p => p.id === contact.id)) {
                          removeParticipant(contact.id);
                        } else {
                          addParticipant(contact.id);
                        }
                      }}
                    >
                      {contact.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Lista de Participantes */}
              {formData.participants.length > 0 && (
                <div className="space-y-3">
                  <Label>Divisão dos Custos</Label>

                  {/* Usuário */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Você</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{userPercentage.toFixed(1)}%</span>
                      <Badge variant="secondary">
                        R$ {preview ? (preview.userAmountPerInstallment * formData.installments).toFixed(2) : '0,00'}
                      </Badge>
                    </div>
                  </div>

                  {/* Participantes */}
                  {formData.participants.map(participant => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{participant.name}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={participant.percentage}
                          onChange={(e) => updateParticipantPercentage(participant.id, parseFloat(e.target.value) || 0)}
                          className="w-20 text-center"
                        />
                        <span className="text-sm text-gray-600">%</span>
                        <Badge variant="outline">
                          R$ {preview ? ((preview.installmentAmount * participant.percentage / 100) * formData.installments).toFixed(2) : '0,00'}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Total:</span>
                    <Badge variant={Math.abs(total - 100) < 0.01 ? "default" : "destructive"}>
                      {total.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quem Pagou */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Quem Pagou?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.paidBy}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paidBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione quem pagou..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-user">Você</SelectItem>
                  {formData.participants.map(participant => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Integração com Viagem */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Vincular à Viagem
                </div>
                <Switch
                  checked={formData.linkToTrip}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, linkToTrip: checked }))}
                />
              </CardTitle>
            </CardHeader>
            {formData.linkToTrip && (
              <CardContent>
                <Select
                  value={formData.tripId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tripId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma viagem..." />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map(trip => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.name} - {trip.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            )}
          </Card>

          {/* Preview */}
          {preview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Resumo do Parcelamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Valor Total:</span>
                    <span className="font-medium ml-2">R$ {preview.totalAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Por Parcela:</span>
                    <span className="font-medium ml-2">R$ {preview.installmentAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Sua Parte Total:</span>
                    <span className="font-medium ml-2 text-blue-600">R$ {preview.userTotalAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Sua Parte/Parcela:</span>
                    <span className="font-medium ml-2 text-blue-600">R$ {preview.userAmountPerInstallment.toFixed(2)}</span>
                  </div>
                </div>

                {Math.abs(total - 100) > 0.01 && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Ajuste os percentuais para totalizar 100%
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || formData.participants.length === 0 || Math.abs(total - 100) > 0.01}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Criando...' : 'Criar Parcelamento Compartilhado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
