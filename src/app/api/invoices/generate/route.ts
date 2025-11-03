import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
export const dynamic = 'force-dynamic';

/**
 * POST /api/invoices/generate
 * Gera faturas de cartão de crédito para o mês
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { creditCardId, month, year } = body;

    if (!creditCardId || !month || !year) {
      return NextResponse.json(
        { error: 'creditCardId, month e year são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`📊 [Invoices] Gerando fatura para cartão ${creditCardId} - ${month}/${year}`);

    // Verificar se cartão existe e pertence ao usuário
    const creditCard = await prisma.creditCard.findFirst({
      where: {
        id: creditCardId,
        userId: auth.userId,
      },
    });

    if (!creditCard) {
      return NextResponse.json(
        { error: 'Cartão de crédito não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se fatura já existe
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        creditCardId_month_year: {
          creditCardId,
          month,
          year,
        },
      },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Fatura já existe para este período' },
        { status: 400 }
      );
    }

    // Buscar transações do período
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(new Date(year, month - 1));

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: auth.userId,
        creditCardId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
        type: 'DESPESA',
      },
    });

    // Calcular total
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );

    // Calcular data de vencimento (dia de vencimento do cartão)
    const dueDate = new Date(year, month - 1, creditCard.dueDay);
    if (dueDate < new Date()) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    // Criar fatura
    const invoice = await prisma.invoice.create({
      data: {
        creditCardId,
        userId: auth.userId,
        month,
        year,
        totalAmount,
        dueDate,
        status: 'open',
      },
    });

    // Vincular transações à fatura
    await prisma.transaction.updateMany({
      where: {
        id: { in: transactions.map(t => t.id) },
      },
      data: {
        invoiceId: invoice.id,
      },
    });

    console.log(`✅ [Invoices] Fatura gerada: R$ ${totalAmount} (${transactions.length} transações)`);

    return NextResponse.json({
      invoice,
      transactionsCount: transactions.length,
      totalAmount,
    }, { status: 201 });
  } catch (error) {
    console.error('❌ [API Invoices] Erro ao gerar:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar fatura' },
      { status: 500 }
    );
  }
}
