import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JournalIntegrationService } from '@/lib/services/journal-integration-service';

/**
 * API para popular lançamentos contábeis retroativamente
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('🔄 Iniciando população de lançamentos contábeis...');

    const result = await JournalIntegrationService.populateHistoricalJournalEntries(
      session.user.id
    );

    console.log('✅ População concluída:', result);

    return NextResponse.json({
      message: 'Lançamentos contábeis populados com sucesso',
      ...result,
    });
  } catch (error) {
    console.error('Erro ao popular lançamentos:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao popular lançamentos',
      },
      { status: 500 }
    );
  }
}
