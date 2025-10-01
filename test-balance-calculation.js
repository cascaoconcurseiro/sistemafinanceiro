// Script para testar cálculo de saldo das contas
const transactions = [
  { type: 'income', amount: 3000, description: 'Salário' },
  { type: 'expense', amount: 150, description: 'Supermercado' },
  { type: 'expense', amount: 80, description: 'Combustível' },
  { type: 'expense', amount: 50, description: 'Teste de transação válida' }
];

let balance = 0;
console.log('=== CÁLCULO DE SALDO ===');
transactions.forEach(t => {
  if (t.type === 'income') {
    balance += t.amount;
  } else if (t.type === 'expense') {
    balance -= t.amount;
  }
  console.log(`${t.description}: ${t.type === 'income' ? '+' : '-'}${t.amount} = Saldo: ${balance}`);
});

console.log(`\nSaldo calculado: R$ ${balance}`);
console.log('Saldo na API: R$ 2720');
console.log('Diferença:', balance - 2720);

// Verificar se há outras transações não consideradas
console.log('\n=== ANÁLISE ===');
if (balance === 2720) {
  console.log('✅ Saldos coincidem - cálculo correto!');
} else {
  console.log('❌ Saldos não coincidem - pode haver transações não consideradas ou erro no cálculo');
}