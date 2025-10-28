'use client';

import { InstallmentsDebugPanel } from '@/components/debug/installments-debug-panel';

export default function InstallmentsDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Debug de Parcelamentos</h1>
        <p className="text-muted-foreground mt-2">
          Ferramenta de diagnóstico e limpeza de transações parceladas
        </p>
      </div>
      
      <InstallmentsDebugPanel />
    </div>
  );
}
