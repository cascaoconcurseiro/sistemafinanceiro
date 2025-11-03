'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart } from 'lucide-react';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { usePeriod } from '@/contexts/period-context';
import { formatCurrency } from '@/lib/utils/format-currency';

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  count: number;
}

export const CategoryAnalysisCard = memo(function CategoryAnalysisCard() {
  const { data, isLoading } = useUnifiedFinancial();
  const { transactions = [], categories: dbCategories = [] } = data || {};
  const { selectedMonth, selectedYear, getMonthName } = usePeriod();

  const categoryData = useMemo(() => {
    console.log('📊 [CategoryAnalysis] Analisando transações:', {
      total: transactions.length,
      selectedMonth,
      selectedYear,
      monthName: getMonthName(),
      sampleTransactions: transactions.slice(0, 5).map((t: any) => {
        const tDate = new Date(t.date);
        return {
          type: t.type,
          amount: t.amount,
          date: t.date,
          dateMonth: tDate.getMonth(),
          dateYear: tDate.getFullYear(),
          category: t.category,
          categoryId: t.categoryId
        };
      })
    });

    // Filtrar transações de despesa do período selecionado
    // ✅ CORREÇÃO: Aceitar ambos os formatos (minúsculo e maiúsculo)
    let expenseTransactions = transactions.filter((t: any) => {
      const transactionDate = new Date(t.date);
      const isExpense = t.type === 'expense' || t.type === 'DESPESA';
      const isInMonth = transactionDate.getMonth() === selectedMonth;
      const isInYear = transactionDate.getFullYear() === selectedYear;

      // Log detalhado para debug
      if (isExpense) {
        console.log('📊 [CategoryAnalysis] Verificando despesa:', {
          description: t.description,
          date: t.date,
          transactionMonth: transactionDate.getMonth(),
          transactionYear: transactionDate.getFullYear(),
          selectedMonth,
          selectedYear,
          isInMonth,
          isInYear,
          willInclude: isExpense && isInMonth && isInYear
        });
      }

      return isExpense && isInMonth && isInYear;
    });

    console.log('📊 [CategoryAnalysis] Despesas filtradas:', {
      count: expenseTransactions.length,
      sample: expenseTransactions.slice(0, 3).map((t: any) => ({
        type: t.type,
        amount: t.amount,
        date: t.date,
        category: t.category,
        categoryId: t.categoryId
      }))
    });

    // ✅ CORREÇÃO: Não usar fallback - se não há despesas, mostrar mensagem clara
    
    // Agrupar por categoria
    const categoryMap = new Map<string, { amount: number; count: number }>();

    expenseTransactions.forEach((t: any) => {
      // Buscar o nome da categoria pelo categoryId
      let categoryName = 'Outros';
      if (t.categoryId) {
        const category = dbCategories.find((c: any) => c.id === t.categoryId);
        categoryName = category?.name || 'Categoria não encontrada';
      } else if (t.category) {
        // Fallback para transações antigas que podem ter category em vez de categoryId
        categoryName = t.category;
      }

      // ✅ CORREÇÃO: Usar myShare para transações compartilhadas
      const transactionAmount = (t.isShared && t.myShare !== null && t.myShare !== undefined)
        ? Math.abs(Number(t.myShare))
        : Math.abs(t.amount);
      
      const existing = categoryMap.get(categoryName) || { amount: 0, count: 0 };
      categoryMap.set(categoryName, {
        amount: existing.amount + transactionAmount,
        count: existing.count + 1
      });
    });

    // Calcular total para percentuais
    const totalAmount = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0);

    // Converter para array e ordenar por valor
    const categories: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Mostrar apenas top 6

    return {
      categories,
      totalAmount,
      totalTransactions: expenseTransactions.length,
      isFromFallback: false // ✅ CORREÇÃO: Removido fallback, sempre mostrar período selecionado
    };
  }, [transactions, dbCategories, selectedMonth, selectedYear]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Gastos por Categoria
            <Badge variant="secondary">Carregando...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { categories, totalAmount, totalTransactions, isFromFallback } = categoryData;
  const monthName = getMonthName();

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Gastos por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PieChart className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 font-medium">
              Nenhuma despesa encontrada
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {isFromFallback
                ? 'Não há despesas nos últimos 30 dias'
                : `Não há despesas em ${monthName} ${selectedYear}`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Gastos por Categoria
          <Badge variant="secondary">
            {isFromFallback ? 'Últimos 30 dias' : monthName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
            {categories.map((category, index) => (
              <div key={category.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`
                      }}
                    />
                    <span className="font-medium text-sm">{category.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {category.count}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      {formatCurrency(category.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {category.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress
                  value={category.percentage}
                  className="h-2"
                  style={{
                    '--progress-background': `hsl(${(index * 60) % 360}, 70%, 50%)`
                  } as any}
                />
              </div>
            ))}

          {/* Aviso se usando fallback */}
          {isFromFallback && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ℹ️ Mostrando dados dos últimos 30 dias pois não há despesas em {monthName} {selectedYear}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
