/**
 * Inicializador de Cron Jobs
 * 
 * Este arquivo configura e inicializa todos os background jobs
 * usando node-cron para agendamento.
 */

import { jobs } from './jobs';

// Tipo para o cron (será instalado depois)
type CronJob = any;

let cronJobs: CronJob[] = [];
let isInitialized = false;

/**
 * Inicializa todos os cron jobs
 */
export function initializeCronJobs() {
    if (isInitialized) {
        console.log('[CRON] Jobs já inicializados');
        return;
    }

    console.log('[CRON] Inicializando background jobs...');

    try {
        // Importar node-cron dinamicamente
        const cron = require('node-cron');

        jobs.forEach((job) => {
            const cronJob = cron.schedule(
                job.schedule,
                async () => {
                    console.log(`[CRON] Executando job: ${job.name}`);
                    try {
                        const result = await job.handler();
                        console.log(`[CRON] Job ${job.name} concluído:`, result);
                    } catch (error) {
                        console.error(`[CRON] Erro no job ${job.name}:`, error);
                    }
                },
                {
                    scheduled: true,
                    timezone: 'America/Sao_Paulo',
                }
            );

            cronJobs.push(cronJob);
            console.log(`[CRON] ✓ Job agendado: ${job.name} (${job.schedule})`);
        });

        isInitialized = true;
        console.log(`[CRON] ${jobs.length} jobs inicializados com sucesso`);
    } catch (error) {
        console.error('[CRON] Erro ao inicializar jobs:', error);
        console.log('[CRON] Instale node-cron: npm install node-cron @types/node-cron');
    }
}

/**
 * Para todos os cron jobs
 */
export function stopCronJobs() {
    if (!isInitialized) {
        return;
    }

    console.log('[CRON] Parando todos os jobs...');

    cronJobs.forEach((job) => {
        if (job && typeof job.stop === 'function') {
            job.stop();
        }
    });

    cronJobs = [];
    isInitialized = false;

    console.log('[CRON] Todos os jobs foram parados');
}

/**
 * Verifica se os jobs estão inicializados
 */
export function isCronInitialized(): boolean {
    return isInitialized;
}

/**
 * Retorna informações sobre os jobs
 */
export function getCronJobsInfo() {
    return {
        initialized: isInitialized,
        totalJobs: jobs.length,
        jobs: jobs.map((job) => ({
            name: job.name,
            schedule: job.schedule,
        })),
    };
}
