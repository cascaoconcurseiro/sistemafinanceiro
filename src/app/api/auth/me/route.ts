import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-grana-secret-key-dev-only';

export async function GET(request: NextRequest) {
  try {
    // Buscar token do cookie
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar e decodificar token JWT
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
    };

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        name: decoded.name,
        email: decoded.email,
      }
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return NextResponse.json(
      { success: false, error: 'Token inválido ou expirado' },
      { status: 401 }
    );
  }
}
