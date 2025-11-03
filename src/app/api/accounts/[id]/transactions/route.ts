import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

// GET - Buscar transações de uma conta específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const accountId = params.id;
    const { searchParams } = new URL(request.url);

    // Parâmetros de filtro
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Verificar se a conta existe e pertence ao usuário
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: auth.userId, deletedAt: null },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    // Construir filtros
    const where: any = {
      accountId,
      userId: auth.userId,
      deletedAt: null,
    };

    // Filtro por mês/ano
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Filtro por tipo
    if (type && type !== 'all') {
      where.type = type;
    }

    // Filtro por categoria
    if (category && category !== 'all') {
      where.categoryId = category;
    }

    // Filtro por busca
    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Buscar transações com paginação
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          categoryRef: {
            select: { id: true, name: true, color: true, icon: true },
          },
          creditCard: {
            select: { id: true, name: true },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calcular saldo da conta
    const allTransactions = await prisma.transaction.findMany({
      where: { accountId, deletedAt: null },
      select: { amount: true, type: true, isShared: true, myShare: true },
    });

    const balance = allTransactions.reduce((sum, t) => {
      // ✅ CORREÇÃO: Usar myShare para transações compartilhadas
      const amount = (t.isShared && t.myShare) ? Number(t.myShare) : Number(t.amount);
      return sum + (t.type === 'income' || t.type === 'RECEITA' ? amount : -amount);
    }, 0);

    // Formatar transações
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      date: t.date.toISOString(),
      status: t.status,
      category: t.categoryRef ? {
        id: t.categoryRef.id,
        name: t.categoryRef.name,
        color: t.categoryRef.color,
        icon: t.categoryRef.icon,
      } : null,
      creditCard: t.creditCard ? {
        id: t.creditCard.id,
        name: t.creditCard.name,
      } : null,
      isInstallment: t.isInstallment,
      installmentNumber: t.installmentNumber,
      totalInstallments: t.totalInstallments,
      isTransfer: t.isTransfer,
      transferType: t.transferType,
      transferId: t.transferId,
      isShared: t.isShared, // ✅ CORREÇÃO: Incluir campo isShared
      myShare: t.myShare ? Number(t.myShare) : null, // ✅ CORREÇÃO: Incluir myShare
      totalSharedAmount: t.totalSharedAmount ? Number(t.totalSharedAmount) : null, // ✅ CORREÇÃO: Incluir totalSharedAmount
    }));

    return NextResponse.json({
      success: true,
      data: {
        account: {
          id: account.id,
          name: account.name,
          type: account.type,
          balance,
        },
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar transações da conta:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar transações da conta' },
      { status: 500 }
    );
  }
}
