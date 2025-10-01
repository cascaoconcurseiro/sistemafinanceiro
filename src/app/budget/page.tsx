'use client';

export const dynamic = 'force-dynamic';

// 🎯 SISTEMA SIMPLIFICADO - Redirecionamento para página unificada
// Orçamento agora é gerenciado junto com Metas em /goals

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModernAppLayout } from '@/components/modern-app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ArrowRight, Calculator } from 'lucide-react';

export default function BudgetRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionamento automático após 3 segundos
    const timer = setTimeout(() => {
      router.push('/goals');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleRedirect = () => {
    router.push('/goals');
  };

  return (
    <ModernAppLayout
      title="Orçamento - Redirecionando"
      subtitle="Sistema Simplificado - Orçamento integrado às Metas"
    >
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">🎯 Sistema Simplificado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              **Orçamento** agora é gerenciado na página de **Metas**.
            </p>
            <p className="text-sm text-gray-600">
              Redirecionando automaticamente em 3 segundos...
            </p>
            <Button onClick={handleRedirect} className="w-full" size="lg">
              <ArrowRight className="mr-2 h-4 w-4" />
              Ir para Metas
            </Button>
            <div className="mt-4 p-3 bg-orange-50 rounded-lg text-sm">
              <p className="font-medium text-orange-800">
                📝 Todas as funcionalidades mantidas:
              </p>
              <ul className="text-orange-700 mt-2 text-left space-y-1">
                <li>• Limites de orçamento por categoria</li>
                <li>• Controle de gastos mensal</li>
                <li>• Análises e insights inteligentes</li>
                <li>• + Metas financeiras no mesmo local!</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernAppLayout>
  );
}
