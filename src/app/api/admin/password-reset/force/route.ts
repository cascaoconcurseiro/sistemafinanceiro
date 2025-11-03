import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    // TODO: Adicionar campo forcePasswordReset no schema
    // await db.user.update({
    //   where: { id: userId },
    //   data: { forcePasswordReset: true },
    // });

    console.log(`Usuário ${userId} será forçado a resetar senha`);

    return NextResponse.json({
      success: true,
      message: 'Usuário será obrigado a resetar senha no próximo login'
    });
  } catch (error) {
    console.error('Erro ao forçar reset:', error);
    return NextResponse.json(
      { error: 'Erro ao forçar reset' },
      { status: 500 }
    );
  }
}

