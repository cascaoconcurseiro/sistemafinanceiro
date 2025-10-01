export interface FinancialInsight {
  id: string;
  type: 'spending_pattern' | 'saving_opportunity' | 'budget_alert' | 'investment_suggestion' | 'risk_assessment';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  actionable: boolean;
  category?: string;
  amount?: number;
  timestamp: string;
}

export interface SpendingPattern {
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  averageAmount: number;
  frequency: number;
  seasonality?: string;
  prediction: number;
}

export interface BudgetRecommendation {
  category: string;
  currentBudget: number;
  recommendedBudget: number;
  reason: string;
  potentialSavings: number;
}

export interface InvestmentSuggestion {
  type: 'emergency_fund' | 'retirement' | 'short_term' | 'long_term';
  amount: number;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
}

class AdvancedAIEngine {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Analyze spending patterns using simple statistical methods
  analyzeSpendingPatterns(transactions: any[]): SpendingPattern[] {
    const categoryGroups = this.groupTransactionsByCategory(transactions);
    const patterns: SpendingPattern[] = [];

    for (const [category, categoryTransactions] of Object.entries(categoryGroups)) {
      const amounts = categoryTransactions.map((t: any) => Math.abs(t.amount));
      const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      
      // Simple trend analysis (last 30 days vs previous 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentTransactions = categoryTransactions.filter((t: any) => 
        new Date(t.date) >= thirtyDaysAgo
      );
      const previousTransactions = categoryTransactions.filter((t: any) => 
        new Date(t.date) >= sixtyDaysAgo && new Date(t.date) < thirtyDaysAgo
      );

      const recentAvg = recentTransactions.length > 0 
        ? recentTransactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) / recentTransactions.length
        : 0;
      const previousAvg = previousTransactions.length > 0
        ? previousTransactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) / previousTransactions.length
        : 0;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentAvg > previousAvg * 1.1) trend = 'increasing';
      else if (recentAvg < previousAvg * 0.9) trend = 'decreasing';

      patterns.push({
        category,
        trend,
        averageAmount,
        frequency: categoryTransactions.length,
        prediction: this.predictNextMonthSpending(categoryTransactions),
      });
    }

    return patterns;
  }

  // Generate financial insights based on transaction data
  generateInsights(transactions: any[], accounts: any[]): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const patterns = this.analyzeSpendingPatterns(transactions);

    // Spending pattern insights
    patterns.forEach(pattern => {
      if (pattern.trend === 'increasing' && pattern.averageAmount > 100) {
        insights.push({
          id: this.generateId(),
          type: 'spending_pattern',
          title: `Aumento nos gastos em ${pattern.category}`,
          description: `Seus gastos em ${pattern.category} aumentaram ${((pattern.prediction / pattern.averageAmount - 1) * 100).toFixed(1)}% no último mês.`,
          impact: pattern.averageAmount > 500 ? 'high' : 'medium',
          confidence: 0.8,
          actionable: true,
          category: pattern.category,
          amount: pattern.averageAmount,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Budget alerts
    const budgetAlerts = this.generateBudgetAlerts(transactions);
    insights.push(...budgetAlerts);

    // Saving opportunities
    const savingOpportunities = this.identifySavingOpportunities(transactions);
    insights.push(...savingOpportunities);

    // Investment suggestions
    const investmentSuggestions = this.generateInvestmentSuggestions(accounts, transactions);
    insights.push(...investmentSuggestions);

    return insights.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 };
      return impactWeight[b.impact] - impactWeight[a.impact];
    });
  }

  private groupTransactionsByCategory(transactions: any[]): Record<string, any[]> {
    return transactions.reduce((groups, transaction) => {
      const category = transaction.category || 'Outros';
      if (!groups[category]) groups[category] = [];
      groups[category].push(transaction);
      return groups;
    }, {});
  }

  private predictNextMonthSpending(categoryTransactions: any[]): number {
    if (categoryTransactions.length === 0) return 0;

    // Simple moving average prediction
    const recentTransactions = categoryTransactions
      .filter(t => new Date(t.date) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .map(t => Math.abs(t.amount));

    return recentTransactions.reduce((sum, amount) => sum + amount, 0) / 3; // 3 months average
  }

  private generateBudgetAlerts(transactions: any[]): FinancialInsight[] {
    const alerts: FinancialInsight[] = [];
    const monthlySpending = this.calculateMonthlySpending(transactions);

    // Check for categories with high spending
    Object.entries(monthlySpending).forEach(([category, amount]) => {
      if (amount > 1000) {
        alerts.push({
          id: this.generateId(),
          type: 'budget_alert',
          title: `Alto gasto em ${category}`,
          description: `Você gastou R$ ${amount.toFixed(2)} em ${category} este mês.`,
          impact: amount > 2000 ? 'high' : 'medium',
          confidence: 0.9,
          actionable: true,
          category,
          amount,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return alerts;
  }

  private identifySavingOpportunities(transactions: any[]): FinancialInsight[] {
    const opportunities: FinancialInsight[] = [];
    const subscriptions = this.identifySubscriptions(transactions);

    subscriptions.forEach(sub => {
      if (sub.frequency > 1) {
        opportunities.push({
          id: this.generateId(),
          type: 'saving_opportunity',
          title: `Possível assinatura duplicada`,
          description: `Detectamos múltiplas cobranças similares de R$ ${sub.amount.toFixed(2)}. Verifique se não há assinaturas duplicadas.`,
          impact: 'medium',
          confidence: 0.7,
          actionable: true,
          amount: sub.amount * sub.frequency,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return opportunities;
  }

  private generateInvestmentSuggestions(
    accounts: any[], 
    transactions: any[], 
    getAccountBalance?: (accountId: string) => number
  ): FinancialInsight[] {
    const suggestions: FinancialInsight[] = [];
    
    // Calculate total balance using getAccountBalance if provided, otherwise fallback to account.balance
    const totalBalance = getAccountBalance 
      ? accounts.reduce((sum, account) => sum + getAccountBalance(account.id), 0)
      : accounts.reduce((sum, account) => sum + account.balance, 0);
      
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const monthlySurplus = monthlyIncome - monthlyExpenses;

    // Emergency fund suggestion
    const emergencyFundTarget = monthlyExpenses * 6;
    if (totalBalance < emergencyFundTarget) {
      suggestions.push({
        id: this.generateId(),
        type: 'investment_suggestion',
        title: 'Reserva de emergência insuficiente',
        description: `Recomendamos ter 6 meses de gastos (R$ ${emergencyFundTarget.toFixed(2)}) como reserva de emergência.`,
        impact: 'high',
        confidence: 0.9,
        actionable: true,
        amount: emergencyFundTarget - totalBalance,
        timestamp: new Date().toISOString(),
      });
    }

    // Investment suggestion for surplus
    if (monthlySurplus > 500) {
      suggestions.push({
        id: this.generateId(),
        type: 'investment_suggestion',
        title: 'Oportunidade de investimento',
        description: `Com uma sobra mensal de R$ ${monthlySurplus.toFixed(2)}, considere investir em renda fixa ou variável.`,
        impact: 'medium',
        confidence: 0.8,
        actionable: true,
        amount: monthlySurplus,
        timestamp: new Date().toISOString(),
      });
    }

    return suggestions;
  }

  private calculateMonthlySpending(transactions: any[]): Record<string, number> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyTransactions = transactions.filter(t => 
      new Date(t.date) >= firstDayOfMonth && t.amount < 0
    );

    return this.groupTransactionsByCategory(monthlyTransactions)
      .reduce((spending: Record<string, number>, [category, categoryTransactions]) => {
        spending[category] = categoryTransactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
        return spending;
      }, {});
  }

  private calculateMonthlyIncome(transactions: any[]): number {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions
      .filter(t => new Date(t.date) >= firstDayOfMonth && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private calculateMonthlyExpenses(transactions: any[]): number {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions
      .filter(t => new Date(t.date) >= firstDayOfMonth && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  private identifySubscriptions(transactions: any[]): Array<{amount: number, frequency: number}> {
    const subscriptions: Record<string, {amount: number, count: number}> = {};
    
    transactions.forEach(t => {
      if (t.amount < 0) {
        const amount = Math.abs(t.amount);
        const key = amount.toFixed(2);
        
        if (!subscriptions[key]) {
          subscriptions[key] = {amount, count: 0};
        }
        subscriptions[key].count++;
      }
    });

    return Object.values(subscriptions)
      .filter(sub => sub.count >= 2)
      .map(sub => ({amount: sub.amount, frequency: sub.count}));
  }

  // Generate budget recommendations
  generateBudgetRecommendations(transactions: any[], currentBudgets: Record<string, number>): BudgetRecommendation[] {
    const recommendations: BudgetRecommendation[] = [];
    const patterns = this.analyzeSpendingPatterns(transactions);

    patterns.forEach(pattern => {
      const currentBudget = currentBudgets[pattern.category] || 0;
      const recommendedBudget = pattern.prediction * 1.1; // 10% buffer

      if (Math.abs(currentBudget - recommendedBudget) > currentBudget * 0.2) {
        recommendations.push({
          category: pattern.category,
          currentBudget,
          recommendedBudget,
          reason: pattern.trend === 'increasing' 
            ? 'Gastos em tendência de alta'
            : pattern.trend === 'decreasing'
            ? 'Gastos em tendência de baixa'
            : 'Ajuste baseado no histórico',
          potentialSavings: Math.max(0, currentBudget - recommendedBudget),
        });
      }
    });

    return recommendations;
  }

  // Risk assessment
  assessFinancialRisk(
    accounts: any[], 
    transactions: any[], 
    getAccountBalance?: (accountId: string) => number
  ): {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high';
    factors: string[];
  } {
    const factors: string[] = [];
    let riskScore = 0;

    // Calculate total balance using getAccountBalance if provided, otherwise fallback to account.balance
    const totalBalance = getAccountBalance 
      ? accounts.reduce((sum, account) => sum + getAccountBalance(account.id), 0)
      : accounts.reduce((sum, account) => sum + account.balance, 0);
      
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const monthlyIncome = this.calculateMonthlyIncome(transactions);

    // Emergency fund ratio
    const emergencyFundRatio = totalBalance / (monthlyExpenses * 6);
    if (emergencyFundRatio < 0.5) {
      riskScore += 30;
      factors.push('Reserva de emergência insuficiente');
    } else if (emergencyFundRatio < 1) {
      riskScore += 15;
      factors.push('Reserva de emergência baixa');
    }

    // Income stability
    const incomeVariability = this.calculateIncomeVariability(transactions);
    if (incomeVariability > 0.3) {
      riskScore += 25;
      factors.push('Renda instável');
    }

    // Debt-to-income ratio (simplified)
    const debtAccounts = accounts.filter(acc => acc.balance < 0);
    const totalDebt = Math.abs(debtAccounts.reduce((sum, acc) => sum + acc.balance, 0));
    const debtToIncomeRatio = totalDebt / (monthlyIncome || 1);
    
    if (debtToIncomeRatio > 0.4) {
      riskScore += 35;
      factors.push('Alto nível de endividamento');
    } else if (debtToIncomeRatio > 0.2) {
      riskScore += 20;
      factors.push('Endividamento moderado');
    }

    // Spending trend
    const spendingTrend = this.calculateSpendingTrend(transactions);
    if (spendingTrend > 0.1) {
      riskScore += 10;
      factors.push('Gastos em alta');
    }

    const level = riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low';

    return {
      score: Math.min(100, riskScore),
      level,
      factors,
    };
  }

  private calculateIncomeVariability(transactions: any[]): number {
    const incomeTransactions = transactions.filter(t => t.amount > 0);
    if (incomeTransactions.length < 2) return 0;

    const amounts = incomeTransactions.map(t => t.amount);
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);

    return standardDeviation / mean; // Coefficient of variation
  }

  private calculateSpendingTrend(transactions: any[]): number {
    const expenseTransactions = transactions
      .filter(t => t.amount < 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (expenseTransactions.length < 4) return 0;

    const firstHalf = expenseTransactions.slice(0, Math.floor(expenseTransactions.length / 2));
    const secondHalf = expenseTransactions.slice(Math.floor(expenseTransactions.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, t) => sum + Math.abs(t.amount), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, t) => sum + Math.abs(t.amount), 0) / secondHalf.length;

    return (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
  }
}

// Export singleton instance
export const advancedAIEngine = new AdvancedAIEngine();
