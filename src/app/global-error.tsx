'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Erro Crítico do Sistema
              </CardTitle>
              <CardDescription className="text-gray-600">
                Ocorreu um erro crítico na aplicação. Por favor, recarregue a página ou entre em contato com o suporte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-1">Detalhes do erro:</p>
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {error.digest}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button onClick={reset} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar Aplicação
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  Ir para Página Inicial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
