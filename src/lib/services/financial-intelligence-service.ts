/**
 * SERVIÇO DE INTELIGÊNCIA FINANCEIRA
 * Categorização automática, previsões, alertas e sugestões
 */

interface Transaction {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  date: Date | string;
  type: string;
}

interface CategorySuggestion {
  categoryId: string;
  confidence: number; // 0-1
  reason: string;
}

interface SpendingAlert {
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  category?: string;
  amount?: number;
  percentage?: number;
}

interface SpendingPrediction {
  month: string;
  predictedAmount: number;
  confidence: number;
  breakdown: Record<string, number>;
}

interface SavingSuggestion {
  category: string;
  currentSpending: number;
  suggestedReduction: number;
  potentialSavings: number;
  tips: string[];
}

export class FinancialIntelligenceService {
  /**
   * 1. CATEGORIZAÇÃO AUTOMÁTICA
   * Sugere categoria baseada no histórico
   */
  static suggestCategory(
    description: string,
    transactions: Transaction[]
  ): CategorySuggestion | null {
    if (!description || transactions.length === 0) return null;

    const descLower = description.toLowerCase().trim();

    // Buscar transações similares
    const similar = transactions.filter((t) => {
      const tDescLower = t.description.toLowerCase().trim();
      
      // Correspondência exata
      if (tDescLower === descLower) return true;
      
      // Contém a descrição
      if (tDescLower.includes(descLower) || descLower.includes(tDescLower)) return true;
      
      // Palavras-chave comuns
      const descWords = descLower.split(/\s+/);
      const tWords = tDescLower.split(/\s+/);
      const commonWords = descWords.filter((w) => tWords.includes(w) && w.length > 3);
      
      return commonWords.length >= 2;
    });

    if (similar.length === 0) return null;

    // Contar categorias mais usadas
    const categoryCounts = similar.reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Categoria mais frequente
    const mostUsed = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
    const [categoryId, count] = mostUsed;

    // Calcular confiança
    const confidence = count / similar.length;

    return {
      categoryId,
      confidence,
      reason: `Usado ${count}x em transações similares`,
    };
  }

