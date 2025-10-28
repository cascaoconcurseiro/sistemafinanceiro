import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Criar usuário padrão primeiro
  const defaultUser = await prisma.user.upsert({
    where: { email: 'usuario@exemplo.com' },
    update: {},
    create: {
      email: 'usuario@exemplo.com',
      name: 'Usuário Exemplo',
      password: 'senha123', // Em produção, isso deveria ser hasheado
      monthlyIncome: 5000.00,
      emergencyReserve: 10000.00,
      riskProfile: 'moderado',
      financialGoals: 'Construir reserva de emergência e investir para aposentadoria'
    }
  })

  // Criar conta padrão
  const defaultAccount = await prisma.account.upsert({
    where: { id: 'conta-corrente' },
    update: {},
    create: {
      id: 'conta-corrente',
      name: 'Conta Corrente',
      type: 'checking',
      // balance removido - será calculado dinamicamente
      currency: 'BRL',
      isActive: true,
      userId: defaultUser.id
    }
  })

  // Criar transações de exemplo
  await prisma.transaction.upsert({
    where: { id: 'trans-1' },
    update: {},
    create: {
      id: 'trans-1',
      accountId: defaultAccount.id,
      userId: defaultUser.id,
      amount: 3000.00,
      description: 'Salário',
      // category: 'Renda', // Removido - usar categoryId se necessário
      type: 'income',
      date: new Date('2024-01-15'),
      isRecurring: true
    }
  })

  await prisma.transaction.upsert({
    where: { id: 'trans-2' },
    update: {},
    create: {
      id: 'trans-2',
      accountId: defaultAccount.id,
      userId: defaultUser.id,
      amount: -250.00,
      description: 'Supermercado',
      // category: 'Alimentação', // Removido - usar categoryId se necessário
      type: 'expense',
      date: new Date('2024-01-16'),
      isRecurring: false
    }
  })

  await prisma.transaction.upsert({
    where: { id: 'trans-3' },
    update: {},
    create: {
      id: 'trans-3',
      accountId: defaultAccount.id,
      userId: defaultUser.id,
      amount: -120.00,
      description: 'Combustível',
      // category: 'Transporte', // Removido - usar categoryId se necessário
      type: 'expense',
      date: new Date('2024-01-17'),
      isRecurring: false
    }
  })

  // Criar metas de exemplo
  await prisma.goal.upsert({
    where: { id: 'goal-1' },
    update: {},
    create: {
      id: 'goal-1',
      userId: defaultUser.id,
      name: 'Reserva de Emergência',
      description: 'Reserva para 6 meses de gastos',
      currentAmount: 2000.00,
      targetAmount: 10000.00,
      deadline: new Date('2024-12-31'),
      priority: 'high',
      status: 'active'
    }
  })

  await prisma.goal.upsert({
    where: { id: 'goal-2' },
    update: {},
    create: {
      id: 'goal-2',
      userId: defaultUser.id,
      name: 'Viagem de Férias',
      description: 'Viagem para Europa',
      currentAmount: 500.00,
      targetAmount: 5000.00,
      deadline: new Date('2024-07-01'),
      priority: 'medium',
      status: 'active'
    }
  })

  await prisma.goal.upsert({
    where: { id: 'goal-3' },
    update: {},
    create: {
      id: 'goal-3',
      userId: defaultUser.id,
      name: 'Novo Notebook',
      description: 'Notebook para trabalho',
      currentAmount: 1200.00,
      targetAmount: 3000.00,
      deadline: new Date('2024-03-31'),
      priority: 'low',
      status: 'active'
    }
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })