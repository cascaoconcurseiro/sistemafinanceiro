'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useBackup } from '@/hooks/use-backup';
import {
  Download,
  Upload,
  Cloud,
  HardDrive,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings,
  Calendar,
  FileText,
  Database,
  Shield,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupData {
  accounts: any[];
  transactions: any[];
  goals: any[];
  trips: any[];
  investments: any[];
  settings: any;
  timestamp: string;
  version: string;
}

export function BackupManager() {
  const { toast } = useToast();
  const {
    isExporting,
    isImporting,
    lastBackup,
    autoBackupEnabled,
    exportData,
    importData,
    scheduleAutoBackup,
  } = useBackup();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      await exportData(format);
      toast({
        title: 'Backup Criado',
        description: `Dados exportados com sucesso em formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Erro no export:', error);
      toast({
        title: 'Erro no Backup',
        description: 'Não foi possível criar o backup dos dados',
        variant: 'destructive',
      });
    }
  };
  const toggleAutoBackup = () => {
    scheduleAutoBackup(!autoBackupEnabled);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importData(file);
        toast({
          title: 'Dados Importados',
          description: 'Backup restaurado com sucesso',
        });
      } catch (error) {
        console.error('Erro no import:', error);
        toast({
          title: 'Erro na Importação',
          description: 'Não foi possível restaurar o backup',
          variant: 'destructive',
        });
      }
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
          <CardDescription>
            Informações sobre backup automático e sincronização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Backup Automático</p>
                <p className="text-xs text-muted-foreground">
                  {autoBackupEnabled ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Último Backup</p>
                <p className="text-xs text-muted-foreground">
                  {lastBackup
                    ? formatDistanceToNow(new Date(lastBackup), {
                        addSuffix: true,
                        locale: ptBR
                      })
                    : 'Nunca'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Próximo Backup</p>
                <p className="text-xs text-muted-foreground">
                  {autoBackupEnabled ? 'Em 7 dias' : 'Desabilitado'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              <div>
                <p className="font-medium">Backup Automático Semanal</p>
                <p className="text-sm text-muted-foreground">
                  Cria backup automaticamente toda semana
                </p>
              </div>
            </div>
            <Button
              variant={autoBackupEnabled ? "default" : "outline"}
              onClick={toggleAutoBackup}
              size="sm"
            >
              {autoBackupEnabled ? 'Desativar' : 'Ativar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exportação de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </CardTitle>
          <CardDescription>
            Faça backup dos seus dados em diferentes formatos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="h-20 flex-col gap-2"
              variant="outline"
            >
              {isExporting ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                <FileText className="h-6 w-6" />
              )}
              <div className="text-center">
                <p className="font-medium">Exportar JSON</p>
                <p className="text-xs text-muted-foreground">
                  Formato completo com todos os dados
                </p>
              </div>
            </Button>

            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="h-20 flex-col gap-2"
              variant="outline"
            >
              {isExporting ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                <Database className="h-6 w-6" />
              )}
              <div className="text-center">
                <p className="font-medium">Exportar CSV</p>
                <p className="text-xs text-muted-foreground">
                  Planilha para análise externa
                </p>
              </div>
            </Button>
          </div>

          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Preparando dados...</span>
                <span>Aguarde</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Importação de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Dados
          </CardTitle>
          <CardDescription>
            Restaure seus dados a partir de um arquivo de backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            onClick={handleImportClick}
            disabled={isImporting}
            variant="outline"
            className="w-full h-16 flex-col gap-2"
          >
            {isImporting ? (
              <RefreshCw className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <div className="text-center">
              <p className="font-medium">
                {isImporting ? 'Importando...' : 'Selecionar Arquivo'}
              </p>
              <p className="text-xs text-muted-foreground">
                Suporta arquivos JSON e CSV
              </p>
            </div>
          </Button>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processando arquivo...</span>
                <span>Aguarde</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          )}

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Atenção:
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  A importação irá substituir os dados existentes. Recomendamos
                  fazer um backup antes de importar novos dados.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
