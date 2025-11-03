import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { runJob, runAllJobs, jobs } from '@/lib/jobs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/jobs/run
 * Executa um job específico ou todos os jobs
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

        const body = await request.json();
        const { jobName } = body;

        if (jobName) {
            // Executar job específico
            const result = await runJob(jobName);
            return NextResponse.json({
                success: true,
                job: jobName,
                result,
            });
        } else {
            // Executar todos os jobs
            const results = await runAllJobs();
            return NextResponse.json({
                success: true,
                results,
            });
        }
    } catch (error: any) {
        console.error('Erro ao executar job:', error);
        return NextResponse.json({ error: error.message || 'Erro ao executar job' }, { status: 500 });
    }
}

/**
 * GET /api/jobs/run
 * Lista todos os jobs disponíveis
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        return NextResponse.json({
            jobs: jobs.map((job) => ({
                name: job.name,
                schedule: job.schedule,
            })),
        });
    } catch (error: any) {
        console.error('Erro ao listar jobs:', error);
        return NextResponse.json({ error: 'Erro ao listar jobs' }, { status: 500 });
    }
}
