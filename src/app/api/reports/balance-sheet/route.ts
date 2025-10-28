/**
 * 📊 API: BALANÇO PATRIMONIAL
 * GET /api/reports/balance-sheet
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

    const summary = await financialCalculationsService.generateFinancialSummary(session.user.id);

    const balanceSheet = {
      assets: summary.totalAssets,
      liabilities: summary.totalLiabilities,
      equity: summary.netWorth,
      isBalanced: Math.abs(summary.balanceSheetBalance) <= 0.01,
      balanceCheck: summary.balanceSheetBalance
    };

    return NextResponse.json({
      success: true,
      data: balanceSheet,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [BalanceSheet] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}