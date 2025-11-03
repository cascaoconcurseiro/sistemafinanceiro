/**
 * SISTEMA DE PREVISÃO DE GASTOS
 * Prevê gastos futuros baseado em histórico e padrões
 */

export interface SpendingPrediction {
  category: string;
  predictedAmount: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  historicalAverage: number;
  lastMonthAmount: number;
  reasoning: string[];
}

export interface MonthlyPrediction {
  month: string;
  year: number;
  totalPredicted: number;
  byCategory: SpendingPrediction[];
  confidence: number;
  warnings: PredictionWarning[];
}

export interface PredictionWarning {
  type: 'high_spending' | 'unusual_pattern' | 'budget_risk';
  category: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface HistoricalData {
  month: string;
  year: number;
  category: string;
  amount: number;
}

export class SpendingPredictor {
  /**
   * Prevê gastos para o próximo mês
   */
  predictNextMonth(historicalData: HistoricalData[], currentDate: Date = new Date()): MonthlyPrediction {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Agrupar por categoria
    const byCategory = this.groupByCategory(historicalData);
    
    // Prever para cada categoria
    const predictions: SpendingPrediction[] = [];
    
    for (const [category, data] of Object.entries(byCategory)) {
      const prediction = this.predictCategorySpending(category, data);
      predictions.push(prediction);
    }

    // Calcular total
    const totalPredicted = predictions.reduce((sum, p) => sum + p.predictedAmount, 0);
    
    // Calcular confiança geral
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

    // Gerar avisos
    const warnings = this.generateWarnings(predictions, historicalData);

    return {
      month: nextMonth.toLocaleString('pt-BR', { month: 'long' }),
      year: nextMonth.getFullYear(),
      totalPredicted,
      byCategory: predictions.sort((a, b) => b.predictedAmount - a.predictedAmount),
      confidence: avgConfidence,
      warnings,
    };
  }

  /**
   * Prevê gastos de uma categoria específica
   */
  private predictCategorySpending(category: string, data: HistoricalData[]): SpendingPrediction {
    // Ordenar por data
    const sorted = data.sort((a, b) => {
      const dateA = new Date(a.year, this.monthToNumber(a.month));
      const dateB = new Date(b.year, this.monthToNumber(b.month));
      return dateA.getTime() - dateB.getTime();
    });

    // Calcular média histórica
    const amounts = sorted.map(d => d.amount);
    const historicalAverage = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

    // Último mês
    const lastMonthAmount = amounts[amounts.length - 1] || 0;

    // Calcular tendência (últimos 3 meses vs 3 anteriores)
    const trend = this.calculateTrend(amounts);

    // Prever próximo valor usando média ponderada
    const predictedAmount = this.calculateWeightedPrediction(amounts, trend);

    // Calcular confiança baseado em consistência
    const confidence = this.calculateConfidence(amounts);

    // Gerar reasoning
    const reasoning = this.generateReasoning(
      category,
      historicalAverage,
      lastMonthAmount,
      predictedAmount,
      trend
    );

    return {
      category,
      predictedAmount,
      confidence,
      trend: trend.direction,
      trendPercentage: trend.percentage,
      historicalAverage,
      lastMonthAmount,
      reasoning,
    };
  }

  /**
   * Calcula tendência de gastos
   */
  private calculateTrend(amounts: number[]): { direction: 'increasing' | 'decreasing' | 'stable'; percentage: number } {
    if (amounts.length < 4) {
      return { direction: 'stable', percentage: 0 };
    }

    // Últimos 3 meses
    const recent = amounts.slice(-3);
    const recentAvg = recent.reduce((sum, a) => sum + a, 0) / recent.length;

    // 3 meses anteriores
    const previous = amounts.slice(-6, -3);
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, a) => sum + a, 0) / previous.length 
      : recentAvg;

    // Calcular variação percentual
    const percentage = previousAvg > 0 
      ? ((recentAvg - previousAvg) / previousAvg) * 100 
      : 0;

