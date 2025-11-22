/**
 * Gerador de Insights Inteligentes
 * Analisa padrões financeiros e gera recomendações
 */

import { formatCurrency, formatPercent } from '../utils'

export interface Insight {
  id: string
  type: 'success' | 'warning' | 'info' | 'danger'
  title: string
  message: string
  action?: {
    label: string
    url: string
  }
  priority: number
  category: string
}

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  date: string
  categoryId: string
  description: string
}

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
}

/**
 * Calcula média de gastos
 */
function calculateAverage(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0
  const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  return total / transactions.length
}

/**
 * Pega transações do mês atual
 */
function getThisMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  return transactions.filter(t => {
    const date = new Date(t.date)
    return date >= startOfMonth
  })
}

/**
 * Pega transações do mês anterior
 */
function getLastMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  
  return transactions.filter(t => {
    const date = new Date(t.date)
    return date >= startOfLastMonth && date <= endOfLastMonth
  })
}

/**
 * Analisa crescimento por categoria
 */
function analyzeCategoryGrowth(
  transactions: Transaction[],
  categories: Category[]
): Array<{ id: string; name: string; growth: number; amount: number }> {
  const thisMonth = getThisMonthTransactions(transactions)
  const lastMonth = getLastMonthTransactions(transactions)
  
  const categoryGrowth = categories.map(category => {
    const thisMonthAmount = thisMonth
      .filter(t => t.categoryId === category.id)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const lastMonthAmount = lastMonth
      .filter(t => t.categoryId === category.id)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const growth = lastMonthAmount > 0
      ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
      : 0
    
    return {
      id: category.id,
      name: category.name,
      growth,
      amount: thisMonthAmount,
    }
  })
  
  return categoryGrowth.sort((a, b) => b.growth - a.growth)
}

/**
 * Encontra assinaturas
 */
function findSubscriptions(transactions: Transaction[]): Array<{
  description: string
  amount: number
  lastUse: number
}> {
  const subscriptionPatterns = /netflix|spotify|amazon|disney|youtube|apple|deezer|assinatura/i
  
  const subscriptions = transactions
    .filter(t => subscriptionPatterns.test(t.description))
    .map(t => ({
      description: t.description,
      amount: t.amount,
      lastUse: Math.floor((Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24)),
    }))
  
  return subscriptions
}

/**
 * Detecta gastos recorrentes
 */
function detectRecurringExpenses(transactions: Transaction[]): Array<{
  description: string
  amount: number
  frequency: number
}> {
  const expenseMap = new Map<string, number[]>()
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const key = t.description.toLowerCase().trim()
      if (!expenseMap.has(key)) {
        expenseMap.set(key, [])
      }
      expenseMap.get(key)!.push(t.amount)
    })
  
  const recurring = Array.from(expenseMap.entries())
    .filter(([_, amounts]) => amounts.length >= 3)
    .map(([description, amounts]) => ({
      description,
      amount: amounts.reduce((sum, a) => sum + a, 0) / amounts.length,
      frequency: amounts.length,
    }))
    .sort((a, b) => b.frequency - a.frequency)
  
  return recurring
}

/**
 * Gera insights baseados em transações
 */
