/**
 * SISTEMA DE FILAS SIMPLIFICADO
 * Para processamento assíncrono de tarefas pesadas
 */

interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

class SimpleQueue {
  private jobs: Map<string, Job> = new Map();
  private processing = false;
  private readonly maxConcurrent = 5;

  /**
   * Adicionar job à fila
   */
  async add<T>(type: string, data: T, options?: { maxAttempts?: number }): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job<T> = {
      id,
      type,
      data,
      status: 'pending',
      attempts: 0,
      maxAttempts: options?.maxAttempts || 3,
      createdAt: new Date(),
    };

    this.jobs.set(id, job);
    
    // Iniciar processamento se não estiver rodando
    if (!this.processing) {
      this.process();
    }

    return id;
  }

  /**
   * Processar fila
   */
  private async process() {
    if (this.processing) return;
    
    this.processing = true;

    // Processar jobs pendentes (máximo 100 iterações para evitar loop infinito)
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      const pendingJobs = Array.from(this.jobs.values())
        .filter(j => j.status === 'pending')
        .slice(0, this.maxConcurrent);

      if (pendingJobs.length === 0) {
        break;
      }

      await Promise.all(
        pendingJobs.map(job => this.processJob(job))
      );

      iterations++;
    }

    if (iterations >= maxIterations) {
      if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Queue processing atingiu limite máximo de iterações');
      }
    }

    this.processing = false;
  }

  /**
   * Processar job individual
   */
  private async processJob(job: Job) {
    job.status = 'processing';
    job.attempts++;

    try {
      // Executar handler do job
      await this.executeJob(job);
      
      job.status = 'completed';
      job.processedAt = new Date();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`Erro ao processar job ${job.id}:`, error);
      }
      
      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Erro desconhecido';
      } else {
        job.status = 'pending'; // Tentar novamente
      }
    }
  }

  /**
   * Executar job (override em subclasses)
   */
  private async executeJob(job: Job) {
    // Handlers de jobs
    switch (job.type) {
      case 'backup':
        await this.handleBackup(job.data);
        break;
      
      case 'email':
        await this.handleEmail(job.data);
        break;
      
      case 'report':
        await this.handleReport(job.data);
        break;
      
      default:
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Tipo de job desconhecido: ${job.type}`);
        }
    }
  }

  /**
   * Handler: Backup
   */
  private async handleBackup(data: any) {
    const { execSync } = require('child_process');
    execSync('node scripts/backup-database.js create');
  }

  /**
   * Handler: Email
   */
  private async handleEmail(data: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Enviando email:', data);
    }
    // Implementar envio de email
  }

  /**
   * Handler: Relatório
   */
  private async handleReport(data: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Gerando relatório:', data);
    }
    // Implementar geração de relatório
  }

  /**
   * Obter status do job
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * Listar jobs
   */
  listJobs(status?: Job['status']): Job[] {
    const jobs = Array.from(this.jobs.values());
    
    if (status) {
      return jobs.filter(j => j.status === status);
    }
    
    return jobs;
  }

  /**
   * Limpar jobs antigos
   */
  cleanup(olderThanHours: number = 24) {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    for (const [id, job] of this.jobs.entries()) {
      if (job.createdAt < cutoff && job.status !== 'processing') {
        this.jobs.delete(id);
      }
    }
  }
}

// Instância global
export const queue = new SimpleQueue();

// Limpar jobs antigos a cada hora (apenas no servidor)
let cleanupInterval: NodeJS.Timeout | null = null;

if (typeof window === 'undefined') {
  cleanupInterval = setInterval(() => queue.cleanup(), 60 * 60 * 1000);
}

// Cleanup function para testes ou shutdown
export function stopQueueCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
