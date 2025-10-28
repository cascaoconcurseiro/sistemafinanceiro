'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Carregando...
          </h2>
          <p className="text-sm text-gray-600 text-center">
            Por favor, aguarde enquanto carregamos seus dados financeiros.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