  /**
   * 2. PREVISÃO DE GASTOS
   * Prevê quanto você vai gastar no próximo mês
   */
  static predictNextMonthSpending(
    transactions: Transaction[],
    months: number = 3
  ): SpendingPrediction {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    // Filtrar transações dos últimos X meses
    const recentTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= cutoffDate && t.type === 'DESPESA';
    });

    if (recentTransactions.length === 0) {
      return {
        month: this.getNextMonthName(),
        predictedAmount: 0,
        confidence: 0,
        breakdown: {},
      };
    }

    // Calcular média mensal por categoria
    const categoryTotals: Record<string, number[]> = {};

    recentTransactions.forEach((t) => {
      const month = new Date(t.date).getMonth();
      const key = t.categoryId || 'sem-categoria';

      if (!categoryTotals[key]) {
        categoryTotals[key] = [];
      }
      categoryTotals[key].push(Math.abs(Number(t.amount)));
    });

    // Calcular média por categoria
    const breakdown: Record<string, number> = {};
    let totalPredicted = 0;

    Object.entries(categoryTotals).forEach(([categoryId, amounts]) => {
      const avg = amounts.reduce((sum, a) => sum + a, 0) / months;
      breakdown[categoryId] = Math.round(avg * 100) / 100;
      totalPredicted += breakdown[categoryId];
    });

    // Confiança baseada na consistência dos dados
    const confidence = Math.min(recentTransactions.length / 30, 1);

    return {
      month: this.getNextMonthName(),
      predictedAmount: Math.round(totalPredicted * 100) / 100,
      confidence,
      breakdown,
    };
  }

  /**
   * 3. ALERTAS INTELIGENTES
   * Detecta gastos anormais
   */
  static generateSpendingAlerts(
    transactions: Transaction[],
    currentMonth: Transaction[]
  ): SpendingAlert[] {
    const alerts: SpendingAlert[] = [];

    // Calcular média dos últimos 3 meses por categoria
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const historicalByCategory = transactions
      .filter((t) => new Date(t.date) >= threeMonthsAgo && t.type === 'DESPESA')
      .reduce((acc, t) => {
        const key = t.categoryId || 'sem-categoria';
        if (!acc[key]) acc[key] = [];
        acc[key].push(Math.abs(Number(t.amount)));
        return acc;
      }, {} as Record<string, number[]>);

    // Calcular gastos do mês atual por categoria
    const currentByCategory = currentMonth
      .filter((t) => t.type === 'DESPESA')
      .reduce((acc, t) => {
        const key = t.categoryId || 'sem-categoria';
        acc[key] = (acc[key] || 0) + Math.abs(Number(t.amount));
        return acc;
      }, {} as Record<string, number>);

    // Comparar e gerar alertas
    Object.entries(currentByCategory).forEach(([categoryId, currentAmount]) => {
      const historical = historicalByCategory[categoryId];
      if (!historical || historical.length === 0) return;

      const avgHistorical = historical.reduce((sum, a) => sum + a, 0) / 3;
      const difference = currentAmount - avgHistorical;
      const percentage = (difference / avgHistorical) * 100;

      // Alerta se gastar 30% a mais
      if (percentage > 30) {
        alerts.push({
          type: percentage > 50 ? 'danger' : 'warning',
          title: 'Gasto acima do normal',
          message: `Você gastou ${percentage.toFixed(0)}% a mais nesta categoria`,
          category: categoryId,
          amount: currentAmount,
          percentage,
        });
      }

      // Alerta se gastar muito pouco (pode ter esquecido de registrar)
      if (percentage < -50 && avgHistorical > 100) {
        alerts.push({
          type: 'info',
          title: 'Gasto abaixo do normal',
          message: `Você gastou ${Math.abs(percentage).toFixed(0)}% menos. Esqueceu de registrar algo?`,
          category: categoryId,
          amount: currentAmount,
          percentage,
        });
      }
    });

    // Alerta de gasto total alto
    const totalCurrent = Object.values(currentByCategory).reduce((sum, a) => sum + a, 0);
    const totalHistorical = Object.values(historicalByCategory)
      .flat()
      .reduce((sum, a) => sum + a, 0) / 3;

    if (totalCurrent > totalHistorical * 1.3) {
      const percentage = ((totalCurrent - totalHistorical) / totalHistorical) * 100;
      alerts.push({
        type: 'danger',
        title: '⚠️ Gastos muito altos este mês',
        message: `Você gastou ${percentage.toFixed(0)}% a mais que a média (R$ ${totalCurrent.toFixed(2)})`,
        amount: totalCurrent,
        percentage,
      });
    }

    return alerts;
  }

  /**
   * 4. SUGESTÕES DE ECONOMIA
   * Identifica onde você pode economizar
   */
  static generateSavingSuggestions(
    transactions: Transaction[],
    categories: Array<{ id: string; name: string }>
  ): SavingSuggestion[] {
    const suggestions: SavingSuggestion[] = [];

    // Últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExpenses = transactions.filter(
      (t) => new Date(t.date) >= thirtyDaysAgo && t.type === 'DESPESA'
    );

    // Agrupar por categoria
    const byCategory = recentExpenses.reduce((acc, t) => {
      const key = t.categoryId || 'sem-categoria';
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0, transactions: [] };
      }
      acc[key].total += Math.abs(Number(t.amount));
      acc[key].count += 1;
      acc[key].transactions.push(t);
      return acc;
    }, {} as Record<string, { total: number; count: number; transactions: Transaction[] }>);

    // Analisar cada categoria
    Object.entries(byCategory).forEach(([categoryId, data]) => {
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category?.name || 'Sem categoria';

      // Sugestão 1: Delivery/Restaurantes
      if (categoryName.toLowerCase().includes('alimentação') || 
          categoryName.toLowerCase().includes('restaurante')) {
        if (data.total > 500) {
          const reduction = data.total * 0.3; // 30% de redução
          suggestions.push({
            category: categoryName,
            currentSpending: data.total,
            suggestedReduction: reduction,
            potentialSavings: reduction,
            tips: [
              'Cozinhe em casa 2-3x por semana',
              'Prepare marmitas para o trabalho',
              'Use apps de cashback em delivery',
              `Economize até R$ ${reduction.toFixed(2)}/mês`,
            ],
          });
        }
      }

      // Sugestão 2: Transporte
      if (categoryName.toLowerCase().includes('transporte')) {
        if (data.total > 300) {
          const reduction = data.total * 0.25;
          suggestions.push({
            category: categoryName,
            currentSpending: data.total,
            suggestedReduction: reduction,
            potentialSavings: reduction,
            tips: [
              'Considere transporte público',
              'Carona solidária com colegas',
              'Bicicleta para trajetos curtos',
              `Economize até R$ ${reduction.toFixed(2)}/mês`,
            ],
          });
        }
      }

      // Sugestão 3: Assinaturas
      if (categoryName.toLowerCase().includes('assinatura') || 
          categoryName.toLowerCase().includes('streaming')) {
        if (data.count > 3) {
          suggestions.push({
            category: categoryName,
            currentSpending: data.total,
            suggestedReduction: data.total * 0.4,
            potentialSavings: data.total * 0.4,
            tips: [
              `Você tem ${data.count} assinaturas`,
              'Cancele as que não usa há 30 dias',
              'Compartilhe planos familiares',
              'Alterne entre serviços mensalmente',
            ],
          });
        }
      }

      // Sugestão 4: Gastos muito frequentes
      if (data.count > 20) {
        const avgPerTransaction = data.total / data.count;
        suggestions.push({
          category: categoryName,
          currentSpending: data.total,
          suggestedReduction: data.total * 0.2,
          potentialSavings: data.total * 0.2,
          tips: [
            `${data.count} transações em 30 dias (média R$ ${avgPerTransaction.toFixed(2)})`,
            'Tente reduzir a frequência',
            'Planeje compras maiores e menos frequentes',
            'Evite compras por impulso',
          ],
        });
      }
    });

    // Ordenar por potencial de economia
    return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * HELPERS
   */
  private static getNextMonthName(): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return months[next.getMonth()];
  }

  /**
   * ANÁLISE COMPLETA
   * Retorna todas as análises de uma vez
   */
  static analyzeFinances(
    transactions: Transaction[],
    categories: Array<{ id: string; name: string }>
  ) {
    const now = new Date();
    const currentMonth = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === now.getMonth() && 
             tDate.getFullYear() === now.getFullYear();
    });

    return {
      prediction: this.predictNextMonthSpending(transactions),
      alerts: this.generateSpendingAlerts(transactions, currentMonth),
      suggestions: this.generateSavingSuggestions(transactions, categories),
    };
  }
}
