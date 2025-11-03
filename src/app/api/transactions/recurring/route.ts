import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { recurringService } from '@/lib/services/recurring-service';
export const dynamic = 'force-dynamic';

/**
 * POST /api/transactions/recurring
 * Cria template de transação recorrente
 * Requirements: 14.1, 14.2
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();

        const template = await recurringService.createRecurringTemplate({
            userId: session.user.id,
            templateData: body.templateData,
            frequency: body.frequency,
            startDate: new Date(body.startDate),
            endDate: body.endDate ? new Date(body.endDate) : undefined,
            occurrences: body.occurrences,
        });

        return NextResponse.json({
            success: true,
            template,
            message: 'Transação recorrente criada com sucesso',
        });
    } catch (error: any) {
        console.error('Erro ao criar transação recorrente:', error);
        return NextResponse.json(
            { error: 'Erro ao criar transação recorrente' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/transactions/recurring
 * Lista templates de transações recorrentes
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { prisma } = await import('@/lib/prisma');

        const templates = await prisma.recurringTransactionTemplate.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                nextGeneration: 'asc',
            },
        });

        return NextResponse.json({ templates });
    } catch (error: any) {
        console.error('Erro ao buscar transações recorrentes:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar transações recorrentes' },
            { status: 500 }
        );
    }
}
