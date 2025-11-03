import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { exportService } from '@/lib/services/export-service';

/**
 * POST /api/export/transactions
 * Exporta transações em formato especificado
 * Requirements: 23.2
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();

        const data = await exportService.exportTransactions(
            session.user.id,
            body.format || 'JSON',
            {
                startDate: body.startDate ? new Date(body.startDate) : undefined,
                endDate: body.endDate ? new Date(body.endDate) : undefined,
                accountId: body.accountId,
                categoryId: body.categoryId,
            }
        );

        return new NextResponse(data, {
            headers: {
                'Content-Type':
                    body.format === 'CSV'
                        ? 'text/csv'
                        : 'application/json',
                'Content-Disposition': `attachment; filename="transactions.${body.format === 'CSV' ? 'csv' : 'json'}"`,
            },
        });
    } catch (error: any) {
        console.error('Erro ao exportar transações:', error);
        return NextResponse.json({ error: 'Erro ao exportar transações' }, { status: 500 });
    }
}
