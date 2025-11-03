import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    const month = searchParams.get('month'); // Format: YYYY-MM
    const year = searchParams.get('year');

    // Se não especificar mês, pegar o mês atual
    const currentDate = new Date();
    const targetMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // ✅ CORREÇÃO CRÍTICA: Buscar apenas cartões do usuário autenticado
    const creditCards = await prisma.creditCard.findMany({
      where: {
        userId: auth.userId, // ✅ Isolamento de dados
        ...(cardId && { id: cardId })
      },
      include: {
        transactions: {
          where: {
            date: {
              gte: `${targetMonth}-01`,
              lt: `${targetYear}-${String(parseInt(targetMonth.split('-')[1]) + 1).padStart(2, '0')}-01`
            },
            type: 'expense'
          },
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    // Gerar faturas para cada cartão
    const bills = creditCards.map(card => {
      const transactions = card.transactions;
      const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      // Calcular data de fechamento e vencimento
      const closingDay = card.closingDay || 5; // Dia 5 por padrão
      const dueDay = card.dueDay || 15; // Dia 15 por padrão

      const [year, month] = targetMonth.split('-').map(Number);
      const closingDate = new Date(year, month - 1, closingDay);
      const dueDate = new Date(year, month, dueDay); // Próximo mês

      // Se já passou do fechamento, a fatura está fechada
      const today = new Date();
      const isClosed = today > closingDate;
      const isOverdue = today > dueDate;

      let status: 'open' | 'closed' | 'overdue' = 'open';
      if (isOverdue) {
        status = 'overdue';
      } else if (isClosed) {
        status = 'closed';
      }

      // Agrupar transações por categoria
      const categoryBreakdown = transactions.reduce((acc, transaction) => {
        const category = transaction.category || 'outros';
        if (!acc[category]) {
          acc[category] = {
            name: category,
            amount: 0,
            count: 0,
            transactions: []
          };
        }
        acc[category].amount += Math.abs(Number(transaction.amount));
        acc[category].count += 1;
        acc[category].transactions.push(transaction);
        return acc;
      }, {} as Record<string, any>);

      return {
        id: `${card.id}-${targetMonth}`,
        cardId: card.id,
        cardName: card.name,
        cardLimit: Number(card.limit),
        currentBalance: Number(card.currentBalance),
        month: targetMonth,
        year: targetYear,
        closingDate: closingDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        totalAmount,
        availableLimit: Number(card.limit) - Number(card.currentBalance),
        status,
        transactionCount: transactions.length,
        transactions: transactions.map(t => ({
          id: t.id,
          description: t.description,
          amount: Math.abs(Number(t.amount)),
          date: t.date,
          category: t.category,
          installmentNumber: t.installmentNumber,
          totalInstallments: t.totalInstallments
        })),
        categoryBreakdown: Object.values(categoryBreakdown),
        summary: {
          totalTransactions: transactions.length,
          averageTransaction: transactions.length > 0 ? totalAmount / transactions.length : 0,
          largestTransaction: transactions.length > 0 ? Math.max(...transactions.map(t => Math.abs(Number(t.amount)))) : 0,
          installmentTransactions: transactions.filter(t => t.totalInstallments && t.totalInstallments > 1).length
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: bills,
      month: targetMonth,
      year: targetYear
    });

  } catch (error) {
    console.error('Erro ao buscar faturas de cartão:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, cardId, month, data } = body;

    // ✅ CORREÇÃO CRÍTICA: Verificar se o cartão pertence ao usuário
    const card = await prisma.creditCard.findFirst({
      where: {
        id: cardId,
        userId: auth.userId
      }
    });

    if (!card) {
      return NextResponse.json(
        { error: 'Cartão não encontrado ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'pay_bill':
        // Marcar fatura como paga
        const { paymentDate, paymentAccount } = data;

        // Buscar transações da fatura
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = `${month}-01`;
        const endDate = `${year}-${String(monthNum + 1).padStart(2, '0')}-01`;

        // ✅ CORREÇÃO CRÍTICA: Buscar apenas transações do usuário
        const transactions = await prisma.transaction.findMany({
          where: {
            creditCardId: cardId,
            userId: auth.userId, // ✅ Isolamento de dados
            date: {
              gte: startDate,
              lt: endDate
            },
            type: 'expense'
          }
        });

        // Criar transação de pagamento da fatura
        const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

        // ✅ CORREÇÃO CRÍTICA: Criar transação com userId
        await prisma.transaction.create({
          data: {
            userId: auth.userId, // ✅ Associar ao usuário
            description: `Pagamento Fatura Cartão - ${month}`,
            amount: -totalAmount, // Negativo porque é saída de dinheiro
            date: paymentDate,
            type: 'expense',
            category: 'pagamento-cartao',
            accountId: paymentAccount,
            notes: `Pagamento da fatura do cartão referente ao mês ${month}`
          }
        });

        // Atualizar saldo do cartão
        await prisma.creditCard.update({
          where: { id: cardId },
          data: {
            currentBalance: {
              decrement: totalAmount
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Fatura paga com sucesso'
        });

      case 'close_bill':
        // Fechar fatura manualmente - cartão já foi verificado acima

        return NextResponse.json({
          success: true,
          message: 'Fatura fechada com sucesso'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Erro ao processar ação da fatura:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
