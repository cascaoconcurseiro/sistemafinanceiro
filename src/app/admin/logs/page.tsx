'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

export default function LogsManagement() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Logs do Sistema</h1>
              <p className="text-sm text-muted-foreground">
                Visualizar logs de auditoria
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Logs Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Funcionalidade em desenvolvimento
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
