import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { budgetService } from '@/lib/services/budget-service';

/**
 * GET /api/budgets/[id]/usage
 * Retorna uso do orçamento
 * Requirements: 16.2
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const usage = await budgetService.calculateBudgetUsage(params.id, session.user.id);

        return NextResponse.json(usage);
    } catch (error: any) {
        console.error('Erro ao calcular uso do orçamento:', error);
        return NextResponse.json({ error: 'Erro ao calcular uso do orçamento' }, { status: 500 });
    }
}
