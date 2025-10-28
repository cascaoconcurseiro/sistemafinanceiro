import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exportService } from '@/lib/services/export-service';

/**
 * GET /api/reports/tax/[year]
 * Gera relatório fiscal
 * Requirements: 24.1, 24.2
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { year: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const year = parseInt(params.year);

        const report = await exportService.generateTaxReport(session.user.id, year);

        return NextResponse.json(report);
    } catch (error: any) {
        console.error('Erro ao gerar relatório fiscal:', error);
        return NextResponse.json({ error: 'Erro ao gerar relatório fiscal' }, { status: 500 });
    }
}
