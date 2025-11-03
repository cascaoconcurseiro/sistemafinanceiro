import { CronJob } from 'cron';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  compressionLevel: number;
  encryptionEnabled: boolean;
  backupPath?: string;
}

export interface BackupResult {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental';
  size: number;
  checksum: string;
  status: 'success' | 'failed' | 'partial';
  errorMessage?: string;
  filePath: string;
}

export class BackupService {
  private static instance: BackupService;
  private jobs: Map<string, CronJob> = new Map();
  private backupDir: string;

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.ensureBackupDirectory();
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de backup:', error);
    }
  }

  private getCronPattern(frequency: BackupConfig['frequency']): string {
    const patterns = {
      hourly: '0 * * * *',     // A cada hora
      daily: '0 2 * * *',      // Diariamente às 2h
      weekly: '0 2 * * 0',     // Semanalmente no domingo às 2h
      monthly: '0 2 1 * *'     // Mensalmente no dia 1 às 2h
    };
    return patterns[frequency];
  }

  async scheduleBackup(config: BackupConfig): Promise<string> {
    const jobId = `backup-${Date.now()}`;
    const cronPattern = this.getCronPattern(config.frequency);

    const job = new CronJob(cronPattern, async () => {
      await this.performBackup(config);
    });

    this.jobs.set(jobId, job);
    job.start();

    console.log(`Backup agendado: ${jobId} - ${config.frequency}`);
    return jobId;
  }

  async performBackup(config: BackupConfig): Promise<BackupResult> {
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date();
    const fileName = `${backupId}.sql`;
    const filePath = path.join(this.backupDir, fileName);

    try {
      // Realizar backup do banco de dados
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL não configurada');
      }

      // Extrair informações da URL do banco
      const url = new URL(dbUrl);
      const dbName = url.pathname.slice(1); // Remove a barra inicial

      // Comando pg_dump
      const command = `pg_dump "${dbUrl}" > "${filePath}"`;

      await execAsync(command);

      // Verificar se o arquivo foi criado
      const stats = await fs.stat(filePath);
      const size = stats.size;

      // Calcular checksum
      const fileContent = await fs.readFile(filePath);
      const checksum = createHash('sha256').update(fileContent).digest('hex');

      // Comprimir se solicitado
      if (config.compressionLevel > 0) {
        const compressedPath = `${filePath}.gz`;
        await execAsync(`gzip -${config.compressionLevel} "${filePath}"`);
        await fs.rename(`${filePath}.gz`, compressedPath);
      }

      // Limpar backups antigos
      await this.cleanOldBackups(config.retentionDays);

      const result: BackupResult = {
        id: backupId,
        timestamp,
        type: 'full',
        size,
        checksum,
        status: 'success',
        filePath: config.compressionLevel > 0 ? `${filePath}.gz` : filePath
      };

      console.log(`Backup realizado com sucesso: ${backupId}`);
      return result;

    } catch (error) {
      console.error(`Erro no backup ${backupId}:`, error);

      return {
        id: backupId,
        timestamp,
        type: 'full',
        size: 0,
        checksum: '',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        filePath: filePath
      };
    }
  }

  async restoreBackup(backupPath: string): Promise<boolean> {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL não configurada');
      }

      // Verificar se o arquivo existe
      await fs.access(backupPath);

      // Se for um arquivo comprimido, descomprimir primeiro
      let sqlFile = backupPath;
      if (backupPath.endsWith('.gz')) {
        sqlFile = backupPath.replace('.gz', '');
        await execAsync(`gunzip -c "${backupPath}" > "${sqlFile}"`);
      }

      // Restaurar o banco
      const url = new URL(dbUrl);
      const dbName = url.pathname.slice(1);

      const command = `psql "${dbUrl}" < "${sqlFile}"`;
      await execAsync(command);

      // Limpar arquivo temporário se foi descomprimido
      if (backupPath.endsWith('.gz')) {
        await fs.unlink(sqlFile);
      }

      console.log(`Backup restaurado com sucesso: ${backupPath}`);
      return true;

    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      return false;
    }
  }

  async listBackups(): Promise<BackupResult[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: BackupResult[] = [];

      for (const file of files) {
        if (file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);

          // Extrair timestamp do nome do arquivo
          const timestampMatch = file.match(/backup_(\d+)/);
          const timestamp = timestampMatch ? new Date(parseInt(timestampMatch[1])) : stats.mtime;

          backups.push({
            id: file.replace(/\.(sql|sql\.gz)$/, ''),
            timestamp,
            type: 'full',
            size: stats.size,
            checksum: '', // Seria necessário recalcular se necessário
            status: 'success',
            filePath
          });
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    } catch (error) {
      console.error('Erro ao listar backups:', error);
      return [];
    }
  }

  private async cleanOldBackups(retentionDays: number): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      for (const file of files) {
        if (file.startsWith('backup_')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            console.log(`Backup antigo removido: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao limpar backups antigos:', error);
    }
  }

  async verifyBackup(backupPath: string): Promise<boolean> {
    try {
      // Verificar se o arquivo existe e não está corrompido
      await fs.access(backupPath);
      const stats = await fs.stat(backupPath);

      if (stats.size === 0) {
        return false;
      }

      // Para arquivos SQL, verificar se contém estruturas básicas
      let content: string;
      if (backupPath.endsWith('.gz')) {
        const { stdout } = await execAsync(`gunzip -c "${backupPath}"`);
        content = stdout;
      } else {
        content = await fs.readFile(backupPath, 'utf-8');
      }

      // Verificações básicas de integridade
      const hasCreateTable = content.includes('CREATE TABLE');
      const hasInsert = content.includes('INSERT INTO') || content.includes('COPY');

      return hasCreateTable || hasInsert;

    } catch (error) {
      console.error('Erro ao verificar backup:', error);
      return false;
    }
  }

  stopScheduledBackup(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job) {
      job.stop();
      this.jobs.delete(jobId);
      console.log(`Backup agendado parado: ${jobId}`);
      return true;
    }
    return false;
  }

  getScheduledBackups(): string[] {
    return Array.from(this.jobs.keys());
  }
}

// Instância singleton
export const backupService = BackupService.getInstance();
