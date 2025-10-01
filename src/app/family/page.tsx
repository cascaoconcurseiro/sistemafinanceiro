'use client'

import { useState, useEffect } from 'react'
import { ModernAppLayout } from '@/components/modern-app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, User, UserCheck } from 'lucide-react'
import { BackButton } from '@/components/back-button'
import { toast } from 'sonner'

interface FamilyMember {
  id: string
  name: string
  relationship: string
  isActive?: boolean
}

const relationshipOptions = [
  'Cônjuge',
  'Filho(a)',
  'Pai',
  'Mãe',
  'Irmão(ã)',
  'Avô(ó)',
  'Tio(a)',
  'Primo(a)',
  'Sogro(a)',
  'Cunhado(a)',
  'Outro'
]

function FamilyManagement() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({})
  const [loading, setLoading] = useState(true)

  // Carregar membros da API
  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/family')
      if (response.ok) {
        const data = await response.json()
        const membersWithDates = data.map((member: any) => ({
          ...member,
          birthDate: member.birthDate ? new Date(member.birthDate) : undefined
        }))
        setMembers(membersWithDates)
      }
    } catch (error) {
      console.error('Erro ao carregar membros da família:', error)
      toast.error('Erro ao carregar membros da família')
    } finally {
      setLoading(false)
    }
  }

  const addMember = async () => {
    if (!newMember.name || !newMember.relationship) {
      toast.error('Nome e relacionamento são obrigatórios!')
      return
    }

    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMember),
      })

      if (response.ok) {
        const createdMember = await response.json()
        const memberWithDate = {
          ...createdMember,
          birthDate: createdMember.birthDate ? new Date(createdMember.birthDate) : undefined
        }
        setMembers(prev => [...prev, memberWithDate])
        setNewMember({})
        setIsAddingMember(false)
        toast.success('Membro adicionado com sucesso!')
      } else {
        toast.error('Erro ao adicionar membro da família')
      }
    } catch (error) {
      console.error('Erro ao adicionar membro:', error)
      toast.error('Erro ao adicionar membro da família')
    }
  }

  const updateMember = async () => {
    if (!editingMember?.id) return

    try {
      const response = await fetch('/api/family', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingMember),
      })

      if (response.ok) {
        const updatedMember = await response.json()
        const memberWithDate = {
          ...updatedMember,
          birthDate: updatedMember.birthDate ? new Date(updatedMember.birthDate) : undefined
        }
        setMembers(prev => prev.map(m => m.id === memberWithDate.id ? memberWithDate : m))
        setEditingMember(null)
        toast.success('Membro atualizado com sucesso!')
      } else {
        toast.error('Erro ao atualizar membro da família')
      }
    } catch (error) {
      console.error('Erro ao atualizar membro:', error)
      toast.error('Erro ao atualizar membro da família')
    }
  }

  const deleteMember = async (id: string) => {
    try {
      const response = await fetch(`/api/family?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMembers(prev => prev.filter(m => m.id !== id))
        toast.success('Membro removido com sucesso!')
      } else {
        toast.error('Erro ao remover membro da família')
      }
    } catch (error) {
      console.error('Erro ao remover membro:', error)
      toast.error('Erro ao remover membro da família')
    }
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
    <ModernAppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Família</h1>
              <p className="text-gray-600">Gerencie os membros da sua família</p>
            </div>
          </div>
          <Button onClick={() => setIsAddingMember(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Membro
          </Button>
        </div>

        {/* Lista de Membros */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {member.avatar ? (
                        <AvatarImage src={member.avatar} alt={member.name} />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {member.relationship}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingMember(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p className="text-gray-500">Membro da família</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {members.length === 0 && (
            <div className="col-span-full text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum membro cadastrado</h3>
              <p className="text-gray-600 mb-4">Comece adicionando os membros da sua família</p>
              <Button onClick={() => setIsAddingMember(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Membro
              </Button>
            </div>
          )}
        </div>

        {/* Modal de Adicionar/Editar Membro */}
        {(isAddingMember || editingMember) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>
                  {editingMember ? 'Editar Membro' : 'Adicionar Membro'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={editingMember ? editingMember.name : newMember.name || ''}
                    onChange={(e) => {
                      if (editingMember) {
                        setEditingMember({ ...editingMember, name: e.target.value })
                      } else {
                        setNewMember({ ...newMember, name: e.target.value })
                      }
                    }}
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="relationship">Parentesco *</Label>
                  <Select
                    value={editingMember ? editingMember.relationship : newMember.relationship || ''}
                    onValueChange={(value) => {
                      if (editingMember) {
                        setEditingMember({ ...editingMember, relationship: value })
                      } else {
                        setNewMember({ ...newMember, relationship: value })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parentesco" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingMember(false)
                      setEditingMember(null)
                      setNewMember({})
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={editingMember ? updateMember : addMember}
                    className="flex-1"
                  >
                    {editingMember ? 'Atualizar' : 'Adicionar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ModernAppLayout>
  )
}

export default function FamilyPage() {
  return <FamilyManagement />
}
