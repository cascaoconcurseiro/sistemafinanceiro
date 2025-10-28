import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { accountService } from '@/lib/services/account-service';

/**
 * DELETE /api/accounts/[id]/delete
 * Exclui conta com opções
 * Requirements: 1.3, 1.4, 1.5
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const deleteAll = searchParams.get('deleteAll') === 'true';
        const keepTransactions = searchParams.get('keepTransactions') === 'true';
        const targetAccountId = searchParams.get('targetAccountId');

        await accountService.deleteAccount(params.id, session.user.id, {
            deleteAll,
            keepTransactions,
            targetAccountId: targetAccountId || undefined,
        });

        return NextResponse.json({
            success: true,
            message: 'Conta excluída com sucesso',
        });
    } catch (error: any) {
        console.error('Erro ao excluir conta:', error);
        return NextResponse.json({ error: error.message || 'Erro ao excluir conta' }, { status: 500 });
    }
}

/**
 * GET /api/accounts/[id]/delete
 * Valida exclusão de conta
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

        const validation = await accountService.validateAccountDeletion(
            params.id,
            session.user.id
        );

        return NextResponse.json(validation);
    } catch (error: any) {
        console.error('Erro ao validar exclusão:', error);
        return NextResponse.json({ error: 'Erro ao validar exclusão' }, { status: 500 });
    }
}
