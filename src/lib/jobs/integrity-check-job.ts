/**
 * Job de validação de integridade
 * Executa semanalmente para verificar consistência dos dados
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { prisma } from '@/lib/prisma';
import { validationService } from '@/lib/services/validation-service';

export async function integrityCheckJob() {
    console.log('[JOB] Iniciando validação de integridade...');

    try {
        // Buscar todos os usuários ativos
        const users = await prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, email: true },
        });

        const results = [];

        for (const user of users) {
            try {
                const report = await validationService.validateIntegrity(user.id);

                if (!report.isValid) {
                    console.warn(`[JOB] Problemas de integridade encontrados para usuário ${user.email}`);

                    // Criar notificação para o usuário
                    await prisma.notification.create({
                        data: {
                            userId: user.id,
                            type: 'INTEGRITY_ISSUE',
                            title: 'Problemas de integridade detectados',
                            message: `${report.issues.length} problemas encontrados. Verifique seus dados.`,
                            isRead: false,
                        },
                    });
                }

                results.push({
                    userId: user.id,
                    email: user.email,
                    isValid: report.isValid,
                    issuesCount: report.issues.length,
                });
            } catch (error) {
                console.error(`[JOB] Erro ao validar integridade do usuário ${user.id}:`, error);
            }
        }

        const totalIssues = results.reduce((sum, r) => sum + r.issuesCount, 0);

        console.log(`[JOB] Validação de integridade concluída. ${totalIssues} problemas encontrados`);

        return {
            success: true,
            usersChecked: results.length,
            totalIssues,
            results,
        };
    } catch (error) {
        console.error('[JOB] Erro ao validar integridade:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

// Configuração do cron: executar semanalmente aos domingos às 02:00
export const integrityCheckJobConfig = {
    name: 'integrity-check',
    schedule: '0 2 * * 0', // Domingos às 02:00
    handler: integrityCheckJob,
};
