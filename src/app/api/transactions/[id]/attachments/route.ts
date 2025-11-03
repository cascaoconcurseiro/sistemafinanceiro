import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { transactionService } from '@/lib/services/transaction-service';
export const dynamic = 'force-dynamic';

/**
 * POST /api/transactions/[id]/attachments
 * Upload de anexo
 * Requirements: 20.1, 20.2
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

        const attachment = await transactionService.addAttachment(
            params.id,
            session.user.id,
            {
                fileName: body.fileName,
                fileSize: body.fileSize,
                fileType: body.fileType,
                fileUrl: body.fileUrl,
            }
        );

        return NextResponse.json({
            success: true,
            attachment,
            message: 'Anexo adicionado com sucesso',
        });
    } catch (error: any) {
        console.error('Erro ao adicionar anexo:', error);
        return NextResponse.json({ error: error.message || 'Erro ao adicionar anexo' }, { status: 500 });
    }
}
