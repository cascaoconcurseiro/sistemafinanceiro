import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing
 * 
 * Retorna APENAS as obrigações financeiras do usuário (o que ele deve ou vai receber)
 * 
 * ✅ REGRA DE OURO: Nunca misturar transações originais com dívidas
 * ✅ Retorna lista normalizada e pronta para exibir
 * ✅ Sem duplicações
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'regular'; // 'regular' | 'trip'
    const tripId = searchParams.get('tripId');

    console.log(`📋 [Billing API] Buscando obrigações para usuário ${auth.userId}, modo: ${mode}`);

    // ✅ PASSO 1: Buscar APENAS dívidas onde o usuário está envolvido
    const debtsWhereIAmDebtor = await prisma.sharedDebt.findMany({
      where: {
        debtorId: auth.userId,
        status: { in: ['active', 'paid'] }, // Incluir pagas para histórico
        currentAmount: { gt: 0 }, // Apenas com saldo > 0
        ...(mode === 'trip' && tripId ? { tripId } : {}),
        ...(mode === 'regular' ? { tripId: null } : {}),
      },
      include: {
        creditor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transaction: {
          select: {
            id: true,
            description: true,
            date: true,
            categoryId: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const debtsWhereIAmCreditor = await prisma.sharedDebt.findMany({
      where: {
        creditorId: auth.userId,
        status: { in: ['active', 'paid'] },
        currentAmount: { gt: 0 },
        ...(mode === 'trip' && tripId ? { tripId } : {}),
        ...(mode === 'regular' ? { tripId: null } : {}),
      },
      include: {
        debtor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transaction: {
          select: {
            id: true,
            description: true,
            date: true,
            categoryId: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`💰 [Billing API] Encontradas ${debtsWhereIAmDebtor.length} dívidas (eu devo)`);
    console.log(`💰 [Billing API] Encontrados ${debtsWhereIAmCreditor.length} créditos (me devem)`);

    // ✅ PASSO 2: Normalizar em formato único
    interface BillingObligation {
      id: string;
      debtId: string;
      originTransactionId: string | null;
      description: string;
      category: string;
      categoryId: string | null;
      owedValue: number;
      paidAmount: number;
      remainingAmount: number;
      date: string;
      dueDate: string;
      status: 'active' | 'paid';
      type: 'DEBIT' | 'CREDIT';
      counterparty: {
        id: string;
        name: string;
        email: string;
      };
      tripId: string | null;
    }

    const obligations: BillingObligation[] = [];

    // Processar dívidas (EU DEVO)
    debtsWhereIAmDebtor.forEach((debt) => {
      obligations.push({
        id: `debt-${debt.id}`,
        debtId: debt.id,
        originTransactionId: debt.transactionId,
        description: debt.description,
        category: debt.transaction?.category || 'Compartilhado',
        categoryId: debt.transaction?.categoryId || null,
        owedValue: Number(debt.amount),
        paidAmount: Number(debt.amount) - Number(debt.currentAmount),
        remainingAmount: Number(debt.currentAmount),
        date: debt.transaction?.date?.toISOString() || debt.createdAt.toISOString(),
        dueDate: calculateDueDate(debt.transaction?.date || debt.createdAt),
        status: debt.status as 'active' | 'paid',
        type: 'DEBIT',
        counterparty: {
          id: debt.creditor.id,
          name: debt.creditor.name || debt.creditor.email,
          email: debt.creditor.email,
        },
        tripId: debt.tripId,
      });
    });

    // Processar créditos (ME DEVEM)
    debtsWhereIAmCreditor.forEach((debt) => {
      obligations.push({
        id: `credit-${debt.id}`,
        debtId: debt.id,
        originTransactionId: debt.transactionId,
        description: debt.description,
        category: debt.transaction?.category || 'Compartilhado',
        categoryId: debt.transaction?.categoryId || null,
        owedValue: Number(debt.amount),
        paidAmount: Number(debt.amount) - Number(debt.currentAmount),
        remainingAmount: Number(debt.currentAmount),
        date: debt.transaction?.date?.toISOString() || debt.createdAt.toISOString(),
        dueDate: calculateDueDate(debt.transaction?.date || debt.createdAt),
        status: debt.status as 'active' | 'paid',
        type: 'CREDIT',
        counterparty: {
          id: debt.debtor.id,
          name: debt.debtor.name || debt.debtor.email,
          email: debt.debtor.email,
        },
        tripId: debt.tripId,
      });
    });

    // ✅ PASSO 3: Agrupar por pessoa
    const billingByUser: Record<string, {
      user: {
        id: string;
        name: string;
        email: string;
      };
      netBalance: number; // Positivo = me devem, Negativo = eu devo
      obligations: BillingObligation[];
    }> = {};

    obligations.forEach((obligation) => {
      const userId = obligation.counterparty.id;
      
      if (!billingByUser[userId]) {
        billingByUser[userId] = {
          user: obligation.counterparty,
          netBalance: 0,
          obligations: [],
        };
      }

      billingByUser[userId].obligations.push(obligation);
      
      // Calcular saldo líquido
      if (obligation.type === 'CREDIT') {
        billingByUser[userId].netBalance += obligation.remainingAmount;
      } else {
        billingByUser[userId].netBalance -= obligation.remainingAmount;
      }
    });

    console.log(`📊 [Billing API] Total de obrigações: ${obligations.length}`);
    console.log(`👥 [Billing API] Agrupadas em ${Object.keys(billingByUser).length} pessoas`);

    return NextResponse.json({
      success: true,
      obligations,
      billingByUser,
      summary: {
        totalDebts: debtsWhereIAmDebtor.length,
        totalCredits: debtsWhereIAmCreditor.length,
        totalDebtAmount: debtsWhereIAmDebtor.reduce((sum, d) => sum + Number(d.currentAmount), 0),
        totalCreditAmount: debtsWhereIAmCreditor.reduce((sum, d) => sum + Number(d.currentAmount), 0),
      },
    });
  } catch (error) {
    console.error('❌ [Billing API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar obrigações financeiras' },
      { status: 500 }
    );
  }
}

/**
 * Calcula data de vencimento (próximo mês, dia 10)
 */
function calculateDueDate(date: Date): string {
  const dueDate = new Date(date);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(10);
  return dueDate.toISOString().substring(0, 10);
}
