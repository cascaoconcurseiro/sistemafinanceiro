/**
 * 🔐 AUTH HELPERS - Funções de Autenticação Reutilizáveis
 * Suporta tanto JWT quanto NextAuth
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-grana-secret-key';

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * Extrai e valida token JWT da requisição
 * Suporta tanto JWT (access_token) quanto NextAuth
 * 
 * IMPORTANTE: Esta função é ASYNC!
 * Use: const auth = await authenticateRequest(request);
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  console.log('🔐 [Auth] Tentando autenticar...');
  
  // 1. Tentar JWT com cookies primeiro (mais rápido e confiável em API routes)
  const accessToken = request.cookies.get('access_token')?.value;
  
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET) as any;
      const userId = decoded.userId;
      
      if (userId) {
        console.log('✅ [Auth] JWT OK - userId:', userId);
        return {
          success: true,
          userId
        };
      }
    } catch (error) {
      console.log('⚠️ [Auth] JWT inválido:', error);
    }
  }

  // 2. Fallback para NextAuth (pode não funcionar em todas as situações)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      console.log('✅ [Auth] NextAuth OK - userId:', session.user.id);
      return {
        success: true,
        userId: session.user.id
      };
    }
    console.log('⚠️ [Auth] NextAuth sem sessão');
  } catch (error) {
    console.log('⚠️ [Auth] NextAuth falhou:', error);
  }

  console.log('❌ [Auth] Nenhum método de autenticação funcionou');
  return {
    success: false,
    error: 'Token de acesso não encontrado'
  };
}

/**
 * Versão simplificada para uso direto (sem NextAuth)
 * Mantida para compatibilidade com código antigo
 */
export function authenticateRequestSync(request: NextRequest): AuthResult {
  const accessToken = request.cookies.get('access_token')?.value;
  
  if (!accessToken) {
    return {
      success: false,
      error: 'Token de acesso não encontrado'
    };
  }

  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as any;
    const userId = decoded.userId;
    
    if (!userId) {
      return {
        success: false,
        error: 'UserId não encontrado no token'
      };
    }

    return {
      success: true,
      userId
    };
  } catch (error) {
    return {
      success: false,
      error: 'Token inválido ou expirado'
    };
  }
}

/**
 * Gera token JWT
 */
export function generateToken(userId: string, expiresIn: string = '24h'): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
}

/**
 * Verifica se token é válido
 */
export function verifyToken(token: string): AuthResult {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      success: true,
      userId: decoded.userId
    };
  } catch (error) {
    return {
      success: false,
      error: 'Token inválido'
    };
  }
}
