'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Info, RefreshCw } from 'lucide-react';

interface AuditIssue {
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

interface AuditReport {
  timestamp: string;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    totalInfo: number;
  };
  issues: AuditIssue[];
  statistics: {
    accounts: number;
    creditCards: number;
    transactions: number;
    categories: number;
    invoices: number;
    sharedExpenses: number;
  };
}

export default function AuditPage() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/audit');
      if (!response.ok) {
        throw new Error('Falha ao executar auditoria');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'info':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auditoria de Dados</h1>
          <p className="text-muted-foreground">
            Verificação de consistência e integridade dos dados financeiros
          </p>
        </div>
        <Button onClick={runAudit} disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Auditando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Executar Auditoria
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Erros Críticos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">
                  {report.summary.totalErrors}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avisos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-500">
                  {report.summary.totalWarnings}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Informações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">
                  {report.summary.totalInfo}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
              <CardDescription>
                Última auditoria: {new Date(report.timestamp).toLocaleString('pt-BR')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contas</p>
                  <p className="text-2xl font-bold">{report.statistics.accounts}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cartões</p>
                  <p className="text-2xl font-bold">{report.statistics.creditCards}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transações</p>
                  <p className="text-2xl font-bold">{report.statistics.transactions}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categorias</p>
                  <p className="text-2xl font-bold">{report.statistics.categories}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faturas</p>
                  <p className="text-2xl font-bold">{report.statistics.invoices}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Despesas Compartilhadas</p>
                  <p className="text-2xl font-bold">{report.statistics.sharedExpenses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Geral */}
          <Card>
            <CardHeader>
              <CardTitle>Status Geral</CardTitle>
            </CardHeader>
            <CardContent>
              {report.summary.totalErrors === 0 && report.summary.totalWarnings === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Dados consistentes! Nenhum problema encontrado.</span>
                </div>
              ) : report.summary.totalErrors === 0 ? (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Apenas avisos encontrados. Recomenda-se revisão.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Erros críticos encontrados! Ação necessária.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Issues */}
          {report.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Auditoria</CardTitle>
                <CardDescription>
                  {report.issues.length} item(ns) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 border rounded-lg"
                    >
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityColor(issue.severity) as any}>
                            {issue.category}
                          </Badge>
                          <span className="text-sm font-medium">{issue.message}</span>
                        </div>
                        {issue.details && (
                          <pre className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded overflow-x-auto">
                            {JSON.stringify(issue.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!report && !loading && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Clique em "Executar Auditoria" para verificar a consistência dos dados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
