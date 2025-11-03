import { prisma } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

export type NotificationType = 'info' | 'warning' | 'alert' | 'success';
export type NotificationCategory = 'bill' | 'goal' | 'budget' | 'card' | 'investment' | 'reminder' | 'achievement' | 'general';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        isRead: false,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });

    console.log(`🔔 Notificação criada: ${params.title}`);
    return notification;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
}

// Verificar e criar notificações de faturamento
export async function checkBillingNotifications(userId: string) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // 1. Contas a vencer hoje
  const billsDueToday = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      status: 'pending',
      date: {
        gte: now,
        lt: tomorrow,
      },
      deletedAt: null,
    },
  });

  for (const bill of billsDueToday) {
    // Verificar se já existe notificação para esta conta
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        metadata: {
          contains: bill.id,
        },
        createdAt: {
          gte: now, // Apenas hoje
        },
      },
    });

    if (!existing) {
      await createNotification({
        userId,
        type: 'alert',
        category: 'bill',
        title: '🚨 Conta vence hoje!',
        message: `${bill.description} - R$ ${Math.abs(Number(bill.amount)).toFixed(2)}`,
        actionUrl: '/transactions',
        metadata: { billId: bill.id, dueDate: bill.date },
      });
    }
  }

  // 2. Contas vencidas
  const overdueBills = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      status: 'pending',
      date: {
        lt: now,
      },
      deletedAt: null,
    },
    take: 5,
  });

  for (const bill of overdueBills) {
    const daysOverdue = Math.ceil((now.getTime() - new Date(bill.date).getTime()) / (1000 * 60 * 60 * 24));

    // Notificar apenas se venceu recentemente (últimos 3 dias)
    if (daysOverdue <= 3) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          metadata: {
            contains: `overdue-${bill.id}`,
          },
        },
      });

      if (!existing) {
        await createNotification({
          userId,
          type: 'alert',
          category: 'bill',
          title: '⚠️ Conta vencida!',
          message: `${bill.description} - Venceu há ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}`,
          actionUrl: '/transactions',
          metadata: { billId: bill.id, overdueBy: `overdue-${bill.id}` },
        });
      }
    }
  }

  // 3. Faturas de cartão próximas
  const cards = await prisma.creditCard.findMany({
    where: {
      userId,
      isActive: true,
    },
  });

  for (const card of cards) {
    const today = now.getDate();
    const dueDay = card.dueDay;
    let daysUntilDue = dueDay - today;

    if (daysUntilDue < 0) {
      daysUntilDue += 30;
    }

    // Notificar 3 dias antes
    if (daysUntilDue <= 3 && daysUntilDue >= 0) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          metadata: {
            contains: `card-${card.id}`,
          },
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Últimas 24h
          },
        },
      });

      if (!existing) {
        await createNotification({
          userId,
          type: daysUntilDue === 0 ? 'alert' : 'warning',
          category: 'card',
          title: daysUntilDue === 0 ? '💳 Fatura vence hoje!' : `💳 Fatura vence em ${daysUntilDue} dia${daysUntilDue > 1 ? 's' : ''}`,
          message: `${card.name} - Saldo: R$ ${Number(card.currentBalance).toFixed(2)}`,
          actionUrl: '/credit-card-bills',
          metadata: { cardId: `card-${card.id}`, dueDay: card.dueDay },
        });
      }
    }
  }
}

