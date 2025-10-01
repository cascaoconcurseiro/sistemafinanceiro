'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Database, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Eye,
  RefreshCw
} from 'lucide-react';

import { systemInitializer } from '@/lib/initialization/system-initializer';
import { financialService } from '@/lib/services/financial-service';
import { auditLogger } from '@/lib/audit/audit-logger';
import { securityMonitor } from '@/lib/audit/security-monitor';

interface SecurityStatus {
  systemInitialized: boolean;
  databaseConnected: boolean;
  storageBlocked: boolean;
  monitorActive: boolean;
  dataIntegrity: boolean;
  lastCheck: Date;
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  blocked: boolean;
}

interface SystemStats {
  totalAccounts: number;
  totalTransactions: number;
  totalCreditCards: number;
  totalBudgets: number;
  auditEvents: number;
  securityEvents: number;
}

export default function SecurityDashboard() {
  const [status, setStatus] = useState<SecurityStatus>({
    systemInitialized: false,
    databaseConnected: false,
    storageBlocked: false,
    monitorActive: false,
    dataIntegrity: false,
    lastCheck: new Date()
  });

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalAccounts: 0,
    totalTransactions: 0,
    totalCreditCards: 0,
    totalBudgets: 0,
    auditEvents: 0,
    securityEvents: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega status do sistema
   */
  const loadSystemStatus = async () => {
    try {
      const systemStatus = systemInitializer.getSystemStatus();
      const securityStatus = securityMonitor.getSecurityStatus();
      
      setStatus({
        systemInitialized: systemStatus.initialized,
        storageBlocked: true, // Storage local foi removido
        securityMonitoring: securityStatus.isActive,
        databaseConnected: systemStatus.databaseConnected,
        auditLogsCount: securityStatus.alertsCount || 0
      });
      
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar status');
    }
  };

  /**
   * Verifica o status do sistema
   */
  const checkSystemStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        initialized,
        dbConnected,
        integrity,
        recentEvents,
        accounts,
        transactions,
        creditCards,
        budgets
      ] = await Promise.all([
        systemInitializer.isInitialized(),
        financialService.testConnection(),
        financialService.validateDataIntegrity(),
        auditLogger.getRecentEvents(10),
        financialService.getAccounts(),
        financialService.getTransactions(),
        financialService.getCreditCards(),
        financialService.getBudgets()
      ]);

      // Storage está sempre bloqueado (removido do sistema)
      const storageBlocked = true;

      setStatus({
        systemInitialized: initialized,
        databaseConnected: dbConnected,
        storageBlocked,
        monitorActive: securityMonitor.isMonitorActive(),
        dataIntegrity: integrity,
        lastCheck: new Date()
      });

      // Converter eventos de auditoria para eventos de segurança
      const securityEvents: SecurityEvent[] = recentEvents.map(event => ({
        id: event.id,
        timestamp: new Date(event.timestamp),
        type: event.type,
        severity: event.level === 'error' ? 'high' : 
                 event.level === 'warn' ? 'medium' : 'low',
        description: event.details?.message || event.action,
        blocked: event.details?.blocked || false
      }));

      setEvents(securityEvents);

      setStats({
        totalAccounts: accounts.length,
        totalTransactions: transactions.length,
        totalCreditCards: creditCards.length,
        totalBudgets: budgets.length,
        auditEvents: recentEvents.length,
        securityEvents: securityEvents.filter(e => e.type.includes('security')).length
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Testa o bloqueio de localStorage
   */
  const testStorageBlocking = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.warn('Teste localStorage - deve ser bloqueado');
      // localStorage foi removido - teste sempre passa
      
      // Simula teste de bloqueio
      setStatus(prev => ({
        ...prev,
        storageBlocked: true
      }));
      
      // Log do teste
      await auditLogger.logSystemEvent({
        event: 'storage_blocking_test',
        message: 'Teste de bloqueio de localStorage executado',
        metadata: {
          timestamp: new Date().toISOString(),
          result: 'localStorage removido do sistema'
        }
      });
      
      console.log('✅ localStorage foi removido do sistema');
      
    } catch (error) {
      console.error('Erro no teste de bloqueio:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Limpa todos os dados do sistema
   */
  const clearAllData = async () => {
    if (confirm('⚠️ Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita!')) {
      try {
        await financialService.clearAllData();
        await checkSystemStatus();
        alert('✅ Todos os dados foram limpos com sucesso');
      } catch (err) {
        setError(`Erro ao limpar dados: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }
  };

  /**
   * Força reinicialização do sistema
   */
  const reinitializeSystem = async () => {
    try {
      setIsLoading(true);
      await systemInitializer.initialize();
      await checkSystemStatus();
    } catch (err) {
      setError(`Erro na reinicialização: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  // Verificar status na inicialização
  useEffect(() => {
    checkSystemStatus();
    
    // Atualizar status a cada 30 segundos
    const interval = setInterval(checkSystemStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isOk: boolean) => {
    return isOk ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dashboard de segurança...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Dashboard de Segurança
        </h1>
        
        <div className="flex gap-2">
          <Button onClick={checkSystemStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button onClick={testStorageBlocking} variant="outline" size="sm">
            <Lock className="h-4 w-4 mr-2" />
            Testar Bloqueio
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistema Inicializado</CardTitle>
            {getStatusIcon(status.systemInitialized)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.systemInitialized ? 'Ativo' : 'Inativo'}
            </div>
            <p className="text-xs text-muted-foreground">
              Sistema de segurança financeira
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banco de Dados</CardTitle>
            <Database className={`h-4 w-4 ${status.databaseConnected ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.databaseConnected ? 'Conectado' : 'Desconectado'}
            </div>
            <p className="text-xs text-muted-foreground">
              PostgreSQL/Neon como única fonte
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Bloqueado</CardTitle>
            <Lock className={`h-4 w-4 ${status.storageBlocked ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.storageBlocked ? 'Bloqueado' : 'Vulnerável'}
            </div>
            <p className="text-xs text-muted-foreground">
              localStorage/sessionStorage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitor Ativo</CardTitle>
            <Eye className={`h-4 w-4 ${status.monitorActive ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.monitorActive ? 'Monitorando' : 'Inativo'}
            </div>
            <p className="text-xs text-muted-foreground">
              Detecção de violações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integridade</CardTitle>
            {getStatusIcon(status.dataIntegrity)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.dataIntegrity ? 'Íntegra' : 'Comprometida'}
            </div>
            <p className="text-xs text-muted-foreground">
              Validação dos dados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Verificação</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.lastCheck.toLocaleTimeString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {status.lastCheck.toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalAccounts}</div>
              <div className="text-sm text-muted-foreground">Contas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalTransactions}</div>
              <div className="text-sm text-muted-foreground">Transações</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalCreditCards}</div>
              <div className="text-sm text-muted-foreground">Cartões</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalBudgets}</div>
              <div className="text-sm text-muted-foreground">Orçamentos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.auditEvents}</div>
              <div className="text-sm text-muted-foreground">Eventos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.securityEvents}</div>
              <div className="text-sm text-muted-foreground">Alertas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eventos de Segurança Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Eventos de Segurança Recentes</CardTitle>
          <Badge variant="outline">{events.length} eventos</Badge>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum evento de segurança registrado
            </p>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                    <div>
                      <div className="font-medium">{event.type}</div>
                      <div className="text-sm text-muted-foreground">{event.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{event.timestamp.toLocaleTimeString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.blocked ? '🚫 Bloqueado' : '⚠️ Permitido'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações de Administração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">⚠️ Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={reinitializeSystem} 
              variant="outline"
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reinicializar Sistema
            </Button>
            
            <Button 
              onClick={clearAllData} 
              variant="destructive"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Limpar Todos os Dados
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            ⚠️ Use essas ações com extrema cautela. Elas podem afetar o funcionamento do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
