import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
export const dynamic = 'force-dynamic';

/**
 * POST /api/installments/cancel-future
 * Cancelar parcelas futuras
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { installmentGroupId, reason } = body;

    if (!installmentGroupId) {
      return NextResponse.json(
        { error: 'installmentGroupId é obrigatório' },
        { status: 400 }
      );
    }

    const result = await FinancialOperationsService.cancelFutureInstallments(
      installmentGroupId,
      session.user.id,
      reason
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Erro ao cancelar parcelas:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao cancelar parcelas',
      },
      { status: 500 }
    );
  }
}
