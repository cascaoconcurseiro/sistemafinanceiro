import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
export const dynamic = 'force-dynamic';

/**
 * API para limpar transações órfãs (sem conta válida)
 * DELETE /api/transactions/cleanup-orphans
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

    // Buscar todas as contas ativas do usuário
    const activeAccounts = await prisma.account.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    const activeAccountIds = activeAccounts.map(acc => acc.id);

    // Buscar transações órfãs (com conta que não existe)
    const orphanTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        accountId: {
          notIn: activeAccountIds,
        },
      },
      select: {
        id: true,
        description: true,
        accountId: true,
        amount: true,
      },
    });

    if (orphanTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma transação órfã encontrada',
        deleted: 0,
      });
    }

    // Fazer soft delete das transações órfãs
    const result = await prisma.transaction.updateMany({
      where: {
        id: {
          in: orphanTransactions.map(t => t.id),
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    console.log(`✅ ${result.count} transações órfãs removidas:`, orphanTransactions);

    return NextResponse.json({
      success: true,
      message: `${result.count} transações órfãs removidas com sucesso`,
      deleted: result.count,
      transactions: orphanTransactions,
    });

  } catch (error) {
    console.error('❌ Erro ao limpar transações órfãs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao limpar transações órfãs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
