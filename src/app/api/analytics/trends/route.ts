import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { analyticsService } from '@/lib/services/analytics-service';

export const runtime = 'nodejs';

/**
 * GET /api/analytics/trends
 * Retorna análise de tendências
 * Requirements: 27.1, 27.2
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const trends = await analyticsService.calculateTrends(session.user.id);

        return NextResponse.json(trends);
    } catch (error: any) {
        console.error('Erro ao calcular tendências:', error);
        return NextResponse.json({ error: 'Erro ao calcular tendências' }, { status: 500 });
    }
}
