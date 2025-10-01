export interface SmartBudgetConfig {
  totalIncome: number;
  fixedExpenses: number;
  savingsGoal: number; // Percentage of income
  emergencyFundTarget: number; // Months of expenses
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  priorities: BudgetPriority[];
  constraints: BudgetConstraint[];
}

export interface BudgetPriority {
  category: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  minAmount?: number;
  maxAmount?: number;
  isFlexible: boolean;
}

export interface BudgetConstraint {
  type: 'max_percentage' | 'min_amount' | 'max_amount' | 'ratio';
  category?: string;
  value: number;
  description: string;
}

export interface SmartBudgetRecommendation {
  category: string;
  recommendedAmount: number;
  currentAmount: number;
  difference: number;
  reasoning: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high';
  adjustmentType: 'increase' | 'decrease' | 'maintain';
}

export interface BudgetOptimization {
  totalSavings: number;
  recommendations: SmartBudgetRecommendation[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigation: string[];
  };
  projectedOutcomes: {
    monthlyBalance: number;
    yearlyBalance: number;
    emergencyFundCompletion: string;
    savingsGoalProgress: number;
  };
}

export interface SpendingPattern {
  category: string;
  averageMonthly: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: number; // -1 to 1, seasonal variation
  volatility: number; // 0-1, how much it varies
  predictability: number; // 0-1, how predictable it is
}

export interface BudgetAlert {
  id: string;
  type: 'overspending' | 'underspending' | 'trend_change' | 'opportunity';
  category: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
  amount?: number;
  percentage?: number;
  createdAt: string;
}

class SmartBudgetEngine {
  private readonly PATTERNS_KEY = 'sua-grana-spending-patterns';
  private readonly ALERTS_KEY = 'sua-grana-budget-alerts';

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private getStorageData<T>(key: string): T[] {
    if (!this.isClient()) return [];
    
    try {
      // Dados agora vêm apenas do banco de dados via API
      console.warn(`getStorageData(${key}) - localStorage removido, use banco de dados`);
      return [];
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return [];
    }
  }

  private setStorageData<T>(key: string, data: T[]): void {
    if (!this.isClient()) return;
    
    try {
      // Dados agora são salvos apenas no banco de dados via API
      console.warn(`setStorageData(${key}) - localStorage removido, use banco de dados`);
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  }

  // Analyze spending patterns from historical data
  analyzeSpendingPatterns(transactions: any[]): SpendingPattern[] {
    const categoryData: Record<string, number[]> = {};
    const monthlyData: Record<string, Record<string, number>> = {};

    // Group transactions by month and category
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const month = transaction.date.substring(0, 7); // YYYY-MM
        const category = transaction.category;

        if (!monthlyData[month]) {
          monthlyData[month] = {};
        }
        if (!monthlyData[month][category]) {
          monthlyData[month][category] = 0;
        }
        monthlyData[month][category] += transaction.amount;
      });

    // Calculate patterns for each category
    const patterns: SpendingPattern[] = [];
    const allCategories = new Set<string>();
    
    Object.values(monthlyData).forEach(monthData => {
      Object.keys(monthData).forEach(category => allCategories.add(category));
    });

    allCategories.forEach(category => {
      const monthlyAmounts: number[] = [];
      const months = Object.keys(monthlyData).sort();

      months.forEach(month => {
        monthlyAmounts.push(monthlyData[month][category] || 0);
      });

      if (monthlyAmounts.length >= 3) {
        const pattern = this.calculateSpendingPattern(category, monthlyAmounts);
        patterns.push(pattern);
      }
    });

    // Store patterns for future reference
    this.setStorageData(this.PATTERNS_KEY, patterns);

