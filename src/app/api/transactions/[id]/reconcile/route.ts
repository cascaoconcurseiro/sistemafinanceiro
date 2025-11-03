import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { transactionService } from '@/lib/services/transaction-service';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/transactions/[id]/reconcile
 * Marca transação como reconciliada
 * Requirements: 17.1
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const transaction = await transactionService.reconcileTransaction(
            params.id,
            session.user.id
        );

        return NextResponse.json({
            success: true,
            transaction,
            message: 'Transação reconciliada com sucesso',
        });
    } catch (error: any) {
        console.error('Erro ao reconciliar transação:', error);
        return NextResponse.json(
            { error: 'Erro ao reconciliar transação' },
            { status: 500 }
        );
    }
}