// Verificar e criar notificações de metas
export async function checkGoalNotifications(userId: string) {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // 1. Metas próximas do prazo
  const upcomingGoals = await prisma.goal.findMany({
    where: {
      userId,
      status: 'active',
      targetDate: {
        gte: now,
        lte: nextWeek,
      },
    },
  });

  for (const goal of upcomingGoals) {
    const daysUntil = Math.ceil((new Date(goal.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;

    if (progress < 80) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          metadata: {
            contains: `goal-deadline-${goal.id}`,
          },
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!existing) {
        await createNotification({
          userId,
          type: 'warning',
          category: 'goal',
          title: `🎯 Meta "${goal.name}" vence em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`,
          message: `Progresso: ${progress.toFixed(0)}% - Faltam R$ ${(Number(goal.targetAmount) - Number(goal.currentAmount)).toFixed(2)}`,
          actionUrl: '/goals',
          metadata: { goalId: goal.id, type: `goal-deadline-${goal.id}` },
        });
      }
    }
  }

  // 2. Metas atingidas
  const activeGoals = await prisma.goal.findMany({
    where: {
      userId,
      status: 'active',
    },
  });

  for (const goal of activeGoals) {
    if (Number(goal.currentAmount) >= Number(goal.targetAmount)) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          metadata: {
            contains: `goal-achieved-${goal.id}`,
          },
        },
      });

      if (!existing) {
        await createNotification({
          userId,
          type: 'success',
          category: 'achievement',
          title: '🎉 Meta atingida!',
          message: `Parabéns! Você atingiu a meta "${goal.name}" de R$ ${Number(goal.targetAmount).toFixed(2)}`,
          actionUrl: '/goals',
          metadata: { goalId: goal.id, type: `goal-achieved-${goal.id}` },
        });

        // Atualizar status da meta
        await prisma.goal.update({
          where: { id: goal.id },
          data: { status: 'completed' },
        });
      }
    }
  }

  // 3. Progresso significativo (a cada 25%)
  for (const goal of activeGoals) {
    const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
    const milestones = [25, 50, 75];

    for (const milestone of milestones) {
      if (progress >= milestone && progress < milestone + 5) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId,
            metadata: {
              contains: `goal-progress-${goal.id}-${milestone}`,
            },
          },
        });

        if (!existing) {
          await createNotification({
            userId,
            type: 'success',
            category: 'goal',
            title: `🎯 ${milestone}% da meta atingido!`,
            message: `Você já alcançou ${milestone}% da meta "${goal.name}". Continue assim!`,
            actionUrl: '/goals',
            metadata: { goalId: goal.id, type: `goal-progress-${goal.id}-${milestone}` },
          });
        }
      }
    }
  }
}

// Verificar e criar notificações de orçamento
export async function checkBudgetNotifications(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      category: true,
    },
  });

  for (const budget of budgets) {
    const spent = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: budget.categoryId,
        type: 'expense',
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        deletedAt: null,
      },
      _sum: {
        amount: true,
      },
    });

    const totalSpent = Math.abs(Number(spent._sum.amount || 0));
    const budgetAmount = Number(budget.amount);
    const percentage = (totalSpent / budgetAmount) * 100;

    // Notificar em 80%, 90% e 100%
    const thresholds = [
      { value: 100, type: 'alert' as NotificationType, emoji: '🚨', text: 'estourado' },
      { value: 90, type: 'alert' as NotificationType, emoji: '⚠️', text: 'quase estourado' },
      { value: 80, type: 'warning' as NotificationType, emoji: '⚡', text: 'em alerta' },
    ];

    for (const threshold of thresholds) {
      if (percentage >= threshold.value) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId,
            metadata: {
              contains: `budget-${budget.id}-${threshold.value}`,
            },
            createdAt: {
              gte: startOfMonth, // Apenas neste mês
            },
          },
        });

        if (!existing) {
          await createNotification({
            userId,
            type: threshold.type,
            category: 'budget',
            title: `${threshold.emoji} Orçamento ${threshold.text}!`,
            message: `${budget.category?.name || 'Categoria'}: ${percentage.toFixed(0)}% usado (R$ ${totalSpent.toFixed(2)} de R$ ${budgetAmount.toFixed(2)})`,
            actionUrl: '/budget',
            metadata: { budgetId: budget.id, type: `budget-${budget.id}-${threshold.value}` },
          });
        }
        break; // Apenas uma notificação por orçamento
      }
    }
  }
}

