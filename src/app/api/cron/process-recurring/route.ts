import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron Job: Processar Transações Recorrentes
 * Executa diariamente às 00:00
 * Cria transações baseadas em templates recorrentes
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorização (apenas Vercel Cron pode chamar)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 [Cron] Processando transações recorrentes...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar templates ativos que precisam gerar transação hoje
    const templates = await prisma.recurringTransactionTemplate.findMany({
      where: {
        isActive: true,
        nextGeneration: {
          lte: today
        },
        OR: [
          { endDate: null },
          { endDate: { gte: today } }
        ]
      }
    });

    console.log(`📋 [Cron] ${templates.length} template(s) para processar`);

    let created = 0;
    let errors = 0;

    for (const template of templates) {
      try {
        const templateData = JSON.parse(template.templateData);

        // Criar transação
        await prisma.transaction.create({
          data: {
            ...templateData,
            date: today,
            recurringId: template.id,
          }
        });

        // Calcular próxima data de geração
        let nextDate = new Date(template.nextGeneration);
        
        switch (template.frequency) {
          case 'DAILY':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'WEEKLY':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'MONTHLY':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'YEARLY':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        // Atualizar template
        await prisma.recurringTransactionTemplate.update({
          where: { id: template.id },
          data: {
            lastGenerated: today,
            nextGeneration: nextDate
          }
        });

        created++;
      } catch (error) {
        console.error(`❌ [Cron] Erro ao processar template ${template.id}:`, error);
        errors++;
      }
    }

    console.log(`✅ [Cron] Processamento concluído: ${created} criadas, ${errors} erros`);

    return NextResponse.json({
      success: true,
      processed: templates.length,
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

export const dynamic = 'force-dynamic';
