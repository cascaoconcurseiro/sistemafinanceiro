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

    // Buscar bugs do banco de dados
    const bugs = await prisma.bugReport.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Buscar informações dos usuários
    const bugsWithUserInfo = await Promise.all(
      bugs.map(async (bug) => {
        const user = await prisma.user.findUnique({
          where: { id: bug.userId },
          select: { name: true, email: true },
        });

        return {
          ...bug,
          userName: user?.name || 'Usuário Desconhecido',
          userEmail: user?.email || '',
        };
      })
    );

    return NextResponse.json(bugsWithUserInfo);
  } catch (error) {
    console.error('Erro ao buscar bugs:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar bugs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, severity, category, stackTrace, userAgent, url } = body;

    // Salvar bug no banco
    const bug = await prisma.bugReport.create({
      data: {
        userId: session.user.id,
        title,
        description,
        severity: severity || 'MEDIUM',
        category: category || 'Geral',
        stackTrace,
        userAgent,
        url,
      },
    });

    
    return NextResponse.json({
      success: true,
      message: 'Bug reportado com sucesso',
      bugId: bug.id,
    });
  } catch (error) {
    console.error('Erro ao reportar bug:', error);
    return NextResponse.json(
      { error: 'Erro ao reportar bug' },
      { status: 500 }
    );
  }
}

