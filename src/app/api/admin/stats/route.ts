import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Buscar estatísticas
    const [totalUsers, activeUsers, totalTransactions, totalAccounts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.transaction.count(),
      prisma.account.count(),
    ]);

    // Calcular tamanho do banco de dados
    let databaseSize = '0 MB';
    try {
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        databaseSize = `${sizeInMB} MB`;
      }
    } catch (error) {
      console.error('Erro ao calcular tamanho do banco:', error);
    }

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalTransactions,
      totalAccounts,
      databaseSize,
      systemHealth: 'Bom',
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}

