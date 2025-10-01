/**
 * Utilitários para formatação de moedas e conversão
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  decimalPlaces: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileiro',
    flag: '🇧🇷',
    decimalPlaces: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano',
    flag: '🇺🇸',
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    decimalPlaces: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'Libra Esterlina',
    flag: '🇬🇧',
    decimalPlaces: 2,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Iene Japonês',
    flag: '🇯🇵',
    decimalPlaces: 0,
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Dólar Canadense',
    flag: '🇨🇦',
    decimalPlaces: 2,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Dólar Australiano',
    flag: '🇦🇺',
    decimalPlaces: 2,
  },
  CHF: {
    code: 'CHF',
    symbol: 'Fr',
    name: 'Franco Suíço',
    flag: '🇨🇭',
    decimalPlaces: 2,
  },
};

/**
 * Obtém informações sobre uma moeda
 */
export function getCurrencyInfo(currencyCode: string): CurrencyInfo {
  return SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.BRL;
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
  amount: number,
  currencyCode: string = 'BRL',
  showCode: boolean = false
): string {
  const info = getCurrencyInfo(currencyCode);

  // Formatação específica para cada moeda
  let formatted: string;

  if (currencyCode === 'BRL') {
    // Formatação brasileira: R$ 1.234,56
    formatted = amount.toLocaleString('pt-BR', {
      minimumFractionDigits: info.decimalPlaces,
      maximumFractionDigits: info.decimalPlaces,
    });
    return `${info.symbol} ${formatted}${showCode ? ` ${info.code}` : ''}`;
  } else if (currencyCode === 'USD') {
    // Formatação americana: $1,234.56
    formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: info.decimalPlaces,
      maximumFractionDigits: info.decimalPlaces,
    });
    return `${info.symbol}${formatted}${showCode ? ` ${info.code}` : ''}`;
  } else if (currencyCode === 'EUR') {
    // Formatação europeia: €1.234,56
    formatted = amount.toLocaleString('de-DE', {
      minimumFractionDigits: info.decimalPlaces,
      maximumFractionDigits: info.decimalPlaces,
    });
    return `${info.symbol}${formatted}${showCode ? ` ${info.code}` : ''}`;
  } else if (currencyCode === 'JPY') {
    // Formatação japonesa: ¥1,234 (sem decimais)
    formatted = amount.toLocaleString('ja-JP', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${info.symbol}${formatted}${showCode ? ` ${info.code}` : ''}`;
  } else {
    // Formatação padrão para outras moedas
    formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: info.decimalPlaces,
      maximumFractionDigits: info.decimalPlaces,
    });
    return `${info.symbol}${formatted}${showCode ? ` ${info.code}` : ''}`;
  }
}

/**
 * Formata um valor com símbolo compacto (K, M, B)
 */
export function formatCompactCurrency(
  amount: number,
  currencyCode: string = 'BRL'
): string {
  const info = getCurrencyInfo(currencyCode);

  if (Math.abs(amount) >= 1000000000) {
    return `${info.symbol}${(amount / 1000000000).toFixed(1)}B`;
  } else if (Math.abs(amount) >= 1000000) {
    return `${info.symbol}${(amount / 1000000).toFixed(1)}M`;
  } else if (Math.abs(amount) >= 1000) {
    return `${info.symbol}${(amount / 1000).toFixed(1)}K`;
  } else {
    return formatCurrency(amount, currencyCode);
  }
}

/**
 * Parse de string de valor monetário para número
 */
export function parseCurrencyString(value: string): number {
  // Remove todos os caracteres não numéricos, exceto vírgula, ponto e sinal de menos
  const cleanValue = value.replace(/[^\d,.\-]/g, '');

  // Se contém vírgula e ponto, assume formatação brasileira (vírgula como decimal)
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    // Remove pontos (separador de milhares) e substitui vírgula por ponto
    return parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
  }

  // Se contém apenas vírgula, substitui por ponto
  if (cleanValue.includes(',') && !cleanValue.includes('.')) {
    return parseFloat(cleanValue.replace(',', '.'));
  }

  // Caso contrário, faz parse direto
  return parseFloat(cleanValue) || 0;
}

/**
 * Converte valor entre moedas (mock - em produção usar API real)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates?: Record<string, number>
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Taxas mock para demonstração - em produção, usar API real
  const mockRates: Record<string, Record<string, number>> = {
    BRL: {
      USD: 0.2,
      EUR: 0.18,
      GBP: 0.15,
      JPY: 30.0,
      CAD: 0.27,
      AUD: 0.3,
      CHF: 0.18,
    },
    USD: {
      BRL: 5.0,
      EUR: 0.85,
      GBP: 0.75,
      JPY: 150.0,
      CAD: 1.35,
      AUD: 1.5,
      CHF: 0.9,
    },
    EUR: {
      BRL: 5.5,
      USD: 1.18,
      GBP: 0.88,
      JPY: 165.0,
      CAD: 1.45,
      AUD: 1.6,
      CHF: 1.05,
    },
  };

  // Usar taxas personalizadas se fornecidas
  const rates = exchangeRates || mockRates[fromCurrency];

  if (!rates || !rates[toCurrency]) {
    console.warn(
      `Taxa de câmbio não encontrada para ${fromCurrency} -> ${toCurrency}`
    );
    return amount; // Retorna valor original se não encontrar taxa
  }

  return amount * rates[toCurrency];
}

/**
 * Obtém lista de moedas suportadas para seletores
 */
export function getSupportedCurrencies(): Array<{
  value: string;
  label: string;
  flag: string;
}> {
  return Object.values(SUPPORTED_CURRENCIES).map((currency) => ({
    value: currency.code,
    label: `${currency.flag} ${currency.name} (${currency.code})`,
    flag: currency.flag,
  }));
}

/**
 * Verifica se uma moeda é suportada
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return currencyCode in SUPPORTED_CURRENCIES;
}

/**
 * Obtém moeda padrão do usuário (baseada na localização ou configuração)
 */
export function getDefaultCurrency(): string {
  if (typeof navigator !== 'undefined') {
    const locale = navigator.language || 'pt-BR';

    if (locale.startsWith('pt-BR')) return 'BRL';
    if (locale.startsWith('en-US')) return 'USD';
    if (locale.startsWith('en-GB')) return 'GBP';
    if (
      locale.startsWith('de') ||
      locale.startsWith('fr') ||
      locale.startsWith('es') ||
      locale.startsWith('it')
    )
      return 'EUR';
    if (locale.startsWith('ja')) return 'JPY';
    if (locale.startsWith('en-CA')) return 'CAD';
    if (locale.startsWith('en-AU')) return 'AUD';
  }

  return 'BRL'; // Padrão para Brasil
}

/**
 * Formatar porcentagem de variação cambial
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
