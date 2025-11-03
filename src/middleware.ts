import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Função para obter JWT_SECRET com validação
function getJWTSecret() {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('🔴 ERRO CRÍTICO: JWT_SECRET não configurado em produção!');
  }
  return process.env.JWT_SECRET || 'sua-grana-secret-key-dev-only';
}

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/force-logout',
  '/api/auth/error',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/callback',
  '/api/auth/csrf',
  '/api/auth/session',
  '/api/auth/providers',
  '/api/health',
  '/force-logout.html',
  '/_next',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Permitir rotas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 🔧 TEMPORÁRIO: Middleware desabilitado para debug
  // TODO: Reativar após corrigir problema de cookies
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
