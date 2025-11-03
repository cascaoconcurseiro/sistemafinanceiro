import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { IntelligentAlertSystem } from '@/core/alerts/intelligent-alerts';

const alertSystem = new IntelligentAlertSystem();

/**
 * GET /api/ml/alerts
 * Gera alertas inteligentes baseados nos dados do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Buscar orçamentos e gastos do mês
    const budgets = await prisma.budget.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfMonth,
        },
        type: 'DESPESA',
        deletedAt: null,
      },
    });

    // Calcular gastos por categoria
    const spentByCategory: Record<string, number> = {};
    transactions.forEach(t => {
      const category = t.category || 'Outros';
      spentByCategory[category] = (spentByCategory[category] || 0) + Math.abs(Number(t.amount));
    });

    // Preparar dados de orçamento
    const budgetData = budgets.map(b => ({
      category: b.category,
      spent: spentByCategory[b.category] || 0,
      budget: Number(b.amount),
    }));

    // Buscar contas a vencer
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingBills = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        status: 'pending',
        date: {
          gte: now,
          lte: threeDaysFromNow,
        },
        deletedAt: null,
      },
    });

    const billsData = upcomingBills.map(b => ({
      description: b.description,
      amount: Math.abs(Number(b.amount)),
      dueDate: b.date,
    }));

    // Buscar metas
    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        isCompleted: false,
      },
    });

    const goalsData = goals.map(g => ({
      goalName: g.name,
      current: Number(g.current),
      target: Number(g.target),
    }));

    // Gerar alertas
    const alerts = alertSystem.checkAndGenerateAlerts({
      budgets: budgetData,
      bills: billsData,
      goals: goalsData,
    });

    return NextResponse.json({
      success: true,
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warnings: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
      },
    });
  } catch (error) {
    console.error('❌ [API] Erro ao gerar alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar alertas' },
      { status: 500 }
    );
  }
}
