/**
 * Job de verificação de vencimentos de faturas
 * Executa diariamente para alertar sobre faturas próximas do vencimento
 * Requirements: 22.1
 */

import { notificationService } from '@/lib/services/notification-service';

export async function checkInvoiceDuesJob() {
    console.log('[JOB] Iniciando verificação de vencimentos de faturas...');

    try {
        await notificationService.checkInvoiceDues();

        console.log('[JOB] Verificação de vencimentos concluída com sucesso');

        return {
            success: true,
            message: 'Verificação de vencimentos concluída',
        };
    } catch (error) {
        console.error('[JOB] Erro ao verificar vencimentos:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

// Configuração do cron: executar diariamente às 08:00
export const invoiceDueCheckJobConfig = {
    name: 'check-invoice-dues',
    schedule: '0 8 * * *', // Diariamente às 08:00
    handler: checkInvoiceDuesJob,
};
