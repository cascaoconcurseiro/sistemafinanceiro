'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <FileQuestion className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Página não encontrada
          </CardTitle>
          <CardDescription className="text-gray-600">
            A página que você está procurando não existe ou foi movida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-300 mb-2">404</div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Link href="/" className="w-full">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Ir para o Dashboard
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Páginas disponíveis:</p>
            <div className="mt-2 space-y-1">
              <Link href="/" className="block text-blue-600 hover:underline">
                Dashboard
              </Link>
              <Link href="/transactions" className="block text-blue-600 hover:underline">
                Transações
              </Link>
              <Link href="/goals" className="block text-blue-600 hover:underline">
                Metas
              </Link>
              <Link href="/trips" className="block text-blue-600 hover:underline">
                Viagens
              </Link>
              <Link href="/travel" className="block text-blue-600 hover:underline">
                Gestão de Viagens
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
