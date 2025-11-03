import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
export const dynamic = 'force-dynamic';

/**
 * GET /api/integrity/validate
 * Validar consistência de todos os dados financeiros
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const result = await FinancialOperationsService.validateAllConsistency(
      session.user.id
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao validar consistência:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao validar consistência',
      },
      { status: 500 }
    );
  }
}
