import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ error: 'tripId é obrigatório' }, { status: 400 });
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se a viagem pertence ao usuário
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: auth.userId
      }
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Viagem não encontrada ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    const exchanges = await prisma.currencyExchange.findMany({
      where: { tripId },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(exchanges);
  } catch (error) {
    console.error('Erro ao buscar câmbios:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.tripId || !data.date || !data.amountBRL || !data.amountForeign || !data.exchangeRate) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tripId, date, amountBRL, amountForeign, exchangeRate' },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se a viagem pertence ao usuário
    const trip = await prisma.trip.findFirst({
      where: {
        id: data.tripId,
        userId: auth.userId
      }
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Viagem não encontrada ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    const exchange = await prisma.currencyExchange.create({
      data: {
        tripId: data.tripId,
        date: new Date(data.date),
        amountBRL: data.amountBRL,
        amountForeign: data.amountForeign,
        exchangeRate: data.exchangeRate,
        cet: data.cet || null,
        location: data.location || null,
        notes: data.notes || null
      }
    });

    return NextResponse.json(exchange, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar câmbio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se o câmbio pertence ao usuário
    const existingExchange = await prisma.currencyExchange.findFirst({
      where: { id: data.id },
      include: {
        trip: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!existingExchange || existingExchange.trip?.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Câmbio não encontrado ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.amountBRL !== undefined) updateData.amountBRL = data.amountBRL;
    if (data.amountForeign !== undefined) updateData.amountForeign = data.amountForeign;
    if (data.exchangeRate !== undefined) updateData.exchangeRate = data.exchangeRate;
    if (data.cet !== undefined) updateData.cet = data.cet;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const exchange = await prisma.currencyExchange.update({
      where: { id: data.id },
      data: updateData
    });

    return NextResponse.json(exchange);
  } catch (error) {
    console.error('Erro ao atualizar câmbio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se o câmbio pertence ao usuário
    const existingExchange = await prisma.currencyExchange.findFirst({
      where: { id },
      include: {
        trip: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!existingExchange || existingExchange.trip?.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Câmbio não encontrado ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    await prisma.currencyExchange.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir câmbio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
