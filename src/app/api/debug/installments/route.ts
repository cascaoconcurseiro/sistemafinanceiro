import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

/**
 * API de Debug para Parcelamentos
 * GET - Lista todas as transações parceladas (incluindo deletadas)
 * POST - Limpa transações parceladas deletadas (força soft delete)
 */

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar TODAS as transações parceladas (incluindo deletadas)
    const allInstallments = await prisma.transaction.findMany({
      where: {
        userId: auth.userId,
        OR: [
          { installmentGroupId: { not: null } },
          { parentTransactionId: { not: null } },
          { AND: [
            { installmentNumber: { not: null } },
            { totalInstallments: { gt: 1 } }
          ]}
        ]
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        description: true,
        amount: true,
        installmentNumber: true,
        totalInstallments: true,
        installmentGroupId: true,
        parentTransactionId: true,
        deletedAt: true,
        createdAt: true,
        isShared: true,
        myShare: true,
      }
    });

    // Agrupar por installmentGroupId
    const groups = new Map<string, any[]>();

    allInstallments.forEach(t => {
      const groupKey = t.installmentGroupId || t.parentTransactionId || t.description;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(t);
    });

    // Formatar resposta
    const groupedData = Array.from(groups.entries()).map(([groupKey, transactions]) => {
      const activeCount = transactions.filter(t => !t.deletedAt).length;
      const deletedCount = transactions.filter(t => t.deletedAt).length;

      return {
        groupKey,
        totalTransactions: transactions.length,
        activeTransactions: activeCount,
        deletedTransactions: deletedCount,
        status: activeCount > 0 ? 'ATIVO' : 'DELETADO',
        transactions: transactions.map(t => ({
          id: t.id,
          description: t.description,
          installment: `${t.installmentNumber}/${t.totalInstallments}`,
          amount: Number(t.amount),
          myShare: t.myShare ? Number(t.myShare) : null,
          isShared: t.isShared,
          deletedAt: t.deletedAt,
          createdAt: t.createdAt,
        }))
      };
    });

    return NextResponse.json({
      success: true,
      totalGroups: groupedData.length,
      activeGroups: groupedData.filter(g => g.status === 'ATIVO').length,
      deletedGroups: groupedData.filter(g => g.status === 'DELETADO').length,
      groups: groupedData,
    });

  } catch (error) {
    console.error('❌ [Debug Installments] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar parcelamentos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, groupKey } = body;

    if (action === 'force-delete-group' && groupKey) {
      // Forçar soft delete de um grupo específico
      
      const result = await prisma.transaction.updateMany({
        where: {
          userId: auth.userId,
          OR: [
            { installmentGroupId: groupKey },
            { parentTransactionId: groupKey },
            { description: groupKey }
          ],
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      });

      console.log(`✅ [Debug] ${result.count} transações marcadas como deletadas`);

      return NextResponse.json({
        success: true,
        message: `${result.count} transações marcadas como deletadas`,
        count: result.count
      });
    }

    if (action === 'cleanup-orphans') {
      // Limpar transações órfãs (parcelas sem grupo completo)
      
      // Buscar todos os grupos
      const allInstallments = await prisma.transaction.findMany({
        where: {
          userId: auth.userId,
          installmentGroupId: { not: null },
          deletedAt: null
        },
        select: {
          installmentGroupId: true,
          totalInstallments: true,
        }
      });

      // Contar parcelas por grupo
      const groupCounts = new Map<string, number>();
      allInstallments.forEach(t => {
        const key = t.installmentGroupId!;
        groupCounts.set(key, (groupCounts.get(key) || 0) + 1);
      });

      // Encontrar grupos incompletos
      const incompleteGroups: string[] = [];
      for (const [groupId, count] of groupCounts.entries()) {
        const expected = allInstallments.find(t => t.installmentGroupId === groupId)?.totalInstallments || 0;
        if (count < expected) {
          incompleteGroups.push(groupId);
        }
      }

      console.log(`🔍 [Debug] Encontrados ${incompleteGroups.length} grupos incompletos`);

      // Deletar grupos incompletos
      let totalDeleted = 0;
      for (const groupId of incompleteGroups) {
        const result = await prisma.transaction.updateMany({
          where: {
            userId: auth.userId,
            installmentGroupId: groupId,
            deletedAt: null
          },
          data: {
            deletedAt: new Date()
          }
        });
        totalDeleted += result.count;
      }

      return NextResponse.json({
        success: true,
        message: `${totalDeleted} transações órfãs marcadas como deletadas`,
        incompleteGroups: incompleteGroups.length,
        totalDeleted
      });
    }

    return NextResponse.json(
      { error: 'Ação inválida. Use: force-delete-group ou cleanup-orphans' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ [Debug Installments] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar ação' },
      { status: 500 }
    );
  }
}

