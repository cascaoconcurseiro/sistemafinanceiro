import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { creditCardService } from '@/lib/services/credit-card-service';

/**
 * POST /api/credit-cards/[id]/invoices/generate
 * Gera fatura do mês
 * Requirements: 10.1, 10.2
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();

        const invoice = await creditCardService.generateInvoice(
            params.id,
            body.month,
            body.year,
            session.user.id
        );

        return NextResponse.json({
            success: true,
            invoice,
            message: 'Fatura gerada com sucesso',
        });
    } catch (error: any) {
        console.error('Erro ao gerar fatura:', error);
        return NextResponse.json({ error: error.message || 'Erro ao gerar fatura' }, { status: 500 });
    }
}
