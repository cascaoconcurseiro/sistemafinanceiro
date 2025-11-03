import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

/**
 * POST /api/invoices/reverse-payment
 * Estornar pagamento de fatura
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, reason } = body;

    if (!paymentId || !reason) {
      return NextResponse.json(
        { error: 'paymentId e reason são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await FinancialOperationsService.reverseInvoicePayment(
      paymentId,
      session.user.id,
      reason
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Erro ao estornar pagamento:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao estornar pagamento',
      },
      { status: 500 }
    );
  }
}
