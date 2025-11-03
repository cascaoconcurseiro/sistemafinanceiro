import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RefundService } from '@/lib/services/refund-service';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      originalTransactionId,
      amount,
      accountId,
      date,
      description,
      reason,
    } = body;

    // Validações
    if (!originalTransactionId || !amount || !accountId || !date) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Criar reembolso
    const refund = await RefundService.createRefund({
      originalTransactionId,
      userId: session.user.id,
      amount: parseFloat(amount),
      accountId,
      date: new Date(date),
      description,
      reason,
    });

    return NextResponse.json(refund, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar reembolso:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao criar reembolso',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const transactions = await RefundService.listRefundedTransactions(
      session.user.id
    );

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Erro ao listar reembolsos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar reembolsos' },
      { status: 500 }
    );
  }
}
