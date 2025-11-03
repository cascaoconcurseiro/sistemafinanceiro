import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
        const auth = await authenticateRequest(request);
    
    if (!auth.success) {
            return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const userId = auth.userId!;
    
    const creditCards = await prisma.creditCard.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        limit: true,
        currentBalance: true,
        closingDay: true,
        dueDay: true,
        isActive: true,
        paymentAccountId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

        return NextResponse.json({ success: true, data: creditCards });
  } catch (error) {
    console.error('❌ [Credit Cards] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cartões de crédito', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.name || !body.limit || !body.dueDay || !body.closingDay) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }

    const creditCard = await prisma.creditCard.create({
      data: {
        userId: auth.userId,
        name: body.name,
        limit: body.limit,
        currentBalance: 0,
        dueDay: body.dueDay,
        closingDay: body.closingDay,
        isActive: true,
        paymentAccountId: body.paymentAccountId || null,
      },
    });

    return NextResponse.json({ success: true, data: creditCard });
  } catch (error) {
    console.error('Erro ao criar cartão:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cartão de crédito' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do cartão é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o cartão pertence ao usuário
    const existing = await prisma.creditCard.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Cartão não encontrado' },
        { status: 404 }
      );
    }

    const creditCard = await prisma.creditCard.update({
      where: { id },
      data: {
        name: data.name,
        limit: data.limit,
        dueDay: data.dueDay,
        closingDay: data.closingDay,
        isActive: data.isActive,
        paymentAccountId: data.paymentAccountId !== undefined ? data.paymentAccountId : undefined,
      },
    });

    return NextResponse.json({ success: true, data: creditCard });
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar cartão de crédito' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do cartão é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o cartão pertence ao usuário
    const existing = await prisma.creditCard.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Cartão não encontrado' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.creditCard.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Cartão desativado' });
  } catch (error) {
    console.error('Erro ao deletar cartão:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar cartão de crédito' },
      { status: 500 }
    );
  }
}
