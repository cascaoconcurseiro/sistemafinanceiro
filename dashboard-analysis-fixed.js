// Script para verificar cálculos do dashboard
const transactions = [
  { amount: 5000, type: 'income', date: '2024-09-15', category: 'Trabalho' },
  { amount: 350, type: 'expense', date: '2024-09-14', category: 'Alimentação' },
  { amount: 80, type: 'expense', date: '2024-09-13', category: 'Combustível' },
  { amount: 50, type: 'expense', date: '2024-01-15', category: 'alimentacao' }
];

const currentMonth = '2024-09';
const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

const monthlyIncome = currentMonthTransactions
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + t.amount, 0);

const monthlyExpenses = currentMonthTransactions
  .filter(t => t.type === 'expense')
  .reduce((sum, t) => sum + t.amount, 0);

const monthlyResult = monthlyIncome - monthlyExpenses;

console.log('=== ANÁLISE DO DASHBOARD ===');
console.log('Transações do mês atual (2024-09):', currentMonthTransactions.length);
console.log('Receitas do mês: R$', monthlyIncome.toFixed(2));
console.log('Despesas do mês: R$', monthlyExpenses.toFixed(2));
console.log('Resultado do mês: R$', monthlyResult.toFixed(2));

// Análise por categoria
const expensesByCategory = {};
currentMonthTransactions
  .filter(t => t.type === 'expense')
  .forEach(t => {
    const category = t.category || 'Sem categoria';
    expensesByCategory[category] = (expensesByCategory[category] || 0) + t.amount;
  });

console.log('\n=== GASTOS POR CATEGORIA ===');
Object.entries(expensesByCategory).forEach(([category, amount]) => {
  const percentage = monthlyExpenses > 0 ? (amount / monthlyExpenses * 100).toFixed(1) : 0;
  console.log(`${category}: R$ ${amount.toFixed(2)} (${percentage}%)`);
});

// Verificar se o mês atual é setembro de 2024
const today = new Date();
const currentRealMonth = today.toISOString().slice(0, 7); // YYYY-MM
console.log('\n=== VERIFICAÇÃO DE DATA ===');
console.log('Mês atual real:', currentRealMonth);
console.log('Mês sendo analisado:', currentMonth);
console.log('Está analisando o mês correto?', currentRealMonth === currentMonth);