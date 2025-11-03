'use client'

import { useState } from 'react'
import { ModernAppLayout } from '@/components/layout/modern-app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, UserCheck, Users, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { useFamilyMembers, useDeleteFamilyMember, type FamilyMember } from '@/hooks/queries/use-family-members'

function FamilyManagement() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [formData, setFormData] = useState({ name: '', relationship: '' })

  const { data: familyMembersData, isLoading: loading, refetch } = useFamilyMembers()
  const deleteMutation = useDeleteFamilyMember()

  // ✅ CORREÇÃO: Hook agora retorna array direto
  const members = familyMembersData || []

  const handleAddMember = async () => {
    if (!formData.name.trim()) {
      toast.error('Por favor, insira o nome do membro')
      return
    }

    try {
      // ✅ CORREÇÃO: Usar a rota correta /api/family-members
      const response = await fetch('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Membro adicionado com sucesso!')
        setFormData({ name: '', relationship: '' })
        setShowAddModal(false)
        refetch()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erro ao adicionar membro')
      }
    } catch (error) {
      console.error('Erro ao adicionar membro:', error)
      toast.error('Erro ao adicionar membro')
    }
  }

  const handleEditMember = async () => {
    if (!editingMember || !formData.name.trim()) return

    try {
      // ✅ CORREÇÃO: Usar a rota correta /api/family-members
      const response = await fetch(`/api/family-members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Membro atualizado com sucesso!')
        setEditingMember(null)
        setFormData({ name: '', relationship: '' })
        refetch()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erro ao atualizar membro')
      }
    } catch (error) {
      console.error('Erro ao atualizar membro:', error)
      toast.error('Erro ao atualizar membro')
    }
  }

  const deleteMember = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success('Membro removido com sucesso!')
          refetch()
        }
      })
    }
  }

  const openEditModal = (member: FamilyMember) => {
    setEditingMember(member)
    setFormData({ name: member.name, relationship: member.relationship || '' })
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingMember(null)
    setFormData({ name: '', relationship: '' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <ModernAppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando membros da família...</p>
          </div>
        </div>
      </ModernAppLayout>
    )
  }

  return (
    <ModernAppLayout
      title="Família"
      subtitle="Gerencie os membros da sua família"
    >
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Membros da Família
              </CardTitle>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Membro
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Gerencie os membros da sua família para compartilhar despesas e organizar viagens
            </p>
          </CardContent>
        </Card>

        {/* Lista de Membros */}
        <Card>
          <CardContent className="p-6">
            {members.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum membro cadastrado</h3>
                <p className="text-gray-600 mb-4">Comece adicionando os membros da sua família</p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Membro
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">{member.name}</h3>
                        {member.relationship && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {member.relationship}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Adicionar/Editar */}
      <Dialog open={showAddModal || !!editingMember} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Editar Membro' : 'Adicionar Membro'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do membro"
              />
            </div>
            <div>
              <Label htmlFor="relationship">Relacionamento</Label>
              <Input
                id="relationship"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                placeholder="Ex: Cônjuge, Filho(a), Pai/Mãe"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeModal}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={editingMember ? handleEditMember : handleAddMember}>
                <Save className="w-4 h-4 mr-2" />
                {editingMember ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModernAppLayout>
  )
}

export default function FamilyPage() {
  return <FamilyManagement />
}
