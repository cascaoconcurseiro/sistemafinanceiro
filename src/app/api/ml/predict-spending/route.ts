import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { SpendingPredictor } from '@/core/ml/spending-prediction';
export const dynamic = 'force-dynamic';

const predictor = new SpendingPredictor();

/**
 * GET /api/ml/predict-spending
 * Prevê gastos para o próximo mês
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar transações dos últimos 12 meses
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: 'DESPESA',
        date: {
          gte: twelveMonthsAgo,
        },
        deletedAt: null,
      },
      select: {
        amount: true,
        category: true,
        date: true,
      },
    });

    // Agrupar por mês e categoria
    const historicalData = transactions.map(t => {
      const date = new Date(t.date);
      return {
        month: date.toLocaleString('pt-BR', { month: 'long' }),
        year: date.getFullYear(),
        category: t.category || 'Outros',
        amount: Math.abs(Number(t.amount)),
      };
    });

    // Gerar previsão
    const prediction = predictor.predictNextMonth(historicalData);

    return NextResponse.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error('❌ [API] Erro ao prever gastos:', error);
    return NextResponse.json(
      { error: 'Erro ao prever gastos' },
      { status: 500 }
    );
  }
}
