import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { status } = body;

    // Atualizar bug no banco
    await prisma.bugReport.update({
      where: { id: params.id },
      data: { status },
    });

    console.log(`✅ Bug ${params.id} atualizado para status: ${status}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar bug:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar bug' },
      { status: 500 }
    );
  }
}