export function generateInsights(
  transactions: Transaction[],
  categories: Category[]
): Insight[] {
  const insights: Insight[] = []
  let insightId = 1

  // 1. Gastos acima da média
  const expenses = transactions.filter(t => t.type === 'expense')
  const avgExpense = calculateAverage(expenses)
  const thisMonthExpenses = getThisMonthTransactions(expenses)
  const thisMonthTotal = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0)
  
  if (thisMonthTotal > avgExpense * 1.2) {
    const percentAbove = ((thisMonthTotal / avgExpense - 1) * 100)
    insights.push({
      id: `insight-${insightId++}`,
      type: 'warning',
      title: 'Gastos acima da média',
      message: `Você gastou ${formatCurrency(thisMonthTotal)} este mês, ${formatPercent(percentAbove)} acima da sua média de ${formatCurrency(avgExpense)}`,
      action: {
        label: 'Ver detalhes',
        url: '/reports/expenses',
      },
      priority: 9,
      category: 'spending',
    })
  }

  // 2. Categoria com maior crescimento
  const categoryGrowth = analyzeCategoryGrowth(transactions, categories)
  const topGrowth = categoryGrowth[0]
  
  if (topGrowth && topGrowth.growth > 50) {
    insights.push({
      id: `insight-${insightId++}`,
      type: 'info',
      title: `Gastos com ${topGrowth.name} aumentaram`,
      message: `Aumento de ${formatPercent(topGrowth.growth)} em relação ao mês passado (${formatCurrency(topGrowth.amount)})`,
      action: {
        label: 'Criar meta',
        url: `/goals/create?category=${topGrowth.id}`,
      },
      priority: 7,
      category: 'trends',
    })
  }

  // 3. Assinaturas não utilizadas
  const subscriptions = findSubscriptions(transactions)
  const unusedSubscriptions = subscriptions.filter(s => s.lastUse > 30)
  
  if (unusedSubscriptions.length > 0) {
    const totalSavings = unusedSubscriptions.reduce((sum, s) => sum + s.amount, 0)
    insights.push({
      id: `insight-${insightId++}`,
      type: 'success',
      title: 'Economize cancelando assinaturas',
      message: `${unusedSubscriptions.length} assinatura(s) não usada(s) há mais de 30 dias. Economia potencial: ${formatCurrency(totalSavings)}/mês`,
      action: {
        label: 'Ver assinaturas',
        url: '/subscriptions',
      },
      priority: 8,
      category: 'savings',
    })
  }

  // 4. Gastos recorrentes detectados
  const recurring = detectRecurringExpenses(transactions)
  if (recurring.length > 0) {
    const topRecurring = recurring[0]
    insights.push({
      id: `insight-${insightId++}`,
      type: 'info',
      title: 'Gasto recorrente detectado',
      message: `"${topRecurring.description}" aparece ${topRecurring.frequency}x. Média: ${formatCurrency(topRecurring.amount)}`,
      action: {
        label: 'Criar recorrência',
        url: '/transactions/recurring',
      },
      priority: 6,
      category: 'automation',
    })
  }

  // 5. Economia este mês
  const lastMonthExpenses = getLastMonthTransactions(expenses)
  const lastMonthTotal = lastMonthExpenses.reduce((sum, t) => sum + t.amount, 0)
  
  if (thisMonthTotal < lastMonthTotal * 0.9) {
    const saved = lastMonthTotal - thisMonthTotal
    const percentSaved = ((saved / lastMonthTotal) * 100)
    insights.push({
      id: `insight-${insightId++}`,
      type: 'success',
      title: 'Parabéns! Você economizou',
      message: `Você gastou ${formatPercent(percentSaved)} menos que o mês passado. Economia de ${formatCurrency(saved)}`,
      priority: 10,
      category: 'achievement',
    })
  }

  // 6. Alerta de gastos altos em um dia
  const dailyExpenses = new Map<string, number>()
  thisMonthExpenses.forEach(t => {
    const day = t.date.split('T')[0]
    dailyExpenses.set(day, (dailyExpenses.get(day) || 0) + t.amount)
  })
  
  const highestDay = Array.from(dailyExpenses.entries())
    .sort((a, b) => b[1] - a[1])[0]
  
  if (highestDay && highestDay[1] > avgExpense * 2) {
    insights.push({
      id: `insight-${insightId++}`,
      type: 'warning',
      title: 'Dia de gastos altos',
      message: `Em ${new Date(highestDay[0]).toLocaleDateString('pt-BR')}, você gastou ${formatCurrency(highestDay[1])}`,
      action: {
        label: 'Ver transações',
        url: `/transactions?date=${highestDay[0]}`,
      },
      priority: 5,
      category: 'alert',
    })
  }

  // Ordenar por prioridade
  return insights.sort((a, b) => b.priority - a.priority)
}

/**
 * Gera previsão de gastos para o próximo mês
 */
export function predictNextMonthExpenses(transactions: Transaction[]): {
  predicted: number
  confidence: number
  breakdown: Array<{ category: string; amount: number }>
} {
  const last3Months = transactions
    .filter(t => {
      const date = new Date(t.date)
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      return date >= threeMonthsAgo && t.type === 'expense'
    })
  
  const avgMonthly = calculateAverage(last3Months)
  
  // Calcular por categoria
  const categoryMap = new Map<string, number[]>()
  last3Months.forEach(t => {
    if (!categoryMap.has(t.categoryId)) {
      categoryMap.set(t.categoryId, [])
    }
    categoryMap.get(t.categoryId)!.push(t.amount)
  })
  
  const breakdown = Array.from(categoryMap.entries()).map(([category, amounts]) => ({
    category,
    amount: amounts.reduce((sum, a) => sum + a, 0) / amounts.length,
  }))
  
  return {
    predicted: avgMonthly,
    confidence: last3Months.length >= 30 ? 0.85 : 0.6,
    breakdown,
  }
}
