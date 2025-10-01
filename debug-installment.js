// Debug script para testar o cálculo de parcelas

// Simular a função parseNumber
function parseNumber(value) {
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

// Simular o que acontece no modal
const formData = {
  amount: '500,00',
  type: 'expense',
  installments: 3
};

console.log('=== DEBUG INSTALLMENT CALCULATION ===');
console.log('Input amount:', formData.amount);

// Simular parseNumber
const amount = parseNumber(formData.amount);
console.log('Parsed amount:', amount);

// Simular adjustedFinalAmount
const adjustedFinalAmount = formData.type === 'expense' ? -amount : amount;
console.log('Adjusted final amount:', adjustedFinalAmount);

// Simular Math.abs(adjustedFinalAmount) usado no baseTransaction
const baseTransactionAmount = Math.abs(adjustedFinalAmount);
console.log('Base transaction amount:', baseTransactionAmount);

// Simular o cálculo de parcela no transaction-manager
const totalInstallments = formData.installments;
const installmentAmount = Math.round((baseTransactionAmount / totalInstallments) * 100) / 100;
console.log('Installment amount:', installmentAmount);

console.log('\n=== EXPECTED RESULTS ===');
console.log('Expected installment amount:', 500 / 3);
console.log('Expected rounded installment amount:', Math.round((500 / 3) * 100) / 100);

console.log('\n=== COMPARISON ===');
console.log('Calculated:', installmentAmount);
console.log('Expected:', Math.round((500 / 3) * 100) / 100);
console.log('Match:', installmentAmount === Math.round((500 / 3) * 100) / 100);