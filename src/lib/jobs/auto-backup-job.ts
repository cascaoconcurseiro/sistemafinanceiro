/**
 * Job de backup automático
 * Executa conforme configuração do usuário
 * Requirements: 23.1
 */

import { prisma } from '@/lib/prisma';
import { exportService } from '@/lib/services/export-service';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function autoBackupJob() {
    console.log('[JOB] Iniciando backup automático...');

    try {
        // Buscar usuários com backup automático habilitado
        const settings = await prisma.userSettings.findMany({
            where: {
                autoBackup: true,
            },
            include: {
                user: true,
            },
        });

        const backups = [];

        for (const setting of settings) {
            try {
                // Verificar se deve fazer backup hoje baseado na frequência
                const shouldBackup = checkBackupFrequency(setting.backupFrequency);

                if (!shouldBackup) {
                    continue;
                }

                // Gerar backup
                const backupData = await exportService.exportFullBackup(setting.userId);

                // Salvar backup em arquivo (ou enviar para storage)
                const fileName = `backup-${setting.userId}-${new Date().toISOString().split('T')[0]}.json`;
                const backupPath = join(process.cwd(), 'backups', fileName);

                await writeFile(backupPath, backupData);

                backups.push({
                    userId: setting.userId,
                    email: setting.user.email,
                    fileName,
                });

                console.log(`[JOB] Backup criado para ${setting.user.email}`);
            } catch (error) {
                console.error(`[JOB] Erro ao criar backup do usuário ${setting.userId}:`, error);
            }
        }

        console.log(`[JOB] ${backups.length} backups criados com sucesso`);

        return {
            success: true,
            count: backups.length,
            backups,
        };
    } catch (error) {
        console.error('[JOB] Erro ao executar backup automático:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

function checkBackupFrequency(frequency: string | null): boolean {
    if (!frequency) return false;

    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();

    switch (frequency) {
        case 'DAILY':
            return true;
        case 'WEEKLY':
            return dayOfWeek === 0; // Domingo
        case 'MONTHLY':
            return dayOfMonth === 1; // Dia 1 do mês
        default:
            return false;
    }
}

// Configuração do cron: executar diariamente às 04:00
export const autoBackupJobConfig = {
    name: 'auto-backup',
    schedule: '0 4 * * *', // Diariamente às 04:00
    handler: autoBackupJob,
};
