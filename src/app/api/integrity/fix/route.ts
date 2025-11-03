import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
export const dynamic = 'force-dynamic';

/**
 * POST /api/integrity/fix
 * Corrigir todas as inconsistências encontradas
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const result = await FinancialOperationsService.fixAllInconsistencies(
      session.user.id
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao corrigir inconsistências:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao corrigir inconsistências',
      },
      { status: 500 }
    );
  }
}
