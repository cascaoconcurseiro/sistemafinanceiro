import { NextRequest, NextResponse } from 'next/server';
import { rotateTokens } from '@/lib/services/token-service';
import { cookies } from 'next/headers';

/**
 * API: Refresh Token
 * Rotaciona tokens usando refresh token
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [Refresh Token] Iniciando rotação de tokens...');
    
    // Obter refresh token do cookie
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token não fornecido' },
        { status: 401 }
      );
    }
    
    // Rotacionar tokens
    const result = await rotateTokens(refreshToken);
    
    if (!result.success) {
      console.log('❌ [Refresh Token] Falha:', result.error);
      
      // Limpar cookies
      const response = NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
      
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      
      return response;
    }
    
    console.log('✅ [Refresh Token] Tokens rotacionados com sucesso');
    
    // Criar resposta com novos tokens
    const response = NextResponse.json({
      success: true,
      message: 'Tokens atualizados'
    });
    
    // Definir novos cookies
    response.cookies.set('access_token', result.accessToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutos
    });
    
    response.cookies.set('refresh_token', result.refreshToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ [Refresh Token] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
