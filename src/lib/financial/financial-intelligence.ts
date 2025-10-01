export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyFundMonths: number;
  investmentAllocation: Record<string, number>;
  monthlyBurnRate: number;
  cashFlowTrend: 'positive' | 'negative' | 'stable';
}

export interface SpendingInsight {
  id: string;
  type: 'warning' | 'opportunity' | 'achievement' | 'trend';
  title: string;
  description: string;
  category?: string;
  amount?: number;
  percentage?: number;
  recommendation?: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  createdAt: string;
}

export interface BudgetAnalysis {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: 'under' | 'on-track' | 'over' | 'exceeded';
  trend: 'improving' | 'stable' | 'worsening';
  projectedEndOfMonth: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'emergency' | 'investment' | 'purchase' | 'debt' | 'other';
  priority: 'low' | 'medium' | 'high';
  monthlyContribution: number;
  projectedCompletion: string;
  status: 'on-track' | 'behind' | 'ahead' | 'completed';
}

export interface InvestmentRecommendation {
  type: 'stocks' | 'bonds' | 'real-estate' | 'crypto' | 'savings' | 'emergency-fund';
  allocation: number; // Percentage
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
  timeHorizon: 'short' | 'medium' | 'long';
}

export interface CashFlowPrediction {
  date: string;
  predictedIncome: number;
  predictedExpenses: number;
  predictedBalance: number;
  confidence: number; // 0-1
  factors: string[];
}

export interface FinancialHealthScore {
  overall: number; // 0-100
  breakdown: {
    budgeting: number;
    saving: number;
    investing: number;
    debtManagement: number;
    emergencyFund: number;
  };
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

class FinancialIntelligence {
  private readonly INSIGHTS_KEY = 'sua-grana-insights';
  private readonly GOALS_KEY = 'sua-grana-goals';

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private getStorageData<T>(key: string): T[] {
    // Dados agora vêm do banco de dados, não do localStorage
    console.warn(`getStorageData(${key}) - localStorage removido, use banco de dados`);
    return [];
  }

  private setStorageData<T>(key: string, data: T[]): void {
    // Dados agora são salvos no banco de dados, não no localStorage
    console.warn(`setStorageData(${key}) - localStorage removido, use banco de dados`);
  }

  // Financial Metrics Calculation
  calculateFinancialMetrics(transactions: any[], accounts: any[]): FinancialMetrics {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const last3Months = this.getLast3Months();
    
    // Calculate basic metrics
    const monthlyTransactions = transactions.filter(t => 
      t.date.startsWith(currentMonth)
    );
    
    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    // Calculate debt-to-income ratio
    const debtAccounts = accounts.filter(acc => acc.type === 'credit' && acc.balance < 0);
    const totalDebt = Math.abs(debtAccounts.reduce((sum, acc) => sum + acc.balance, 0));
    const debtToIncomeRatio = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0;
    
    // Calculate emergency fund months
    const emergencyFunds = accounts
      .filter(acc => acc.type === 'savings' || acc.name.toLowerCase().includes('emergência'))
      .reduce((sum, acc) => sum + acc.balance, 0);
    const emergencyFundMonths = totalExpenses > 0 ? emergencyFunds / totalExpenses : 0;
    
    // Investment allocation (simplified)
    const investmentAccounts = accounts.filter(acc => 
      acc.type === 'investment' || acc.name.toLowerCase().includes('investimento')
    );
    const investmentAllocation: Record<string, number> = {};
    investmentAccounts.forEach(acc => {
      investmentAllocation[acc.name] = acc.balance;
    });
    
    // Monthly burn rate
    const last3MonthsExpenses = transactions
      .filter(t => t.type === 'expense' && last3Months.includes(t.date.substring(0, 7)))
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyBurnRate = last3MonthsExpenses / 3;
    
    // Cash flow trend
    const cashFlowTrend = this.determineCashFlowTrend(transactions);
    
    return {
      totalIncome,
      totalExpenses,
      netWorth,
      savingsRate,
      debtToIncomeRatio,
      emergencyFundMonths,
      investmentAllocation,
      monthlyBurnRate,
      cashFlowTrend,
    };
  }

