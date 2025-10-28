import { NextRequest, NextResponse } from 'next/server';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { TransactionSchema, validateOrThrow } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';

/**
 * GET /api/transactions
 * Lista todas as transações do usuário com filtros opcionais
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');
    const goalId = searchParams.get('goalId');
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const service = new FinancialOperationsService();
    
    // Construir filtros
    const where: any = { userId: auth.userId, deletedAt: null };
    if (tripId) where.tripId = tripId;
    if (goalId) where.goalId = goalId;
    if (accountId) where.accountId = accountId;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Buscar transações usando Prisma diretamente (GET não precisa do serviço)
    const { prisma } = await import('@/lib/prisma');
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, type: true } },
        creditCard: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      transactions: transactions.map(t => ({
        ...t,
        amount: Number(t.amount),
        myShare: t.myShare ? Number(t.myShare) : null,
        totalSharedAmount: t.totalSharedAmount ? Number(t.totalSharedAmount) : null,
        sharedWith: t.sharedWith ? JSON.parse(t.sharedWith) : null,
        metadata: t.metadata ? JSON.parse(t.metadata) : null,
      })),
    });
  } catch (error) {
    console.error('❌ [API Transactions GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Cria uma nova transação com validação completa e atomicidade garantida
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 [API Transactions POST] Dados recebidos:', body);

    // ✅ PREPARAR DADOS ANTES DA VALIDAÇÃO
    // Converter tipo de transação para o formato esperado pelo schema
    const typeMap: Record<string, string> = {
      'income': 'RECEITA',
      'expense': 'DESPESA',
      'transfer': 'TRANSFERENCIA',
      'RECEITA': 'RECEITA',
      'DESPESA': 'DESPESA',
      'TRANSFERENCIA': 'TRANSFERENCIA',
    };

    const transactionData = {
      ...body,
      userId: auth.userId, // Adicionar userId
      type: typeMap[body.type] || body.type, // Converter tipo
      date: new Date(body.date),
      amount: Math.abs(Number(body.amount)), // Sempre positivo
    };

    // ✅ VALIDAÇÃO COM ZOD (após preparar os dados)
    try {
      validateOrThrow(TransactionSchema, transactionData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Dados inválidos',
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // ✅ USAR SERVIÇO FINANCEIRO (métodos estáticos)
    
    // Se for parcelado, usar método específico
    if (body.installments && body.installments > 1) {
      console.log(`📦 [API Transactions POST] Criando ${body.installments} parcelas`);
      
      const result = await FinancialOperationsService.createInstallments({
        baseTransaction: transactionData,
        totalInstallments: body.installments,
        firstDueDate: transactionData.date,
        frequency: 'monthly',
      });

      return NextResponse.json({
        success: true,
        message: `${result.installments.length} parcelas criadas com sucesso`,
        parentTransaction: {
          ...result.parentTransaction,
          amount: Number(result.parentTransaction.amount),
        },
        installments: result.installments.map(i => ({
          ...i,
          amount: Number(i.amount),
        })),
      });
    }

    // Transação única
    const transaction = await FinancialOperationsService.createTransaction({
      transaction: transactionData,
      createJournalEntries: true, // Sempre criar partidas dobradas
      linkToInvoice: !!body.creditCardId, // Vincular a fatura se for cartão
    });

    console.log('✅ [API Transactions POST] Transação criada:', transaction.id);

    return NextResponse.json({
      success: true,
      transaction: {
        ...transaction,
        amount: Number(transaction.amount),
        myShare: transaction.myShare ? Number(transaction.myShare) : null,
        totalSharedAmount: transaction.totalSharedAmount ? Number(transaction.totalSharedAmount) : null,
      },
    });
  } catch (error) {
    console.error('❌ [API Transactions POST] Erro:', error);
    console.error('❌ [API Transactions POST] Stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Erros de validação do serviço
    if (error instanceof Error) {
      console.error('❌ [API Transactions POST] Mensagem:', error.message);
      
      if (error.message.includes('Saldo insuficiente')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('Limite insuficiente')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      
      // Retornar mensagem de erro detalhada em desenvolvimento
      return NextResponse.json(
        { 
          error: 'Erro ao criar transação',
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar transação', details: String(error) },
      { status: 500 }
    );
  }
}
