import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

// PUT - Atualizar dívida
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    console.log('🔍 [API] Buscando dívida:', { id, userId: auth.userId, body });

    // Buscar dívida (você pode ser o devedor OU o credor)
    const debt = await prisma.sharedDebt.findFirst({
      where: {
        id,
        OR: [
          { debtorId: auth.userId },
          { creditorId: auth.userId }
        ]
      }
    });

    console.log('🔍 [API] Dívida encontrada:', debt);

    if (!debt) {
      console.error('❌ [API] Dívida não encontrada');
      return NextResponse.json(
        { error: 'Dívida não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar dívida
    const updatedDebt = await prisma.sharedDebt.update({
      where: { id },
      data: {
        status: body.status || debt.status,
        paidAt: body.paidAt !== undefined ? (body.paidAt ? new Date(body.paidAt) : null) : debt.paidAt,
        currentAmount: body.currentAmount !== undefined ? body.currentAmount : debt.currentAmount,
      }
    });

    console.log('✅ Dívida atualizada:', {
      id: updatedDebt.id,
      status: updatedDebt.status,
      paidAt: updatedDebt.paidAt
    });

    return NextResponse.json(updatedDebt);
  } catch (error) {
    console.error('❌ Erro ao atualizar dívida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar dívida
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;

    // Buscar dívida
    const debt = await prisma.debt.findFirst({
      where: {
        id,
        userId: auth.userId
      }
    });

    if (!debt) {
      return NextResponse.json(
        { error: 'Dívida não encontrada' },
        { status: 404 }
      );
    }

    // Deletar dívida
    await prisma.debt.delete({
      where: { id }
    });

    console.log('✅ Dívida deletada:', id);

    return NextResponse.json({ message: 'Dívida deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar dívida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Buscar dívida específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;

    // Buscar dívida
    const debt = await prisma.debt.findFirst({
      where: {
        id,
        userId: auth.userId
      }
    });

    if (!debt) {
      return NextResponse.json(
        { error: 'Dívida não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(debt);
  } catch (error) {
    console.error('❌ Erro ao buscar dívida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
