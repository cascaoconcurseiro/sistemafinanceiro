/**
 * SISTEMA DE SUGESTÕES DE ECONOMIA
 * Analisa gastos e sugere formas de economizar
 */

export interface SavingSuggestion {
  id: string;
  type: 'reduce_spending' | 'eliminate_expense' | 'find_alternative' | 'optimize_timing' | 'negotiate';
  category: string;
  title: string;
  description: string;
  potentialSavings: number;
  savingsPercentage: number;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'low' | 'medium' | 'high';
  actionSteps: string[];
  impact: string;
}

export interface SpendingAnalysis {
  category: string;
  currentMonthly: number;
  averageMonthly: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageOfIncome: number;
  comparedToAverage: number;
}

export class SavingsSuggestionEngine {
  /**
   * Gera sugestões de economia baseadas nos gastos
   */
  generateSuggestions(
    spending: SpendingAnalysis[],
    monthlyIncome: number
  ): SavingSuggestion[] {
    const suggestions: SavingSuggestion[] = [];

    for (const category of spending) {
      // Sugestões para gastos altos
      if (category.percentageOfIncome > 15) {
        suggestions.push(...this.suggestReduceHighSpending(category, monthlyIncome));
      }

      // Sugestões para gastos crescentes
      if (category.trend === 'increasing' && category.comparedToAverage > 20) {
        suggestions.push(...this.suggestControlGrowth(category));
      }

      // Sugestões específicas por categoria
      suggestions.push(...this.suggestCategorySpecific(category));
    }

    // Ordenar por potencial de economia
    return suggestions
      .sort((a, b) => b.potentialSavings - a.potentialSavings)
      .slice(0, 10); // Top 10 sugestões
  }

  /**
   * Sugestões para reduzir gastos altos
   */
  private suggestReduceHighSpending(category: SpendingAnalysis, income: number): SavingSuggestion[] {
    const suggestions: SavingSuggestion[] = [];
    const targetReduction = 0.2; // 20% de redução

    suggestions.push({
      id: `reduce-${category.category}`,
      type: 'reduce_spending',
      category: category.category,
      title: `Reduzir gastos com ${category.category}`,
      description: `Seus gastos com ${category.category} representam ${category.percentageOfIncome.toFixed(1)}% da sua renda. Recomendamos reduzir para 10-12%.`,
      potentialSavings: category.currentMonthly * targetReduction,
      savingsPercentage: targetReduction * 100,
      difficulty: 'medium',
      priority: category.percentageOfIncome > 25 ? 'high' : 'medium',
      actionSteps: this.getActionSteps(category.category, 'reduce'),
      impact: `Economia de R$ ${(category.currentMonthly * targetReduction).toFixed(2)}/mês`,
    });

    return suggestions;
  }

  /**
   * Sugestões para controlar crescimento
   */
  private suggestControlGrowth(category: SpendingAnalysis): SavingSuggestion[] {
    const suggestions: SavingSuggestion[] = [];

    suggestions.push({
      id: `control-${category.category}`,
      type: 'reduce_spending',
      category: category.category,
      title: `Controlar crescimento em ${category.category}`,
      description: `Seus gastos com ${category.category} aumentaram ${category.comparedToAverage.toFixed(1)}% acima da média.`,
      potentialSavings: category.currentMonthly - category.averageMonthly,
      savingsPercentage: category.comparedToAverage,
      difficulty: 'easy',
      priority: 'medium',
      actionSteps: [
        'Revisar gastos recentes nesta categoria',
        'Identificar despesas não essenciais',
        'Estabelecer limite mensal',
        'Monitorar semanalmente',
      ],
      impact: `Voltar ao nível médio de gastos`,
    });

    return suggestions;
  }

  /**
   * Sugestões específicas por categoria
   */
  private suggestCategorySpecific(category: SpendingAnalysis): SavingSuggestion[] {
    const suggestions: SavingSuggestion[] = [];

    switch (category.category.toLowerCase()) {
      case 'alimentação':
      case 'supermercado':
        suggestions.push({
          id: `food-${Date.now()}`,
          type: 'find_alternative',
          category: category.category,
          title: 'Otimizar compras de supermercado',
          description: 'Planeje refeições e faça lista de compras para evitar desperdício',
          potentialSavings: category.currentMonthly * 0.15,
          savingsPercentage: 15,
          difficulty: 'easy',
          priority: 'medium',
          actionSteps: [
            'Fazer lista de compras semanal',
            'Comparar preços entre supermercados',
            'Comprar marcas próprias',
            'Evitar compras por impulso',
          ],
          impact: 'Economia de até 15% nas compras',
        });
        break;

      case 'transporte':
      case 'combustível':
        suggestions.push({
          id: `transport-${Date.now()}`,
          type: 'find_alternative',
          category: category.category,
          title: 'Alternativas de transporte',
          description: 'Considere transporte público ou carona para reduzir custos',
          potentialSavings: category.currentMonthly * 0.25,
          savingsPercentage: 25,
          difficulty: 'medium',
          priority: 'medium',
          actionSteps: [
            'Avaliar custo de transporte público',
            'Considerar carona solidária',
            'Otimizar rotas para economizar combustível',
            'Manter veículo bem mantido',
          ],
          impact: 'Economia de até 25% em transporte',
        });
        break;

      case 'lazer':
      case 'entretenimento':
        suggestions.push({
          id: `entertainment-${Date.now()}`,
          type: 'reduce_spending',
          category: category.category,
          title: 'Otimizar gastos com lazer',
          description: 'Busque alternativas gratuitas ou mais econômicas de entretenimento',
          potentialSavings: category.currentMonthly * 0.30,
          savingsPercentage: 30,
          difficulty: 'easy',
          priority: 'low',
          actionSteps: [
            'Cancelar assinaturas não utilizadas',
            'Buscar eventos gratuitos',
            'Aproveitar promoções',
            'Estabelecer orçamento mensal',
          ],
          impact: 'Economia de até 30% em lazer',
        });
        break;

      case 'restaurante':
      case 'delivery':
        suggestions.push({
          id: `dining-${Date.now()}`,
          type: 'reduce_spending',
          category: category.category,
          title: 'Reduzir pedidos de delivery',
          description: 'Cozinhar em casa pode economizar significativamente',
          potentialSavings: category.currentMonthly * 0.40,
          savingsPercentage: 40,
          difficulty: 'medium',
          priority: 'high',
          actionSteps: [
            'Planejar refeições da semana',
            'Cozinhar em maior quantidade',
            'Limitar delivery a 1-2x por semana',
            'Levar marmita para o trabalho',
          ],
          impact: 'Economia de até 40% em alimentação fora',
        });
        break;
    }

    return suggestions;
  }

  /**
   * Gera passos de ação baseados na categoria
   */
  private getActionSteps(category: string, type: string): string[] {
    const defaultSteps = [
      'Revisar gastos dos últimos 3 meses',
      'Identificar despesas desnecessárias',
      'Estabelecer meta de redução',
      'Monitorar progresso semanalmente',
    ];

    return defaultSteps;
  }
}
