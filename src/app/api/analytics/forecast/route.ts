import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyticsService } from '@/lib/services/analytics-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/analytics/forecast
 * Retorna previsão de saldo
 * Requirements: 27.3
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const months = parseInt(searchParams.get('months') || '3');

        const forecast = await analyticsService.predictFutureBalance(session.user.id, months);

        return NextResponse.json({ forecast });
    } catch (error: any) {
        console.error('Erro ao calcular previsão:', error);
        return NextResponse.json({ error: 'Erro ao calcular previsão' }, { status: 500 });
    }
}
