/**
 * PAINEL ADMINISTRATIVO - ROTAÇÃO DE LOGS
 * 
 * Interface para gerenciar o sistema de rotação automática de logs
 * Permite configurar, monitorar e controlar a rotação de logs
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  RotateCcw, 
  Trash2, 
  RefreshCw, 
  HardDrive, 
  FileText, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useLogRotation, useLogRotationFormatters } from '@/hooks/use-log-rotation';
import { toast } from 'sonner';

export function LogRotationPanel() {
  const {
    config,
    stats,
    isLoading,
    error,
    lastRotation,
    updateConfig,
    performRotation,
    cleanupLogs,
    refreshStats
  } = useLogRotation();

  const { formatFileSize, formatDuration, formatCronExpression } = useLogRotationFormatters();

  const [configForm, setConfigForm] = useState({
    maxFileSize: config?.maxFileSize || 10485760, // 10MB
    maxFiles: config?.maxFiles || 10,
    retentionDays: config?.retentionDays || 30,
    compressionEnabled: config?.compressionEnabled || true,
    rotationSchedule: config?.rotationSchedule || '0 2 * * *'
  });

  const [cleanupDays, setCleanupDays] = useState(7);

  // Atualizar form quando config carrega
  React.useEffect(() => {
    if (config) {
      setConfigForm({
        maxFileSize: config.maxFileSize,
        maxFiles: config.maxFiles,
        retentionDays: config.retentionDays,
        compressionEnabled: config.compressionEnabled,
        rotationSchedule: config.rotationSchedule
      });
    }
  }, [config]);

  const handleConfigSave = async () => {
    try {
      await updateConfig(configForm);
      toast.success('Configuração atualizada com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar configuração');
    }
  };

  const handleManualRotation = async () => {
    try {
      const result = await performRotation();
      
      if (result.success) {
        toast.success(`Rotação concluída: ${result.rotatedFiles.length} arquivos rotacionados`);
      } else {
        toast.warning(`Rotação concluída com erros: ${result.errors.length} erros`);
      }
    } catch (error) {
      toast.error('Erro ao executar rotação');
    }
  };

  const handleCleanup = async (force = false) => {
    try {
      const result = await cleanupLogs(force ? undefined : cleanupDays, force);
      toast.success(`Limpeza concluída: ${result.count} arquivos removidos`);
    } catch (error) {
      toast.error('Erro ao limpar logs');
    }
  };

  const diskUsagePercentage = stats ? Math.min((stats.totalSize / (1024 * 1024 * 1024)) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rotação de Logs</h2>
          <p className="text-muted-foreground">
            Gerencie o sistema de rotação automática de logs
          </p>
        </div>
        <Button
          onClick={refreshStats}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total de Arquivos</p>
                <p className="text-2xl font-bold">{stats?.totalFiles || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Espaço Usado</p>
                <p className="text-2xl font-bold">{formatFileSize(stats?.totalSize || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RotateCcw className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Arquivos Comprimidos</p>
                <p className="text-2xl font-bold">{stats?.compressedFiles || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Última Rotação</p>
                <p className="text-sm font-bold">
                  {lastRotation ? lastRotation.toLocaleString() : 'Nunca'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disk Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5" />
            <span>Uso de Disco</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Espaço usado pelos logs</span>
              <span>{diskUsagePercentage.toFixed(1)}% de 1GB</span>
            </div>
            <Progress value={diskUsagePercentage} className="h-2" />
            {diskUsagePercentage > 80 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Uso de disco alto. Considere executar uma limpeza ou rotação.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configuração de Rotação</span>
              </CardTitle>
              <CardDescription>
                Configure os parâmetros do sistema de rotação automática
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Tamanho Máximo do Arquivo (bytes)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={configForm.maxFileSize}
                    onChange={(e) => setConfigForm(prev => ({
                      ...prev,
                      maxFileSize: parseInt(e.target.value) || 0
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Atual: {formatFileSize(configForm.maxFileSize)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFiles">Número Máximo de Arquivos</Label>
                  <Input
                    id="maxFiles"
                    type="number"
                    value={configForm.maxFiles}
                    onChange={(e) => setConfigForm(prev => ({
                      ...prev,
                      maxFiles: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Retenção (dias)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    value={configForm.retentionDays}
                    onChange={(e) => setConfigForm(prev => ({
                      ...prev,
                      retentionDays: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rotationSchedule">Agendamento (Cron)</Label>
                  <Input
                    id="rotationSchedule"
                    value={configForm.rotationSchedule}
                    onChange={(e) => setConfigForm(prev => ({
                      ...prev,
                      rotationSchedule: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatCronExpression(configForm.rotationSchedule)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="compressionEnabled"
                  checked={configForm.compressionEnabled}
                  onCheckedChange={(checked) => setConfigForm(prev => ({
                    ...prev,
                    compressionEnabled: checked
                  }))}
                />
                <Label htmlFor="compressionEnabled">Habilitar compressão</Label>
              </div>

              <Separator />

              <Button onClick={handleConfigSave} disabled={isLoading}>
                <Settings className="h-4 w-4 mr-2" />
                Salvar Configuração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RotateCcw className="h-5 w-5" />
                  <span>Rotação Manual</span>
                </CardTitle>
                <CardDescription>
                  Execute uma rotação imediata dos logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleManualRotation} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Executar Rotação
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trash2 className="h-5 w-5" />
                  <span>Limpeza de Logs</span>
                </CardTitle>
                <CardDescription>
                  Remova logs antigos para liberar espaço
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cleanupDays">Remover logs mais antigos que (dias)</Label>
                  <Input
                    id="cleanupDays"
                    type="number"
                    value={cleanupDays}
                    onChange={(e) => setCleanupDays(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleCleanup(false)} 
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpeza Seletiva
                  </Button>
                  
                  <Button 
                    onClick={() => handleCleanup(true)} 
                    disabled={isLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpeza Completa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Status do Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status do Serviço</Label>
                  <Badge variant={config ? "default" : "secondary"}>
                    {config ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Próxima Rotação Agendada</Label>
                  <p className="text-sm">
                    {config ? formatCronExpression(config.rotationSchedule) : 'N/A'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Arquivo Mais Antigo</Label>
                  <p className="text-sm">{stats?.oldestFile || 'N/A'}</p>
                </div>

                <div className="space-y-2">
                  <Label>Arquivo Mais Recente</Label>
                  <p className="text-sm">{stats?.newestFile || 'N/A'}</p>
                </div>
              </div>

              {config && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sistema de rotação configurado e funcionando normalmente.
                    Próxima execução: {formatCronExpression(config.rotationSchedule)}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}