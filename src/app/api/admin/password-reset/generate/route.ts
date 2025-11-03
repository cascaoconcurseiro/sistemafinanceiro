import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { logSecurityEvent } from '@/lib/security-logger';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { email } = body;

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Gerar token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // Salvar token no banco
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log(`✅ Token gerado para ${email}: ${token}`);

    // Registrar evento de segurança
    await logSecurityEvent({
      type: 'PASSWORD_RESET_REQUEST',
      userId: user.id,
      details: `Solicitação de reset de senha para: ${email}`,
      severity: 'MEDIUM',
      metadata: { email, requestedBy: session.user.id },
    });

    return NextResponse.json({
      success: true,
      resetLink,
      token,
      expiresIn: '1 hora'
    });
  } catch (error) {
    console.error('Erro ao gerar link:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar link' },
      { status: 500 }
    );
  }
}

