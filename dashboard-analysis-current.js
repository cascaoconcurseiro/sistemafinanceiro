// Script para verificar cálculos do dashboard com mês atual
const transactions = [
  { amount: 5000, type: 'income', date: '2024-09-15', category: 'Trabalho' },
  { amount: 350, type: 'expense', date: '2024-09-14', category: 'Alimentação' },
  { amount: 80, type: 'expense', date: '2024-09-13', category: 'Combustível' },
  { amount: 50, type: 'expense', date: '2024-01-15', category: 'alimentacao' }
];

// Usar o mês atual real
const today = new Date();
const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
console.log('Mês atual:', currentMonth);

const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

const monthlyIncome = currentMonthTransactions
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + t.amount, 0);

const monthlyExpenses = currentMonthTransactions
  .filter(t => t.type === 'expense')
  .reduce((sum, t) => sum + t.amount, 0);

const monthlyResult = monthlyIncome - monthlyExpenses;

console.log('\n=== ANÁLISE DO DASHBOARD (MÊS ATUAL) ===');
console.log('Transações do mês atual:', currentMonthTransactions.length);
console.log('Receitas do mês: R$', monthlyIncome.toFixed(2));
console.log('Despesas do mês: R$', monthlyExpenses.toFixed(2));
console.log('Resultado do mês: R$', monthlyResult.toFixed(2));

if (currentMonthTransactions.length === 0) {
  console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
  console.log('Não há transações para o mês atual (' + currentMonth + ')');
  console.log('O dashboard pode estar mostrando valores zerados ou incorretos.');
  
  console.log('\n=== TRANSAÇÕES DISPONÍVEIS ===');
  transactions.forEach(t => {
    console.log(`${t.date} - ${t.type} - R$ ${t.amount} - ${t.category}`);
  });
}

// Análise por categoria (se houver transações)
if (currentMonthTransactions.length > 0) {
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
}