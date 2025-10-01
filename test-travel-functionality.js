// Teste de funcionalidades de viagens com múltiplos usuários
console.log('✈️ Testando funcionalidades de viagens com múltiplos usuários...\n');

// Dados da viagem obtidos da API
const tripData = {
  id: "cmg50pmhm0008nwvc6x2wful0",
  name: "oooo",
  destination: "oooo", 
  description: null,
  startDate: "2025-09-29T00:00:00.000Z",
  endDate: "2025-09-29T00:00:00.000Z",
  budget: 1000,
  spent: 0,
  currency: "BRL",
  status: "planned",
  participants: ["Você"],
  expenses: [],
  expenseCount: 0
};

console.log('📊 Dados da viagem atual:');
console.log('Nome:', tripData.name);
console.log('Destino:', tripData.destination);
console.log('Período:', new Date(tripData.startDate).toLocaleDateString('pt-BR'), 'até', new Date(tripData.endDate).toLocaleDateString('pt-BR'));
console.log('Orçamento: R$', tripData.budget.toFixed(2));
console.log('Gasto: R$', tripData.spent.toFixed(2));
console.log('Saldo restante: R$', (tripData.budget - tripData.spent).toFixed(2));
console.log('Status:', tripData.status);
console.log('Participantes:', tripData.participants.join(', '));
console.log('Número de despesas:', tripData.expenseCount);
console.log();

// Simulação de viagem com múltiplos usuários
console.log('🧪 Simulação de viagem com múltiplos usuários:');

const multiUserTrip = {
  name: "Viagem para Gramado",
  destination: "Gramado, RS",
  description: "Viagem de fim de semana com amigos",
  startDate: "2025-01-15",
  endDate: "2025-01-17",
  budget: 2500.00,
  currency: "BRL",
  status: "planned",
  participants: [
    {
      id: "user1",
      name: "Ana Silva",
      email: "ana@email.com",
      role: "organizer"
    },
    {
      id: "user2", 
      name: "Bruno Costa",
      email: "bruno@email.com",
      role: "participant"
    },
    {
      id: "user3",
      name: "Carlos Santos",
      email: "carlos@email.com", 
      role: "participant"
    },
    {
      id: "user4",
      name: "Diana Oliveira",
      email: "diana@email.com",
      role: "participant"
    }
  ],
  expenses: [
    {
      id: "exp1",
      description: "Hotel - 2 noites",
      amount: 800.00,
      category: "Hospedagem",
      date: "2025-01-15",
      paidBy: "user1",
      sharedWith: ["user1", "user2", "user3", "user4"],
      splitType: "equal"
    },
    {
      id: "exp2", 
      description: "Combustível",
      amount: 200.00,
      category: "Transporte",
      date: "2025-01-15",
      paidBy: "user2",
      sharedWith: ["user1", "user2", "user3", "user4"],
      splitType: "equal"
    },
    {
      id: "exp3",
      description: "Jantar no restaurante",
      amount: 320.00,
      category: "Alimentação", 
      date: "2025-01-15",
      paidBy: "user3",
      sharedWith: ["user1", "user2", "user3", "user4"],
      splitType: "equal"
    },
    {
      id: "exp4",
      description: "Passeio de Maria Fumaça",
      amount: 240.00,
      category: "Entretenimento",
      date: "2025-01-16",
      paidBy: "user1",
      sharedWith: ["user1", "user2", "user3"],
      splitType: "equal"
    },
    {
      id: "exp5",
      description: "Compras pessoais",
      amount: 150.00,
      category: "Compras",
      date: "2025-01-16", 
      paidBy: "user4",
      sharedWith: ["user4"],
      splitType: "individual"
    }
  ]
};

console.log('📋 Detalhes da viagem simulada:');
console.log('Nome:', multiUserTrip.name);
console.log('Destino:', multiUserTrip.destination);
console.log('Descrição:', multiUserTrip.description);
console.log('Período:', multiUserTrip.startDate, 'até', multiUserTrip.endDate);
console.log('Orçamento: R$', multiUserTrip.budget.toFixed(2));
console.log('Status:', multiUserTrip.status);
console.log();

console.log('👥 Participantes:');
multiUserTrip.participants.forEach((participant, index) => {
  console.log(`${index + 1}. ${participant.name} (${participant.email}) - ${participant.role}`);
});
console.log();

