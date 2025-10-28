'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  WifiOff, 
  RefreshCw, 
  Activity
} from 'lucide-react';

interface SyncStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export function SyncStatus({ showDetails = false, compact = false }: SyncStatusProps) {
  // Componente simplificado sem funcionalidades de sincronização
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant="secondary"
          className="flex items-center gap-1"
        >
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          disabled
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
            Sincronização Desabilitada
          </div>
          
          <Badge 
            variant="secondary"
            className="flex items-center gap-1"
          >
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md border">
          <p className="font-medium text-gray-800">Modo Offline</p>
          <p className="text-gray-700">
            A sincronização em tempo real foi desabilitada para melhor performance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}