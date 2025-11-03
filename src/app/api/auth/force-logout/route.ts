import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Deletar todos os cookies de autenticação
    const cookieStore = cookies();

    // Deletar access_token
    cookieStore.delete('access_token');

    // Deletar cookies do NextAuth
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('__Secure-next-auth.session-token');
    cookieStore.delete('next-auth.csrf-token');
    cookieStore.delete('__Host-next-auth.csrf-token');

    
    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
