import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Função para gerar senha aleatória segura
function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Garantir pelo menos um de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Preencher o resto
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Embaralhar
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const userId = params.id;

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Gerar nova senha
    const newPassword = generateSecurePassword(12);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha no banco
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    console.log('✅ Senha resetada pelo admin:', {
      adminId: session.user.id,
      adminEmail: session.user.email,
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
    });

    // Registrar na auditoria (se tiver sistema de auditoria)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PASSWORD_RESET_BY_ADMIN',
          details: `Admin resetou senha do usuário ${user.email}`,
          metadata: JSON.stringify({
            targetUserId: user.id,
            targetUserEmail: user.email,
          }),
        },
      });
    } catch (error) {
      // Ignorar se tabela de auditoria não existir
      console.log('Auditoria não disponível');
    }

    return NextResponse.json({
      success: true,
      message: 'Senha resetada com sucesso',
      newPassword: newPassword, // Retornar apenas uma vez
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    return NextResponse.json(
      { error: 'Erro ao resetar senha' },
      { status: 500 }
    );
  }
}
