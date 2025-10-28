/**
 * AGENDADOR CRON - ROTAÇÃO DE LOGS
 * 
 * Sistema de agendamento automático para rotação de logs
 * usando node-cron para execução em intervalos definidos
 */

import cron from 'node-cron';
import { logRotationService } from '@/services/log-rotation-service';

export class LogRotationScheduler {
  private static instance: LogRotationScheduler;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): LogRotationScheduler {
    if (!LogRotationScheduler.instance) {
      LogRotationScheduler.instance = new LogRotationScheduler();
    }
    return LogRotationScheduler.instance;
  }

  /**
   * Inicializar o agendador com configuração padrão
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Agendador de rotação de logs já inicializado');
      return;
    }

    try {
      // Obter configuração atual do serviço
      const config = logRotationService.getConfig();
      
      // Agendar rotação automática
      await this.scheduleRotation(config.rotationSchedule);
      
      // Agendar verificação de espaço em disco (a cada hora)
      await this.scheduleDiskSpaceCheck('0 * * * *');
      
      // Agendar limpeza de logs antigos (diariamente às 2h)
      await this.scheduleCleanup('0 2 * * *');

      this.isInitialized = true;
      console.log('Agendador de rotação de logs inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar agendador de rotação:', error);
      throw error;
    }
  }

  /**
   * Agendar rotação automática de logs
   */
  public async scheduleRotation(cronExpression: string): Promise<void> {
    const taskName = 'log-rotation';
    
    // Cancelar tarefa existente se houver
    if (this.scheduledTasks.has(taskName)) {
      this.scheduledTasks.get(taskName)?.destroy();
      this.scheduledTasks.delete(taskName);
    }

    // Validar expressão cron
    if (!cron.validate(cronExpression)) {
      throw new Error(`Expressão cron inválida: ${cronExpression}`);
    }

    // Criar nova tarefa agendada
    const task = cron.schedule(cronExpression, async () => {
      console.log('Executando rotação automática de logs...');
      
      try {
        const result = await logRotationService.performRotation();
        
        if (result.success) {
          console.log('Rotação automática concluída com sucesso:', {
            rotatedFiles: result.rotatedFiles.length,
            compressedFiles: result.compressedFiles.length,
            deletedFiles: result.deletedFiles.length
          });
        } else {
          console.warn('Rotação automática concluída com erros:', result.errors);
        }
      } catch (error) {
        console.error('Erro durante rotação automática:', error);
      }
    }, {
      scheduled: false, // Não iniciar automaticamente
      timezone: 'America/Sao_Paulo'
    });

    this.scheduledTasks.set(taskName, task);
    task.start();
    
    console.log(`Rotação de logs agendada: ${cronExpression}`);
  }

  /**
   * Agendar verificação de espaço em disco
   */
  public async scheduleDiskSpaceCheck(cronExpression: string): Promise<void> {
    const taskName = 'disk-space-check';
    
    // Cancelar tarefa existente se houver
    if (this.scheduledTasks.has(taskName)) {
      this.scheduledTasks.get(taskName)?.destroy();
      this.scheduledTasks.delete(taskName);
    }

    // Validar expressão cron
    if (!cron.validate(cronExpression)) {
      throw new Error(`Expressão cron inválida: ${cronExpression}`);
    }

    // Criar nova tarefa agendada
    const task = cron.schedule(cronExpression, async () => {
      try {
        const stats = await logRotationService.getLogStats();
        const config = logRotationService.getConfig();
        
        // Verificar se o espaço usado pelos logs excede o limite
        const maxDiskUsage = 1024 * 1024 * 1024; // 1GB por padrão
        
        if (stats.totalSize > maxDiskUsage) {
          console.warn(`Uso de disco pelos logs excede o limite: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);
          
          // Executar rotação forçada para liberar espaço
          console.log('Executando rotação forçada para liberar espaço...');
          await logRotationService.performRotation();
        }
      } catch (error) {
        console.error('Erro durante verificação de espaço em disco:', error);
      }
    }, {
      scheduled: false,
      timezone: 'America/Sao_Paulo'
    });

    this.scheduledTasks.set(taskName, task);
    task.start();
    
    console.log(`Verificação de espaço em disco agendada: ${cronExpression}`);
  }

  /**
   * Agendar limpeza de logs antigos
   */
  public async scheduleCleanup(cronExpression: string): Promise<void> {
    const taskName = 'log-cleanup';
    
    // Cancelar tarefa existente se houver
    if (this.scheduledTasks.has(taskName)) {
      this.scheduledTasks.get(taskName)?.destroy();
      this.scheduledTasks.delete(taskName);
    }

    // Validar expressão cron
    if (!cron.validate(cronExpression)) {
      throw new Error(`Expressão cron inválida: ${cronExpression}`);
    }

    // Criar nova tarefa agendada
    const task = cron.schedule(cronExpression, async () => {
      console.log('Executando limpeza automática de logs antigos...');
      
      try {
        const result = await logRotationService.performRotation();
        
        if (result.deletedFiles.length > 0) {
          console.log(`Limpeza automática concluída: ${result.deletedFiles.length} arquivos removidos`);
        } else {
          console.log('Limpeza automática concluída: nenhum arquivo para remover');
        }
      } catch (error) {
        console.error('Erro durante limpeza automática:', error);
      }
    }, {
      scheduled: false,
      timezone: 'America/Sao_Paulo'
    });

    this.scheduledTasks.set(taskName, task);
    task.start();
    
    console.log(`Limpeza de logs agendada: ${cronExpression}`);
  }

  /**
   * Atualizar agendamento de rotação
   */
  public async updateRotationSchedule(cronExpression: string): Promise<void> {
    await this.scheduleRotation(cronExpression);
    console.log(`Agendamento de rotação atualizado: ${cronExpression}`);
  }

  /**
   * Parar uma tarefa específica
   */
  public stopTask(taskName: string): void {
    const task = this.scheduledTasks.get(taskName);
    if (task) {
      task.stop();
      console.log(`Tarefa '${taskName}' pausada`);
    } else {
      console.warn(`Tarefa '${taskName}' não encontrada`);
    }
  }

  /**
   * Iniciar uma tarefa específica
   */
  public startTask(taskName: string): void {
    const task = this.scheduledTasks.get(taskName);
    if (task) {
      task.start();
      console.log(`Tarefa '${taskName}' iniciada`);
    } else {
      console.warn(`Tarefa '${taskName}' não encontrada`);
    }
  }

  /**
   * Parar todas as tarefas agendadas
   */
  public stopAll(): void {
    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      console.log(`Tarefa '${name}' pausada`);
    });
  }

  /**
   * Iniciar todas as tarefas agendadas
   */
  public startAll(): void {
    this.scheduledTasks.forEach((task, name) => {
      task.start();
      console.log(`Tarefa '${name}' iniciada`);
    });
  }

  /**
   * Destruir uma tarefa específica
   */
  public destroyTask(taskName: string): void {
    const task = this.scheduledTasks.get(taskName);
    if (task) {
      task.destroy();
      this.scheduledTasks.delete(taskName);
      console.log(`Tarefa '${taskName}' removida`);
    } else {
      console.warn(`Tarefa '${taskName}' não encontrada`);
    }
  }

  /**
   * Destruir todas as tarefas agendadas
   */
  public destroyAll(): void {
    this.scheduledTasks.forEach((task, name) => {
      task.destroy();
      console.log(`Tarefa '${name}' removida`);
    });
    this.scheduledTasks.clear();
    this.isInitialized = false;
  }

  /**
   * Obter status de todas as tarefas
   */
  public getTasksStatus(): Record<string, { running: boolean; scheduled: boolean }> {
    const status: Record<string, { running: boolean; scheduled: boolean }> = {};
    
    this.scheduledTasks.forEach((task, name) => {
      status[name] = {
        running: task.getStatus() === 'scheduled',
        scheduled: true
      };
    });
    
    return status;
  }

  /**
   * Executar rotação manual (fora do agendamento)
   */
  public async executeManualRotation(): Promise<void> {
    console.log('Executando rotação manual de logs...');
    
    try {
      const result = await logRotationService.performRotation();
      
      if (result.success) {
        console.log('Rotação manual concluída com sucesso:', {
          rotatedFiles: result.rotatedFiles.length,
          compressedFiles: result.compressedFiles.length,
          deletedFiles: result.deletedFiles.length
        });
      } else {
        console.warn('Rotação manual concluída com erros:', result.errors);
      }
    } catch (error) {
      console.error('Erro durante rotação manual:', error);
      throw error;
    }
  }
}

// Exportar instância singleton
export const logRotationScheduler = LogRotationScheduler.getInstance();