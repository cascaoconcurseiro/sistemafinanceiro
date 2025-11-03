import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BasicAuditService } from '@/lib/services/audit-service-basic';
import { rateLimit } from '@/lib/rate-limiter';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
export const dynamic = 'force-dynamic';

// Função para obter JWT_SECRET com validação
function getJWTSecret() {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('🔴 ERRO CRÍTICO: JWT_SECRET não configurado em produção!');
  }
  return process.env.JWT_SECRET || 'sua-grana-secret-key-dev-only';
}

function getJWTRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || 'sua-grana-refresh-secret-key-dev-only';
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log('🔐 [LOGIN] Tentativa de login:', email);

    if (!email || !password) {
      console.log('❌ [LOGIN] Email ou senha faltando');
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Rate limiting: 5 tentativas por minuto
    if (!rateLimit(email, 5, 60000)) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde 1 minuto.' },
        { status: 429 }
      );
    }

    // Buscar usuário no banco
    console.log('🔍 [LOGIN] Buscando usuário no banco...');
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isActive: true
      }
    });

    if (!user) {
      console.log('❌ [LOGIN] Usuário não encontrado:', email);
      await BasicAuditService.logAuth(
        'FAILED_LOGIN',
        email,
        request.ip,
        request.headers.get('user-agent') || undefined
      );
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    console.log('✅ [LOGIN] Usuário encontrado:', user.email);

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Conta desativada' },
        { status: 401 }
      );
    }

    // Verificar senha
    console.log('🔑 [LOGIN] Verificando senha...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ [LOGIN] Senha inválida');
      await BasicAuditService.logAuth(
        'FAILED_LOGIN',
        email,
        request.ip,
        request.headers.get('user-agent') || undefined
      );
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    console.log('✅ [LOGIN] Senha válida');

    // Gerar tokens JWT
    console.log('🎫 [LOGIN] Gerando tokens JWT...');
    const JWT_SECRET = getJWTSecret();
    const JWT_REFRESH_SECRET = getJWTRefreshSecret();
    
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ [LOGIN] Tokens gerados');

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // ✅ NOVO: Garantir que o usuário tenha categorias padrão
    try {
      const { ensureDefaultCategories } = await import('@/lib/ensure-default-categories');
      await ensureDefaultCategories(user.id);
    } catch (error) {
      console.error('Erro ao criar categorias padrão:', error);
      // Não falhar o login se houver erro nas categorias
    }

    // Registrar login na auditoria
    await BasicAuditService.logAuth(
      'LOGIN',
      user.id,
      request.ip,
      request.headers.get('user-agent') || undefined
    );

    // Configurar cookies seguros
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });

    // 🔒 SEGURANÇA: Cookies com todas as flags de segurança
    response.cookies.set('access_token', accessToken, {
      httpOnly: true, // Previne acesso via JavaScript (XSS)
      secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
      sameSite: 'lax', // Permite redirecionamentos (strict bloqueia)
      path: '/',
      maxAge: 24 * 60 * 60 // 24 horas
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true, // Previne acesso via JavaScript (XSS)
      secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
      sameSite: 'lax', // Permite redirecionamentos (strict bloqueia)
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    });

    console.log('✅ [LOGIN] Login bem-sucedido! Cookies configurados.');
    return response;
  } catch (error) {
    console.error('❌ Erro no login:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
