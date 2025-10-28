/**
 * Job de verificação de alertas de orçamento
 * Executa diariamente para verificar orçamentos excedidos
 * Requirements: 22.2
 */

import { notificationService } from '@/lib/services/notification-service';

export async function checkBudgetAlertsJob() {
    console.log('[JOB] Iniciando verificação de alertas de orçamento...');

    try {
        await notificationService.checkBudgetAlerts();

        console.log('[JOB] Verificação de orçamentos concluída com sucesso');

        return {
            success: true,
            message: 'Verificação de orçamentos concluída',
        };
    } catch (error) {
        console.error('[JOB] Erro ao verificar orçamentos:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

// Configuração do cron: executar diariamente às 09:00
export const budgetAlertJobConfig = {
    name: 'check-budget-alerts',
    schedule: '0 9 * * *', // Diariamente às 09:00
    handler: checkBudgetAlertsJob,
};
