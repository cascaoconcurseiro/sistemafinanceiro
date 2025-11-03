'use client';

/**
 * Sistema Inteligente de Notificações
 * Gera notificações baseadas em dados reais do usuário
 */

import type { Transaction, Account, Goal } from '../storage';

export interface SmartNotification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  category: 'budget' | 'goal' | 'bill' | 'investment' | 'general';
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  isRead: boolean;
  data?: any; // Dados extras para a notificação
}

export class SmartNotificationEngine {
  static generateNotifications(
    transactions: Transaction[],
    accounts: Account[],
    goals: Goal[]
  ): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    const now = new Date();

    // 1. Análise de Orçamento Mensal
    const monthlyBudgetNotifications = this.analyzeBudgetAlerts(
      transactions,
      now
    );
    notifications.push(...monthlyBudgetNotifications);

    // 2. Alertas de Metas
    const goalAlerts = this.analyzeGoalAlerts(goals, transactions, now);
    notifications.push(...goalAlerts);

    // 3. Análise de Contas/Saldos
    const accountAlerts = this.analyzeAccountAlerts(accounts);
    notifications.push(...accountAlerts);

    // 4. Padrões de Gastos Suspeitos
    const spendingAlerts = this.analyzeSpendingPatterns(transactions, now);
    notifications.push(...spendingAlerts);

    // 5. Oportunidades de Economia
    const savingOpportunities = this.analyzeSavingOpportunities(
      transactions,
      now
    );
    notifications.push(...savingOpportunities);

    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private static analyzeBudgetAlerts(
    transactions: Transaction[],
    now: Date
  ): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Transações do mês atual
    const currentMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const monthlyExpenses = currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const monthlyIncome = currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Orçamento estimado baseado na renda (80% da renda para gastos)
    const estimatedBudget = monthlyIncome * 0.8;

    if (monthlyExpenses > estimatedBudget && monthlyIncome > 0) {
      notifications.push({
        id: `budget-exceeded-${now.getTime()}`,
        type: 'warning',
        category: 'budget',
        title: '⚠️ Orçamento Excedido',
        message: `Você gastou R$ ${monthlyExpenses.toFixed(2)} este mês, ${((monthlyExpenses / estimatedBudget - 1) * 100).toFixed(1)}% acima do recomendado.`,
        actionLabel: 'Ver Orçamento',
        actionUrl: '/budget',
        priority: 'high',
        createdAt: now,
        isRead: false,
      });
    }

    return notifications;
  }

  private static analyzeGoalAlerts(
    goals: Goal[],
    transactions: Transaction[],
    now: Date
  ): SmartNotification[] {
    const notifications: SmartNotification[] = [];

    goals.forEach((goal) => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;

      if (progress >= 100) {
        notifications.push({
          id: `goal-completed-${goal.id}`,
          type: 'success',
          category: 'goal',
          title: '🎉 Meta Alcançada!',
          message: `Parabéns! Você atingiu sua meta "${goal.name}".`,
          actionLabel: 'Ver Metas',
          actionUrl: '/goals',
          priority: 'high',
          createdAt: now,
          isRead: false,
        });
      } else if (progress >= 80) {
        notifications.push({
          id: `goal-near-${goal.id}`,
          type: 'info',
          category: 'goal',
          title: '🎯 Quase lá!',
          message: `Você está a ${(100 - progress).toFixed(1)}% de completar a meta "${goal.name}".`,
          actionLabel: 'Ver Metas',
          actionUrl: '/goals',
          priority: 'medium',
          createdAt: now,
          isRead: false,
        });
      }
    });

    return notifications;
  }

  private static analyzeAccountAlerts(accounts: Account[]): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    const now = new Date();

    accounts.forEach((account) => {
      if (account.type === 'checking' && account.balance < 100) {
        notifications.push({
          id: `low-balance-${account.id}`,
          type: 'warning',
          category: 'general',
          title: '💰 Saldo Baixo',
          message: `Sua conta "${account.name}" está com saldo baixo: R$ ${account.balance.toFixed(2)}.`,
          actionLabel: 'Ver Contas',
          actionUrl: '/accounts',
          priority: 'medium',
          createdAt: now,
          isRead: false,
        });
      }

      if (account.type === 'credit' && account.creditLimit) {
        const usage = Math.abs(account.balance) / account.creditLimit;
        if (usage > 0.8) {
          notifications.push({
            id: `credit-limit-${account.id}`,
            type: 'warning',
            category: 'general',
            title: '💳 Limite do Cartão',
            message: `Você está usando ${(usage * 100).toFixed(1)}% do limite do cartão "${account.name}".`,
            actionLabel: 'Ver Cartões',
            actionUrl: '/cards',
            priority: 'high',
            createdAt: now,
            isRead: false,
          });
        }
      }
    });

    return notifications;
  }

  private static analyzeSpendingPatterns(
    transactions: Transaction[],
    now: Date
  ): SmartNotification[] {
    const notifications: SmartNotification[] = [];

    // Análise simples de gastos por categoria
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(
      (t) => new Date(t.date) >= last30Days && t.type === 'expense'
    );

    const categoryTotals: Record<string, number> = {};
    recentTransactions.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    });

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    Object.entries(categoryTotals).forEach(([category, amount]) => {
      const percentage = (amount / totalExpenses) * 100;
      if (percentage > 40) {
        notifications.push({
          id: `high-category-spending-${category}`,
          type: 'info',
          category: 'budget',
          title: '📊 Gasto Concentrado',
          message: `${percentage.toFixed(1)}% dos seus gastos estão na categoria "${category}".`,
          actionLabel: 'Ver Relatórios',
          actionUrl: '/reports',
          priority: 'low',
          createdAt: now,
          isRead: false,
        });
      }
    });

    return notifications;
  }

  private static analyzeSavingOpportunities(
    transactions: Transaction[],
    now: Date
  ): SmartNotification[] {
    const notifications: SmartNotification[] = [];

    // Análise de transações recorrentes que podem ser otimizadas
    const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(
      (t) => new Date(t.date) >= last60Days && t.type === 'expense'
    );

    // Agrupar por descrição similar
    const descriptionGroups: Record<string, Transaction[]> = {};
    recentTransactions.forEach((t) => {
      const key = t.description.toLowerCase().trim();
      if (!descriptionGroups[key]) {
        descriptionGroups[key] = [];
      }
      descriptionGroups[key].push(t);
    });

    Object.entries(descriptionGroups).forEach(([description, transactions]) => {
      if (transactions.length >= 3) {
        const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        notifications.push({
          id: `recurring-expense-${description}`,
          type: 'info',
          category: 'general',
          title: '🔄 Gasto Recorrente',
          message: `Você gastou R$ ${total.toFixed(2)} com "${description}" nos últimos 60 dias.`,
          actionLabel: 'Analisar',
          actionUrl: '/transactions',
          priority: 'low',
          createdAt: now,
          isRead: false,
        });
      }
    });

    return notifications;
  }
}

// Hook para usar as notificações inteligentes
import { useState, useEffect } from 'react';

export function useSmartNotifications() {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Em um app real, você carregaria os dados do storage
        // Por enquanto, retornamos um array vazio
        setNotifications([]);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    unreadCount: notifications.filter(n => !n.isRead).length,
  };
}
