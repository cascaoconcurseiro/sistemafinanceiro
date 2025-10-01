import { Transaction } from '../hooks/use-unified-transactions';

export interface SmartSuggestion {
  id: string;
  type: 'category' | 'merchant' | 'amount' | 'recurring';
  title: string;
  description: string;
  confidence: number;
  data: any;
}

export class SmartSuggestionsEngine {
  private transactions: Transaction[] = [];

  constructor(transactions: Transaction[] = []) {
    this.transactions = transactions;
  }

  updateTransactions(transactions: Transaction[]) {
    this.transactions = transactions;
  }

  generateSuggestions(input: Partial<Transaction>): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Category suggestions based on description
    if (input.description) {
      const categorySuggestions = this.suggestCategories(input.description);
      suggestions.push(...categorySuggestions);
    }

    // Amount suggestions based on similar transactions
    if (input.description && !input.amount) {
      const amountSuggestions = this.suggestAmounts(input.description);
      suggestions.push(...amountSuggestions);
    }

    // Recurring transaction detection
    if (input.description) {
      const recurringSuggestions = this.detectRecurring(input.description);
      suggestions.push(...recurringSuggestions);
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private suggestCategories(description: string): SmartSuggestion[] {
    const categoryMap = new Map<string, number>();
    const normalizedDescription = description.toLowerCase();

    // Find similar transactions
    this.transactions.forEach(transaction => {
      const similarity = this.calculateSimilarity(
        normalizedDescription,
        transaction.description.toLowerCase()
      );

      if (similarity > 0.3) {
        const count = categoryMap.get(transaction.category) || 0;
        categoryMap.set(transaction.category, count + similarity);
      }
    });

    return Array.from(categoryMap.entries())
      .map(([category, score]) => ({
        id: `category-${category}`,
        type: 'category' as const,
        title: `Categoria: ${category}`,
        description: `Baseado em transações similares`,
        confidence: Math.min(score, 1),
        data: { category }
      }))
      .filter(suggestion => suggestion.confidence > 0.4)
      .slice(0, 3);
  }

  private suggestAmounts(description: string): SmartSuggestion[] {
    const normalizedDescription = description.toLowerCase();
    const amounts: number[] = [];

    this.transactions.forEach(transaction => {
      const similarity = this.calculateSimilarity(
        normalizedDescription,
        transaction.description.toLowerCase()
      );

      if (similarity > 0.5) {
        amounts.push(transaction.amount);
      }
    });

    if (amounts.length === 0) return [];

    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const mostCommonAmount = this.getMostCommon(amounts);

    const suggestions: SmartSuggestion[] = [];

    if (mostCommonAmount !== null) {
      suggestions.push({
        id: `amount-common-${mostCommonAmount}`,
        type: 'amount',
        title: `Valor mais comum: R$ ${mostCommonAmount.toFixed(2)}`,
        description: `Usado ${amounts.filter(a => a === mostCommonAmount).length} vezes`,
        confidence: 0.8,
        data: { amount: mostCommonAmount }
      });
    }

    if (Math.abs(avgAmount - (mostCommonAmount || 0)) > 0.01) {
      suggestions.push({
        id: `amount-avg-${avgAmount}`,
        type: 'amount',
        title: `Valor médio: R$ ${avgAmount.toFixed(2)}`,
        description: `Baseado em ${amounts.length} transações similares`,
        confidence: 0.6,
        data: { amount: avgAmount }
      });
    }

    return suggestions.slice(0, 2);
  }

  private detectRecurring(description: string): SmartSuggestion[] {
    const normalizedDescription = description.toLowerCase();
    const similarTransactions = this.transactions.filter(transaction =>
      this.calculateSimilarity(normalizedDescription, transaction.description.toLowerCase()) > 0.7
    );

    if (similarTransactions.length < 2) return [];

    // Check for monthly patterns
    const dates = similarTransactions.map(t => new Date(t.date || t.createdAt));
    const dayOfMonth = this.getMostCommonDayOfMonth(dates);

    if (dayOfMonth !== null) {
      return [{
        id: `recurring-${dayOfMonth}`,
        type: 'recurring',
        title: 'Transação recorrente detectada',
        description: `Geralmente ocorre no dia ${dayOfMonth} do mês`,
        confidence: 0.7,
        data: { dayOfMonth, frequency: 'monthly' }
      }];
    }

    return [];
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    const commonWords = words1.filter(word => 
      words2.some(w => w.includes(word) || word.includes(w))
    );

    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private getMostCommon<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;

    const frequency = new Map<T, number>();
    arr.forEach(item => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });

    let maxCount = 0;
    let mostCommon: T | null = null;

    frequency.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    });

    return mostCommon;
  }

  private getMostCommonDayOfMonth(dates: Date[]): number | null {
    const days = dates.map(date => date.getDate());
    return this.getMostCommon(days);
  }
}

export const smartSuggestions = new SmartSuggestionsEngine();
