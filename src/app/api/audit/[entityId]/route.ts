import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { auditService } from '@/lib/services/audit-service';

/**
 * GET /api/audit/[entityId]
 * Retorna histórico de alterações
 * Requirements: 11.3
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { entityId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get('entityType');

        const history = await auditService.getAuditHistory(
            params.entityId,
            entityType || undefined
        );

        return NextResponse.json({ history });
    } catch (error: any) {
        console.error('Erro ao buscar histórico:', error);
        return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
    }
}
