import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Não é possível excluir usuário administrador' },
        { status: 400 }
      );
    }

    // Excluir todos os dados relacionados ao usuário
    await prisma.$transaction([
      prisma.auditEvent.deleteMany({ where: { userId: params.id } }),
      prisma.notification.deleteMany({ where: { userId: params.id } }),
      prisma.attachment.deleteMany({ where: { userId: params.id } }),
      prisma.transactionTag.deleteMany({
        where: { transaction: { userId: params.id } },
      }),
      prisma.tag.deleteMany({ where: { userId: params.id } }),
      prisma.sharedExpense.deleteMany({ where: { userId: params.id } }),
      prisma.recurringTransaction.deleteMany({ where: { userId: params.id } }),
      prisma.transaction.deleteMany({ where: { userId: params.id } }),
      prisma.budget.deleteMany({ where: { userId: params.id } }),
      prisma.goal.deleteMany({ where: { userId: params.id } }),
      prisma.creditCard.deleteMany({ where: { userId: params.id } }),
      prisma.account.deleteMany({ where: { userId: params.id } }),
      prisma.category.deleteMany({ where: { userId: params.id } }),
      prisma.trip.deleteMany({ where: { userId: params.id } }),
      prisma.contact.deleteMany({ where: { userId: params.id } }),
      prisma.familyMember.deleteMany({ where: { userId: params.id } }),
      prisma.user.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir usuário' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { isActive } = body;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}
