import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { ipAddress } = body;

    // TODO: Implementar bloqueio de IP real
    console.log(`IP bloqueado: ${ipAddress}`);

    return NextResponse.json({
      success: true,
      message: `IP ${ipAddress} bloqueado com sucesso`
    });
  } catch (error) {
    console.error('Erro ao bloquear IP:', error);
    return NextResponse.json(
      { error: 'Erro ao bloquear IP' },
      { status: 500 }
    );
  }
}

