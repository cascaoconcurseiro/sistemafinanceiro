import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 [Logout] Processando logout...');

    // Criar resposta de sucesso
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

    // Limpar cookies de autenticação
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');

    // Limpar cookies do NextAuth se existirem
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Secure-next-auth.session-token');

    
    return response;
  } catch (error) {
    console.error('❌ [Logout] Erro ao fazer logout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
