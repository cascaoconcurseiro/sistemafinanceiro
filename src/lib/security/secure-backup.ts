import { promises as fs } from 'fs';
import path from 'path';
import { SecureConfig } from './secure-config';
import { InputSanitizer, SecureLogger } from './input-sanitizer';

export class SecureBackup {
  private config = SecureConfig.getInstance();
  private backupDir: string;

  constructor() {
    // Usar diretório seguro para backups
    this.backupDir = path.resolve(process.cwd(), 'backups');
  }

  async createBackup(data: any): Promise<string> {
    try {
      // Validar e sanitizar nome do arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.json`;
      const sanitizedFilename = InputSanitizer.sanitizePath(filename);

      // Caminho seguro
      const backupPath = path.join(this.backupDir, sanitizedFilename);

      // Verificar se o caminho está dentro do diretório de backup
      if (!backupPath.startsWith(this.backupDir)) {
        throw new Error('Invalid backup path');
      }

      // Criar diretório se não existir
      await fs.mkdir(this.backupDir, { recursive: true });

      // Sanitizar dados antes de salvar
      const sanitizedData = this.sanitizeBackupData(data);

      // Salvar backup
      await fs.writeFile(backupPath, JSON.stringify(sanitizedData, null, 2));

      SecureLogger.info('Backup created successfully', { filename: sanitizedFilename });
      return backupPath;
    } catch (error) {
      SecureLogger.error('Failed to create backup', error);
      throw error;
    }
  }

  private sanitizeBackupData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeBackupData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const sanitizedKey = InputSanitizer.sanitizeString(key);

      if (typeof value === 'string') {
        sanitized[sanitizedKey] = InputSanitizer.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[sanitizedKey] = this.sanitizeBackupData(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => InputSanitizer.sanitizePath(file));
    } catch (error) {
      SecureLogger.error('Failed to list backups', error);
      return [];
    }
  }

  async deleteBackup(filename: string): Promise<void> {
    try {
      const sanitizedFilename = InputSanitizer.sanitizePath(filename);
      const backupPath = path.join(this.backupDir, sanitizedFilename);

      // Verificar se o caminho está dentro do diretório de backup
      if (!backupPath.startsWith(this.backupDir)) {
        throw new Error('Invalid backup path');
      }

      await fs.unlink(backupPath);
      SecureLogger.info('Backup deleted successfully', { filename: sanitizedFilename });
    } catch (error) {
      SecureLogger.error('Failed to delete backup', error);
      throw error;
    }
  }
}
