import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

interface RouteParams {
  params: {
    id: string
  }
}

export const dynamic = 'force-dynamic';

// POST - Vincular transações automaticamente baseado no período da viagem
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const tripId = params.id;
    const body = await request.json();
    const { transactionIds } = body;

    console.log('🔗 [LinkTransactions API] Vinculando transações:', transactionIds, 'à viagem:', tripId);

    if (!tripId) {
      return NextResponse.json(
        { error: 'ID da viagem é obrigatório' },
        { status: 400 }
      );
    }

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'IDs das transações são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a viagem existe
    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar as transações
    const result = await prisma.transaction.updateMany({
      where: {
        id: {
          in: transactionIds
        }
      },
      data: {
        tripId: tripId
      }
    });

    console.log(`✅ [LinkTransactions API] ${result.count} transações vinculadas com sucesso`);

    // Recalcular o total gasto da viagem
    const transactions = await prisma.transaction.findMany({
      where: {
        tripId: tripId,
        type: 'DESPESA'
      }
    });

    const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    // Atualizar o campo spent da viagem
    await prisma.trip.update({
      where: { id: tripId },
      data: { spent: totalSpent }
    });

    console.log(`✅ [LinkTransactions API] Total gasto atualizado: R$ ${totalSpent.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      linkedCount: result.count,
      totalSpent,
      message: `${result.count} transação(ões) vinculada(s) com sucesso`
    });

  } catch (error) {
    console.error('❌ [LinkTransactions API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
