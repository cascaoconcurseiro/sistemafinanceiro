import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { authenticateRequest } = await import('@/lib/utils/auth-helpers');
    const auth = await authenticateRequest(request);

    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Gerar notificações automáticas
    const notifications = await generateFinancialNotifications(auth.userId);

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function generateFinancialNotifications(userId: string) {
  const notifications: any[] = [];

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // 1. Contas a vencer (próximos 7 dias)
  const upcomingBills = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      status: 'pending',
      date: {
        gte: now,
        lte: nextWeek,
      },
      deletedAt: null,
    },
    orderBy: { date: 'asc' },
    take: 5,
  });

  upcomingBills.forEach(bill => {
    const daysUntil = Math.ceil((new Date(bill.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    notifications.push({
      id: `bill-${bill.id}`,
      type: daysUntil <= 1 ? 'alert' : 'warning',
      category: 'bill',
      title: daysUntil === 0 ? 'Conta vence hoje!' : `Conta vence em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`,
      message: `${bill.description} - R$ ${Math.abs(Number(bill.amount)).toFixed(2)}`,
      date: now.toISOString(),
      isRead: false,
      actionUrl: '/transactions',
      metadata: { billId: bill.id },
    });
  });

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
    orderBy: { date: 'desc' },
    take: 5,
  });

  overdueBills.forEach(bill => {
    const daysOverdue = Math.ceil((now.getTime() - new Date(bill.date).getTime()) / (1000 * 60 * 60 * 24));
    notifications.push({
      id: `overdue-${bill.id}`,
      type: 'alert',
      category: 'bill',
      title: '⚠️ Conta vencida!',
      message: `${bill.description} - Venceu há ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}`,
      date: now.toISOString(),
      isRead: false,
      actionUrl: '/transactions',
      metadata: { billId: bill.id },
    });
  });

  // 3. Faturas de cartão próximas do vencimento
  const upcomingCardBills = await prisma.creditCard.findMany({
    where: {
      userId,
      isActive: true,
    },
  });

  upcomingCardBills.forEach(card => {
    const today = now.getDate();
    const dueDay = card.dueDay;
    let daysUntilDue = dueDay - today;

    if (daysUntilDue < 0) {
      daysUntilDue += 30; // Próximo mês
    }

    if (daysUntilDue <= 7) {
      notifications.push({
        id: `card-due-${card.id}`,
        type: daysUntilDue <= 2 ? 'alert' : 'warning',
        category: 'card',
        title: daysUntilDue === 0 ? 'Fatura vence hoje!' : `Fatura vence em ${daysUntilDue} dia${daysUntilDue > 1 ? 's' : ''}`,
        message: `${card.name} - Saldo: R$ ${Number(card.currentBalance).toFixed(2)}`,
        date: now.toISOString(),
        isRead: false,
        actionUrl: '/credit-card-bills',
        metadata: { cardId: card.id },
      });
    }
  });

  // 4. Metas próximas do prazo
  const upcomingGoals = await prisma.goal.findMany({
    where: {
      userId,
      status: 'active',
      deadline: {
        gte: now,
        lte: nextWeek,
      },
    },
  });

  upcomingGoals.forEach(goal => {
    const daysUntil = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;

    notifications.push({
      id: `goal-${goal.id}`,
      type: progress < 80 ? 'warning' : 'info',
      category: 'goal',
      title: `Meta "${goal.name}" vence em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`,
      message: `Progresso: ${progress.toFixed(0)}% - Faltam R$ ${(Number(goal.targetAmount) - Number(goal.currentAmount)).toFixed(2)}`,
      date: now.toISOString(),
      isRead: false,
      actionUrl: '/goals',
      metadata: { goalId: goal.id },
    });
  });

  // 5. Metas atingidas
  try {
    const achievedGoals = await prisma.goal.findMany({
      where: {
        userId,
        status: 'active',
      },
      take: 10,
    });

    // Filtrar metas atingidas manualmente
    achievedGoals
      .filter(goal => Number(goal.currentAmount) >= Number(goal.targetAmount))
      .slice(0, 3)
      .forEach(goal => {
        notifications.push({
          id: `achieved-${goal.id}`,
          type: 'success',
          category: 'achievement',
          title: '🎉 Meta atingida!',
          message: `Parabéns! Você atingiu a meta "${goal.name}"`,
          date: now.toISOString(),
          isRead: false,
          actionUrl: '/goals',
          metadata: { goalId: goal.id },
        });
      });
  } catch (error) {
    console.log('Erro ao buscar metas atingidas:', error);
  }

  // 6. Orçamentos estourados
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      categoryRef: true, // ✅ CORREÇÃO: Campo correto é categoryRef, não category
    },
  });

  for (const budget of budgets) {
    // Calcular gastos do mês atual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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

    if (percentage >= 90) {
      notifications.push({
        id: `budget-${budget.id}`,
        type: percentage >= 100 ? 'alert' : 'warning',
        category: 'budget',
        title: percentage >= 100 ? '🚨 Orçamento estourado!' : '⚠️ Orçamento quase estourado',
        message: `${budget.category?.name || 'Categoria'}: ${percentage.toFixed(0)}% usado (R$ ${totalSpent.toFixed(2)} de R$ ${budgetAmount.toFixed(2)})`,
        date: now.toISOString(),
        isRead: false,
        actionUrl: '/budgets',
        metadata: { budgetId: budget.id },
      });
    }
  }

  // 7. Lembretes personalizados
  try {
    // Buscar lembretes pendentes e vencidos (próximos 7 dias + vencidos)
    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        status: {
          in: ['pending', 'overdue'] // Incluir tanto pendentes quanto vencidos
        },
        dueDate: {
          lte: nextWeek, // Inclui vencidos e próximos 7 dias
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    console.log(`📌 [Notifications] Encontrados ${reminders.length} lembretes para notificar`);

    reminders.forEach(reminder => {
      const daysUntil = Math.ceil((new Date(reminder.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let title, type;
      if (daysUntil < 0) {
        // Vencido
        const daysOverdue = Math.abs(daysUntil);
        title = `📌 Lembrete vencido há ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}!`;
        type = 'alert';
      } else if (daysUntil === 0) {
        // Hoje
        title = '📌 Lembrete para hoje!';
        type = 'alert';
      } else {
        // Futuro
        title = `📌 Lembrete em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`;
        type = 'info';
      }

      notifications.push({
        id: `reminder-${reminder.id}`,
        type,
        category: 'reminder',
        title,
        message: reminder.title,
        date: now.toISOString(),
        isRead: false,
        actionUrl: '/reminders',
        metadata: { reminderId: reminder.id },
      });
    });
  } catch (error) {
    console.error('❌ [Notifications] Erro ao buscar lembretes:', error);
  }

  // 8. Buscar notificações salvas no banco de dados
  try {
    const savedNotifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false, // Apenas não lidas
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Limitar a 10 mais recentes
    });

    console.log(`💾 [Notifications] Encontradas ${savedNotifications.length} notificações salvas`);

    savedNotifications.forEach(notif => {
      notifications.push({
        id: `saved-${notif.id}`,
        type: notif.type as any,
        category: notif.type,
        title: notif.title,
        message: notif.message,
        date: notif.createdAt.toISOString(),
        isRead: notif.isRead,
        actionUrl: '/notifications',
        metadata: notif.metadata ? JSON.parse(notif.metadata) : {},
      });
    });
  } catch (error) {
    console.error('❌ [Notifications] Erro ao buscar notificações salvas:', error);
  }

    // Ordenar por prioridade (alertas primeiro, depois warnings, etc)
    const priorityOrder = { alert: 0, warning: 1, info: 2, success: 3 };
    notifications.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);
  } catch (error) {
    console.error('❌ [Notifications] Erro ao gerar notificações:', error);
  }

  // Se não houver notificações, retornar array vazio (não mostrar boas-vindas sempre)
  console.log(`📊 [Notifications] Total de ${notifications.length} notificações geradas`);

  return notifications;
}
