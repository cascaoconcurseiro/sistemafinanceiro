import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/login',
  '/api/auth',
  '/api/health'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pular recursos estáticos e arquivos do Next.js
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon') || 
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/workbox-') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  
  // Redirecionar /login para /auth/login
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Obter token do NextAuth
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Se é rota pública
  if (isPublicRoute) {
    // Se já está logado e tenta acessar login/register, redirecionar
    if (token && (pathname === '/auth/login' || pathname === '/auth/register')) {
      const role = token.role as string
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Para rotas protegidas, verificar autenticação
  if (!token) {
    console.log('🔒 [Auth] Sem sessão - Redirecionando para login:', pathname)
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verificar acesso admin
  if (pathname.startsWith('/admin')) {
    const role = token.role as string
    if (role !== 'ADMIN') {
      console.log('⛔ [Auth] Acesso negado ao admin para:', token.email)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Se está na raiz, redirecionar baseado no role
  if (pathname === '/') {
    const role = token.role as string
    if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}