    // Determinar direção
    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(percentage) < 5) {
      direction = 'stable';
    } else if (percentage > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    return { direction, percentage: Math.abs(percentage) };
  }

  /**
   * Calcula previsão usando média ponderada
   */
  private calculateWeightedPrediction(
    amounts: number[],
    trend: { direction: string; percentage: number }
  ): number {
    if (amounts.length === 0) return 0;

    // Pesos: meses mais recentes têm mais peso
    const weights = amounts.map((_, i) => Math.pow(1.5, i));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Média ponderada
    const weightedAvg = amounts.reduce((sum, amount, i) => {
      return sum + (amount * weights[i]);
    }, 0) / totalWeight;

    // Ajustar pela tendência
    let prediction = weightedAvg;
    if (trend.direction === 'increasing') {
      prediction *= (1 + trend.percentage / 100);
    } else if (trend.direction === 'decreasing') {
      prediction *= (1 - trend.percentage / 100);
    }

    return Math.round(prediction * 100) / 100;
  }

  /**
   * Calcula confiança da previsão
   */
  private calculateConfidence(amounts: number[]): number {
    if (amounts.length < 2) return 0.3;

    // Calcular desvio padrão
    const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Coeficiente de variação
    const cv = avg > 0 ? stdDev / avg : 1;

    // Confiança inversamente proporcional à variação
    // CV baixo = alta confiança
    let confidence = Math.max(0.3, 1 - cv);

    // Ajustar pela quantidade de dados
    if (amounts.length < 3) confidence *= 0.7;
    else if (amounts.length < 6) confidence *= 0.85;

    return Math.min(0.95, confidence);
  }

  /**
   * Gera explicação da previsão
   */
  private generateReasoning(
    category: string,
    historicalAverage: number,
    lastMonthAmount: number,
    predictedAmount: number,
    trend: { direction: string; percentage: number }
  ): string[] {
    const reasoning: string[] = [];

    // Comparar com média
    const diffFromAvg = ((predictedAmount - historicalAverage) / historicalAverage) * 100;
    if (Math.abs(diffFromAvg) > 10) {
      reasoning.push(
        `Previsão ${diffFromAvg > 0 ? 'acima' : 'abaixo'} da média histórica (${Math.abs(diffFromAvg).toFixed(1)}%)`
      );
    } else {
      reasoning.push('Previsão próxima da média histórica');
    }

    // Tendência
    if (trend.direction === 'increasing') {
      reasoning.push(`Tendência de aumento de ${trend.percentage.toFixed(1)}%`);
    } else if (trend.direction === 'decreasing') {
      reasoning.push(`Tendência de redução de ${trend.percentage.toFixed(1)}%`);
    } else {
      reasoning.push('Gastos estáveis nos últimos meses');
    }

    // Comparar com último mês
    const diffFromLast = ((predictedAmount - lastMonthAmount) / lastMonthAmount) * 100;
    if (Math.abs(diffFromLast) > 15) {
      reasoning.push(
        `Variação de ${diffFromLast > 0 ? '+' : ''}${diffFromLast.toFixed(1)}% em relação ao último mês`
      );
    }

    return reasoning;
  }

  /**
   * Gera avisos baseados nas previsões
   */
  private generateWarnings(predictions: SpendingPrediction[], historicalData: HistoricalData[]): PredictionWarning[] {
    const warnings: PredictionWarning[] = [];

    for (const prediction of predictions) {
      // Aviso de gasto alto
      if (prediction.trend === 'increasing' && prediction.trendPercentage > 20) {
        warnings.push({
          type: 'high_spending',
          category: prediction.category,
          message: `Gastos com ${prediction.category} aumentando ${prediction.trendPercentage.toFixed(1)}%`,
          severity: prediction.trendPercentage > 40 ? 'high' : 'medium',
        });
      }

      // Aviso de padrão incomum
      if (prediction.confidence < 0.5) {
        warnings.push({
          type: 'unusual_pattern',
          category: prediction.category,
          message: `Padrão irregular em ${prediction.category} - previsão menos confiável`,
          severity: 'low',
        });
      }

      // Aviso de risco ao orçamento
      const avgSpending = prediction.historicalAverage;
      if (prediction.predictedAmount > avgSpending * 1.5) {
        warnings.push({
          type: 'budget_risk',
          category: prediction.category,
          message: `${prediction.category} pode ultrapassar 50% da média histórica`,
          severity: 'high',
        });
      }
    }

    return warnings.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Agrupa dados por categoria
   */
  private groupByCategory(data: HistoricalData[]): Record<string, HistoricalData[]> {
    const grouped: Record<string, HistoricalData[]> = {};
    
    for (const item of data) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }

    return grouped;
  }

  /**
   * Converte nome do mês para número
   */
  private monthToNumber(month: string): number {
    const months: Record<string, number> = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
      'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
      'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11,
    };
    return months[month.toLowerCase()] || 0;
  }
}
