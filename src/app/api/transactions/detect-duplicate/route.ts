import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
export const dynamic = 'force-dynamic';

/**
 * POST /api/transactions/detect-duplicate
 * Detectar transação duplicada antes de criar
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, description, date } = body;

    if (!amount || !description || !date) {
      return NextResponse.json(
        { error: 'amount, description e date são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await FinancialOperationsService.detectDuplicate({
      userId: session.user.id,
      amount,
      description,
      date: new Date(date),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao detectar duplicata:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao detectar duplicata',
      },
      { status: 500 }
    );
  }
}