// Verificar e criar notificações de investimentos
export async function checkInvestmentNotifications(userId: string) {
  try {
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        status: 'active',
      },
    });

    for (const investment of investments) {
      const currentValue = Number(investment.currentValue || 0);
      const investedAmount = Number(investment.investedAmount || 0);

      if (investedAmount > 0) {
        const returnPercentage = ((currentValue - investedAmount) / investedAmount) * 100;

        // Notificar sobre ganhos significativos (>10%)
        if (returnPercentage >= 10) {
          const existing = await prisma.notification.findFirst({
            where: {
              userId,
              metadata: {
                contains: `investment-gain-${investment.id}`,
              },
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Última semana
              },
            },
          });

          if (!existing) {
            await createNotification({
              userId,
              type: 'success',
              category: 'investment',
              title: '📈 Investimento em alta!',
              message: `${investment.name}: +${returnPercentage.toFixed(2)}% de retorno (R$ ${(currentValue - investedAmount).toFixed(2)})`,
              actionUrl: '/investments',
              metadata: { investmentId: investment.id, type: `investment-gain-${investment.id}` },
            });
          }
        }

        // Notificar sobre perdas significativas (>5%)
        if (returnPercentage <= -5) {
          const existing = await prisma.notification.findFirst({
            where: {
              userId,
              metadata: {
                contains: `investment-loss-${investment.id}`,
              },
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          });

          if (!existing) {
            await createNotification({
              userId,
              type: 'alert',
              category: 'investment',
              title: '📉 Atenção ao investimento',
              message: `${investment.name}: ${returnPercentage.toFixed(2)}% de retorno (R$ ${(currentValue - investedAmount).toFixed(2)})`,
              actionUrl: '/investments',
              metadata: { investmentId: investment.id, type: `investment-loss-${investment.id}` },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar notificações de investimento:', error);
  }
}

// Verificar lembretes vencidos
export async function checkReminderNotifications(userId: string) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Lembretes para hoje
  const remindersToday = await prisma.reminder.findMany({
    where: {
      userId,
      status: 'pending',
      dueDate: {
        gte: now,
        lt: tomorrow,
      },
    },
  });

  for (const reminder of remindersToday) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        metadata: {
          contains: `reminder-today-${reminder.id}`,
        },
        createdAt: {
          gte: now,
        },
      },
    });

    if (!existing) {
      await createNotification({
        userId,
        type: 'info',
        category: 'reminder',
        title: '📌 Lembrete para hoje!',
        message: reminder.title,
        actionUrl: '/reminders',
        metadata: { reminderId: reminder.id, type: `reminder-today-${reminder.id}` },
      });
    }
  }

  // Lembretes vencidos
  const overdueReminders = await prisma.reminder.findMany({
    where: {
      userId,
      status: 'pending',
      dueDate: {
        lt: now,
      },
    },
    take: 5,
  });

  for (const reminder of overdueReminders) {
    // Atualizar status para overdue
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { status: 'overdue' },
    });

    const daysOverdue = Math.ceil((now.getTime() - new Date(reminder.dueDate).getTime()) / (1000 * 60 * 60 * 24));

    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        metadata: {
          contains: `reminder-overdue-${reminder.id}`,
        },
      },
    });

    if (!existing) {
      await createNotification({
        userId,
        type: 'alert',
        category: 'reminder',
        title: `📌 Lembrete vencido há ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}!`,
        message: reminder.title,
        actionUrl: '/reminders',
        metadata: { reminderId: reminder.id, type: `reminder-overdue-${reminder.id}` },
      });
    }
  }
}

// Função principal que verifica todas as notificações
export async function generateAllNotifications(userId: string) {
  console.log(`🔔 Gerando notificações para usuário: ${userId}`);

  await Promise.all([
    checkBillingNotifications(userId),
    checkGoalNotifications(userId),
    checkBudgetNotifications(userId),
    checkInvestmentNotifications(userId),
    checkReminderNotifications(userId),
  ]);

  }
