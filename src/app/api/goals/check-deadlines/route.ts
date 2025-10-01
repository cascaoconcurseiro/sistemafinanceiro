import { NextRequest, NextResponse } from 'next/server';
import { GoalNotificationService } from '@/lib/notifications/goal-notifications';

// POST - Check goal deadlines and create notifications
export async function POST() {
  try {
    await GoalNotificationService.checkGoalDeadlines();

    return NextResponse.json({ 
      message: 'Verificação de prazos das metas concluída com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao verificar prazos das metas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}