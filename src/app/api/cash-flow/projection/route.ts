import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CashFlowProjectionService } from '@/lib/services/cash-flow-projection-service';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') as 'week' | 'month' | 'quarter' | 'year' || 'month';

    const projection = await CashFlowProjectionService.getProjectionByPeriod(
      session.user.id,
      period
    );

    return NextResponse.json(projection);
  } catch (error) {
    console.error('Erro ao gerar projeção:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar projeção de fluxo de caixa' },
      { status: 500 }
    );
  }
}
