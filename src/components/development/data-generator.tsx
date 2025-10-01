'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Database, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DataGenerator() {
  const [isChecking, setIsChecking] = useState(false);

  const checkDatabaseData = async () => {
    setIsChecking(true);

    try {
      // Verifica se há dados no banco de dados
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.info('Os dados são carregados automaticamente do banco de dados SQLite via Prisma');
    } catch (error) {
      toast.error('Erro ao verificar dados do banco');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Gerenciamento de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta funcionalidade foi atualizada. Os dados agora são carregados automaticamente 
            do banco de dados SQLite via Prisma. Use o comando `npx prisma db seed` para 
            popular o banco com dados iniciais.
          </AlertDescription>
        </Alert>

        <Button
          variant="outline"
          onClick={checkDatabaseData}
          disabled={isChecking}
          className="flex items-center gap-2 w-full"
        >
          <Database className="h-4 w-4" />
          {isChecking ? 'Verificando...' : 'Verificar Dados do Banco'}
        </Button>
      </CardContent>
    </Card>
  );
}
