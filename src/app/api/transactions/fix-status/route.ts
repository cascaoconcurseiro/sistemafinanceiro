import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
export const dynamic = 'force-dynamic';

/**
 * API para corrigir status de transações
 * Atualiza transações PENDENTES para CLEARED quando apropriado
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    
    // Buscar transações pendentes que NÃO são "pago por outra pessoa"
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        userId: auth.userId,
        status: 'pending',
        paidBy: null, // Não é pago por outra pessoa
        deletedAt: null
      }
    });

    console.log(`🔍 [Fix Status] Encontradas ${pendingTransactions.length} transações pendentes sem paidBy`);

    // Atualizar todas para 'cleared'
    const result = await prisma.transaction.updateMany({
      where: {
        userId: auth.userId,
        status: 'pending',
        paidBy: null,
        deletedAt: null
      },
      data: {
        status: 'cleared'
      }
    });

    console.log(`✅ [Fix Status] ${result.count} transações atualizadas para 'cleared'`);

    return NextResponse.json({
      success: true,
      message: `${result.count} transações atualizadas para 'cleared'`,
      updated: result.count,
      transactions: pendingTransactions.map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        date: t.date
      }))
    });

  } catch (error) {
    console.error('❌ [Fix Status] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro ao atualizar status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

