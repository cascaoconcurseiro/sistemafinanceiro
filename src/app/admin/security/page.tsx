'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Shield,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  Ban,
  Activity,
  Key,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  type: 'LOGIN_FAILED' | 'LOGIN_SUCCESS' | 'SUSPICIOUS_ACTIVITY' | 'PASSWORD_RESET' | 'ACCOUNT_LOCKED';
  userId?: string;
  userName?: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
}

interface SecurityStats {
  failedLogins24h: number;
  suspiciousActivities: number;
  blockedIPs: number;
  activeUsers: number;
  passwordResets24h: number;
}

export default function SecurityManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    failedLogins24h: 0,
    suspiciousActivities: 0,
    blockedIPs: 0,
    activeUsers: 0,
    passwordResets24h: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      loadSecurityData();
    }
  }, [status, session]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/admin/security/events'),
        fetch('/api/admin/security/stats'),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de segurança:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async (ipAddress: string) => {
    if (!confirm(`Deseja bloquear o IP ${ipAddress}?`)) return;

    try {
      const response = await fetch('/api/admin/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress }),
      });

      if (response.ok) {
        toast.success('IP bloqueado com sucesso');
        loadSecurityData();
      }
    } catch (error) {
      toast.error('Erro ao bloquear IP');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600';
      case 'HIGH': return 'bg-orange-600';
      case 'MEDIUM': return 'bg-yellow-600';
      case 'LOW': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'LOGIN_FAILED': return <UserX className="h-4 w-4" />;
      case 'LOGIN_SUCCESS': return <Shield className="h-4 w-4" />;
      case 'SUSPICIOUS_ACTIVITY': return <AlertTriangle className="h-4 w-4" />;
      case 'PASSWORD_RESET': return <Key className="h-4 w-4" />;
      case 'ACCOUNT_LOCKED': return <Lock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Segurança do Sistema</h1>
                <p className="text-sm text-muted-foreground">
                  Monitoramento e auditoria de segurança
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Estatísticas de Segurança */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserX className="h-4 w-4" />
                Logins Falhados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.failedLogins24h}
              </div>
              <p className="text-xs text-muted-foreground">Últimas 24h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Atividades Suspeitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.suspiciousActivities}
              </div>
              <p className="text-xs text-muted-foreground">Detectadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ban className="h-4 w-4" />
                IPs Bloqueados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.blockedIPs}
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Usuários Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeUsers}
              </div>
              <p className="text-xs text-muted-foreground">Online agora</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Reset de Senha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.passwordResets24h}
              </div>
              <p className="text-xs text-muted-foreground">Últimas 24h</p>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/security/blocked-ips')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                IPs Bloqueados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerenciar lista de IPs bloqueados
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/security/password-policy')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Política de Senhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configurar requisitos de senha
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/security/two-factor')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Autenticação 2FA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configurar autenticação de dois fatores
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Eventos de Segurança Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos de Segurança Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {getEventIcon(event.type)}
                        {event.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.userName || 'N/A'}</TableCell>
                    <TableCell className="font-mono text-sm">{event.ipAddress}</TableCell>
                    <TableCell className="max-w-xs truncate">{event.details}</TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(event.createdAt).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/security/events/${event.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {event.severity === 'CRITICAL' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBlockIP(event.ipAddress)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
