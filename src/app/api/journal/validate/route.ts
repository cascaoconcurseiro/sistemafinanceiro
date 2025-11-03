import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JournalIntegrationService } from '@/lib/services/journal-integration-service';
export const dynamic = 'force-dynamic';

/**
 * API para validar integridade do sistema de partidas dobradas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const validation = await JournalIntegrationService.validateSystemIntegrity(
      session.user.id
    );

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Erro ao validar sistema:', error);
    return NextResponse.json(
      { error: 'Erro ao validar integridade do sistema' },
      { status: 500 }
    );
  }
}
