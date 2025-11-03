import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

// GET - Buscar cartão por ID
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

    const creditCard = await prisma.creditCard.findFirst({
      where: {
        id,
        userId: auth.userId
      }
    });

    if (!creditCard) {
      return NextResponse.json(
        { error: 'Cartão não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: creditCard });
  } catch (error) {
    console.error('Erro ao buscar cartão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar cartão por ID
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
    const data = await request.json();

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
        isActive: data.isActive !== undefined ? data.isActive : true,
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

// DELETE - Deletar cartão por ID
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

    // ✅ CORREÇÃO: Deletar PERMANENTEMENTE do banco de dados
    console.log('🗑️ Deletando cartão permanentemente:', id);

    // 1. Deletar faturas
    const deletedInvoices = await prisma.invoice.deleteMany({
      where: { creditCardId: id, userId: auth.userId }
    });
    console.log(`   ✅ Deletadas ${deletedInvoices.count} faturas`);

    // 2. Deletar lançamentos contábeis das transações
    const transactions = await prisma.transaction.findMany({
      where: { creditCardId: id, userId: auth.userId },
      select: { id: true }
    });

    for (const transaction of transactions) {
      await prisma.journalEntry.deleteMany({
        where: { transactionId: transaction.id }
      });
    }
    console.log(`   ✅ Deletados lançamentos de ${transactions.length} transações`);

    // 3. Deletar transações
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: { creditCardId: id, userId: auth.userId }
    });
    console.log(`   ✅ Deletadas ${deletedTransactions.count} transações`);

    // 4. Deletar cartão
    await prisma.creditCard.delete({
      where: { id }
    });
    console.log(`   ✅ Cartão deletado permanentemente`);

    return NextResponse.json({
      success: true,
      message: 'Cartão deletado permanentemente do banco de dados',
      deletedTransactions: deletedTransactions.count,
      deletedInvoices: deletedInvoices.count
    });
  } catch (error) {
    console.error('Erro ao deletar cartão:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar cartão de crédito' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
