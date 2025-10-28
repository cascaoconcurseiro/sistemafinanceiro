import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exportService } from '@/lib/services/export-service';

/**
 * POST /api/export/backup
 * Exporta backup completo
 * Requirements: 23.1
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const data = await exportService.exportFullBackup(session.user.id);

        return new NextResponse(data, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`,
            },
        });
    } catch (error: any) {
        console.error('Erro ao exportar backup:', error);
        return NextResponse.json({ error: 'Erro ao exportar backup' }, { status: 500 });
    }
}
