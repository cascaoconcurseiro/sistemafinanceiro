'use client';

import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2">
      <div className="flex items-center justify-center space-x-2 text-sm font-medium">
        <WifiOff className="h-4 w-4" />
        <span>Você está offline. Algumas funcionalidades podem estar limitadas.</span>
      </div>
    </div>
  );
}

export function OnlineIndicator() {
  // Componente desabilitado - não mostrar mensagens de conexão
  return null;
}
