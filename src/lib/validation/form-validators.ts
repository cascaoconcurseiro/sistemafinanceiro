/**
 * Validadores e sanitizadores de formulários
 */

export const sanitizeString = (str: string): string => {
  return str.trim();
};

export const sanitizeNumber = (value: string | number): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

export const validateRequiredString = (str: string): boolean => {
  return str.trim().length > 0;
};

export const validatePositiveNumber = (num: number): boolean => {
  return num > 0;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCurrency = (value: number): boolean => {
  return !isNaN(value) && isFinite(value);
};
