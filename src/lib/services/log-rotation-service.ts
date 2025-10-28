/**
 * SERVIÇO DE ROTAÇÃO DE LOGS
 * 
 * Implementa rotação automática de logs com:
 * - Rotação baseada em tamanho e tempo
 * - Compressão de logs antigos
 * - Limpeza automática de logs expirados
 * - Monitoramento de espaço em disco
 */

import { CronJob } from 'cron';
import { promises as fs } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';

export interface LogRotationConfig {
  maxFileSize: number; // em bytes
  maxFiles: number;
  retentionDays: number;
  compressionEnabled: boolean;
  rotationSchedule: string; // cron pattern
  logDirectory: string;
}

export interface LogStats {
  totalFiles: number;
  totalSize: number;
  oldestLog: Date | null;
  newestLog: Date | null;
}

export interface RotationResult {
  success: boolean;
  rotatedFiles: string[];
  compressedFiles: string[];
  deletedFiles: string[];
  errors: string[];
}

export class LogRotationService {
  private static instance: LogRotationService;
  private config: LogRotationConfig;
  private rotationJob?: CronJob;
  private isRunning = false;

  private constructor() {
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      retentionDays: 30,
      compressionEnabled: true,
      rotationSchedule: '0 0 * * *', // diariamente à meia-noite
      logDirectory: path.join(process.cwd(), 'logs')
    };
  }

  static getInstance(): LogRotationService {
    if (!LogRotationService.instance) {
      LogRotationService.instance = new LogRotationService();
    }
    return LogRotationService.instance;
  }

  async initialize(config?: Partial<LogRotationConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Garantir que o diretório de logs existe
    await this.ensureLogDirectory();

    // Configurar rotação automática
    this.rotationJob = new CronJob(this.config.rotationSchedule, async () => {
      await this.performRotation();
    });

    this.rotationJob.start();
    this.log('Serviço de rotação de logs inicializado');
  }

  async performRotation(): Promise<RotationResult> {
    if (this.isRunning) {
      this.log('Rotação já em andamento, pulando...');
      return {
        success: false,
        rotatedFiles: [],
        compressedFiles: [],
        deletedFiles: [],
        errors: ['Rotação já em andamento']
      };
    }

    this.isRunning = true;
    const result: RotationResult = {
      success: true,
      rotatedFiles: [],
      compressedFiles: [],
      deletedFiles: [],
      errors: []
    };

    try {
      this.log('Iniciando rotação de logs');

      const files = await fs.readdir(this.config.logDirectory);
      
      for (const file of files) {
        if (file.endsWith('.log')) {
          try {
            const rotated = await this.rotateLogFile(path.join(this.config.logDirectory, file));
            if (rotated) {
              result.rotatedFiles.push(file);
            }
          } catch (error) {
            const errorMsg = `Erro ao rotacionar ${file}: ${error}`;
            result.errors.push(errorMsg);
            this.log(errorMsg);
          }
        }
      }

      // Comprimir logs rotacionados
      const compressedFiles = await this.compressRotatedLogs();
      result.compressedFiles = compressedFiles;

      // Limpar logs expirados
      const deletedFiles = await this.cleanupExpiredLogs();
      result.deletedFiles = deletedFiles;

      this.log(`Rotação concluída: ${result.rotatedFiles.length} rotacionados, ${result.compressedFiles.length} comprimidos, ${result.deletedFiles.length} removidos`);
    } catch (error) {
      const errorMsg = `Erro na rotação de logs: ${error}`;
      result.errors.push(errorMsg);
      result.success = false;
      this.log(errorMsg);
    } finally {
      this.isRunning = false;
    }

    return result;
  }

  private async rotateLogFile(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      
      // Verificar se o arquivo precisa ser rotacionado
      if (stats.size < this.config.maxFileSize) {
        return false;
      }

      const directory = path.dirname(filePath);
      const filename = path.basename(filePath, '.log');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Mover arquivo atual
      const rotatedPath = path.join(directory, `${filename}-${timestamp}.log`);
      await fs.rename(filePath, rotatedPath);

      // Criar novo arquivo de log vazio
      await fs.writeFile(filePath, '');

      // Limitar número de arquivos
      await this.limitLogFiles(directory, filename);

      this.log(`Log rotacionado: ${path.basename(filePath)} -> ${path.basename(rotatedPath)}`);
      return true;
    } catch (error) {
      throw new Error(`Erro ao rotacionar log ${filePath}: ${error}`);
    }
  }

  private async compressRotatedLogs(): Promise<string[]> {
    const compressedFiles: string[] = [];

    if (!this.config.compressionEnabled) {
      return compressedFiles;
    }

    try {
      const files = await fs.readdir(this.config.logDirectory);
      const rotatedLogs = files.filter(file => 
        file.includes('-') && file.endsWith('.log') && !file.endsWith('.gz')
      );

      for (const file of rotatedLogs) {
        try {
          const filePath = path.join(this.config.logDirectory, file);
          await this.compressLogFile(filePath);
          compressedFiles.push(file);
        } catch (error) {
          this.log(`Erro ao comprimir ${file}: ${error}`);
        }
      }
    } catch (error) {
      this.log(`Erro ao comprimir logs: ${error}`);
    }

    return compressedFiles;
  }

  private async compressLogFile(filePath: string): Promise<void> {
    const compressedPath = `${filePath}.gz`;
    
    await pipeline(
      createReadStream(filePath),
      createGzip(),
      createWriteStream(compressedPath)
    );

    // Remover arquivo original após compressão
    await fs.unlink(filePath);
    
    this.log(`Log comprimido: ${path.basename(filePath)} -> ${path.basename(compressedPath)}`);
  }

  private async limitLogFiles(directory: string, baseFilename: string): Promise<void> {
    try {
      const files = await fs.readdir(directory);
      const logFiles = files
        .filter(file => file.startsWith(`${baseFilename}-`) && (file.endsWith('.log') || file.endsWith('.log.gz')))
        .map(file => ({
          name: file,
          path: path.join(directory, file),
          stats: null as any
        }));

      // Obter estatísticas dos arquivos
      for (const file of logFiles) {
        file.stats = await fs.stat(file.path);
      }

      // Ordenar por data de modificação (mais antigos primeiro)
      logFiles.sort((a, b) => a.stats.mtime.getTime() - b.stats.mtime.getTime());

      // Remover arquivos excedentes
      if (logFiles.length > this.config.maxFiles) {
        const filesToRemove = logFiles.slice(0, logFiles.length - this.config.maxFiles);
        
        for (const file of filesToRemove) {
          await fs.unlink(file.path);
          this.log(`Arquivo removido por limite: ${file.name}`);
        }
      }
    } catch (error) {
      this.log(`Erro ao limitar arquivos de log: ${error}`);
    }
  }

  private async cleanupExpiredLogs(): Promise<string[]> {
    const deletedFiles: string[] = [];

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const files = await fs.readdir(this.config.logDirectory);
      
      for (const file of files) {
        if (file.endsWith('.log') || file.endsWith('.log.gz')) {
          const filePath = path.join(this.config.logDirectory, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedFiles.push(file);
            this.log(`Log expirado removido: ${file}`);
          }
        }
      }
    } catch (error) {
      this.log(`Erro ao limpar logs expirados: ${error}`);
    }

    return deletedFiles;
  }

  async getLogStats(): Promise<LogStats> {
    try {
      const files = await fs.readdir(this.config.logDirectory);
      const logFiles = files.filter(file => file.endsWith('.log') || file.endsWith('.log.gz'));
      
      let totalSize = 0;
      let oldestLog: Date | null = null;
      let newestLog: Date | null = null;

      for (const file of logFiles) {
        const filePath = path.join(this.config.logDirectory, file);
        const stats = await fs.stat(filePath);
        
        totalSize += stats.size;
        
        if (!oldestLog || stats.mtime < oldestLog) {
          oldestLog = stats.mtime;
        }
        
        if (!newestLog || stats.mtime > newestLog) {
          newestLog = stats.mtime;
        }
      }

      return {
        totalFiles: logFiles.length,
        totalSize,
        oldestLog,
        newestLog
      };
    } catch (error) {
      this.log(`Erro ao obter estatísticas de logs: ${error}`);
      return {
        totalFiles: 0,
        totalSize: 0,
        oldestLog: null,
        newestLog: null
      };
    }
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.access(this.config.logDirectory);
    } catch {
      await fs.mkdir(this.config.logDirectory, { recursive: true });
      this.log(`Diretório de logs criado: ${this.config.logDirectory}`);
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [LogRotation] ${message}`);
    
    // Escrever no arquivo de log do sistema (se existir)
    const logFile = path.join(this.config.logDirectory, 'system.log');
    const logEntry = `${timestamp} [LogRotation] ${message}\n`;
    
    fs.appendFile(logFile, logEntry).catch(() => {
      // Ignorar erros de escrita no log para evitar loops
    });
  }

  async stop(): Promise<void> {
    if (this.rotationJob) {
      this.rotationJob.stop();
      this.log('Serviço de rotação de logs parado');
    }
  }

  getConfig(): LogRotationConfig {
    return { ...this.config };
  }

  async updateConfig(newConfig: Partial<LogRotationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar job se o schedule mudou
    if (newConfig.rotationSchedule && this.rotationJob) {
      this.rotationJob.stop();
      this.rotationJob = new CronJob(this.config.rotationSchedule, async () => {
        await this.performRotation();
      });
      this.rotationJob.start();
    }
    
    this.log('Configuração de rotação atualizada');
  }
}

// Instância singleton
export const logRotationService = LogRotationService.getInstance();