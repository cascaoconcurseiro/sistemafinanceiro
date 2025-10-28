import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ValidationService } from '@/lib/services/validation-service';

/**
 * POST /api/validation/validate-transaction
 * Valida uma transação antes de criar
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { transaction } = body;

    if (!transaction) {
      return NextResponse.json(
        { error: 'Dados da transação são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar transação
    await ValidationService.validateTransaction({
      ...transaction,
      userId: session.user.id,
    });

    return NextResponse.json({
      valid: true,
      message: 'Transação válida',
    });
  } catch (error) {
    console.error('Erro ao validar transação:', error);
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : 'Erro ao validar transação',
      },
      { status: 400 }
    );
  }
}
