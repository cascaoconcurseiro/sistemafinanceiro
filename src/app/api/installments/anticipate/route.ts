import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

/**
 * POST /api/installments/anticipate
 * Antecipar parcelas com desconto
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { installmentGroupId, accountId, discountPercent } = body;

    if (!installmentGroupId || !accountId) {
      return NextResponse.json(
        { error: 'installmentGroupId e accountId são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await FinancialOperationsService.anticipateInstallments(
      installmentGroupId,
      session.user.id,
      accountId,
      discountPercent || 0
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Erro ao antecipar parcelas:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao antecipar parcelas',
      },
      { status: 500 }
    );
  }
}
