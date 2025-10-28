'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Users, DollarSign, Calendar, Filter, Search, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface SharedDebt {
  id: string
  creditor: string
  debtor: string
  originalAmount: number
  currentAmount: number
  description: string
  transactionId?: string
  status: 'active' | 'paid' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export default function SharedDebtsPage() {
  const [debts, setDebts] = useState<SharedDebt[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<SharedDebt | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentAmount, setPaymentAmount] = useState('')

  // Form state para criar nova dívida
  const [newDebt, setNewDebt] = useState({
    creditor: '',
    debtor: '',
    originalAmount: '',
    description: '',
    transactionId: ''
  })

  // Carregar dívidas
  const loadDebts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shared-debts', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setDebts(data.map((debt: any) => ({
          ...debt,
          createdAt: new Date(debt.createdAt),
          updatedAt: new Date(debt.updatedAt)
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar dívidas:', error)
      toast.error('Erro ao carregar dívidas compartilhadas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDebts()
  }, [])

  // Criar nova dívida
  const handleCreateDebt = async () => {
    try {
      if (!newDebt.creditor || !newDebt.debtor || !newDebt.originalAmount || !newDebt.description) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      const response = await fetch('/api/shared-debts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDebt,
          originalAmount: parseFloat(newDebt.originalAmount)
        })
      })

      if (response.ok) {
        toast.success('Dívida criada com sucesso!')
        setIsCreateModalOpen(false)
        setNewDebt({ creditor: '', debtor: '', originalAmount: '', description: '', transactionId: '' })
        loadDebts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar dívida')
      }
    } catch (error) {
      console.error('Erro ao criar dívida:', error)
      toast.error('Erro ao criar dívida')
    }
  }

  // Processar pagamento
  const handlePayment = async () => {
    if (!selectedDebt || !paymentAmount) return

    try {
      const response = await fetch(`/api/shared-debts/${selectedDebt.id}/payment`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(paymentAmount) })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        setIsPaymentModalOpen(false)
        setPaymentAmount('')
        setSelectedDebt(null)
        loadDebts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao processar pagamento')
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      toast.error('Erro ao processar pagamento')
    }
  }

  // Marcar como paga/cancelada
  const handleStatusChange = async (debt: SharedDebt, newStatus: 'paid' | 'cancelled') => {
    try {
      const response = await fetch(`/api/shared-debts/${debt.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success(`Dívida marcada como ${newStatus === 'paid' ? 'paga' : 'cancelada'}`)
        loadDebts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  // Filtrar dívidas
  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.creditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.debtor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || debt.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calcular estatísticas
  const stats = {
    total: debts.length,
    active: debts.filter(d => d.status === 'active').length,
    paid: debts.filter(d => d.status === 'paid').length,
    totalAmount: debts.filter(d => d.status === 'active').reduce((sum, d) => sum + d.currentAmount, 0)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando dívidas compartilhadas...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dívidas Compartilhadas</h1>
          <p className="text-muted-foreground">Gerencie créditos e débitos entre pessoas</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Dívida
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Dívida</DialogTitle>
              <DialogDescription>
                Registre uma nova dívida compartilhada entre pessoas
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="creditor">Credor (quem deve receber)</Label>
                <Input
                  id="creditor"
                  value={newDebt.creditor}
                  onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
                  placeholder="Nome do credor"
                />
              </div>
              
              <div>
                <Label htmlFor="debtor">Devedor (quem deve pagar)</Label>
                <Input
                  id="debtor"
                  value={newDebt.debtor}
                  onChange={(e) => setNewDebt({ ...newDebt, debtor: e.target.value })}
                  placeholder="Nome do devedor"
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newDebt.originalAmount}
                  onChange={(e) => setNewDebt({ ...newDebt, originalAmount: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newDebt.description}
                  onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
                  placeholder="Descreva o motivo da dívida"
                />
              </div>
              
              <div>
                <Label htmlFor="transactionId">ID da Transação (opcional)</Label>
                <Input
                  id="transactionId"
                  value={newDebt.transactionId}
                  onChange={(e) => setNewDebt({ ...newDebt, transactionId: e.target.value })}
                  placeholder="ID da transação relacionada"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateDebt}>
                Criar Dívida
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Ativo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por credor, devedor ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="paid">Pagas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Dívidas */}
      <div className="space-y-4">
        {filteredDebts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {debts.length === 0 ? 'Nenhuma dívida cadastrada' : 'Nenhuma dívida encontrada com os filtros aplicados'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredDebts.map((debt) => (
            <Card key={debt.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(debt.status)}>
                        {getStatusIcon(debt.status)}
                        <span className="ml-1 capitalize">{debt.status === 'active' ? 'Ativa' : debt.status === 'paid' ? 'Paga' : 'Cancelada'}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {debt.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{debt.description}</h3>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span><strong>Credor:</strong> {debt.creditor}</span>
                      <span><strong>Devedor:</strong> {debt.debtor}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold">
                        R$ {debt.currentAmount.toFixed(2)}
                      </span>
                      {debt.originalAmount !== debt.currentAmount && (
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {debt.originalAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {debt.status === 'active' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDebt(debt)
                          setIsPaymentModalOpen(true)
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pagar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(debt, 'paid')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar como Paga
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(debt, 'cancelled')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Pagamento */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processar Pagamento</DialogTitle>
            <DialogDescription>
              Registre um pagamento para a dívida selecionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedDebt && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold">{selectedDebt.description}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedDebt.creditor} → {selectedDebt.debtor}
                </p>
                <p className="text-lg font-semibold">
                  Valor atual: R$ {selectedDebt.currentAmount.toFixed(2)}
                </p>
              </div>
              
              <div>
                <Label htmlFor="paymentAmount">Valor do Pagamento (R$)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  max={selectedDebt.currentAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0,00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo: R$ {selectedDebt.currentAmount.toFixed(2)}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePayment}>
              Processar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}