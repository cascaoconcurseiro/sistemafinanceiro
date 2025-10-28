/**
 * Job de geração de faturas mensais
 * Executa no dia de fechamento de cada cartão
 * Requirements: 10.1
 */

import { prisma } from '@/lib/prisma';
import { creditCardService } from '@/lib/services/credit-card-service';

export async function generateInvoicesJob() {
    console.log('[JOB] Iniciando geração de faturas mensais...');

    try {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // Buscar cartões com dia de fechamento = hoje
        const cards = await prisma.creditCard.findMany({
            where: {
                closingDay: currentDay,
                isActive: true,
            },
        });

        const generatedInvoices = [];

        for (const card of cards) {
            try {
                const invoice = await creditCardService.generateInvoice(
                    card.id,
                    currentMonth,
                    currentYear,
                    card.userId
                );

                generatedInvoices.push(invoice);
            } catch (error) {
                console.error(`[JOB] Erro ao gerar fatura do cartão ${card.id}:`, error);
            }
        }

        console.log(`[JOB] ${generatedInvoices.length} faturas geradas com sucesso`);

        return {
            success: true,
            count: generatedInvoices.length,
            invoices: generatedInvoices,
        };
    } catch (error) {
        console.error('[JOB] Erro ao gerar faturas:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

// Configuração do cron: executar diariamente às 01:00
export const generateInvoicesJobConfig = {
    name: 'generate-invoices',
    schedule: '0 1 * * *', // Diariamente às 01:00
    handler: generateInvoicesJob,
};
