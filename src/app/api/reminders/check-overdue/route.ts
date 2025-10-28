import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * Verifica lembretes vencidos e cria notificações
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const now = new Date();
    
    // Buscar lembretes pendentes que já venceram ou estão vencendo hoje
    const overdueReminders = await prisma.reminder.findMany({
      where: {
        userId: auth.userId,
        status: 'pending',
        dueDate: {
          lte: now
        }
      }
    });

    console.log(`📅 [Check Overdue] Encontrados ${overdueReminders.length} lembretes vencidos`);

    // Criar notificações para lembretes vencidos
    for (const reminder of overdueReminders) {
      // Verificar se já existe notificação para este lembrete
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: auth.userId,
          type: 'reminder',
          relatedId: reminder.id
        }
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId: auth.userId,
            title: `Lembrete: ${reminder.title}`,
            message: reminder.description || 'Você tem um lembrete pendente',
            type: 'reminder',
            priority: reminder.priority || 'medium',
            isRead: false,
            relatedId: reminder.id,
            metadata: JSON.stringify({ reminderId: reminder.id })
          }
        });
        
        console.log(`✅ [Check Overdue] Notificação criada para: ${reminder.title}`);
      }
    }

    return NextResponse.json({
      success: true,
      overdueCount: overdueReminders.length,
      message: `${overdueReminders.length} lembretes vencidos verificados`
    });
  } catch (error) {
    console.error('❌ [Check Overdue] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar lembretes' },
      { status: 500 }
    );
  }
}