    return patterns;
  }

  private calculateSpendingPattern(category: string, amounts: number[]): SpendingPattern {
    const averageMonthly = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    // Calculate trend
    const trend = this.calculateTrend(amounts);
    
    // Calculate seasonality (simplified)
    const seasonality = this.calculateSeasonality(amounts);
    
    // Calculate volatility
    const volatility = this.calculateVolatility(amounts, averageMonthly);
    
    // Calculate predictability
    const predictability = Math.max(0, 1 - volatility);

    return {
      category,
      averageMonthly,
      trend,
      seasonality,
      volatility,
      predictability,
    };
  }

  private calculateTrend(amounts: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (amounts.length < 2) return 'stable';

    const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
    const secondHalf = amounts.slice(Math.floor(amounts.length / 2));

    const firstAvg = firstHalf.reduce((sum, amount) => sum + amount, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, amount) => sum + amount, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private calculateSeasonality(amounts: number[]): number {
    // Simplified seasonality calculation
    // In a real implementation, this would use more sophisticated time series analysis
    if (amounts.length < 12) return 0;

    const monthlyVariation = amounts.map((amount, index) => {
      const month = index % 12;
      return { month, amount };
    });

    // Group by month and calculate average
    const monthlyAverages: Record<number, number> = {};
    monthlyVariation.forEach(({ month, amount }) => {
      if (!monthlyAverages[month]) {
        monthlyAverages[month] = 0;
      }
      monthlyAverages[month] += amount;
    });

    // Calculate coefficient of variation
    const averages = Object.values(monthlyAverages);
    const mean = averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
    const variance = averages.reduce((sum, avg) => sum + Math.pow(avg - mean, 2), 0) / averages.length;
    const stdDev = Math.sqrt(variance);

    return mean > 0 ? Math.min(1, stdDev / mean) : 0;
  }

  private calculateVolatility(amounts: number[], average: number): number {
    if (amounts.length < 2) return 0;

    const variance = amounts.reduce((sum, amount) => {
      return sum + Math.pow(amount - average, 2);
    }, 0) / amounts.length;

    const stdDev = Math.sqrt(variance);
    return average > 0 ? Math.min(1, stdDev / average) : 0;
  }

  // Generate smart budget recommendations
  generateSmartBudget(config: SmartBudgetConfig, patterns: SpendingPattern[]): BudgetOptimization {
    const availableIncome = config.totalIncome - config.fixedExpenses;
    const targetSavings = config.totalIncome * (config.savingsGoal / 100);
    const availableForVariable = availableIncome - targetSavings;

    const recommendations: SmartBudgetRecommendation[] = [];

    // Apply 50/30/20 rule as base, then adjust based on patterns and priorities
    const baseAllocations = this.calculateBaseAllocations(config, availableForVariable);

    // Adjust based on spending patterns
    patterns.forEach(pattern => {
      const baseAmount = baseAllocations[pattern.category] || pattern.averageMonthly;
      const recommendation = this.generateCategoryRecommendation(
        pattern,
        baseAmount,
        config,
        availableForVariable
      );
      recommendations.push(recommendation);
    });

    // Handle categories not in patterns
    Object.entries(baseAllocations).forEach(([category, amount]) => {
      if (!patterns.find(p => p.category === category)) {
        recommendations.push({
          category,
          recommendedAmount: amount,
          currentAmount: 0,
          difference: amount,
          reasoning: 'Categoria nova baseada em alocação padrão',
          confidence: 0.6,
          priority: 'medium',
          adjustmentType: 'increase',
        });
      }
    });

    // Calculate risk assessment
    const riskAssessment = this.assessBudgetRisk(recommendations, config);

    // Calculate projected outcomes
    const projectedOutcomes = this.calculateProjectedOutcomes(recommendations, config);

    // Calculate total potential savings
    const totalSavings = recommendations.reduce((sum, rec) => {
      return sum + (rec.adjustmentType === 'decrease' ? Math.abs(rec.difference) : 0);
    }, 0);

    return {
      totalSavings,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      riskAssessment,
      projectedOutcomes,
    };
  }

  private calculateBaseAllocations(config: SmartBudgetConfig, availableAmount: number): Record<string, number> {
    const allocations: Record<string, number> = {};

    // Standard categories with default percentages
    const defaultCategories = {
      'Alimentação': 0.25,
      'Transporte': 0.15,
      'Entretenimento': 0.10,
      'Saúde': 0.10,
      'Educação': 0.08,
      'Vestuário': 0.07,
      'Casa': 0.15,
      'Outros': 0.10,
    };

    // Adjust based on risk tolerance
    const adjustmentFactor = this.getRiskAdjustmentFactor(config.riskTolerance);

    Object.entries(defaultCategories).forEach(([category, percentage]) => {
      allocations[category] = availableAmount * percentage * adjustmentFactor;
    });

    // Apply priority adjustments
    config.priorities.forEach(priority => {
      if (priority.importance === 'critical' && priority.minAmount) {
        allocations[priority.category] = Math.max(
          allocations[priority.category] || 0,
          priority.minAmount
        );
      }
    });

    return allocations;
  }

  private getRiskAdjustmentFactor(riskTolerance: string): number {
    switch (riskTolerance) {
      case 'conservative': return 0.8; // More conservative spending
      case 'moderate': return 1.0; // Standard allocation
      case 'aggressive': return 1.2; // More flexible spending
      default: return 1.0;
    }
  }

  private generateCategoryRecommendation(
    pattern: SpendingPattern,
    baseAmount: number,
    config: SmartBudgetConfig,
    availableAmount: number
  ): SmartBudgetRecommendation {
    let recommendedAmount = baseAmount;
    let reasoning = '';
    let confidence = 0.7;
    let priority: 'low' | 'medium' | 'high' = 'medium';

    // Adjust based on trend
    if (pattern.trend === 'increasing' && pattern.volatility < 0.3) {
      recommendedAmount = Math.min(pattern.averageMonthly * 1.1, baseAmount * 1.2);
      reasoning = 'Categoria com tendência de crescimento estável';
      confidence = 0.8;
    } else if (pattern.trend === 'decreasing') {
      recommendedAmount = Math.max(pattern.averageMonthly * 0.9, baseAmount * 0.8);
      reasoning = 'Categoria com tendência de redução';
      confidence = 0.8;
    }

    // Adjust based on volatility
    if (pattern.volatility > 0.5) {
      recommendedAmount *= 1.1; // Add buffer for volatile categories
      reasoning += ' (com buffer para volatilidade)';
      confidence *= 0.9;
    }

    // Apply priority constraints
    const priority_config = config.priorities.find(p => p.category === pattern.category);
    if (priority_config) {
      if (priority_config.importance === 'critical') {
        priority = 'high';
        if (priority_config.minAmount) {
          recommendedAmount = Math.max(recommendedAmount, priority_config.minAmount);
          reasoning += ' (categoria crítica)';
        }
      } else if (priority_config.importance === 'low') {
        priority = 'low';
        recommendedAmount *= 0.9;
        reasoning += ' (baixa prioridade)';
      }
    }

    // Apply constraints
    config.constraints.forEach(constraint => {
      if (constraint.category === pattern.category) {
        switch (constraint.type) {
          case 'max_amount':
            recommendedAmount = Math.min(recommendedAmount, constraint.value);
            break;
          case 'min_amount':
            recommendedAmount = Math.max(recommendedAmount, constraint.value);
            break;
          case 'max_percentage':
            recommendedAmount = Math.min(recommendedAmount, availableAmount * (constraint.value / 100));
            break;
        }
      }
    });

    const currentAmount = pattern.averageMonthly;
    const difference = recommendedAmount - currentAmount;
    const adjustmentType: 'increase' | 'decrease' | 'maintain' = 
      Math.abs(difference) < currentAmount * 0.05 ? 'maintain' :
      difference > 0 ? 'increase' : 'decrease';

    return {
      category: pattern.category,
      recommendedAmount,
      currentAmount,
      difference,
      reasoning,
      confidence,
      priority,
      adjustmentType,
    };
  }

  private assessBudgetRisk(
    recommendations: SmartBudgetRecommendation[],
    config: SmartBudgetConfig
  ): BudgetOptimization['riskAssessment'] {
    const factors: string[] = [];
    const mitigation: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for high volatility categories
    const highVolatilityCategories = recommendations.filter(r => r.confidence < 0.6);
    if (highVolatilityCategories.length > 0) {
      factors.push(`${highVolatilityCategories.length} categorias com alta volatilidade`);
      mitigation.push('Monitore gastos semanalmente nessas categorias');
      riskLevel = 'medium';
    }

    // Check for large increases
    const largeIncreases = recommendations.filter(r => 
      r.adjustmentType === 'increase' && Math.abs(r.difference) > r.currentAmount * 0.2
    );
    if (largeIncreases.length > 0) {
      factors.push(`${largeIncreases.length} categorias com aumentos significativos`);
      mitigation.push('Implemente aumentos gradualmente ao longo de 2-3 meses');
      riskLevel = 'medium';
    }

    // Check savings rate
    const totalRecommended = recommendations.reduce((sum, r) => sum + r.recommendedAmount, 0);
    const actualSavingsRate = ((config.totalIncome - config.fixedExpenses - totalRecommended) / config.totalIncome) * 100;
    
    if (actualSavingsRate < config.savingsGoal * 0.8) {
      factors.push('Meta de poupança pode não ser atingida');
      mitigation.push('Considere reduzir gastos em categorias de baixa prioridade');
      riskLevel = 'high';
    }

    // Check emergency fund
    if (config.emergencyFundTarget < 3) {
      factors.push('Fundo de emergência insuficiente');
      mitigation.push('Priorize construção do fundo de emergência');
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }

    return {
      level: riskLevel,
      factors,
      mitigation,
    };
  }

  private calculateProjectedOutcomes(
    recommendations: SmartBudgetRecommendation[],
    config: SmartBudgetConfig
  ): BudgetOptimization['projectedOutcomes'] {
    const totalRecommendedSpending = recommendations.reduce((sum, r) => sum + r.recommendedAmount, 0);
    const monthlyBalance = config.totalIncome - config.fixedExpenses - totalRecommendedSpending;
    const yearlyBalance = monthlyBalance * 12;

    // Calculate emergency fund completion
    const currentEmergencyFund = 0; // This should come from actual data
    const targetEmergencyFund = config.fixedExpenses * config.emergencyFundTarget;
    const monthsToComplete = targetEmergencyFund > 0 ? 
      Math.ceil((targetEmergencyFund - currentEmergencyFund) / (monthlyBalance * 0.5)) : 0;
    
    const emergencyFundCompletion = monthsToComplete > 0 ? 
      new Date(Date.now() + monthsToComplete * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
      'Já atingido';

    // Calculate savings goal progress
    const monthlySavings = monthlyBalance;
    const targetMonthlySavings = config.totalIncome * (config.savingsGoal / 100);
    const savingsGoalProgress = targetMonthlySavings > 0 ? 
      Math.min(100, (monthlySavings / targetMonthlySavings) * 100) : 100;

    return {
      monthlyBalance,
      yearlyBalance,
      emergencyFundCompletion,
      savingsGoalProgress,
    };
  }

  // Generate budget alerts
  generateBudgetAlerts(
    currentSpending: Record<string, number>,
    budgets: Record<string, number>,
    patterns: SpendingPattern[]
  ): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];

    // Check for overspending
    Object.entries(currentSpending).forEach(([category, spent]) => {
      const budget = budgets[category];
      if (budget && spent > budget * 0.9) {
        const severity = spent > budget ? 'high' : 'medium';
        alerts.push({
          id: `overspending-${category}-${Date.now()}`,
          type: 'overspending',
          category,
          severity,
          message: `Você gastou ${((spent / budget) * 100).toFixed(1)}% do orçamento de ${category}`,
          recommendation: spent > budget ? 
            'Pare os gastos nesta categoria pelo resto do mês' :
            'Monitore os gastos nesta categoria de perto',
          amount: spent,
          percentage: (spent / budget) * 100,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Check for significant underspending
    Object.entries(budgets).forEach(([category, budget]) => {
      const spent = currentSpending[category] || 0;
      const currentDay = new Date().getDate();
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const expectedSpending = budget * (currentDay / daysInMonth);

      if (spent < expectedSpending * 0.5 && currentDay > 15) {
        alerts.push({
          id: `underspending-${category}-${Date.now()}`,
          type: 'underspending',
          category,
          severity: 'low',
          message: `Você gastou apenas ${((spent / budget) * 100).toFixed(1)}% do orçamento de ${category}`,
          recommendation: 'Considere realocar parte deste orçamento para outras categorias ou poupança',
          amount: spent,
          percentage: (spent / budget) * 100,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Check for trend changes
    patterns.forEach(pattern => {
      const currentSpent = currentSpending[pattern.category] || 0;
      const expectedSpent = pattern.averageMonthly;
      const deviation = Math.abs(currentSpent - expectedSpent) / expectedSpent;

      if (deviation > 0.3 && pattern.predictability > 0.7) {
        alerts.push({
          id: `trend-change-${pattern.category}-${Date.now()}`,
          type: 'trend_change',
          category: pattern.category,
          severity: 'medium',
          message: `Padrão de gastos em ${pattern.category} mudou significativamente`,
          recommendation: 'Analise o que causou esta mudança e ajuste seu orçamento se necessário',
          amount: currentSpent,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Store alerts
    this.setStorageData(this.ALERTS_KEY, alerts);

    return alerts;
  }

  // Get stored alerts
  getBudgetAlerts(): BudgetAlert[] {
    return this.getStorageData<BudgetAlert>(this.ALERTS_KEY);
  }

  // Clear old alerts
  clearOldAlerts(daysOld = 30): void {
    const alerts = this.getBudgetAlerts();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const filteredAlerts = alerts.filter(alert => 
      new Date(alert.createdAt) > cutoffDate
    );

    this.setStorageData(this.ALERTS_KEY, filteredAlerts);
  }

  // Optimize budget allocation
  optimizeBudgetAllocation(
    totalAmount: number,
    categories: string[],
    constraints: BudgetConstraint[] = [],
    priorities: BudgetPriority[] = []
  ): Record<string, number> {
    const allocation: Record<string, number> = {};

    // Initialize with equal distribution
    const baseAmount = totalAmount / categories.length;
    categories.forEach(category => {
      allocation[category] = baseAmount;
    });

    // Apply constraints
    constraints.forEach(constraint => {
      if (constraint.category && allocation[constraint.category] !== undefined) {
        switch (constraint.type) {
          case 'min_amount':
            allocation[constraint.category] = Math.max(allocation[constraint.category], constraint.value);
            break;
          case 'max_amount':
            allocation[constraint.category] = Math.min(allocation[constraint.category], constraint.value);
            break;
          case 'max_percentage':
            allocation[constraint.category] = Math.min(allocation[constraint.category], totalAmount * (constraint.value / 100));
            break;
        }
      }
    });

    // Apply priorities
    priorities.forEach(priority => {
      if (allocation[priority.category] !== undefined) {
        const multiplier = this.getPriorityMultiplier(priority.importance);
        allocation[priority.category] *= multiplier;
      }
    });

    // Normalize to ensure total doesn't exceed available amount
    const currentTotal = Object.values(allocation).reduce((sum, amount) => sum + amount, 0);
    if (currentTotal > totalAmount) {
      const scaleFactor = totalAmount / currentTotal;
      Object.keys(allocation).forEach(category => {
        allocation[category] *= scaleFactor;
      });
    }

    return allocation;
  }

  private getPriorityMultiplier(importance: string): number {
    switch (importance) {
      case 'critical': return 1.5;
      case 'high': return 1.2;
      case 'medium': return 1.0;
      case 'low': return 0.8;
      default: return 1.0;
    }
  }
}

// Export singleton instance
export const smartBudgetEngine = new SmartBudgetEngine();
