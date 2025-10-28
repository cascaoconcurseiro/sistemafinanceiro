/**
 * Monitor de Performance
 * Utilitários para medir e otimizar performance
 */

// Medir tempo de execução de funções
export function measureTime<T>(
  fn: () => T,
  label: string
): T {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
}

// Medir tempo de execução de funções assíncronas
export async function measureTimeAsync<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
}

// Debounce para otimizar chamadas frequentes
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle para limitar frequência de execução
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoização simples para funções puras
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Lazy loading de módulos
export async function lazyLoad<T>(
  importFn: () => Promise<{ default: T }>
): Promise<T> {
  const module = await importFn();
  return module.default;
}

// Verificar se está no cliente
export const isClient = typeof window !== 'undefined';

// Verificar se está em produção
export const isProduction = process.env.NODE_ENV === 'production';

// Log de performance apenas em desenvolvimento
export const perfLog = (message: string, ...args: any[]) => {
  if (!isProduction) {
    console.log(`🚀 ${message}`, ...args);
  }
};

// Marcar início de medição
export const markStart = (name: string) => {
  if (isClient && !isProduction) {
    performance.mark(`${name}-start`);
  }
};

// Marcar fim de medição e calcular duração
export const markEnd = (name: string) => {
  if (isClient && !isProduction) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    if (measure) {
      perfLog(`${name}: ${measure.duration.toFixed(2)}ms`);
    }
    
    // Limpar marcações
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
  }
};

// Batch updates para otimizar re-renders
export function batchUpdates<T>(
  updates: Array<() => void>
): void {
  // React 18+ já faz batching automático
  // Mas podemos agrupar manualmente se necessário
  updates.forEach(update => update());
}

// Verificar se elemento está visível (para lazy loading)
export function isElementVisible(element: HTMLElement): boolean {
  if (!isClient) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Intersection Observer para lazy loading
export function createIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (!isClient || !('IntersectionObserver' in window)) {
    return null;
  }
  
  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, options);
}
