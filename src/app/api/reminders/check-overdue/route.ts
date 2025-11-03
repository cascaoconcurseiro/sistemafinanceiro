import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-grana-secret-key-dev-only';

export async function GET(request: NextRequest) {
  try {
    // Buscar token do cookie
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar e decodificar token JWT
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      userId: string;
    };

    // Buscar lembretes vencidos
    const now = new Date();
    const overdueReminders = await prisma.reminder.findMany({
      where: {
        userId: decoded.userId,
        dueDate: {
          lte: now,
        },
        status: {
          in: ['pending', 'active'],
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      count: overdueReminders.length,
      reminders: overdueReminders,
    });
  } catch (error) {
    console.error('❌ Erro ao verificar lembretes vencidos:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar lembretes' },
      { status: 500 }
    );
  }
}
