import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

/**
 * PUT /api/installments/update-future
 * Editar parcelas futuras
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { installmentGroupId, fromInstallment, newAmount } = body;

    if (!installmentGroupId || !fromInstallment || !newAmount) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await FinancialOperationsService.updateFutureInstallments(
      installmentGroupId,
      session.user.id,
      fromInstallment,
      newAmount
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Erro ao atualizar parcelas:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao atualizar parcelas',
      },
      { status: 500 }
    );
  }
}
