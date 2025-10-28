/**
 * Job de detecção de fraudes
 * Executa diariamente para detectar transações suspeitas
 * Requirements: 28.1, 28.2
 */

import { prisma } from '@/lib/prisma';
import { fraudDetectionService } from '@/lib/services/fraud-detection-service';

export async function fraudDetectionJob() {
    console.log('[JOB] Iniciando detecção de fraudes...');

    try {
        // Buscar todos os usuários ativos
        const users = await prisma.user.findMany({
            where: { isActive: true },
            select: { id: true },
        });

        let totalAnomalies = 0;
        let totalMultipleTransactions = 0;

        for (const user of users) {
            try {
                // Detectar anomalias
                const anomalies = await fraudDetectionService.detectAnomalies(user.id);
                totalAnomalies += anomalies.length;

                // Detectar múltiplas transações
                const multiple = await fraudDetectionService.detectMultipleTransactions(user.id);
                totalMultipleTransactions += multiple.length;
            } catch (error) {
                console.error(`[JOB] Erro ao detectar fraudes do usuário ${user.id}:`, error);
            }
        }

        console.log(
            `[JOB] Detecção de fraudes concluída. ${totalAnomalies} anomalias e ${totalMultipleTransactions} alertas de múltiplas transações`
        );

        return {
            success: true,
            usersChecked: users.length,
            totalAnomalies,
            totalMultipleTransactions,
        };
    } catch (error) {
        console.error('[JOB] Erro ao detectar fraudes:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

// Configuração do cron: executar diariamente às 03:00
export const fraudDetectionJobConfig = {
    name: 'fraud-detection',
    schedule: '0 3 * * *', // Diariamente às 03:00
    handler: fraudDetectionJob,
};