  // Spending Insights Generation
  generateSpendingInsights(transactions: any[], budgets: any[] = []): SpendingInsight[] {
    const insights: SpendingInsight[] = [];
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    // Analyze spending patterns
    const monthlyTransactions = transactions.filter(t => 
      t.type === 'expense' && t.date.startsWith(currentMonth)
    );
    
    // Category spending analysis
    const categorySpending: Record<string, number> = {};
    monthlyTransactions.forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });
    
    // Find highest spending categories
    const sortedCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    sortedCategories.forEach(([category, amount], index) => {
      if (index === 0) {
        insights.push({
          id: `top-spending-${Date.now()}`,
          type: 'trend',
          title: 'Maior Categoria de Gastos',
          description: `Você gastou R$ ${amount.toFixed(2)} em ${category} este mês`,
          category,
          amount,
          priority: 'medium',
          actionable: true,
          recommendation: `Considere revisar os gastos em ${category} para identificar oportunidades de economia`,
          createdAt: new Date().toISOString(),
        });
      }
    });
    
    // Budget analysis insights
    budgets.forEach(budget => {
      const spent = categorySpending[budget.category] || 0;
      const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      if (percentageUsed > 90) {
        insights.push({
          id: `budget-warning-${budget.category}-${Date.now()}`,
          type: 'warning',
          title: 'Orçamento Quase Esgotado',
          description: `Você já usou ${percentageUsed.toFixed(1)}% do orçamento de ${budget.category}`,
          category: budget.category,
          percentage: percentageUsed,
          priority: 'high',
          actionable: true,
          recommendation: 'Considere reduzir gastos nesta categoria pelo resto do mês',
          createdAt: new Date().toISOString(),
        });
      } else if (percentageUsed < 50 && new Date().getDate() > 20) {
        insights.push({
          id: `budget-opportunity-${budget.category}-${Date.now()}`,
          type: 'opportunity',
          title: 'Orçamento Subutilizado',
          description: `Você usou apenas ${percentageUsed.toFixed(1)}% do orçamento de ${budget.category}`,
          category: budget.category,
          percentage: percentageUsed,
          priority: 'low',
          actionable: true,
          recommendation: 'Você pode realocar parte deste orçamento para outras categorias ou poupança',
          createdAt: new Date().toISOString(),
        });
      }
    });
    
