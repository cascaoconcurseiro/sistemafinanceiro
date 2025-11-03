import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export const dynamic = 'force-dynamic';

// GET - Buscar fatura de um cartão específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const cardId = params.id;
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '0');
    const year = parseInt(searchParams.get('year') || '0');

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Mês e ano são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o cartão pertence ao usuário
    const card = await prisma.creditCard.findFirst({
      where: {
        id: cardId,
        userId: auth.userId,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: 'Cartão não encontrado' },
        { status: 404 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Usar Prisma ORM em vez de SQL raw
    let invoice = await prisma.invoice.findFirst({
      where: {
        creditCardId: cardId,
        month: month,
        year: year,
        userId: auth.userId // ✅ Garantir isolamento de dados
      }
    });

    // Calcular data de vencimento
    const dueDate = new Date(year, month, card.dueDay);

    // Se não existe, criar fatura vazia
    if (!invoice) {
      const invoiceId = `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // ✅ CORREÇÃO CRÍTICA: Usar Prisma ORM em vez de SQL raw
      invoice = await prisma.invoice.create({
        data: {
          id: invoiceId,
          userId: auth.userId,
          creditCardId: cardId,
          month: month,
          year: year,
          totalAmount: 0,
          paidAmount: 0,
          dueDate: dueDate,
          isPaid: false,
          status: 'open'
        }
      });
    }

    const invoiceData = invoice;

    // Buscar transações do cartão no período do mês específico
    // Para cartão de crédito, todas as transações do mês devem aparecer na fatura
    const startDate = new Date(year, month - 1, 1); // Primeiro dia do mês
    const endDate = new Date(year, month, 0); // Último dia do mês

    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId: cardId,
        userId: auth.userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      orderBy: {
        date: 'asc',
      },
    });

    
    // Calcular total
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );

    // ✅ CORREÇÃO CRÍTICA: Usar Prisma ORM em vez de SQL raw
    if (Number(invoiceData.totalAmount) !== totalAmount) {
      await prisma.invoice.update({
        where: {
          id: invoiceData.id,
          userId: auth.userId // ✅ Garantir isolamento de dados
        },
        data: {
          totalAmount: totalAmount,
          updatedAt: new Date()
        }
      });
      invoiceData.totalAmount = totalAmount;
    }

    // Determinar status da fatura
    let status = 'open';
    let isPaid = invoiceData.isPaid;

    if (Number(invoiceData.paidAmount) >= Number(invoiceData.totalAmount) && Number(invoiceData.totalAmount) > 0) {
      status = 'paid';
      isPaid = true;
    } else if (Number(invoiceData.paidAmount) > 0) {
      status = 'partial';
      isPaid = false;
    } else if (new Date(invoiceData.dueDate) < new Date() && Number(invoiceData.totalAmount) > 0) {
      status = 'overdue';
      isPaid = false;
    } else {
      status = 'open';
      isPaid = false;
    }

    // ✅ CORREÇÃO CRÍTICA: Usar Prisma ORM em vez de SQL raw
    if (isPaid !== invoiceData.isPaid) {
      await prisma.invoice.update({
        where: {
          id: invoiceData.id,
          userId: auth.userId // ✅ Garantir isolamento de dados
        },
        data: {
          isPaid: isPaid,
          updatedAt: new Date()
        }
      });
      invoiceData.isPaid = isPaid;
    }

    // Buscar categorias para resolver os nomes
    const categoryIds = [...new Set(transactions.map(t => t.categoryId).filter(Boolean))];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true }
    });
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    // Formatar transações
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      description: t.description,
      amount: Math.abs(Number(t.amount)),
      date: t.date.toISOString(),
      category: t.categoryId ? (categoryMap.get(t.categoryId) || 'Categoria não encontrada') : 'Sem categoria',
      installmentNumber: t.installmentNumber,
      totalInstallments: t.totalInstallments,
      isInstallment: t.isInstallment,
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: invoiceData.id,
        month: invoiceData.month,
        year: invoiceData.year,
        totalAmount: Number(Number(invoiceData.totalAmount).toFixed(2)),
        paidAmount: Number(Number(invoiceData.paidAmount).toFixed(2)),
        dueDate: new Date(invoiceData.dueDate).toISOString(),
        isPaid: invoiceData.isPaid,
        status: status,
        transactions: formattedTransactions,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar fatura:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar fatura' },
      { status: 500 }
    );
  }
}
