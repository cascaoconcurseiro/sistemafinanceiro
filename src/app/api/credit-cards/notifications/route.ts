import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';


// GET - Verificar faturas próximas do vencimento e em atraso
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // ✅ CORREÇÃO CRÍTICA: Usar Prisma ORM em vez de SQL raw para evitar injection
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        userId: auth.userId,
        isPaid: false,
        totalAmount: {
          gt: 0
        }
      },
      include: {
        creditCard: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    const notifications = [];

    for (const invoice of unpaidInvoices) {
      const dueDate = new Date(invoice.dueDate);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const remainingAmount = Number(invoice.totalAmount) - Number(invoice.paidAmount || 0);

      // Fatura vencida
      if (now > dueDate) {
        notifications.push({
          type: 'overdue',
          title: 'Fatura em Atraso',
          message: `A fatura do cartão ${invoice.creditCard?.name} está ${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? 's' : ''} em atraso`,
          invoiceId: invoice.id,
          cardName: invoice.creditCard?.name,
          amount: remainingAmount,
          dueDate: invoice.dueDate,
          daysOverdue: Math.abs(diffDays),
          priority: 'high'
        });
      }
      // Fatura próxima do vencimento (3 dias ou menos)
      else if (diffDays <= 3 && diffDays >= 0) {
        notifications.push({
          type: 'due_soon',
          title: 'Vencimento Próximo',
          message: `A fatura do cartão ${invoice.creditCard?.name} vence em ${diffDays} dia${diffDays !== 1 ? 's' : ''}`,
          invoiceId: invoice.id,
          cardName: invoice.creditCard?.name,
          amount: remainingAmount,
          dueDate: invoice.dueDate,
          daysUntilDue: diffDays,
          priority: diffDays === 0 ? 'high' : 'medium'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        summary: {
          total: notifications.length,
          overdue: notifications.filter(n => n.type === 'overdue').length,
          dueSoon: notifications.filter(n => n.type === 'due_soon').length,
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar notificações de faturas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    );
  }
}

// POST - Criar notificação no sistema
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, type, metadata } = body;

    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Título, mensagem e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: auth.userId,
        title,
        message,
        type,
        metadata: metadata ? JSON.stringify(metadata) : null,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return NextResponse.json(
      { error: 'Erro ao criar notificação' },
      { status: 500 }
    );
  }
}
