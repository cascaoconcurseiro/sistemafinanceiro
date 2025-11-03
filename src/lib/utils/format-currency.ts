/**
 * Função utilitária para formatação de valores monetários
 * Garante sempre 2 casas decimais e formatação brasileira
 */
export function formatCurrency(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Função para formatar valores sem o símbolo da moeda
 */
export function formatNumber(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Função para formatar percentuais
 */
export function formatPercentage(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0,00%';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
