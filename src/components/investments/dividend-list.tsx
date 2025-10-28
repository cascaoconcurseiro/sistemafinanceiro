'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DIVIDEND_TYPE_LABELS } from '@/types/investment';

interface DividendListProps {
  userId: string;
}

export function DividendList({ userId }: DividendListProps) {
  const { data: dividends, isLoading } = useQuery({
    queryKey: ['dividends', userId],
    queryFn: async () => {
      const res = await fetch(`/api/investments/dividends?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch dividends');
      return res.json();
    }
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (!dividends || dividends.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Nenhum dividendo registrado</p>
          <p className="text-sm text-muted-foreground">
            Registre dividendos para acompanhar seus proventos
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Agrupar por mês
  const groupedByMonth = dividends.reduce((acc: any, div: any) => {
    const date = new Date(div.paymentDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        label: monthLabel,
        dividends: [],
        total: 0
      };
    }
    
    acc[monthKey].dividends.push(div);
    acc[monthKey].total += Number(div.netAmount);
    
    return acc;
  }, {});
  
  const months = Object.entries(groupedByMonth).sort((a, b) => b[0].localeCompare(a[0]));
  
  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(dividends.reduce((sum: number, d: any) => sum + Number(d.netAmount), 0))}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Proventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dividends.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(dividends.reduce((sum: number, d: any) => sum + Number(d.netAmount), 0) / months.length)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Lista por Mês */}
      <div className="space-y-4">
        {months.map(([key, data]: [string, any]) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">{data.label}</CardTitle>
                <Badge variant="secondary" className="text-lg font-bold">
                  {formatCurrency(data.total)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.dividends.map((dividend: any) => (
                  <div
                    key={dividend.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{dividend.investment?.ticker}</p>
                        <Badge variant="outline" className="text-xs">
                          {DIVIDEND_TYPE_LABELS[dividend.type as keyof typeof DIVIDEND_TYPE_LABELS]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dividend.investment?.name}
                      </p>
                      {dividend.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {dividend.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="font-bold text-green-600">
                        {formatCurrency(Number(dividend.netAmount))}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(dividend.paymentDate)}
                      </div>
                      {dividend.taxAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          IR: {formatCurrency(Number(dividend.taxAmount))}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
