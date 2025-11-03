/**
 * Utilitário de Debug Condicional
 * Logs apenas em desenvolvimento
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true';

export const debug = {
  /**
   * Log normal - apenas em desenvolvimento
   */
  log: (...args: any[]) => {
    if (isDevelopment && isDebugEnabled) {
      console.log(...args);
    }
  },

  /**
   * Warning - apenas em desenvolvimento
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Error - sempre mostrar
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Info - apenas em desenvolvimento
   */
  info: (...args: any[]) => {
    if (isDevelopment && isDebugEnabled) {
      console.info(...args);
    }
  },

  /**
   * Table - apenas em desenvolvimento
   */
  table: (data: any) => {
    if (isDevelopment && isDebugEnabled) {
      console.table(data);
    }
  },

  /**
   * Group - apenas em desenvolvimento
   */
  group: (label: string) => {
    if (isDevelopment && isDebugEnabled) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment && isDebugEnabled) {
      console.groupEnd();
    }
  },

  /**
   * Time - apenas em desenvolvimento
   */
  time: (label: string) => {
    if (isDevelopment && isDebugEnabled) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (isDevelopment && isDebugEnabled) {
      console.timeEnd(label);
    }
  },
};

/**
 * Habilitar debug via localStorage (browser only)
 */
export const enableDebug = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('debug', 'true');
    window.location.reload();
  }
};

/**
 * Desabilitar debug
 */
export const disableDebug = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('debug');
    window.location.reload();
  }
};

/**
 * Verificar se debug está habilitado
 */
export const isDebugActive = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('debug') === 'true' || isDebugEnabled;
  }
  return isDebugEnabled;
};
