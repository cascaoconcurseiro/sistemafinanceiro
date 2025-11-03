import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron Job: Processar Transações Agendadas
 * Executa diariamente às 00:00
 * Cria transações de agendamentos que venceram
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar agendamentos pendentes que venceram
    const scheduled = await prisma.scheduledTransaction.findMany({
      where: {
        status: 'PENDING',
        scheduledDate: {
          lte: today
        }
      }
    });

    console.log(`📋 [Cron] ${scheduled.length} agendamento(s) para processar`);

    let created = 0;
    let errors = 0;

    for (const item of scheduled) {
      try {
        await prisma.$transaction(async (tx) => {
          // Criar transação
          const transaction = await tx.transaction.create({
            data: {
              userId: item.userId || '',
              accountId: item.accountId,
              amount: item.amount,
              description: item.description,
              type: item.type,
              date: item.scheduledDate,
              categoryId: item.category,
              status: 'cleared',
              tripId: item.tripId,
              isShared: !!item.sharedWith,
              sharedWith: item.sharedWith,
            }
          });

          // Atualizar agendamento
          await tx.scheduledTransaction.update({
            where: { id: item.id },
            data: {
              status: 'COMPLETED',
              processedAt: new Date()
            }
          });

          // Se for recorrente, criar próximo agendamento
          if (item.isRecurring && item.recurringFrequency) {
            let nextDate = new Date(item.scheduledDate);

            switch (item.recurringFrequency) {
              case 'DAILY':
                nextDate.setDate(nextDate.getDate() + (item.recurringInterval || 1));
                break;
              case 'WEEKLY':
                nextDate.setDate(nextDate.getDate() + 7 * (item.recurringInterval || 1));
                break;
              case 'MONTHLY':
                nextDate.setMonth(nextDate.getMonth() + (item.recurringInterval || 1));
                break;
              case 'YEARLY':
                nextDate.setFullYear(nextDate.getFullYear() + (item.recurringInterval || 1));
                break;
            }

            // Verificar se não passou da data final
            if (!item.recurringEndDate || nextDate <= item.recurringEndDate) {
              await tx.scheduledTransaction.create({
                data: {
                  ...item,
                  id: undefined,
                  scheduledDate: nextDate,
                  status: 'PENDING',
                  processedAt: null,
                  createdAt: undefined,
                  updatedAt: undefined,
                }
              });
            }
          }
        });

        created++;
      } catch (error) {
        console.error(`❌ [Cron] Erro ao processar agendamento ${item.id}:`, error);
        errors++;
      }
    }

    console.log(`✅ [Cron] Processamento concluído: ${created} criadas, ${errors} erros`);

    return NextResponse.json({
      success: true,
      processed: scheduled.length,
      created,
      errors
    });

  } catch (error) {
    console.error('❌ [Cron] Erro:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

