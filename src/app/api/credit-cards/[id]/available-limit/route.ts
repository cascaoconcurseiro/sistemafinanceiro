import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { creditCardService } from '@/lib/services/credit-card-service';
export const dynamic = 'force-dynamic';

/**
 * GET /api/credit-cards/[id]/available-limit
 * Retorna limite disponível
 * Requirements: 26.2
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

        const availableLimit = await creditCardService.calculateAvailableLimit(
            params.id,
            session.user.id
        );

        return NextResponse.json({
            availableLimit,
        });
    } catch (error: any) {
        console.error('Erro ao calcular limite:', error);
        return NextResponse.json({ error: 'Erro ao calcular limite' }, { status: 500 });
    }
}
