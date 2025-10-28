import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Sanitização segura de inputs
export class InputSanitizer {
  // Sanitizar strings para prevenir XSS
  static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }

  // Sanitizar HTML mantendo tags seguras
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  // Sanitizar para logs (prevenir log injection)
  static sanitizeForLog(input: any): string {
    if (input === null || input === undefined) return 'null';
    const str = String(input);
    return str.replace(/[\r\n\t]/g, ' ').replace(/[^\x20-\x7E]/g, '?').substring(0, 1000);
  }

  // Validar e sanitizar paths (prevenir path traversal)
  static sanitizePath(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/\.\./g, '')
      .replace(/[<>:"|?*]/g, '')
      .replace(/^\/+/, '')
      .substring(0, 255);
  }

  // Sanitizar SQL inputs (usar com prepared statements)
  static sanitizeSqlInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/['";\\]/g, '');
  }

  // Validar email
  static validateEmail(email: string): boolean {
    const emailSchema = z.string().email();
    return emailSchema.safeParse(email).success;
  }

  // Validar UUID
  static validateUuid(uuid: string): boolean {
    const uuidSchema = z.string().uuid();
    return uuidSchema.safeParse(uuid).success;
  }
}

// Logger seguro
export class SecureLogger {
  static log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const sanitizedMessage = InputSanitizer.sanitizeForLog(message);
    const sanitizedData = data ? InputSanitizer.sanitizeForLog(JSON.stringify(data)) : '';
    
    console[level](`[${new Date().toISOString()}] ${sanitizedMessage}`, sanitizedData);
  }

  static info(message: string, data?: any) {
    this.log('info', message, data);
  }

  static warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  static error(message: string, data?: any) {
    this.log('error', message, data);
  }
}