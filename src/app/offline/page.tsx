'use client';

import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md">
        <WifiOff className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Você está offline
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="w-full"
        >
          Tentar Novamente
        </Button>
      </div>
    </div>
  );
}
