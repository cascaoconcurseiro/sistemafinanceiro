export function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  
  if (!value || typeof value !== 'string') return 0;
  
  // Remove espaços e caracteres não numéricos, exceto vírgula, ponto e sinal negativo
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  
  // Se está vazio após limpeza, retorna 0
  if (!cleanValue) return 0;
  
  // Converte vírgula para ponto (formato brasileiro para americano)
  const normalizedValue = cleanValue.replace(',', '.');
  
  const parsed = parseFloat(normalizedValue);
  
  return isNaN(parsed) ? 0 : parsed;
}

export function isValidNumber(value: string | number): boolean {
  if (typeof value === 'number') return !isNaN(value) && isFinite(value);
  
  if (!value || typeof value !== 'string') return false;
  
  const parsed = parseNumber(value);
  return !isNaN(parsed) && isFinite(parsed);
}

export function formatCurrency(
  value: number | string | null | undefined, 
  currency: string = 'BRL', 
  locale: string = 'pt-BR'
): string {
  // Tratamento de casos extremos
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }

  // Conversão de string para número
  let numericValue: number;
  if (typeof value === 'string') {
    // Remove caracteres não numéricos exceto vírgula, ponto e sinal negativo
    const cleanValue = value.replace(/[^\d.,-]/g, '');
    
    // Converte vírgula para ponto se for formato brasileiro
    const normalizedValue = cleanValue.replace(',', '.');
    
    numericValue = parseFloat(normalizedValue);
    
    // Se não conseguir converter, retorna valor padrão
    if (isNaN(numericValue)) {
      return 'R$ 0,00';
    }
  } else {
    numericValue = value;
  }

  // Validação adicional
  if (!isValidNumber(numericValue)) return 'R$ 0,00';

  // Tratamento de valores extremamente grandes ou pequenos
  if (Math.abs(numericValue) > Number.MAX_SAFE_INTEGER) {
    return 'R$ ∞';
  }

  if (Math.abs(numericValue) < Number.MIN_VALUE && numericValue !== 0) {
    return 'R$ 0,00';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch (error) {
    // Fallback para formato brasileiro
    const formatted = Math.abs(numericValue).toFixed(2).replace('.', ',');
    const [integer, decimal] = formatted.split(',');
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const sign = numericValue < 0 ? '-' : '';
    return `${sign}R$ ${formattedInteger},${decimal}`;
  }
}

export function formatNumber(
  value: number, 
  decimals: number = 2, 
  locale: string = 'pt-BR'
): string {
  if (!isValidNumber(value)) return '0';
  
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (error) {
    // Fallback
    return value.toFixed(decimals).replace('.', ',');
  }
}

export function formatPercentage(
  value: number, 
  decimals: number = 1, 
  locale: string = 'pt-BR'
): string {
  if (!isValidNumber(value)) return '0%';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  } catch (error) {
    // Fallback
    return `${(value).toFixed(decimals).replace('.', ',')}%`;
  }
}

export function roundToDecimals(value: number, decimals: number = 2): number {
  if (!isValidNumber(value)) return 0;
  
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function isPositive(value: number): boolean {
  return isValidNumber(value) && value > 0;
}

export function isNegative(value: number): boolean {
  return isValidNumber(value) && value < 0;
}

export function isZero(value: number): boolean {
  return isValidNumber(value) && value === 0;
}

export function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + (isValidNumber(value) ? value : 0), 0);
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  
  const validValues = values.filter(isValidNumber);
  if (!validValues.length) return 0;
  
  return sum(validValues) / validValues.length;
}

export function max(values: number[]): number {
  const validValues = values.filter(isValidNumber);
  return validValues.length ? Math.max(...validValues) : 0;
}

export function min(values: number[]): number {
  const validValues = values.filter(isValidNumber);
  return validValues.length ? Math.min(...validValues) : 0;
}

export function formatInputCurrency(value: string): string {
  // Remove tudo exceto dígitos
  const digits = value.replace(/\D/g, '');
  
  if (!digits) return '';
  
  // Converte para centavos
  const cents = parseInt(digits, 10);
  
  // Converte de volta para reais
  const reais = cents / 100;
  
  // Formata como moeda brasileira
  return formatCurrency(reais);
}