    // Unusual spending detection
    const lastMonthTransactions = transactions.filter(t => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return t.date.startsWith(lastMonth.toISOString().substring(0, 7));
    });
    
    const lastMonthSpending: Record<string, number> = {};
    lastMonthTransactions.forEach(t => {
      if (t.type === 'expense') {
        lastMonthSpending[t.category] = (lastMonthSpending[t.category] || 0) + t.amount;
      }
    });
    
    Object.entries(categorySpending).forEach(([category, currentAmount]) => {
      const lastAmount = lastMonthSpending[category] || 0;
      if (lastAmount > 0) {
        const increase = ((currentAmount - lastAmount) / lastAmount) * 100;
        
        if (increase > 50) {
          insights.push({
            id: `spending-increase-${category}-${Date.now()}`,
            type: 'warning',
            title: 'Aumento Significativo nos Gastos',
            description: `Seus gastos em ${category} aumentaram ${increase.toFixed(1)}% em relação ao mês passado`,
            category,
            percentage: increase,
            priority: 'medium',
            actionable: true,
            recommendation: 'Analise o que causou este aumento e considere ajustar seus hábitos de consumo',
            createdAt: new Date().toISOString(),
          });
        }
      }
    });
    
    return insights;
  }

  // Budget Analysis
  analyzeBudgets(transactions: any[], budgets: any[]): BudgetAnalysis[] {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyTransactions = transactions.filter(t => 
      t.type === 'expense' && t.date.startsWith(currentMonth)
    );
    
    const categorySpending: Record<string, number> = {};
    monthlyTransactions.forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });
    
    return budgets.map(budget => {
      const spent = categorySpending[budget.category] || 0;
      const remaining = Math.max(0, budget.amount - spent);
      const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      let status: BudgetAnalysis['status'] = 'under';
      if (percentageUsed >= 100) status = 'exceeded';
      else if (percentageUsed >= 90) status = 'over';
      else if (percentageUsed >= 70) status = 'on-track';
      
      // Calculate trend (simplified)
      const trend = this.calculateBudgetTrend(budget.category, transactions);
      
      // Project end of month spending
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const currentDay = new Date().getDate();
      const dailyAverage = spent / currentDay;
      const projectedEndOfMonth = dailyAverage * daysInMonth;
      
      return {
        category: budget.category,
        budgeted: budget.amount,
        spent,
        remaining,
        percentageUsed,
        status,
        trend,
        projectedEndOfMonth,
      };
    });
  }

  // Financial Goals Management
  getFinancialGoals(): FinancialGoal[] {
    return this.getStorageData<FinancialGoal>(this.GOALS_KEY);
  }

  addFinancialGoal(goal: Omit<FinancialGoal, 'id' | 'projectedCompletion' | 'status'>): FinancialGoal {
    const goals = this.getFinancialGoals();
    
    const newGoal: FinancialGoal = {
      ...goal,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      projectedCompletion: this.calculateProjectedCompletion(goal),
      status: this.calculateGoalStatus(goal),
    };
    
    goals.push(newGoal);
    this.setStorageData(this.GOALS_KEY, goals);
    
    return newGoal;
  }

  updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): FinancialGoal | null {
    const goals = this.getFinancialGoals();
    const goalIndex = goals.findIndex(g => g.id === id);
    
    if (goalIndex === -1) return null;
    
    goals[goalIndex] = {
      ...goals[goalIndex],
      ...updates,
    };
    
    // Recalculate status and projection
    goals[goalIndex].projectedCompletion = this.calculateProjectedCompletion(goals[goalIndex]);
    goals[goalIndex].status = this.calculateGoalStatus(goals[goalIndex]);
    
    this.setStorageData(this.GOALS_KEY, goals);
    return goals[goalIndex];
  }

  // Investment Recommendations
  generateInvestmentRecommendations(
    metrics: FinancialMetrics,
    riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  ): InvestmentRecommendation[] {
    const recommendations: InvestmentRecommendation[] = [];
    
    // Emergency fund recommendation
    if (metrics.emergencyFundMonths < 3) {
      recommendations.push({
        type: 'emergency-fund',
        allocation: 30,
        reasoning: 'Priorize construir um fundo de emergência de 3-6 meses de gastos',
        riskLevel: 'low',
        expectedReturn: 2,
        timeHorizon: 'short',
      });
    }
    
    // Based on risk tolerance
    switch (riskTolerance) {
      case 'conservative':
        recommendations.push(
          {
            type: 'savings',
            allocation: 40,
            reasoning: 'Investimentos seguros com liquidez para preservar capital',
            riskLevel: 'low',
            expectedReturn: 3,
            timeHorizon: 'short',
          },
          {
            type: 'bonds',
            allocation: 35,
            reasoning: 'Títulos do governo para renda fixa estável',
            riskLevel: 'low',
            expectedReturn: 5,
            timeHorizon: 'medium',
          },
          {
            type: 'stocks',
            allocation: 25,
            reasoning: 'Pequena exposição a ações para crescimento a longo prazo',
            riskLevel: 'medium',
            expectedReturn: 8,
            timeHorizon: 'long',
          }
        );
        break;
        
      case 'moderate':
        recommendations.push(
          {
            type: 'savings',
            allocation: 20,
            reasoning: 'Reserva de liquidez para oportunidades',
            riskLevel: 'low',
            expectedReturn: 3,
            timeHorizon: 'short',
          },
          {
            type: 'bonds',
            allocation: 30,
            reasoning: 'Base sólida de renda fixa',
            riskLevel: 'low',
            expectedReturn: 5,
            timeHorizon: 'medium',
          },
          {
            type: 'stocks',
            allocation: 40,
            reasoning: 'Crescimento através de ações diversificadas',
            riskLevel: 'medium',
            expectedReturn: 10,
            timeHorizon: 'long',
          },
          {
            type: 'real-estate',
            allocation: 10,
            reasoning: 'Diversificação através de fundos imobiliários',
            riskLevel: 'medium',
            expectedReturn: 7,
            timeHorizon: 'long',
          }
        );
        break;
        
      case 'aggressive':
        recommendations.push(
          {
            type: 'stocks',
            allocation: 60,
            reasoning: 'Foco em crescimento através de ações',
            riskLevel: 'high',
            expectedReturn: 12,
            timeHorizon: 'long',
          },
          {
            type: 'real-estate',
            allocation: 20,
            reasoning: 'Diversificação em fundos imobiliários',
            riskLevel: 'medium',
            expectedReturn: 8,
            timeHorizon: 'long',
          },
          {
            type: 'crypto',
            allocation: 10,
            reasoning: 'Pequena exposição a criptomoedas para alto potencial',
            riskLevel: 'high',
            expectedReturn: 15,
            timeHorizon: 'long',
          },
          {
            type: 'bonds',
            allocation: 10,
            reasoning: 'Estabilidade mínima com títulos',
            riskLevel: 'low',
            expectedReturn: 5,
            timeHorizon: 'medium',
          }
        );
        break;
    }
    
    return recommendations;
  }

  // Cash Flow Prediction
  predictCashFlow(transactions: any[], months: number = 6): CashFlowPrediction[] {
    const predictions: CashFlowPrediction[] = [];
    const monthlyData = this.getMonthlyAverages(transactions);
    
    let currentBalance = 0; // This should come from actual account balances
    
    for (let i = 1; i <= months; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const dateStr = futureDate.toISOString().substring(0, 7);
      
      const predictedIncome = monthlyData.averageIncome * (0.9 + Math.random() * 0.2); // Add some variance
      const predictedExpenses = monthlyData.averageExpenses * (0.9 + Math.random() * 0.2);
      const predictedBalance = currentBalance + predictedIncome - predictedExpenses;
      
      predictions.push({
        date: dateStr,
        predictedIncome,
        predictedExpenses,
        predictedBalance,
        confidence: Math.max(0.5, 1 - (i * 0.1)), // Confidence decreases over time
        factors: [
          'Baseado na média dos últimos 6 meses',
          'Considera variação sazonal',
          i > 3 ? 'Previsão de longo prazo - menor precisão' : 'Previsão de curto prazo',
        ],
      });
      
      currentBalance = predictedBalance;
    }
    
    return predictions;
  }

  // Financial Health Score
  calculateFinancialHealthScore(
    metrics: FinancialMetrics,
    goals: FinancialGoal[],
    budgetCompliance: number
  ): FinancialHealthScore {
    const scores = {
      budgeting: Math.min(100, budgetCompliance * 100),
      saving: Math.min(100, Math.max(0, metrics.savingsRate)),
      investing: this.calculateInvestmentScore(metrics),
      debtManagement: Math.max(0, 100 - metrics.debtToIncomeRatio),
      emergencyFund: Math.min(100, (metrics.emergencyFundMonths / 6) * 100),
    };
    
    const overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5;
    
    const recommendations: string[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Analyze each area
    if (scores.budgeting < 70) {
      weaknesses.push('Controle orçamentário');
      recommendations.push('Melhore o acompanhamento e controle do seu orçamento mensal');
    } else {
      strengths.push('Bom controle orçamentário');
    }
    
    if (scores.saving < 20) {
      weaknesses.push('Taxa de poupança');
      recommendations.push('Aumente sua taxa de poupança para pelo menos 20% da renda');
    } else {
      strengths.push('Boa capacidade de poupança');
    }
    
    if (scores.emergencyFund < 50) {
      weaknesses.push('Fundo de emergência');
      recommendations.push('Construa um fundo de emergência de 3-6 meses de gastos');
    } else {
      strengths.push('Fundo de emergência adequado');
    }
    
    if (scores.debtManagement < 70) {
      weaknesses.push('Gestão de dívidas');
      recommendations.push('Reduza sua relação dívida/renda para menos de 30%');
    } else {
      strengths.push('Boa gestão de dívidas');
    }
    
    return {
      overall,
      breakdown: scores,
      recommendations,
      strengths,
      weaknesses,
    };
  }

  // Helper Methods
  private getLast3Months(): string[] {
    const months: string[] = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().substring(0, 7));
    }
    return months;
  }

  private determineCashFlowTrend(transactions: any[]): 'positive' | 'negative' | 'stable' {
    const last3Months = this.getLast3Months();
    const monthlyNetFlow = last3Months.map(month => {
      const monthTransactions = transactions.filter(t => t.date.startsWith(month));
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return income - expenses;
    });
    
    const trend = monthlyNetFlow[0] - monthlyNetFlow[2]; // Current vs 3 months ago
    
    if (trend > 500) return 'positive';
    if (trend < -500) return 'negative';
    return 'stable';
  }

  private calculateBudgetTrend(category: string, transactions: any[]): 'improving' | 'stable' | 'worsening' {
    // Simplified trend calculation
    const currentMonth = new Date().toISOString().substring(0, 7);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().substring(0, 7);
    
    const currentSpending = transactions
      .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastSpending = transactions
      .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(lastMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (currentSpending < lastSpending * 0.9) return 'improving';
    if (currentSpending > lastSpending * 1.1) return 'worsening';
    return 'stable';
  }

  private calculateProjectedCompletion(goal: FinancialGoal): string {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return new Date().toISOString().split('T')[0];
    
    if (goal.monthlyContribution <= 0) return goal.targetDate;
    
    const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution);
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsNeeded);
    
    return projectedDate.toISOString().split('T')[0];
  }

  private calculateGoalStatus(goal: FinancialGoal): FinancialGoal['status'] {
    const progress = goal.currentAmount / goal.targetAmount;
    const targetDate = new Date(goal.targetDate);
    const today = new Date();
    const totalDays = targetDate.getTime() - new Date(goal.createdAt || today).getTime();
    const daysPassed = today.getTime() - new Date(goal.createdAt || today).getTime();
    const expectedProgress = daysPassed / totalDays;
    
    if (progress >= 1) return 'completed';
    if (progress > expectedProgress * 1.1) return 'ahead';
    if (progress < expectedProgress * 0.8) return 'behind';
    return 'on-track';
  }

  private getMonthlyAverages(transactions: any[]): { averageIncome: number; averageExpenses: number } {
    const last6Months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      last6Months.push(date.toISOString().substring(0, 7));
    }
    
    const monthlyData = last6Months.map(month => {
      const monthTransactions = transactions.filter(t => t.date.startsWith(month));
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return { income, expenses };
    });
    
    const averageIncome = monthlyData.reduce((sum, data) => sum + data.income, 0) / monthlyData.length;
    const averageExpenses = monthlyData.reduce((sum, data) => sum + data.expenses, 0) / monthlyData.length;
    
    return { averageIncome, averageExpenses };
  }

  private calculateInvestmentScore(metrics: FinancialMetrics): number {
    const totalInvestments = Object.values(metrics.investmentAllocation).reduce((sum, amount) => sum + amount, 0);
    const investmentRatio = metrics.netWorth > 0 ? (totalInvestments / metrics.netWorth) * 100 : 0;
    
    // Score based on investment ratio (target: 20-60% of net worth)
    if (investmentRatio >= 20 && investmentRatio <= 60) return 100;
    if (investmentRatio < 20) return (investmentRatio / 20) * 100;
    return Math.max(60, 100 - ((investmentRatio - 60) * 2));
  }
}

// Export singleton instance
export const financialIntelligence = new FinancialIntelligence();
