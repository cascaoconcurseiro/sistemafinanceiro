'use client';

import { useRealTimeSync } from '../hooks/useRealTimeSync';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Activity,
  Clock,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SyncStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export function SyncStatus({ showDetails = false, compact = false }: SyncStatusProps) {
  const { status, isEnabled, enableSync, disableSync, forceSync } = useRealTimeSync();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={status.isConnected ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          {status.isConnected ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          {status.isConnected ? 'Online' : 'Offline'}
        </Badge>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={forceSync}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sincronização em Tempo Real
          </div>
          
          <Badge 
            variant={status.isConnected ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {status.isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {status.isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Mensagens:</span>
              <span className="font-medium">{status.messagesReceived}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Última atualização:</span>
              <span className="font-medium">
                {status.lastUpdate 
                  ? formatDistanceToNow(status.lastUpdate, { 
                      addSuffix: true, 
                      locale: ptBR 
                    })
                  : 'Nunca'
                }
              </span>
            </div>
            
            {status.reconnectAttempts > 0 && (
              <div className="col-span-2 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">Tentativas de reconexão:</span>
                <span className="font-medium text-yellow-600">
                  {status.reconnectAttempts}
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={isEnabled ? disableSync : enableSync}
            className="flex items-center gap-2"
          >
            {isEnabled ? (
              <>
                <WifiOff className="h-4 w-4" />
                Desabilitar
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                Habilitar
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={forceSync}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Sincronizar Agora
          </Button>
        </div>
        
        {!status.isConnected && isEnabled && (
          <div className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <p className="font-medium text-yellow-800">Conexão perdida</p>
            <p className="text-yellow-700">
              Tentando reconectar automaticamente... Os dados serão sincronizados quando a conexão for restaurada.
            </p>
          </div>
        )}
        
        {status.isConnected && (
          <div className="text-sm text-muted-foreground bg-green-50 p-3 rounded-md border border-green-200">
            <p className="font-medium text-green-800">Sincronização ativa</p>
            <p className="text-green-700">
              Seus dados estão sendo sincronizados automaticamente em tempo real.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
