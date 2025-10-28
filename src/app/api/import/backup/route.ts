import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exportService } from '@/lib/services/export-service';

/**
 * POST /api/import/backup
 * Importa backup
 * Requirements: 23.4
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();

        const result = await exportService.importBackup(session.user.id, body.backupData);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Erro ao importar backup:', error);
        return NextResponse.json({ error: 'Erro ao importar backup' }, { status: 500 });
    }
}
