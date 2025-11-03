import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Buscar solicitações de reset do banco
    const requests = await prisma.passwordResetToken.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Buscar informações dos usuários
    const requestsWithUserInfo = await Promise.all(
      requests.map(async (request) => {
        const user = await prisma.user.findUnique({
          where: { id: request.userId },
          select: { name: true, email: true },
        });

        return {
          ...request,
          userName: user?.name || 'Usuário Desconhecido',
          userEmail: user?.email || '',
        };
      })
    );

    return NextResponse.json(requestsWithUserInfo);
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitações' },
      { status: 500 }
    );
  }
}

