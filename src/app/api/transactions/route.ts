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
    
    // ✅ OTIMIZAÇÃO: Paginação
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;

    const service = new FinancialOperationsService();

    // Construir filtros
    const where: any = { 
      userId: auth.userId, 
      deletedAt: null,
      // ✅ CORREÇÃO: Excluir transações pagas por outros (só aparecem em Compartilhadas)
      paidBy: null,
    };
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
    
    // ✅ OTIMIZAÇÃO: Buscar total e dados em paralelo
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          description: true,
          amount: true,
          date: true,
          type: true,
          status: true,
          accountId: true,
          categoryId: true,
          creditCardId: true,
          isShared: true,
          myShare: true,
          totalSharedAmount: true,
          isInstallment: true,
          installmentNumber: true,
          totalInstallments: true,
          tripId: true,
          goalId: true,
          createdAt: true,
          paidBy: true, // ✅ NOVO: Para identificar se foi pago por outro
          metadata: true, // ✅ NOVO: Dados adicionais
          sharedWith: true, // ✅ NOVO: Com quem foi compartilhado
          account: { select: { id: true, name: true, type: true } },
          categoryRef: { select: { id: true, name: true, type: true } },
          creditCard: { select: { id: true, name: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // ✅ OTIMIZAÇÃO: Resposta paginada
    return NextResponse.json({
      success: true,
      transactions: transactions.map(t => ({
        ...t,
        amount: Number(t.amount),
        myShare: t.myShare ? Number(t.myShare) : null,
        totalSharedAmount: t.totalSharedAmount ? Number(t.totalSharedAmount) : null,
        category: t.categoryRef?.name || 'Sem Categoria',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + transactions.length < total,
      },
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
    console.log('📦 [API Transactions POST] Dados recebidos:', JSON.stringify(body, null, 2));

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

    // ✅ CORREÇÃO: Preparar dados com campos de parcelamento se necessário
    const installments = body.installments || body.totalInstallments;
    
    // ✅ CORREÇÃO CRÍTICA: Converter data corretamente para evitar problemas de timezone
    // Adicionar horário ao meio-dia para garantir que a data seja a correta
    const dateWithTime = body.date.includes('T') ? body.date : `${body.date}T12:00:00`;
    
    // ✅ NOVO: Calcular myShare para transações compartilhadas
    let myShare = null;
    let totalSharedAmount = null;
    let isShared = false;

    if (body.sharedWith && Array.isArray(body.sharedWith) && body.sharedWith.length > 0) {
      isShared = true;
      const totalParticipants = body.sharedWith.length + 1; // +1 para incluir você
      const amount = Math.abs(Number(body.amount));
      myShare = amount / totalParticipants;
      totalSharedAmount = amount;

      console.log(`🤝 [API Transactions POST] Transação compartilhada:`, {
        totalParticipants,
        amount,
        myShare,
        sharedWith: body.sharedWith
      });
    }

    const transactionData = {
      ...body,
      userId: auth.userId, // Adicionar userId
      type: typeMap[body.type] || body.type, // Converter tipo
      date: new Date(dateWithTime), // ✅ Data com horário para evitar timezone
      amount: Math.abs(Number(body.amount)), // Sempre positivo
      isShared, // ✅ NOVO: Marcar como compartilhada
      myShare, // ✅ NOVO: Minha parte
      totalSharedAmount, // ✅ NOVO: Valor total compartilhado
      // ✅ Adicionar campos de parcelamento se for parcelado
      ...(installments && installments > 1 ? {
        isInstallment: true,
        installmentNumber: body.installmentNumber || 1,
        totalInstallments: installments,
      } : {}),
    };

    // ✅ NOVO: Se é "pago por outra pessoa", criar SharedDebt em vez de Transaction
    if (body.paidBy && body.paidBy !== auth.userId) {
      console.log('👤 [API Transactions POST] Pago por outra pessoa - criando SharedDebt');
      
      const { prisma } = await import('@/lib/prisma');
      
      // Buscar nome da categoria
      let categoryName = 'Sem categoria';
      if (body.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: body.categoryId },
          select: { name: true },
        });
        categoryName = category?.name || 'Sem categoria';
      }
      
      const debt = await prisma.sharedDebt.create({
        data: {
          userId: auth.userId,
          creditorId: body.paidBy, // Quem pagou
          debtorId: auth.userId, // Eu (quem deve)
          originalAmount: body.myShare || body.amount,
          currentAmount: body.myShare || body.amount,
          description: `${body.description} (${categoryName})`,
          status: 'active',
        },
      });
      
      console.log('✅ [API Transactions POST] SharedDebt criada:', debt.id);
      
      return NextResponse.json({
        success: true,
        debt,
        message: 'Dívida registrada com sucesso (não foi debitado da sua conta)',
      });
    }

    // ✅ VALIDAÇÃO COM ZOD (após preparar os dados)
        try {
      console.log('🔍 [API Transactions POST] Validando dados:', JSON.stringify(transactionData, null, 2));
      validateOrThrow(TransactionSchema, transactionData);
      console.log('✅ [API Transactions POST] Validação passou!');
          } catch (error) {
            if (error instanceof z.ZodError) {
        console.error('❌ [API Transactions POST] Erro de validação:', error.errors);
        return NextResponse.json(
          {
            error: 'Dados inválidos',
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          },
          { status: 400 }
        );
      }
      console.error('❌ [API Transactions POST] Erro desconhecido:', error);
      throw error;
    }

    // ✅ USAR SERVIÇO FINANCEIRO (métodos estáticos)

    // Se for parcelado, usar método específico
    if (installments && installments > 1) {
      console.log(`📦 [API Transactions POST] Criando ${installments} parcelas`);

      const result = await FinancialOperationsService.createInstallments({
        baseTransaction: transactionData, // Já tem os campos de parcelamento
        totalInstallments: installments,
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
      if (error.message.includes('não encontrada') || error.message.includes('não encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      // ✅ CORREÇÃO: Retornar mensagem de erro mais clara
      return NextResponse.json(
        {
          error: `Erro ao criar transação: ${error.message}`,
          details: process.env.NODE_ENV === 'development' ? error.stack : error.message
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
