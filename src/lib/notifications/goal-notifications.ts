import { prisma } from '@/lib/prisma';

interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  targetDate?: Date;
  isCompleted?: boolean;
}

export class GoalNotificationService {
  /**
   * Checks if a goal has been completed and creates a notification
   */
  static async checkGoalCompletion(goalId: string, previousAmount: number, newAmount: number) {
    try {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId }
      });

      if (!goal) return;

      const wasCompleted = previousAmount >= goal.target;
      const isNowCompleted = newAmount >= goal.target;

      // If goal was just completed (wasn't completed before, but is now)
      if (!wasCompleted && isNowCompleted) {
        await this.createGoalAchievementNotification(goal);
      }

      // Check for milestone notifications (25%, 50%, 75%, 90%)
      await this.checkMilestoneNotifications(goal, previousAmount, newAmount);
    } catch (error) {
      console.error('Erro ao verificar conclusão da meta:', error);
    }
  }

  /**
   * Creates a notification for goal achievement
   */
  private static async createGoalAchievementNotification(goal: any) {
    try {
      await prisma.notification.create({
        data: {
          title: '🎉 Meta Alcançada!',
          message: `Parabéns! Você atingiu sua meta "${goal.name}". Valor alcançado: R$ ${goal.current.toFixed(2)}`,
          type: 'success',
          isRead: false,
          metadata: JSON.stringify({
            goalId: goal.id,
            goalName: goal.name,
            targetAmount: goal.target,
            currentAmount: goal.current,
            type: 'goal_achievement'
          })
        }
      });
    } catch (error) {
      console.error('Erro ao criar notificação de meta alcançada:', error);
    }
  }

  /**
   * Checks and creates milestone notifications (25%, 50%, 75%, 90%)
   */
  private static async checkMilestoneNotifications(goal: any, previousAmount: number, newAmount: number) {
    const milestones = [25, 50, 75, 90];
    const target = goal.target;

    for (const milestone of milestones) {
      const milestoneAmount = (milestone / 100) * target;
      const previousProgress = (previousAmount / target) * 100;
      const newProgress = (newAmount / target) * 100;

      // If we just crossed this milestone
      if (previousProgress < milestone && newProgress >= milestone) {
        await this.createMilestoneNotification(goal, milestone);
      }
    }
  }

  /**
   * Creates a milestone notification
   */
  private static async createMilestoneNotification(goal: any, milestone: number) {
    try {
      const emoji = milestone === 90 ? '🔥' : milestone >= 75 ? '🚀' : milestone >= 50 ? '💪' : '🎯';
      
      await prisma.notification.create({
        data: {
          title: `${emoji} ${milestone}% da Meta Atingida!`,
          message: `Você alcançou ${milestone}% da meta "${goal.name}". Continue assim! R$ ${goal.current.toFixed(2)} de R$ ${goal.target.toFixed(2)}`,
          type: 'info',
          isRead: false,
          metadata: JSON.stringify({
            goalId: goal.id,
            goalName: goal.name,
            milestone,
            targetAmount: goal.target,
            currentAmount: goal.current,
            type: 'goal_milestone'
          })
        }
      });
    } catch (error) {
      console.error('Erro ao criar notificação de marco da meta:', error);
    }
  }

  /**
   * Checks for goals approaching their deadline
   */
  static async checkGoalDeadlines() {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      const goalsNearDeadline = await prisma.goal.findMany({
        where: {
          targetDate: {
            lte: thirtyDaysFromNow,
            gte: now
          },
          isCompleted: false
        }
      });

      for (const goal of goalsNearDeadline) {
        const daysUntilDeadline = Math.ceil(
          (goal.targetDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const progress = (goal.current / goal.target) * 100;
        
        // Only notify if progress is less than 90% and deadline is within 30 days
        if (progress < 90) {
          await this.createDeadlineNotification(goal, daysUntilDeadline, progress);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar prazos das metas:', error);
    }
  }

  /**
   * Creates a deadline notification
   */
  private static async createDeadlineNotification(goal: any, daysUntilDeadline: number, progress: number) {
    try {
      const urgencyLevel = daysUntilDeadline <= 7 ? 'warning' : 'info';
      const emoji = daysUntilDeadline <= 7 ? '⚠️' : '📅';
      
      await prisma.notification.create({
        data: {
          title: `${emoji} Meta Próxima do Prazo`,
          message: `A meta "${goal.name}" vence em ${daysUntilDeadline} dias. Progresso atual: ${progress.toFixed(1)}%`,
          type: urgencyLevel,
          isRead: false,
          metadata: JSON.stringify({
            goalId: goal.id,
            goalName: goal.name,
            daysUntilDeadline,
            progress,
            targetAmount: goal.target,
            currentAmount: goal.current,
            type: 'goal_deadline'
          })
        }
      });
    } catch (error) {
      console.error('Erro ao criar notificação de prazo da meta:', error);
    }
  }
}