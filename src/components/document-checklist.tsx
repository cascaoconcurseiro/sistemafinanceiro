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
import { Plus, Trash2, Edit, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Trip } from '@/types';
import { databaseService } from '@/lib/services/database-service';

interface Document {
  id: string;
  name: string;
  type: 'passport' | 'visa' | 'insurance' | 'ticket' | 'hotel' | 'other';
  status: 'pending' | 'obtained' | 'expired';
  expiryDate?: string;
  notes?: string;
  required: boolean;
  createdAt: string;
}

interface DocumentChecklistProps {
  trip: Trip;
}

function DocumentChecklist({ trip }: DocumentChecklistProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'other' as Document['type'],
    status: 'pending' as Document['status'],
    expiryDate: '',
    notes: '',
    required: true,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadDocuments();
      initializeDefaultDocuments();
    }
  }, [trip.id, isMounted]);

  const loadDocuments = () => {
    if (typeof window === 'undefined') return;
    // TODO: Implementar carregamento de documentos via DatabaseService
    console.warn('Carregamento de documentos temporariamente desabilitado - use DatabaseService');
    setDocuments([]);
  };

  const saveDocuments = (docs: Document[]) => {
    // TODO: Implementar salvamento de documentos via DatabaseService
    console.warn('Salvamento de documentos temporariamente desabilitado - use DatabaseService');
    setDocuments(docs);
  };

  const initializeDefaultDocuments = () => {
    if (typeof window === 'undefined') return;
    // TODO: Implementar verificação de documentos existentes via DatabaseService
    console.warn('Inicialização de documentos padrão temporariamente desabilitada - use DatabaseService');
    // const existing = []; // localDataService.getStorageData(`trip-documents-${trip.id}`);
    // if (!existing) {
      const defaultDocuments: Document[] = [
        {
          id: '1',
          name: 'Passaporte',
          type: 'passport',
          status: 'pending',
          required: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Visto',
          type: 'visa',
          status: 'pending',
          required: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Seguro Viagem',
          type: 'insurance',
          status: 'pending',
          required: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Passagem Aérea',
          type: 'ticket',
          status: 'pending',
          required: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '5',
          name: 'Reserva do Hotel',
          type: 'hotel',
          status: 'pending',
          required: true,
          createdAt: new Date().toISOString(),
        },
      ];
      
      setDocuments(defaultDocuments);
      saveDocuments(defaultDocuments);
    // }
  };

  const getTypeLabel = (type: Document['type']) => {
    switch (type) {
      case 'passport':
        return 'Passaporte';
      case 'visa':
        return 'Visto';
      case 'insurance':
        return 'Seguro';
      case 'ticket':
        return 'Passagem';
      case 'hotel':
        return 'Hotel';
      case 'other':
        return 'Outro';
      default:
        return type;
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'obtained':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Document['status']) => {
    switch (status) {
      case 'obtained':
        return 'Obtido';
      case 'pending':
        return 'Pendente';
      case 'expired':
        return 'Expirado';
      default:
        return status;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do documento é obrigatório');
      return;
    }

    // Validar data se fornecida
    if (formData.expiryDate && !isValidDate(formData.expiryDate)) {
      toast.error('Data de expiração inválida. Use o formato dd/mm/aaaa');
      return;
    }

    const newDocument: Document = {
      id: editingDocument?.id || Date.now().toString(),
      name: formData.name,
      type: formData.type,
      status: formData.status,
      expiryDate: formData.expiryDate || undefined,
      notes: formData.notes || undefined,
      required: formData.required,
      createdAt: editingDocument?.createdAt || new Date().toISOString(),
    };

    let updatedDocuments;
    if (editingDocument) {
      updatedDocuments = documents.map(doc => 
        doc.id === editingDocument.id ? newDocument : doc
      );
    } else {
      updatedDocuments = [...documents, newDocument];
    }

    setDocuments(updatedDocuments);
    saveDocuments(updatedDocuments);
    
    toast.success(editingDocument ? 'Documento atualizado!' : 'Documento adicionado!');
    
    // Reset form
    setFormData({
      name: '',
      type: 'other',
      status: 'pending',
      expiryDate: '',
      notes: '',
      required: true,
    });
    setShowAddModal(false);
    setEditingDocument(null);
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      name: document.name,
      type: document.type,
      status: document.status,
      expiryDate: document.expiryDate || '',
      notes: document.notes || '',
      required: document.required,
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    saveDocuments(updatedDocuments);
    toast.success('Documento excluído!');
  };

  const isValidDate = (dateString: string) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(dateString);
  };

  const getStats = () => {
    const total = documents.length;
    const obtained = documents.filter(doc => doc.status === 'obtained').length;
    const pending = documents.filter(doc => doc.status === 'pending').length;
    const expired = documents.filter(doc => doc.status === 'expired').length;
    
    return { total, obtained, pending, expired };
  };

  const stats = getStats();

  if (!isMounted) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Documentos da Viagem</h2>
          <p className="text-muted-foreground">
            {stats.obtained}/{stats.total} obtidos
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Documento
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Obtidos</p>
                <p className="text-2xl font-bold text-green-600">{stats.obtained}</p>
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Expirados</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de documentos */}
      <div className="space-y-3">
        {documents.map(document => (
          <Card key={document.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium">{document.name}</h3>
                    {document.required && (
                      <Badge variant="destructive" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">
                      {getTypeLabel(document.type)}
                    </Badge>
                    <Badge className={getStatusColor(document.status)}>
                      {getStatusLabel(document.status)}
                    </Badge>
                    
                    {document.expiryDate && (
                      <Badge variant="outline">
                        Expira: {document.expiryDate}
                      </Badge>
                    )}
                  </div>
                  
                  {document.notes && (
                    <p className="text-sm text-muted-foreground">
                      {document.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(document)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(document.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum documento cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione documentos para organizar sua viagem
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Documento
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
                {editingDocument ? 'Editar Documento' : 'Adicionar Documento'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Documento *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Passaporte"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Document['type'] })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="passport">Passaporte</option>
                    <option value="visa">Visto</option>
                    <option value="insurance">Seguro</option>
                    <option value="ticket">Passagem</option>
                    <option value="hotel">Hotel</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Document['status'] })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="pending">Pendente</option>
                    <option value="obtained">Obtido</option>
                    <option value="expired">Expirado</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="expiryDate">Data de Expiração</Label>
                <Input
                  id="expiryDate"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  placeholder="dd/mm/aaaa"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) => setFormData({ ...formData, required: !!checked })}
                />
                <Label htmlFor="required">Documento obrigatório</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDocument(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDocument ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default DocumentChecklist;


