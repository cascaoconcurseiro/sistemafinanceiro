/**
 * Utilitários de Sanitização
 * Protege contra XSS e injeção de código
 */

/**
 * Remove tags HTML e caracteres perigosos
 */
export const sanitize = {
  /**
   * Sanitiza texto removendo HTML
   */
  text: (text: string | null | undefined): string => {
    if (!text) return '';
    return String(text)
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  },

  /**
   * Sanitiza HTML permitindo apenas tags seguras
   */
  html: (html: string | null | undefined): string => {
    if (!html) return '';
    
    // Remove scripts e eventos
    let clean = String(html)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
    
    return clean;
  },

  /**
   * Sanitiza URL
   */
  url: (url: string | null | undefined): string => {
    if (!url) return '';
    
    try {
      const parsed = new URL(url);
      // Apenas permite http e https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }
      return parsed.toString();
    } catch {
      return '';
    }
  },

  /**
   * Sanitiza número
   */
  number: (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  },

  /**
   * Sanitiza email
   */
  email: (email: string | null | undefined): string => {
    if (!email) return '';
    return String(email)
      .toLowerCase()
      .trim()
      .replace(/[<>]/g, '');
  },

  /**
   * Sanitiza JSON
   */
  json: (json: string | null | undefined): any => {
    if (!json) return null;
    
    try {
      return JSON.parse(String(json));
    } catch {
      return null;
    }
  }
};

/**
 * Middleware de sanitização para APIs
 */
export function sanitizeRequestBody<T extends Record<string, any>>(body: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitize.text(value);
    } else if (typeof value === 'number') {
      sanitized[key] = sanitize.number(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitize.text(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}
