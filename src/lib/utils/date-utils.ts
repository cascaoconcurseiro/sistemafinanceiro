import { format, parse, isValid, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Obtém a data atual no formato brasileiro (DD/MM/AAAA)
 */
export function getCurrentDateBR(): string {
  return format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/AAAA)
 */
export function formatDateToBR(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Formata uma data para input HTML (AAAA-MM-DD)
 */
export function formatDateInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Converte data brasileira (DD/MM/AAAA) para ISO (AAAA-MM-DD)
 */
export function convertBRDateToISO(brDate: string): string {
  try {
    const parsed = parse(brDate, 'dd/MM/yyyy', new Date());
    if (!isValid(parsed)) return '';
    return format(parsed, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

/**
 * Converte data ISO (AAAA-MM-DD) para formato brasileiro (DD/MM/AAAA)
 */
export function convertISODateToBR(isoDate: string): string {
  try {
    // Adiciona horário para evitar problemas de timezone
    const parsed = new Date(isoDate + 'T12:00:00');
    if (!isValid(parsed)) return '';
    return format(parsed, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '';
  }
}

/**
 * Valida se uma string está no formato de data brasileiro
 */
export function isValidBRDate(dateString: string): boolean {
  try {
    const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
    return isValid(parsed);
  } catch {
    return false;
  }
}

/**
 * Valida se uma data no formato brasileiro é válida (alias para isValidBRDate)
 * @param brDate - Data no formato brasileiro (dd/mm/aaaa)
 * @returns boolean indicando se a data é válida
 */
export function validateBRDate(brDate: string): boolean {
  return isValidBRDate(brDate);
}

/**
 * Obtém o início do dia para uma data
 */
export function getStartOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return startOfDay(dateObj);
}

/**
 * Obtém o fim do dia para uma data
 */
export function getEndOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return endOfDay(dateObj);
}

/**
 * Adiciona dias a uma data
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return addDays(dateObj, days);
}

/**
 * Subtrai dias de uma data
 */
export function subtractDaysFromDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return subDays(dateObj, days);
}

/**
 * Formata data para exibição amigável
 */
export function formatDateFriendly(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  
  const today = new Date();
  const yesterday = subDays(today, 1);
  const tomorrow = addDays(today, 1);
  
  if (format(dateObj, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
    return 'Hoje';
  }
  
  if (format(dateObj, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
    return 'Ontem';
  }
  
  if (format(dateObj, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
    return 'Amanhã';
  }
  
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
}
