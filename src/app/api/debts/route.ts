import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';

// Schema de validação
const createDebtSchema = z.object({
  creditorId: z.string().min(1, 'Credor é obrigatório'),
  debtorId: z.string().min(1, 'Devedor é obrigatório'),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  transactionId: z.string().optional().nullable(),
});

// GET - Listar dívidas
export async function GET(request: NextRequest) {
  
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = auth.userId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    // Buscar dívidas onde o usuário é devedor OU credor
    const debts = await prisma.sharedDebt.findMany({
      where: {
        OR: [
          { debtorId: userId },
          { creditorId: userId },
        ],
        ...(status !== 'all' && { status: status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    
    return NextResponse.json({
      success: true,
      debts: debts.map(d => ({
        id: d.id,
        creditorId: d.creditorId,
        debtorId: d.debtorId,
        originalAmount: Number(d.originalAmount),
        currentAmount: Number(d.currentAmount),
        paidAmount: Number(d.paidAmount),
        description: d.description,
        status: d.status,
        transactionId: d.transactionId,
        tripId: d.tripId, // ✅ NOVO: Retornar tripId
        paidAt: d.paidAt,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    });
  } catch (error) {
    console.error('❌ [Debts API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar dívida
export async function POST(request: NextRequest) {
  
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await request.json();

    console.log('📦 [Debts API] Dados recebidos:', body);

    // Validar dados
    const validation = createDebtSchema.safeParse(body);
    if (!validation.success) {
            return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Criar dívida
    const debt = await prisma.sharedDebt.create({
      data: {
        userId: userId,
        creditorId: data.creditorId,
        debtorId: data.debtorId,
        originalAmount: data.amount,
        currentAmount: data.amount,
        paidAmount: 0,
        description: data.description,
        status: 'active',
        transactionId: data.transactionId,
      },
    });

    
    return NextResponse.json({
      success: true,
      debt: {
        id: debt.id,
        creditorId: debt.creditorId,
        debtorId: debt.debtorId,
        originalAmount: Number(debt.originalAmount),
        currentAmount: Number(debt.currentAmount),
        paidAmount: Number(debt.paidAmount),
        description: debt.description,
        status: debt.status,
        createdAt: debt.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ [Debts API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

