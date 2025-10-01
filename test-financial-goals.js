// Teste de funcionalidades de metas financeiras
console.log('🎯 Testando funcionalidades de metas financeiras...\n');

// Dados das metas obtidos da API
const goalsData = [
  {
    id: "goal-3",
    name: "Novo Notebook",
    description: "Notebook para trabalho",
    current: 1200,
    target: 3000,
    targetDate: "2024-03-31T00:00:00.000Z",
    priority: "low",
    isCompleted: false
  },
  {
    id: "goal-2", 
    name: "Viagem de Férias",
    description: "Viagem para Europa",
    current: 500,
    target: 5000,
    targetDate: "2024-07-01T00:00:00.000Z",
    priority: "medium",
    isCompleted: false
  },
  {
    id: "goal-1",
    name: "Reserva de Emergência", 
    description: "Reserva para 6 meses de gastos",
    current: 2000,
    target: 10000,
    targetDate: "2024-12-31T00:00:00.000Z",
    priority: "high",
    isCompleted: false
  }
];

console.log('📊 Análise das metas financeiras:');
console.log('Total de metas:', goalsData.length);
console.log();

// Analisar cada meta individualmente
goalsData.forEach((goal, index) => {
  const progress = (goal.current / goal.target) * 100;
  const remaining = goal.target - goal.current;
  const targetDate = new Date(goal.targetDate);
  const today = new Date();
  const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  
  console.log(`${index + 1}. ${goal.name}`);
  console.log(`   Descrição: ${goal.description}`);
  console.log(`   Progresso: R$ ${goal.current.toFixed(2)} / R$ ${goal.target.toFixed(2)} (${progress.toFixed(1)}%)`);
  console.log(`   Faltam: R$ ${remaining.toFixed(2)}`);
  console.log(`   Data alvo: ${targetDate.toLocaleDateString('pt-BR')}`);
  console.log(`   Dias restantes: ${daysRemaining > 0 ? daysRemaining : 'Meta vencida'}`);
  console.log(`   Prioridade: ${goal.priority}`);
  console.log(`   Status: ${goal.isCompleted ? '✅ Concluída' : '🔄 Em andamento'}`);
  
  // Calcular valor mensal necessário
  if (daysRemaining > 0) {
    const monthsRemaining = daysRemaining / 30;
    const monthlyNeeded = remaining / monthsRemaining;
    console.log(`   Valor mensal necessário: R$ ${monthlyNeeded.toFixed(2)}`);
  }
  
  // Indicador de progresso visual
  const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
  console.log(`   [${progressBar}] ${progress.toFixed(1)}%`);
  console.log();
});

// Estatísticas gerais
const totalTarget = goalsData.reduce((sum, goal) => sum + goal.target, 0);
const totalCurrent = goalsData.reduce((sum, goal) => sum + goal.current, 0);
const totalRemaining = totalTarget - totalCurrent;
const overallProgress = (totalCurrent / totalTarget) * 100;

console.log('📈 Resumo geral das metas:');
console.log('Valor total das metas: R$', totalTarget.toFixed(2));
console.log('Valor já poupado: R$', totalCurrent.toFixed(2));
console.log('Valor restante: R$', totalRemaining.toFixed(2));
console.log('Progresso geral:', overallProgress.toFixed(1) + '%');
console.log();

// Análise por prioridade
const priorityAnalysis = {
  high: goalsData.filter(g => g.priority === 'high'),
  medium: goalsData.filter(g => g.priority === 'medium'),
  low: goalsData.filter(g => g.priority === 'low')
};

console.log('🎯 Análise por prioridade:');
Object.entries(priorityAnalysis).forEach(([priority, goals]) => {
  if (goals.length > 0) {
    const priorityTotal = goals.reduce((sum, g) => sum + g.target, 0);
    const priorityCurrent = goals.reduce((sum, g) => sum + g.current, 0);
    const priorityProgress = (priorityCurrent / priorityTotal) * 100;
    
    console.log(`${priority.toUpperCase()}: ${goals.length} meta(s)`);
    console.log(`  Progresso: ${priorityProgress.toFixed(1)}% (R$ ${priorityCurrent.toFixed(2)} / R$ ${priorityTotal.toFixed(2)})`);
    goals.forEach(g => console.log(`  - ${g.name}`));
    console.log();
  }
});

// Análise de urgência (metas com prazo próximo)
const today = new Date();
const urgentGoals = goalsData.filter(goal => {
  const targetDate = new Date(goal.targetDate);
  const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  return daysRemaining <= 90 && daysRemaining > 0; // Próximas 3 meses
});

console.log('⚠️  Metas urgentes (próximos 90 dias):');
if (urgentGoals.length === 0) {
  console.log('Nenhuma meta urgente encontrada.');
} else {
  urgentGoals.forEach(goal => {
    const targetDate = new Date(goal.targetDate);
    const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    const progress = (goal.current / goal.target) * 100;
    console.log(`- ${goal.name}: ${daysRemaining} dias restantes (${progress.toFixed(1)}% concluído)`);
  });
}

console.log();

// Simulação de progresso automático
console.log('🔄 Simulação de progresso automático:');
console.log('Simulando adição de R$ 200,00 à meta "Novo Notebook"...');

const notebookGoal = goalsData.find(g => g.name === 'Novo Notebook');
if (notebookGoal) {
  const newCurrent = notebookGoal.current + 200;
  const newProgress = (newCurrent / notebookGoal.target) * 100;
  const wasCompleted = notebookGoal.current >= notebookGoal.target;
  const isNowCompleted = newCurrent >= notebookGoal.target;
  
  console.log(`Progresso anterior: ${((notebookGoal.current / notebookGoal.target) * 100).toFixed(1)}%`);
  console.log(`Novo progresso: ${newProgress.toFixed(1)}%`);
  
  if (!wasCompleted && isNowCompleted) {
    console.log('🎉 META CONCLUÍDA! Parabéns!');
  } else if (newProgress >= 75 && ((notebookGoal.current / notebookGoal.target) * 100) < 75) {
    console.log('🔥 Meta quase concluída! Faltam apenas 25%!');
  }
}

console.log();
console.log('🎯 Teste de metas financeiras concluído com sucesso!');