/**
 * Utilitários para formatação de moeda
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
}

const CURRENCIES: Record<string, CurrencyInfo> = {
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileiro',
    decimalPlaces: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano',
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Iene Japonês',
    decimalPlaces: 0,
  },
};

/**
 * Obtém informações sobre uma moeda
 */
export function getCurrencyInfo(currencyCode: string): CurrencyInfo {
  return CURRENCIES[currencyCode] || CURRENCIES.BRL;
}

/**
 * Obtém o símbolo de uma moeda
 */
export function getCurrencySymbol(currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  return info.symbol;
}

/**
 * Formata um valor monetário
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode: string = 'BRL',
  showCode: boolean = false
): string {
  // Tratamento de casos extremos
  if (amount === null || amount === undefined) {
    return 'R$ 0,00';
  }

  // Conversão de string para número
  let numericAmount: number;
  if (typeof amount === 'string') {
    // Remove caracteres não numéricos exceto vírgula, ponto e sinal negativo
    const cleanAmount = amount.replace(/[^\d.,-]/g, '');

    // Converte vírgula para ponto se for formato brasileiro
    const normalizedAmount = cleanAmount.replace(',', '.');

    numericAmount = parseFloat(normalizedAmount);

    // Se não conseguir converter, retorna valor padrão
    if (isNaN(numericAmount)) {
      return 'R$ 0,00';
    }
  } else {
    numericAmount = amount;
  }

  // Validação de número
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return 'R$ 0,00';
  }

  // Tratamento de valores extremamente grandes ou pequenos
  if (Math.abs(numericAmount) > Number.MAX_SAFE_INTEGER) {
    return 'R$ ∞';
  }

  if (Math.abs(numericAmount) < Number.MIN_VALUE && numericAmount !== 0) {
    return 'R$ 0,00';
  }

  const info = getCurrencyInfo(currencyCode);

  try {
    // Formatação específica para cada moeda
    let formatted: string;

    if (currencyCode === 'BRL') {
      // Formatação brasileira: R$ 1.234,56
      formatted = numericAmount.toLocaleString('pt-BR', {
        minimumFractionDigits: info.decimalPlaces,
        maximumFractionDigits: info.decimalPlaces,
      });
      return `${info.symbol} ${formatted}${showCode ? ` ${info.code}` : ''}`;
    } else if (currencyCode === 'USD') {
      // Formatação americana: $1,234.56
      formatted = numericAmount.toLocaleString('en-US', {
        minimumFractionDigits: info.decimalPlaces,
        maximumFractionDigits: info.decimalPlaces,
      });
      return `${info.symbol}${formatted}${showCode ? ` ${info.code}` : ''}`;
    } else if (currencyCode === 'EUR') {
      // Formatação europeia: €1.234,56
      formatted = numericAmount.toLocaleString('de-DE', {
        minimumFractionDigits: info.decimalPlaces,
        maximumFractionDigits: info.decimalPlaces,
      });
      return `${info.symbol}${formatted}${showCode ? ` ${info.code}` : ''}`;
    } else if (currencyCode === 'JPY') {
      // Formatação japonesa: ¥1,234 (sem decimais)
      formatted = numericAmount.toLocaleString('ja-JP', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      return `${info.symbol}${formatted}${showCode ? ` ${info.code}` : ''}`;
    } else {
      // Formatação padrão para outras moedas
      formatted = numericAmount.toLocaleString('en-US', {
        minimumFractionDigits: info.decimalPlaces,
        maximumFractionDigits: info.decimalPlaces,
      });
      return `${info.symbol}${formatted}${showCode ? ` ${info.code}` : ''}`;
    }
  } catch (error) {
    // Fallback para formato brasileiro
    const formatted = Math.abs(numericAmount).toFixed(2).replace('.', ',');
    const [integer, decimal] = formatted.split(',');
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const sign = numericAmount < 0 ? '-' : '';
    return `${sign}R$ ${formattedInteger},${decimal}`;
  }
}

/**
 * Formata um valor com símbolo compacto (K, M, B)
 */
export function formatCompactCurrency(
  amount: number | string | null | undefined,
  currencyCode: string = 'BRL'
): string {
  // Tratamento de casos extremos
  if (amount === null || amount === undefined) {
    return 'R$ 0,00';
  }

  // Conversão de string para número
  let numericAmount: number;
  if (typeof amount === 'string') {
    const cleanAmount = amount.replace(/[^\d.,-]/g, '');
    const normalizedAmount = cleanAmount.replace(',', '.');
    numericAmount = parseFloat(normalizedAmount);

    if (isNaN(numericAmount)) {
      return 'R$ 0,00';
    }
  } else {
    numericAmount = amount;
  }

  // Validação de número
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return 'R$ 0,00';
  }

  // Tratamento de valores extremamente grandes
  if (Math.abs(numericAmount) > Number.MAX_SAFE_INTEGER) {
    return 'R$ ∞';
  }

  const info = getCurrencyInfo(currencyCode);

  if (Math.abs(numericAmount) >= 1000000000) {
    return `${info.symbol}${(numericAmount / 1000000000).toFixed(1)}B`;
  } else if (Math.abs(numericAmount) >= 1000000) {
    return `${info.symbol}${(numericAmount / 1000000).toFixed(1)}M`;
  } else if (Math.abs(numericAmount) >= 1000) {
    return `${info.symbol}${(numericAmount / 1000).toFixed(1)}K`;
  } else {
    return formatCurrency(numericAmount, currencyCode);
  }
}

/**
 * Converte string para número (aceita formato brasileiro)
 */
export function parseCurrency(value: string): number {
  if (!value || typeof value !== 'string') return 0;

  // Remove símbolos de moeda e espaços
  const cleaned = value
    .replace(/[R$€¥$\s]/g, '')
    .replace(/\./g, '') // Remove pontos (separadores de milhares)
    .replace(',', '.'); // Converte vírgula para ponto decimal

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formatar porcentagem de variação
 */
export function formatCurrencyChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Obter cor para exibição de variação (verde para positivo, vermelho para negativo)
 */
export function getCurrencyChangeColor(change: number): string {
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * Formata porcentagem
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Valida se um valor é um número válido
 */
export function isValidCurrency(value: string | number): boolean {
  if (typeof value === 'number') return !isNaN(value) && isFinite(value);

  if (!value || typeof value !== 'string') return false;

  const parsed = parseCurrency(value);
  return !isNaN(parsed) && isFinite(parsed);
}
