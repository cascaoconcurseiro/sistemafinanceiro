import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { initializeCronJobs, getCronJobsInfo, isCronInitialized } from '@/lib/cron';

/**
 * POST /api/cron/init
 * Inicializa os cron jobs
 * Apenas para administradores
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // TODO: Verificar se usuário é admin
        // if (!session.user.isAdmin) {
        //     return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        // }

        if (isCronInitialized()) {
            return NextResponse.json({
                message: 'Cron jobs já estão inicializados',
                info: getCronJobsInfo(),
            });
        }

        initializeCronJobs();

        return NextResponse.json({
            success: true,
            message: 'Cron jobs inicializados com sucesso',
            info: getCronJobsInfo(),
        });
    } catch (error: any) {
        console.error('Erro ao inicializar cron jobs:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao inicializar cron jobs' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/cron/init
 * Retorna informações sobre os cron jobs
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        return NextResponse.json(getCronJobsInfo());
    } catch (error: any) {
        console.error('Erro ao obter informações dos cron jobs:', error);
        return NextResponse.json({ error: 'Erro ao obter informações' }, { status: 500 });
    }
}
