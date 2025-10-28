import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-grana-secret-key';

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/force-logout',
  '/force-logout.html',
  '/_next',
  '/favicon.ico',
  '/icon-192.png',
];

// Rotas de API que precisam validar userId
const API_ROUTES = [
  '/api/accounts',
  '/api/transactions',
  '/api/categories',
  '/api/unified-financial',
  '/api/notifications',
  '/api/reminders',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Permitir rotas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Verificar token apenas em rotas de API
  if (API_ROUTES.some(route => pathname.startsWith(route))) {
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, JWT_SECRET) as any;
        const userId = decoded.userId;
        
        if (userId) {
          // Validar se userId existe no banco (apenas para rotas críticas)
          if (pathname.startsWith('/api/accounts') || pathname.startsWith('/api/transactions')) {
            try {
              const { PrismaClient } = await import('@prisma/client');
              const prisma = new PrismaClient();
              
              const userExists = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true }
              });
              
              await prisma.$disconnect();
              
              if (!userExists) {
                console.log('⚠️ [Middleware] Token válido mas userId não existe:', userId);
                
                // Retornar resposta especial que o frontend vai detectar
                return NextResponse.json(
                  { 
                    error: 'INVALID_USER_TOKEN',
                    message: 'Seu token de autenticação está desatualizado',
                    action: 'FORCE_LOGOUT'
                  },
                  { status: 401 }
                );
              }
            } catch (error) {
              console.error('Erro ao validar userId:', error);
            }
          }
        }
      } catch (error) {
        // Token inválido - forçar logout
        console.log('⚠️ [Middleware] Token JWT inválido');
        return NextResponse.json(
          { 
            error: 'INVALID_TOKEN',
            message: 'Token de autenticação inválido',
            action: 'FORCE_LOGOUT'
          },
          { status: 401 }
        );
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
