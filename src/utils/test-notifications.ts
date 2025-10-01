/**
 * Utilitário para testar o sistema de notificações com dados reais
 * Execute no console do navegador para adicionar dados que gerem notificações
 */

export const addTestDataForNotifications = () => {
  // Adicionar transações que gerem alerta de gastos altos
  const highExpenseTransactions = [
    {
      id: 'test-expense-1',
      amount: -800,
      description: 'Supermercado - Compras do mês',
      category: 'Alimentação',
      type: 'expense',
      date: new Date().toISOString(),
      account: 'conta-corrente',
    },
    {
      id: 'test-expense-2',
      amount: -1200,
      description: 'Aluguel',
      category: 'Moradia',
      type: 'expense',
      date: new Date().toISOString(),
      account: 'conta-corrente',
    },
    {
      id: 'test-expense-3',
      amount: -500,
      description: 'Gasolina e manutenção',
      category: 'Transporte',
      type: 'expense',
      date: new Date().toISOString(),
      account: 'conta-corrente',
    },
  ];

  // Adicionar contas com saldo baixo
  const lowBalanceAccounts = [
    {
      id: 'test-account-1',
      name: 'Conta Corrente Principal',
      type: 'checking',
      balance: 350, // Saldo baixo para gerar notificação
      bank: 'Banco do Brasil',
    },
  ];

  // Adicionar meta próxima do prazo
  const urgentGoals = [
    {
      id: 'test-goal-1',
      name: 'Viagem para Europa',
      description: 'Economizar para viagem dos sonhos',
      current: 8000,
      target: 15000,
      targetDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 dias
      priority: 'high',
      isCompleted: false,
    },
  ];

  // Adicionar meta concluída
  const completedGoals = [
    {
      id: 'test-goal-2',
      name: 'Reserva de Emergência',
      description: 'Meta para emergências',
      current: 10000,
      target: 10000,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
      isCompleted: false, // Deixar false para simular meta recém atingida
    },
  ];

  // Adicionar viagem próxima
  const upcomingTrips = [
    {
      id: 'test-trip-1',
      name: 'Férias na Praia',
      destination: 'Maceió, AL',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias
      endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 3000,
      spent: 500,
      status: 'planned',
    },
  ];

  // Adicionar conta com muito dinheiro para sugerir investimento
  const highCashAccounts = [
    {
      id: 'test-savings-1',
      name: 'Poupança',
      type: 'savings',
      balance: 8000,
      bank: 'Itaú',
    },
  ];

  // Salvar no banco de dados (localStorage removido)
  console.warn('addTestDataForNotifications - localStorage removido, implementar via banco de dados');
  
  // TODO: Implementar salvamento de dados de teste via banco de dados
  // const saveTestDataToDatabase = async () => {
  //   try {
  //     await databaseAdapter.saveTestTransactions(highExpenseTransactions);
  //     await databaseAdapter.saveTestAccounts([...lowBalanceAccounts, ...highCashAccounts]);
  //     await databaseAdapter.saveTestGoals([...urgentGoals, ...completedGoals]);
  //     await databaseAdapter.saveTestTrips(upcomingTrips);
  //   } catch (error) {
  //     console.error('Error saving test data:', error);
  //   }
  // };
  // saveTestDataToDatabase();

  // Dados de teste adicionados com sucesso

  return {
    transactions: highExpenseTransactions,
    accounts: [...lowBalanceAccounts, ...highCashAccounts],
    goals: [...urgentGoals, ...completedGoals],
    trips: upcomingTrips,
  };
};

// Função para limpar dados de teste
export const clearTestData = () => {
  console.warn('Clear test data - localStorage removido, implementar via banco de dados');
  
  // TODO: Implementar limpeza de dados de teste via banco de dados
  // const clearTestDataFromDatabase = async () => {
  //   try {
  //     await databaseAdapter.clearTestData();
  //   } catch (error) {
  //     console.error('Error clearing test data:', error);
  //   }
  // };
  // clearTestDataFromDatabase();
};

// Disponibilizar globalmente para uso no console
if (typeof window !== 'undefined') {
  (window as any).addTestDataForNotifications = addTestDataForNotifications;
  (window as any).clearTestData = clearTestData;
}
