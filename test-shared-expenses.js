// Teste de funcionalidades de despesas compartilhadas
console.log('🧪 Testando funcionalidades de despesas compartilhadas...\n');

// Dados de teste para despesa compartilhada
const sharedExpenseData = {
  title: 'Jantar em Grupo',
  totalAmount: 150.00,
  participants: [
    {
      id: 'user1',
      name: 'João Silva',
      email: 'joao@email.com',
      amountOwed: 50.00,
      amountPaid: 0,
      isPaid: false
    },
    {
      id: 'user2', 
      name: 'Maria Santos',
      email: 'maria@email.com',
      amountOwed: 50.00,
      amountPaid: 50.00,
      isPaid: true
    },
    {
      id: 'user3',
      name: 'Pedro Costa',
      email: 'pedro@email.com', 
      amountOwed: 50.00,
      amountPaid: 0,
      isPaid: false
    }
  ],
  createdBy: 'user2',
  status: 'active',
  description: 'Jantar no restaurante italiano',
  category: 'Alimentação'
};

console.log('📊 Dados da despesa compartilhada:');
console.log('Título:', sharedExpenseData.title);
console.log('Valor total: R$', sharedExpenseData.totalAmount.toFixed(2));
console.log('Número de participantes:', sharedExpenseData.participants.length);
console.log('Criado por:', sharedExpenseData.participants.find(p => p.id === sharedExpenseData.createdBy)?.name);
console.log('Status:', sharedExpenseData.status);
console.log('Categoria:', sharedExpenseData.category);
console.log();

console.log('👥 Participantes e divisão:');
sharedExpenseData.participants.forEach((participant, index) => {
  console.log(`${index + 1}. ${participant.name} (${participant.email})`);
  console.log(`   Deve pagar: R$ ${participant.amountOwed.toFixed(2)}`);
  console.log(`   Já pagou: R$ ${participant.amountPaid.toFixed(2)}`);
  console.log(`   Status: ${participant.isPaid ? '✅ Pago' : '❌ Pendente'}`);
  console.log();
});

// Calcular estatísticas
const totalOwed = sharedExpenseData.participants.reduce((sum, p) => sum + p.amountOwed, 0);
const totalPaid = sharedExpenseData.participants.reduce((sum, p) => sum + p.amountPaid, 0);
const pendingAmount = totalOwed - totalPaid;
const paidParticipants = sharedExpenseData.participants.filter(p => p.isPaid).length;
const pendingParticipants = sharedExpenseData.participants.length - paidParticipants;

console.log('📈 Resumo financeiro:');
console.log('Total devido: R$', totalOwed.toFixed(2));
console.log('Total pago: R$', totalPaid.toFixed(2));
console.log('Valor pendente: R$', pendingAmount.toFixed(2));
console.log('Participantes que pagaram:', paidParticipants);
console.log('Participantes pendentes:', pendingParticipants);
console.log();

// Verificar divisão proporcional
const isEqualSplit = sharedExpenseData.participants.every(p => p.amountOwed === sharedExpenseData.participants[0].amountOwed);
console.log('💰 Análise da divisão:');
console.log('Divisão igual:', isEqualSplit ? '✅ Sim' : '❌ Não');
console.log('Valor por pessoa (divisão igual): R$', (sharedExpenseData.totalAmount / sharedExpenseData.participants.length).toFixed(2));

if (totalOwed !== sharedExpenseData.totalAmount) {
  console.log('⚠️  ATENÇÃO: Soma dos valores individuais não confere com o total!');
  console.log('Diferença: R$', (sharedExpenseData.totalAmount - totalOwed).toFixed(2));
} else {
  console.log('✅ Divisão correta: soma dos valores individuais confere com o total');
}

console.log();

// Teste de diferentes tipos de divisão
console.log('🔄 Testando diferentes tipos de divisão:');

// Divisão desigual
const unequalSplit = {
  title: 'Compras do Supermercado',
  totalAmount: 200.00,
  participants: [
    { id: 'user1', name: 'Ana', amountOwed: 80.00, amountPaid: 0, isPaid: false },
    { id: 'user2', name: 'Bruno', amountOwed: 60.00, amountPaid: 60.00, isPaid: true },
    { id: 'user3', name: 'Carlos', amountOwed: 60.00, amountPaid: 0, isPaid: false }
  ]
};

console.log('\n📋 Teste de divisão desigual:');
console.log('Título:', unequalSplit.title);
console.log('Total: R$', unequalSplit.totalAmount.toFixed(2));
unequalSplit.participants.forEach(p => {
  console.log(`- ${p.name}: R$ ${p.amountOwed.toFixed(2)} (${p.isPaid ? 'Pago' : 'Pendente'})`);
});

const unequalTotal = unequalSplit.participants.reduce((sum, p) => sum + p.amountOwed, 0);
console.log('Soma das partes: R$', unequalTotal.toFixed(2));
console.log('Conferência:', unequalTotal === unequalSplit.totalAmount ? '✅ Correto' : '❌ Erro');

console.log();
console.log('🎯 Teste de despesas compartilhadas concluído com sucesso!');