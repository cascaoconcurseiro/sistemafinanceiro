'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CashFlowProjectionSummary, CashFlowProjectionItem } from '@/lib/services/cash-flow-projection-service';

// ============================================
// TIPOS
// ============================================

interface CashFlowProjectionProps {
  userId: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CashFlowProjection({ userId }: CashFlowProjectionProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [projection, setProjection] = useState<CashFlowProjectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar projeção
  useEffect(() => {
    loadProjection();
  }, [period, userId]);

  const loadProjection = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/cash-flow/projection?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar projeção');
      }

      const data = await response.json();
      setProjection(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!projection) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho com Resumo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Projeção de Fluxo de Caixa
              </CardTitle>
              <CardDescription>
                Obrigações futuras e receitas esperadas
              </CardDescription>
            </div>

            {/* Seletor de Período */}
            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
              <TabsList>
                <TabsTrigger value="week">7 dias</TabsTrigger>
                <TabsTrigger value="month">30 dias</TabsTrigger>
                <TabsTrigger value="quarter">90 dias</TabsTrigger>
                <TabsTrigger value="year">1 ano</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Receitas */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Receitas Previstas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(projection.totalIncome)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Despesas */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Despesas Previstas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(projection.totalExpenses)}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            {/* Saldo Líquido */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                    <p
                      className={`text-2xl font-bold ${
                        projection.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(projection.netBalance)}
                    </p>
                  </div>
                  <DollarSign
                    className={`h-8 w-8 ${
                      projection.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens Projetados ({projection.items.length})</CardTitle>
          <CardDescription>
            Detalhamento de todas as obrigações e receitas futuras
          </CardDescription>
        </CardHeader>

        <CardContent>
          {projection.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma obrigação futura encontrada para este período
            </div>
          ) : (
            <div className="space-y-2">
              {projection.items.map((item) => (
                <ProjectionItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// COMPONENTE DE ITEM
// ============================================

function ProjectionItem({ item }: { item: CashFlowProjectionItem }) {
  const isIncome = item.type === 'RECEITA';

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        {/* Data */}
        <div className="text-sm text-muted-foreground min-w-[80px]">
          {format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}
        </div>

        {/* Descrição */}
        <div className="flex-1">
          <p className="font-medium">{item.description}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {item.category && <span>{item.category}</span>}
            {item.accountName && (
              <>
                <span>•</span>
                <span>{item.accountName}</span>
              </>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <Badge variant={getSourceVariant(item.source)}>
            {getSourceLabel(item.source)}
          </Badge>

          {item.status === 'confirmed' && (
            <Badge variant="outline">Confirmado</Badge>
          )}
        </div>

        {/* Valor */}
        <div
          className={`text-lg font-bold min-w-[120px] text-right ${
            isIncome ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isIncome ? '+' : '-'}
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(Math.abs(item.amount))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    installment: 'Parcela',
    scheduled: 'Agendada',
    invoice: 'Fatura',
    recurring: 'Recorrente',
  };

  return labels[source] || source;
}

function getSourceVariant(source: string): 'default' | 'secondary' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    installment: 'default',
    scheduled: 'secondary',
    invoice: 'outline',
    recurring: 'secondary',
  };

  return variants[source] || 'default';
}
