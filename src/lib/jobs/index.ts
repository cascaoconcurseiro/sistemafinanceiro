/**
 * Jobs Index
 * Gerenciador central de todos os jobs agendados
 */

import { recurringTransactionsJobConfig } from './recurring-transactions-job';
import { invoiceDueCheckJobConfig } from './invoice-due-check-job';
import { budgetAlertJobConfig } from './budget-alert-job';
import { generateInvoicesJobConfig } from './generate-invoices-job';
import { integrityCheckJobConfig } from './integrity-check-job';
import { fraudDetectionJobConfig } from './fraud-detection-job';
import { autoBackupJobConfig } from './auto-backup-job';

export const jobs = [
    recurringTransactionsJobConfig,
    invoiceDueCheckJobConfig,
    budgetAlertJobConfig,
    generateInvoicesJobConfig,
    integrityCheckJobConfig,
    fraudDetectionJobConfig,
    autoBackupJobConfig,
];

/**
 * Executa todos os jobs manualmente (para testes)
 */
export async function runAllJobs() {
    console.log('Executando todos os jobs...');

    const results = [];

    for (const job of jobs) {
        console.log(`\nExecutando job: ${job.name}`);
        try {
            const result = await job.handler();
            results.push({ job: job.name, ...result });
        } catch (error) {
            console.error(`Erro ao executar job ${job.name}:`, error);
            results.push({
                job: job.name,
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
            });
        }
    }

    return results;
}

/**
 * Executa um job específico
 */
export async function runJob(jobName: string) {
    const job = jobs.find((j) => j.name === jobName);

    if (!job) {
        throw new Error(`Job ${jobName} não encontrado`);
    }

    console.log(`Executando job: ${job.name}`);
    return await job.handler();
}

// Exportar jobs individuais
export * from './recurring-transactions-job';
export * from './invoice-due-check-job';
export * from './budget-alert-job';
export * from './generate-invoices-job';
export * from './integrity-check-job';
export * from './fraud-detection-job';
export * from './auto-backup-job';
