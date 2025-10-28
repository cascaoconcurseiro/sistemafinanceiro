/**
 * 📊 API: BALANCETE DE VERIFICAÇÃO
 * GET /api/reports/trial-balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { doubleEntryService } from '@/lib/services/double-entry-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const trialBalance = await doubleEntryService.generateTrialBalance(session.user.id);
    const systemBalance = await doubleEntryService.validateSystemBalance();

    return NextResponse.json({
      success: true,
      data: {
        accounts: trialBalance,
        summary: {
          totalDebits: systemBalance.totalDebits,
          totalCredits: systemBalance.totalCredits,
          difference: systemBalance.difference,
          isBalanced: systemBalance.isBalanced
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [TrialBalance] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}