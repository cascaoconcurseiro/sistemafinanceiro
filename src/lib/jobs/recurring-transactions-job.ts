/**
 * Job de geração de transações recorrentes
 * Executa diariamente para gerar transações vencidas
 * Requirements: 14.3, 14.4
 */

import { recurringService } from '@/lib/services/recurring-service';

export async function generateRecurringTransactionsJob() {
    console.log('[JOB] Iniciando geração de transações recorrentes...');

    try {
        const transactions = await recurringService.generateDueTransactions();

        console.log(`[JOB] ${transactions.length} transações recorrentes geradas com sucesso`);

        return {
            success: true,
            count: transactions.length,
            transactions,
        };
    } catch (error) {
        console.error('[JOB] Erro ao gerar transações recorrentes:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

// Configuração do cron: executar diariamente às 00:00
export const recurringTransactionsJobConfig = {
    name: 'generate-recurring-transactions',
    schedule: '0 0 * * *', // Diariamente às 00:00
    handler: generateRecurringTransactionsJob,
};
