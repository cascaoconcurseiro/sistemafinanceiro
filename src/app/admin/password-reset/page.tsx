'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Key, 
  Mail,
  RefreshCw,
  Search,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface PasswordResetRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  token: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
}

export default function PasswordResetManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      loadRequests();
    }
  }, [status, session]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/password-reset/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResetLink = async () => {
    if (!searchEmail) {
      toast.error('Digite um email');
      return;
    }

    try {
      const response = await fetch('/api/admin/password-reset/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Link de reset gerado!');
        
        // Copiar link para clipboard
        navigator.clipboard.writeText(data.resetLink);
        toast.info('Link copiado para área de transferência');
        
        loadRequests();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao gerar link');
      }
    } catch (error) {
      toast.error('Erro ao gerar link');
    }
  };

  const handleSendResetEmail = async (email: string) => {
    try {
      const response = await fetch('/api/admin/password-reset/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success('Email de reset enviado!');
        loadRequests();
      } else {
        toast.error('Erro ao enviar email');
      }
    } catch (error) {
      toast.error('Erro ao enviar email');
    }
  };

  const handleForcePasswordReset = async (userId: string) => {
    if (!confirm('Deseja forçar o reset de senha deste usuário?')) return;

    try {
      const response = await fetch('/api/admin/password-reset/force', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success('Usuário será obrigado a resetar senha no próximo login');
        loadRequests();
      } else {
        toast.error('Erro ao forçar reset');
      }
    } catch (error) {
      toast.error('Erro ao forçar reset');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Reset de Senha</h1>
              <p className="text-sm text-muted-foreground">
                Gerenciar solicitações de reset de senha
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Gerar Link de Reset */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Gerar Link de Reset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email do Usuário</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                  <Button onClick={handleGenerateResetLink}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Gerar Link
                  </Button>
                  <Button variant="outline" onClick={() => handleSendResetEmail(searchEmail)}>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Email
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  O link será copiado automaticamente para a área de transferência
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total de Solicitações</p>
                <p className="text-3xl font-bold">{requests.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {requests.filter(r => !r.used && new Date(r.expiresAt) > new Date()).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Utilizados</p>
                <p className="text-3xl font-bold text-green-600">
                  {requests.filter(r => r.used).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Solicitações */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const isExpired = new Date(request.expiresAt) < new Date();
                  const status = request.used ? 'Utilizado' : isExpired ? 'Expirado' : 'Pendente';
                  const statusColor = request.used ? 'text-green-600' : isExpired ? 'text-red-600' : 'text-yellow-600';

                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.userName}</TableCell>
                      <TableCell>{request.userEmail}</TableCell>
                      <TableCell className={statusColor}>{status}</TableCell>
                      <TableCell>
                        {new Date(request.expiresAt).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendResetEmail(request.userEmail)}
                            disabled={request.used || isExpired}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleForcePasswordReset(request.userId)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