console.log('💰 Despesas da viagem:');
let totalSpent = 0;
multiUserTrip.expenses.forEach((expense, index) => {
  totalSpent += expense.amount;
  console.log(`${index + 1}. ${expense.description}`);
  console.log(`   Valor: R$ ${expense.amount.toFixed(2)}`);
  console.log(`   Categoria: ${expense.category}`);
  console.log(`   Data: ${expense.date}`);
  console.log(`   Pago por: ${multiUserTrip.participants.find(p => p.id === expense.paidBy)?.name}`);
  console.log(`   Compartilhado com: ${expense.sharedWith.length} pessoa(s)`);
  console.log(`   Tipo de divisão: ${expense.splitType}`);
  console.log();
});

console.log('📊 Resumo financeiro:');
console.log('Total gasto: R$', totalSpent.toFixed(2));
console.log('Orçamento: R$', multiUserTrip.budget.toFixed(2));
console.log('Saldo restante: R$', (multiUserTrip.budget - totalSpent).toFixed(2));
console.log('Percentual usado:', ((totalSpent / multiUserTrip.budget) * 100).toFixed(1) + '%');
console.log();

// Calcular divisão de custos por participante
console.log('🧮 Divisão de custos por participante:');
const participantBalances = {};

// Inicializar saldos
multiUserTrip.participants.forEach(p => {
  participantBalances[p.id] = {
    name: p.name,
    paid: 0,
    owes: 0,
    balance: 0
  };
});

// Calcular o que cada um pagou e deve
multiUserTrip.expenses.forEach(expense => {
  // Adicionar ao que a pessoa pagou
  participantBalances[expense.paidBy].paid += expense.amount;
  
  // Calcular divisão
  if (expense.splitType === 'equal') {
    const amountPerPerson = expense.amount / expense.sharedWith.length;
    expense.sharedWith.forEach(participantId => {
      participantBalances[participantId].owes += amountPerPerson;
    });
  } else if (expense.splitType === 'individual') {
    participantBalances[expense.paidBy].owes += expense.amount;
  }
});

// Calcular saldo final (positivo = deve receber, negativo = deve pagar)
Object.values(participantBalances).forEach(balance => {
  balance.balance = balance.paid - balance.owes;
});

// Mostrar resultados
Object.values(participantBalances).forEach(balance => {
  console.log(`${balance.name}:`);
  console.log(`  Pagou: R$ ${balance.paid.toFixed(2)}`);
  console.log(`  Deve: R$ ${balance.owes.toFixed(2)}`);
  if (balance.balance > 0) {
    console.log(`  💰 Deve receber: R$ ${balance.balance.toFixed(2)}`);
  } else if (balance.balance < 0) {
    console.log(`  💸 Deve pagar: R$ ${Math.abs(balance.balance).toFixed(2)}`);
  } else {
    console.log(`  ✅ Está quite`);
  }
  console.log();
});

// Análise por categoria
console.log('📈 Gastos por categoria:');
const categoryTotals = {};
multiUserTrip.expenses.forEach(expense => {
  if (!categoryTotals[expense.category]) {
    categoryTotals[expense.category] = 0;
  }
  categoryTotals[expense.category] += expense.amount;
});

Object.entries(categoryTotals).forEach(([category, total]) => {
  const percentage = (total / totalSpent) * 100;
  console.log(`${category}: R$ ${total.toFixed(2)} (${percentage.toFixed(1)}%)`);
});

console.log();

// Verificação de integridade
console.log('🔍 Verificação de integridade:');
const totalPaid = Object.values(participantBalances).reduce((sum, b) => sum + b.paid, 0);
const totalOwed = Object.values(participantBalances).reduce((sum, b) => sum + b.owes, 0);
const balanceSum = Object.values(participantBalances).reduce((sum, b) => sum + b.balance, 0);

console.log('Total pago pelos participantes: R$', totalPaid.toFixed(2));
console.log('Total devido pelos participantes: R$', totalOwed.toFixed(2));
console.log('Soma dos saldos:', balanceSum.toFixed(2));
console.log('Conferência:', Math.abs(balanceSum) < 0.01 ? '✅ Correto' : '❌ Erro nos cálculos');

console.log();
console.log('✈️ Teste de funcionalidades de viagens concluído com sucesso!');