import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logSecurityEvent } from '@/lib/security-logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validações
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER', // Usuário normal
        isActive: true,
        emailVerified: new Date(), // Marcar como verificado
      },
    });

    console.log('✅ Usuário criado:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Registrar evento de segurança
    await logSecurityEvent({
      type: 'ACCOUNT_CREATED',
      userId: user.id,
      details: `Nova conta criada: ${user.email}`,
      severity: 'LOW',
      metadata: { email: user.email, name: user.name },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
