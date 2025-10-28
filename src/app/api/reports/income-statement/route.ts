/**
 * 📊 API: DEMONSTRAÇÃO DO RESULTADO (DRE)
 * GET /api/reports/income-statement?startDate=2024-01-01&endDate=2024-12-31
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { financialCalculationsService } from '@/lib/services/financial-calculations-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const summary = await financialCalculationsService.generateFinancialSummary(session.user.id);

    const incomeStatement = {
      period: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      },
      revenue: summary.totalRevenue,
      expenses: summary.totalExpenses,
      netIncome: summary.netIncome,
      profitMargin: summary.totalRevenue > 0 ? (summary.netIncome / summary.totalRevenue) * 100 : 0
    };

    return NextResponse.json({
      success: true,
      data: incomeStatement,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [IncomeStatement] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}