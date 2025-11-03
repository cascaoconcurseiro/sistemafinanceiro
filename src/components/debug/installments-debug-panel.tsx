'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Database,
  Eye,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface InstallmentGroup {
  groupKey: string;
  totalTransactions: number;
  activeTransactions: number;
  deletedTransactions: number;
  status: 'ATIVO' | 'DELETADO';
  transactions: Array<{
    id: string;
    description: string;
    installment: string;
    amount: number;
    myShare: number | null;
    isShared: boolean;
    deletedAt: string | null;
    createdAt: string;
  }>;
}

interface DebugData {
  success: boolean;
  totalGroups: number;
  activeGroups: number;
  deletedGroups: number;
  groups: InstallmentGroup[];
}

export function InstallmentsDebugPanel() {
  const [data, setData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/installments', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const result = await response.json();
      setData(result);
      toast.success('Dados carregados com sucesso');
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de debug');
    } finally {
      setLoading(false);
    }
  };

  const forceDeleteGroup = async (groupKey: string) => {
    setProcessing(groupKey);
    try {
      const response = await fetch('/api/debug/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'force-delete-group',
          groupKey
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar grupo');
      }

      const result = await response.json();
      toast.success(`${result.count} parcelas marcadas como deletadas`);

      // Forçar refresh do contexto
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cache-invalidation', {
          detail: { entity: 'unified-financial-data' }
        }));
      }

      // Recarregar dados
      setTimeout(() => loadData(), 1000);
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      toast.error('Erro ao deletar grupo');
    } finally {
      setProcessing(null);
    }
  };

  const cleanupOrphans = async () => {
    setProcessing('cleanup');
    try {
      const response = await fetch('/api/debug/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'cleanup-orphans'
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao limpar órfãs');
      }

      const result = await response.json();
      toast.success(result.message);

      // Forçar refresh do contexto
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cache-invalidation', {
          detail: { entity: 'unified-financial-data' }
        }));
      }

      // Recarregar dados
      setTimeout(() => loadData(), 1000);
    } catch (error) {
      console.error('Erro ao limpar órfãs:', error);
      toast.error('Erro ao limpar parcelas órfãs');
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeGroups = data?.groups.filter(g => g.status === 'ATIVO') || [];
  const partialGroups = data?.groups.filter(g =>
    g.activeTransactions > 0 && g.deletedTransactions > 0
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Debug de Parcelamentos
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Atualizar</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={cleanupOrphans}
                disabled={processing === 'cleanup'}
              >
                {processing === 'cleanup' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="ml-2">Limpar Órfãs</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.totalGroups}</div>
                <div className="text-sm text-muted-foreground">Total de Grupos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{data.activeGroups}</div>
                <div className="text-sm text-muted-foreground">Grupos Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{data.deletedGroups}</div>
                <div className="text-sm text-muted-foreground">Grupos Deletados</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      {partialGroups.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção!</strong> Encontrados {partialGroups.length} grupo(s) com parcelas
            parcialmente deletadas. Isso pode causar inconsistências nos relatórios.
          </AlertDescription>
        </Alert>
      )}

      {activeGroups.length === 0 && data && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Tudo certo!</strong> Não há grupos de parcelamento ativos no momento.
          </AlertDescription>
        </Alert>
      )}

      {/* Grupos Ativos */}
      {activeGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Grupos Ativos ({activeGroups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGroups.map((group) => (
                <Card key={group.groupKey} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{group.groupKey}</span>
                        <Badge variant={group.deletedTransactions > 0 ? 'destructive' : 'default'}>
                          {group.activeTransactions} ativas
                        </Badge>
                        {group.deletedTransactions > 0 && (
                          <Badge variant="outline">
                            {group.deletedTransactions} deletadas
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => forceDeleteGroup(group.groupKey)}
                        disabled={processing === group.groupKey}
                      >
                        {processing === group.groupKey ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="ml-2">Deletar Grupo</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Parcela</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Minha Parte</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Criado Em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.transactions.map((t) => (
                          <TableRow
                            key={t.id}
                            className={t.deletedAt ? 'opacity-50 bg-red-50' : ''}
                          >
                            <TableCell className="font-medium">
                              {t.description}
                              {t.isShared && (
                                <Badge variant="secondary" className="ml-2">
                                  Compartilhado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{t.installment}</TableCell>
                            <TableCell>
                              R$ {Math.abs(t.amount).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {t.myShare ? `R$ ${Math.abs(t.myShare).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell>
                              {t.deletedAt ? (
                                <Badge variant="destructive">Deletada</Badge>
                              ) : (
                                <Badge variant="default">Ativa</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Atualizar:</strong> Recarrega os dados do banco de dados
          </p>
          <p>
            <strong>Limpar Órfãs:</strong> Remove grupos incompletos (com parcelas faltando)
          </p>
          <p>
            <strong>Deletar Grupo:</strong> Marca todas as parcelas de um grupo como deletadas
          </p>
          <p className="text-muted-foreground">
            💡 Após qualquer ação, aguarde alguns segundos e recarregue a página (Ctrl+Shift+R)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
