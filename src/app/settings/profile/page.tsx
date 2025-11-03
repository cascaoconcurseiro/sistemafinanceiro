'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  UserCheck,
  ArrowLeft,
  Save,
  Upload,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    avatar: '',
    createdAt: '',
  });

  // Carregar perfil do usuário
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setProfile({
            name: data.profile.name || '',
            email: data.profile.email || '',
            avatar: data.profile.image || '',
            createdAt: data.profile.createdAt || '',
          });
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        toast.error('Erro ao carregar perfil');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadProfile();
    }
  }, [session]);

  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: profile.name,
          image: profile.avatar,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = () => {
    toast.info('Upload de avatar será implementado em breve');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="w-6 h-6" />
            Perfil & Conta
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus dados pessoais e informações da conta
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Avatar e Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize suas informações pessoais e foto de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-2xl">
                  {profile.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button
                  onClick={handleAvatarUpload}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Alterar Foto
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  JPG, PNG ou GIF. Máximo 2MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  O email não pode ser alterado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Conta */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>Detalhes sobre sua conta e plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-medium">Email da Conta</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-medium">Membro desde</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-medium">Status da Conta</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Ativa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </div>
  );
}
