/**
 * Sistema de Logs com Rotação
 * Logs estruturados com níveis e rotação automática
 */

import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 7; // 7 dias

// Criar diretório de logs
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private currentDate: string;
  private logFile: string;

  constructor() {
    this.currentDate = this.getDateString();
    this.logFile = this.getLogFilePath();
    this.rotateLogsIfNeeded();
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getLogFilePath(): string {
    return path.join(LOG_DIR, `app-${this.currentDate}.log`);
  }

  private rotateLogsIfNeeded(): void {
    // Verificar se mudou o dia
    const currentDate = this.getDateString();
    if (currentDate !== this.currentDate) {
      this.currentDate = currentDate;
      this.logFile = this.getLogFilePath();
    }

    // Verificar tamanho do arquivo
    if (fs.existsSync(this.logFile)) {
      const stats = fs.statSync(this.logFile);
      if (stats.size > MAX_LOG_SIZE) {
        const timestamp = Date.now();
        const newName = path.join(LOG_DIR, `app-${this.currentDate}-${timestamp}.log`);
        fs.renameSync(this.logFile, newName);
      }
    }

    // Limpar logs antigos
    this.cleanOldLogs();
  }

  private cleanOldLogs(): void {
    const files = fs.readdirSync(LOG_DIR)
      .filter(f => f.startsWith('app-') && f.endsWith('.log'))
      .map(f => ({
        name: f,
        path: path.join(LOG_DIR, f),
        time: fs.statSync(path.join(LOG_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_LOG_FILES) {
      files.slice(MAX_LOG_FILES).forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
  }

  private write(level: LogLevel, message: string, data?: any): void {
    this.rotateLogsIfNeeded();

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.stringify(data) : undefined,
      stack: level === 'error' && data instanceof Error ? data.stack : undefined
    };

    const line = JSON.stringify(entry) + '\n';

    try {
      fs.appendFileSync(this.logFile, line);
    } catch (error) {
      console.error('Erro ao escrever log:', error);
    }

    // Também logar no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const color = {
        info: '\x1b[36m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
        debug: '\x1b[90m'
      }[level];

      console.log(`${color}[${level.toUpperCase()}]\x1b[0m ${message}`, data || '');
    }
  }

  info(message: string, data?: any): void {
    this.write('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.write('warn', message, data);
  }

  error(message: string, error?: Error | any): void {
    this.write('error', message, error);
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.write('debug', message, data);
    }
  }
}

export const logger = new Logger();

// Capturar erros não tratados
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', reason);
  });
}
