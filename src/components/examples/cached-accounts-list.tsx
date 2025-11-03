/**
 * Exemplo de componente usando o sistema de cache inteligente
 * 
 * Este componente demonstra como usar o cache para melhorar performance
 */

'use client';

import React from 'react';
import { useCache, useAuthCache, useCacheStats } from '@/hooks/use-cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Trash2, BarChart3 } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export function CachedAccountsList() {
  // Hook de autenticação com cache
  const { isAuthenticated, isLoading: authLoading } = useAuthCache();
  
  // Hook de cache para dados de contas
  const {
    data: accounts,
    isLoading,
    error,
    refetch,
    invalidate,
    isFromCache
  } = useCache<Account[]>({
    key: 'accounts',
    fetcher: async () => {
      const response = await fetch('/api/accounts');
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      const result = await response.json();
      return result.accounts || [];
    },
    ttl: 30 * 60 * 1000, // 30 minutos
    tags: ['financial', 'accounts'],
    preload: ['transactions', 'categories'], // Pré-carregar dados relacionados
    backgroundUpdate: true
  });

  // Estatísticas do cache
  const cacheStats = useCacheStats();

  if (authLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Verificando autenticação...
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Você precisa estar logado para ver suas contas.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Erro ao carregar contas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message}
          </p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com controles de cache */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Minhas Contas
              {isFromCache && (
                <Badge variant="secondary" className="text-xs">
                  📦 Cache
                </Badge>
              )}
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </CardTitle>
            
            <div className="flex gap-2">
              <Button
                onClick={refetch}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
              
              <Button
                onClick={invalidate}
                variant="outline"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar Cache
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Estatísticas do cache */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {cacheStats.data.totalEntries}
              </div>
              <div className="text-xs text-muted-foreground">
                Itens em Cache
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(cacheStats.data.hitRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Taxa de Acerto
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {cacheStats.auth.authTokenExists ? '✓' : '✗'}
              </div>
              <div className="text-xs text-muted-foreground">
                Token Auth
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {cacheStats.data.totalHits}
              </div>
              <div className="text-xs text-muted-foreground">
                Cache Hits
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de contas */}
      {isLoading && !accounts ? (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Carregando contas...
          </CardContent>
        </Card>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                  <Badge variant="outline">{account.type}</Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: account.currency || 'BRL'
                  }).format(account.balance)}
                </div>
                
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  Saldo atual
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center p-6">
            <p className="text-muted-foreground">
              Nenhuma conta encontrada.
            </p>
            <Button onClick={refetch} className="mt-4">
              Recarregar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informações de debug do cache */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Debug do Cache
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div>
            <strong>Fonte dos dados:</strong> {isFromCache ? 'Cache Local' : 'API Network'}
          </div>
          <div>
            <strong>Status:</strong> {isLoading ? 'Carregando...' : 'Pronto'}
          </div>
          <div>
            <strong>Última atualização:</strong> {new Date().toLocaleTimeString()}
          </div>
          <div>
            <strong>Cache Stats:</strong> 
            {' '}Hits: {cacheStats.data.totalHits}, 
            {' '}Misses: {cacheStats.data.totalMisses},
            {' '}Rate: {(cacheStats.data.hitRate * 100).toFixed(1)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CachedAccountsList;