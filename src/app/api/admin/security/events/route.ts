import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Buscar eventos de segurança do banco
    const events = await db.securityEvent.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: 100, // Últimos 100 eventos
    });

    // Buscar informações dos usuários quando disponível
    const eventsWithUserInfo = await Promise.all(
      events.map(async (event) => {
        let userName = undefined;
        let userId = undefined;

        // Tentar extrair userId dos detalhes JSON
        if (event.details) {
          try {
            const metadata = JSON.parse(event.details);
            userId = metadata.userId;
          } catch (e) {
            // Ignorar erro de parse
          }
        }

        if (userId) {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { name: true },
          });
          userName = user?.name;
        }

        return {
          id: event.id,
          type: event.type,
          userId,
          userName,
          ipAddress: event.ipAddress || 'N/A',
          userAgent: event.userAgent || 'N/A',
          details: event.description,
          severity: event.severity,
          createdAt: event.timestamp.toISOString(),
        };
      })
    );

    return NextResponse.json(eventsWithUserInfo);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar eventos' },
      { status: 500 }
    );
  }
}

