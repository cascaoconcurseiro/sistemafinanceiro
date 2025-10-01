import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Criar conta padrão
  const defaultAccount = await prisma.account.upsert({
    where: { id: 'conta-corrente' },
    update: {},
    create: {
      id: 'conta-corrente',
      name: 'Conta Corrente',
      type: 'checking',
      balance: 5000.00,
      currency: 'BRL',
      isActive: true
    }
  })

  // Criar transações de exemplo
  await prisma.transaction.upsert({
    where: { id: 'trans-1' },
    update: {},
    create: {
      id: 'trans-1',
      accountId: defaultAccount.id,
      amount: 3000.00,
      description: 'Salário',
      category: 'Renda',
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
      amount: -250.00,
      description: 'Supermercado',
      category: 'Alimentação',
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
      amount: -120.00,
      description: 'Combustível',
      category: 'Transporte',
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
      name: 'Reserva de Emergência',
      description: 'Reserva para 6 meses de gastos',
      current: 2000.00,
      target: 10000.00,
      targetDate: new Date('2024-12-31'),
      priority: 'high',
      isCompleted: false
    }
  })

  await prisma.goal.upsert({
    where: { id: 'goal-2' },
    update: {},
    create: {
      id: 'goal-2',
      name: 'Viagem de Férias',
      description: 'Viagem para Europa',
      current: 500.00,
      target: 5000.00,
      targetDate: new Date('2024-07-01'),
      priority: 'medium',
      isCompleted: false
    }
  })

  await prisma.goal.upsert({
    where: { id: 'goal-3' },
    update: {},
    create: {
      id: 'goal-3',
      name: 'Novo Notebook',
      description: 'Notebook para trabalho',
      current: 1200.00,
      target: 3000.00,
      targetDate: new Date('2024-03-31'),
      priority: 'low',
      isCompleted: false
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