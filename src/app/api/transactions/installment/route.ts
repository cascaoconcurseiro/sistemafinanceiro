import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { transactionService } from '@/lib/services/transaction-service';
import { ValidationError } from '@/lib/services/validation-service';

/**
 * POST /api/transactions/installment
 * Cria transação parcelada
 * Requirements: 3.1, 3.2, 3.3
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();

        const transactions = await transactionService.createInstallmentTransaction({
            userId: session.user.id,
            creditCardId: body.creditCardId,
            categoryId: body.categoryId,
            amount: body.amount,
            description: body.description,
            type: 'expense',
            date: new Date(body.date),
            isInstallment: true,
            totalInstallments: body.totalInstallments,
            tripId: body.tripId,
        });

        return NextResponse.json({
            success: true,
            transactions,
            message: `${transactions.length} parcelas criadas com sucesso`,
        });
    } catch (error: any) {
        if (error instanceof ValidationError) {
            return NextResponse.json(
                { error: error.message, field: error.field, code: error.code },
                { status: 400 }
            );
        }

        console.error('Erro ao criar transação parcelada:', error);
        return NextResponse.json(
            { error: 'Erro ao criar transação parcelada' },
            { status: 500 }
        );
    }
}
