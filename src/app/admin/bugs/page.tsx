'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Bug, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface BugReport {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: string;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BugsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      loadBugs();
    }
  }, [status, session]);

  const loadBugs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/bugs');
      if (response.ok) {
        const data = await response.json();
        setBugs(data);
      }
    } catch (error) {
      console.error('Erro ao carregar bugs:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bugId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bugs/${bugId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Status atualizado');
        loadBugs();
      }
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Usuário', 'Título', 'Severidade', 'Status', 'Data'],
      ...filteredBugs.map(bug => [
        bug.id,
        bug.userName,
        bug.title,
        bug.severity,
        bug.status,
        new Date(bug.createdAt).toLocaleString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bugs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const filteredBugs = bugs.filter(bug => {
    const matchesSearch = bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bug.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || bug.status === filterStatus;
    const matchesSeverity = filterSeverity === 'ALL' || bug.severity === filterSeverity;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600';
      case 'HIGH': return 'bg-orange-600';
      case 'MEDIUM': return 'bg-yellow-600';
      case 'LOW': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertTriangle className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />;
      case 'RESOLVED': return <CheckCircle className="h-4 w-4" />;
      case 'CLOSED': return <CheckCircle className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
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
                <h1 className="text-2xl font-bold">Relatórios de Bugs</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredBugs.length} relatório(s) encontrado(s)
                </p>
              </div>
            </div>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Todos os Status</option>
                <option value="OPEN">Aberto</option>
                <option value="IN_PROGRESS">Em Progresso</option>
                <option value="RESOLVED">Resolvido</option>
                <option value="CLOSED">Fechado</option>
              </select>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Todas as Severidades</option>
                <option value="CRITICAL">Crítico</option>
                <option value="HIGH">Alto</option>
                <option value="MEDIUM">Médio</option>
                <option value="LOW">Baixo</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{bugs.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Abertos</p>
                <p className="text-3xl font-bold text-red-600">
                  {bugs.filter(b => b.status === 'OPEN').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Em Progresso</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {bugs.filter(b => b.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Resolvidos</p>
                <p className="text-3xl font-bold text-green-600">
                  {bugs.filter(b => b.status === 'RESOLVED').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Bugs */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBugs.map((bug) => (
                  <TableRow key={bug.id}>
                    <TableCell>
                      <Badge className={getSeverityColor(bug.severity)}>
                        {bug.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{bug.title}</TableCell>
                    <TableCell>{bug.userName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {getStatusIcon(bug.status)}
                        {bug.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(bug.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/bugs/${bug.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                        {bug.status !== 'RESOLVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(bug.id, 'RESOLVED')}
                          >
                            Resolver
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
