import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

/**
 * POST /api/invoices/pay-partial
 * Pagar fatura parcialmente (rotativo)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, accountId, amount, paymentDate } = body;

    if (!invoiceId || !accountId || !amount) {
      return NextResponse.json(
        { error: 'invoiceId, accountId e amount são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await FinancialOperationsService.payInvoicePartial(
      invoiceId,
      session.user.id,
      accountId,
      amount,
      paymentDate ? new Date(paymentDate) : undefined
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Erro ao pagar fatura:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao pagar fatura',
      },
      { status: 500 }
    );
  }
}
