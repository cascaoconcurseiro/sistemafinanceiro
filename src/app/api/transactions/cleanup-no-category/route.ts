import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

/**
 * API para limpar transações sem categoria
 * DELETE /api/transactions/cleanup-no-category
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Não autenticado' },
        { status: 401 }
      );
    }

    const userId = auth.userId!;

    // Buscar transações sem categoria
    const noCategoryTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { categoryId: null },
          { categoryId: '' },
        ],
      },
      select: {
        id: true,
        description: true,
        amount: true,
        categoryId: true,
      },
    });

    if (noCategoryTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma transação sem categoria encontrada',
        deleted: 0,
      });
    }

    // Fazer soft delete das transações sem categoria
    const result = await prisma.transaction.updateMany({
      where: {
        id: {
          in: noCategoryTransactions.map(t => t.id),
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    console.log(`✅ ${result.count} transações sem categoria removidas:`, noCategoryTransactions);

    return NextResponse.json({
      success: true,
      message: `${result.count} transações sem categoria removidas com sucesso`,
      deleted: result.count,
      transactions: noCategoryTransactions,
    });

  } catch (error) {
    console.error('❌ Erro ao limpar transações sem categoria:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao limpar transações sem categoria',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
