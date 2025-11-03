import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Buscar usuários ativos
    const activeUsers = await db.user.count({
      where: { isActive: true },
    });

    // Dados mockados para outras estatísticas
    const stats = {
      failedLogins24h: 5,
      suspiciousActivities: 2,
      blockedIPs: 0,
      activeUsers,
      passwordResets24h: 1,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}

