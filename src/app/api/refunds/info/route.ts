import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RefundService } from '@/lib/services/refund-service';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId é obrigatório' },
        { status: 400 }
      );
    }

    const refundInfo = await RefundService.getRefundInfo(transactionId);

    if (!refundInfo) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(refundInfo);
  } catch (error) {
    console.error('Erro ao buscar informações de reembolso:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar informações de reembolso' },
      { status: 500 }
    );
  }
}
