/**
 * 🔄 SISTEMA DE BACKUP AUTOMATIZADO
 * 
 * Sistema robusto de backup com agendamento, verificação de integridade
 * e limpeza automática de backups antigos.
 */

import { CronJob } from 'cron';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { backup as backupConfig } from '@/lib/config';

export interface BackupResult {
  success: boolean;
  backupId: string;
  filePath: string;
  size: number;
  timestamp: Date;
  error?: string;
}

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  size: number;
  filePath: string;
  checksum: string;
  tables: string[];
  recordCounts: Record<string, number>;
}

export class AutomatedBackupService {
  private cronJob: CronJob | null = null;
  private isRunning = false;

  constructor() {
    this.initializeBackupDirectory();
  }

  /**
   * Inicializa o diretório de backup
   */
  private async initializeBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(backupConfig.path, { recursive: true });
      console.log(`📁 Diretório de backup inicializado: ${backupConfig.path}`);
    } catch (error) {
      console.error('❌ Erro ao criar diretório de backup:', error);
    }
  }

  /**
   * Inicia o sistema de backup automatizado
   */
  start(): void {
    if (!backupConfig.enabled) {
      console.log('⏸️ Backup automatizado desabilitado');
      return;
    }

    if (this.cronJob) {
      console.log('⚠️ Backup automatizado já está rodando');
      return;
    }

    try {
      this.cronJob = new CronJob(
        backupConfig.schedule,
        () => this.performScheduledBackup(),
        null,
        true,
        'America/Sao_Paulo'
      );

      console.log(`🕐 Backup automatizado iniciado com schedule: ${backupConfig.schedule}`);
      this.isRunning = true;
    } catch (error) {
      console.error('❌ Erro ao iniciar backup automatizado:', error);
    }
  }

  /**
   * Para o sistema de backup automatizado
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      console.log('⏹️ Backup automatizado parado');
    }
  }

  /**
   * Verifica se o sistema está rodando
   */
  isActive(): boolean {
    return this.isRunning && this.cronJob !== null;
  }

  /**
   * Executa backup agendado
   */
  private async performScheduledBackup(): Promise<void> {
    console.log('🔄 Iniciando backup agendado...');
    
    try {
      const result = await this.createFullBackup();
      
      if (result.success) {
        console.log(`✅ Backup agendado concluído: ${result.backupId}`);
        
        // Limpar backups antigos
        await this.cleanupOldBackups();
      } else {
        console.error(`❌ Falha no backup agendado: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erro no backup agendado:', error);
    }
  }

  /**
   * Cria backup completo do sistema
   */
  async createFullBackup(): Promise<BackupResult> {
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date();
    const fileName = `${backupId}.json`;
    const filePath = path.join(backupConfig.path, fileName);

    try {
      console.log(`📦 Criando backup: ${backupId}`);

      // Coletar dados de todas as tabelas
      const [
        users,
        accounts,
        transactions,
        goals,
        budgets,
        investments,
        trips,
        categories,
        auditEvents,
        auditLogs,
        securityEvents,
        systemEvents,
        notifications
      ] = await Promise.all([
        prisma.user.findMany(),
        prisma.account.findMany(),
        prisma.transaction.findMany(),
        prisma.goal.findMany(),
        prisma.budget.findMany(),
        prisma.investment.findMany(),
        prisma.trip.findMany(),
        prisma.category.findMany(),
        prisma.auditEvent.findMany(),
        prisma.auditLog.findMany(),
        prisma.securityEvent.findMany(),
        prisma.systemEvent.findMany(),
        prisma.notification.findMany()
      ]);

      // Preparar dados do backup
      const backupData = {
        metadata: {
          id: backupId,
          timestamp: timestamp.toISOString(),
          version: '1.0.0',
          tables: [
            'users', 'accounts', 'transactions', 'goals', 'budgets',
            'investments', 'trips', 'categories', 'auditEvents',
            'auditLogs', 'securityEvents', 'systemEvents', 'notifications'
          ]
        },
        data: {
          users: users.map(user => ({
            ...user,
            password: '[REDACTED]' // Não incluir senhas no backup
          })),
          accounts,
          transactions,
          goals,
          budgets,
          investments,
          trips,
          categories,
          auditEvents,
          auditLogs,
          securityEvents,
          systemEvents,
          notifications
        },
        statistics: {
          totalRecords: users.length + accounts.length + transactions.length + 
                       goals.length + budgets.length + investments.length + 
                       trips.length + categories.length + auditEvents.length +
                       auditLogs.length + securityEvents.length + systemEvents.length +
                       notifications.length,
          recordCounts: {
            users: users.length,
            accounts: accounts.length,
            transactions: transactions.length,
            goals: goals.length,
            budgets: budgets.length,
            investments: investments.length,
            trips: trips.length,
            categories: categories.length,
            auditEvents: auditEvents.length,
            auditLogs: auditLogs.length,
            securityEvents: securityEvents.length,
            systemEvents: systemEvents.length,
            notifications: notifications.length
          }
        }
      };

      // Salvar backup
      const backupJson = JSON.stringify(backupData, null, 2);
      await fs.writeFile(filePath, backupJson, 'utf8');

      // Verificar tamanho do arquivo
      const stats = await fs.stat(filePath);
      const size = stats.size;

      // Calcular checksum
      const checksum = await this.calculateChecksum(backupJson);

      // Salvar metadados
      await this.saveBackupMetadata({
        id: backupId,
        timestamp,
        size,
        filePath,
        checksum,
        tables: backupData.metadata.tables,
        recordCounts: backupData.statistics.recordCounts
      });

      console.log(`✅ Backup criado com sucesso: ${backupId} (${this.formatBytes(size)})`);

      return {
        success: true,
        backupId,
        filePath,
        size,
        timestamp
      };

    } catch (error) {
      console.error(`❌ Erro ao criar backup ${backupId}:`, error);
      
      // Tentar remover arquivo parcial
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        // Ignorar erro de remoção
      }

      return {
        success: false,
        backupId,
        filePath,
        size: 0,
        timestamp,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Verifica integridade de um backup
   */
  async verifyBackupIntegrity(backupId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Buscar metadados do backup
      const metadata = await this.getBackupMetadata(backupId);
      if (!metadata) {
        errors.push('Metadados do backup não encontrados');
        return { isValid: false, errors };
      }

      // Verificar se arquivo existe
      const fileExists = await fs.access(metadata.filePath).then(() => true).catch(() => false);
      if (!fileExists) {
        errors.push('Arquivo de backup não encontrado');
        return { isValid: false, errors };
      }

      // Verificar tamanho do arquivo
      const stats = await fs.stat(metadata.filePath);
      if (stats.size !== metadata.size) {
        errors.push(`Tamanho do arquivo incorreto. Esperado: ${metadata.size}, Atual: ${stats.size}`);
      }

      // Verificar checksum
      const content = await fs.readFile(metadata.filePath, 'utf8');
      const currentChecksum = await this.calculateChecksum(content);
      if (currentChecksum !== metadata.checksum) {
        errors.push('Checksum do arquivo não confere');
      }

      // Verificar estrutura JSON
      try {
        const backupData = JSON.parse(content);
        
        if (!backupData.metadata || !backupData.data || !backupData.statistics) {
          errors.push('Estrutura do backup inválida');
        }

        // Verificar contagem de registros
        for (const [table, expectedCount] of Object.entries(metadata.recordCounts)) {
          const actualCount = backupData.data[table]?.length || 0;
          if (actualCount !== expectedCount) {
            errors.push(`Contagem de registros incorreta para ${table}. Esperado: ${expectedCount}, Atual: ${actualCount}`);
          }
        }

      } catch (parseError) {
        errors.push('Arquivo JSON inválido');
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      errors.push(`Erro na verificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const files = await fs.readdir(backupConfig.path);
      const backupFiles = files.filter(file => file.startsWith('backup_') && file.endsWith('.json'));
      
      const backups: BackupMetadata[] = [];
      
      for (const file of backupFiles) {
        const backupId = file.replace('.json', '');
        const metadata = await this.getBackupMetadata(backupId);
        if (metadata) {
          backups.push(metadata);
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('❌ Erro ao listar backups:', error);
      return [];
    }
  }

  /**
   * Remove backups antigos baseado na política de retenção
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - backupConfig.retentionDays);

      const oldBackups = backups.filter(backup => backup.timestamp < cutoffDate);

      for (const backup of oldBackups) {
        try {
          await fs.unlink(backup.filePath);
          await this.removeBackupMetadata(backup.id);
          console.log(`🗑️ Backup antigo removido: ${backup.id}`);
        } catch (error) {
          console.error(`❌ Erro ao remover backup ${backup.id}:`, error);
        }
      }

      if (oldBackups.length > 0) {
        console.log(`🧹 Limpeza concluída: ${oldBackups.length} backups antigos removidos`);
      }
    } catch (error) {
      console.error('❌ Erro na limpeza de backups:', error);
    }
  }

  /**
   * Calcula checksum MD5 de uma string
   */
  private async calculateChecksum(content: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Salva metadados do backup
   */
  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataPath = path.join(backupConfig.path, `${metadata.id}.metadata.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }

  /**
   * Carrega metadados do backup
   */
  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    try {
      const metadataPath = path.join(backupConfig.path, `${backupId}.metadata.json`);
      const content = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(content);
      
      // Converter timestamp para Date
      metadata.timestamp = new Date(metadata.timestamp);
      
      return metadata;
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove metadados do backup
   */
  private async removeBackupMetadata(backupId: string): Promise<void> {
    try {
      const metadataPath = path.join(backupConfig.path, `${backupId}.metadata.json`);
      await fs.unlink(metadataPath);
    } catch (error) {
      // Ignorar erro se arquivo não existir
    }
  }

  /**
   * Formata bytes em formato legível
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Instância singleton
export const automatedBackup = new AutomatedBackupService();