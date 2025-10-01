import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { force = false } = body;

    // Verificar se já existem dados
    if (!force) {
      const existingTransactions = await prisma.transaction.count();
      if (existingTransactions > 0) {
        return NextResponse.json({
          success: false,
          message: 'Dados já existem. Use force: true para recriar.',
          existingCount: existingTransactions,
        });
      }
    }

    // Limpar dados existentes se force = true
    if (force) {
      await prisma.entries.deleteMany();
      await prisma.transaction.deleteMany();
      await prisma.account.deleteMany();
      await prisma.category.deleteMany();
      await prisma.user.deleteMany();
      await prisma.tenant.deleteMany();
    }

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        id: 'tenant-1',
        name: 'Tenant Principal',
        slug: 'principal',
      },
    });

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        id: 'user-1',
        name: 'Usuário Teste',
        email: 'teste@exemplo.com',
        tenant_id: tenant.id,
      },
    });

    // Criar categorias
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          id: 'cat-alimentacao',
          name: 'Alimentação',
          type: 'EXPENSE',
        },
      }),
      prisma.category.create({
        data: {
          id: 'cat-salario',
          name: 'Salário',
          type: 'INCOME',
        },
      }),
      prisma.category.create({
        data: {
          id: 'cat-transporte',
          name: 'Transporte',
          type: 'EXPENSE',
        },
      }),
      prisma.category.create({
        data: {
          id: 'cat-freelance',
          name: 'Freelance',
          type: 'INCOME',
        },
      }),
      prisma.category.create({
        data: {
          id: 'cat-lazer',
          name: 'Lazer',
          type: 'EXPENSE',
        },
      }),
    ]);

    // Criar contas
    const accounts = await Promise.all([
      prisma.account.create({
        data: {
          id: 'acc-corrente',
          name: 'Conta Corrente',
          type: 'checking',
          tenant_id: tenant.id,
        },
      }),
      prisma.account.create({
        data: {
          id: 'acc-poupanca',
          name: 'Poupança',
          type: 'savings',
          tenant_id: tenant.id,
        },
      }),
      prisma.account.create({
        data: {
          id: 'acc-cartao',
          name: 'Cartão de Crédito',
          type: 'credit',
          tenant_id: tenant.id,
        },
      }),
    ]);

    // Criar transações dos últimos 6 meses
    const transactions = [];
    const now = new Date();

    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const currentMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1);
      
      // Receitas do mês
      const salaryDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 5);
      const freelanceDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15);
      
      // Salário
      const salaryTransaction = await prisma.transaction.create({
        data: {
          id: `trans-salario-${monthOffset}`,
          description: `Salário ${currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          date: salaryDate,
          status: 'COMPLETED',
          created_by: user.id,
          tenant_id: tenant.id,
          entries: {
            create: [
              {
                id: `entry-salario-${monthOffset}`,
                account_id: accounts[0].id, // Conta corrente
                category_id: categories[1].id, // Salário
                credit: 5000,
                debit: 0,
                description: 'Salário mensal',
              },
            ],
          },
        },
      });
      
      // Freelance (valor variável)
      const freelanceAmount = Math.random() * 2000 + 800; // Entre 800 e 2800
      const freelanceTransaction = await prisma.transaction.create({
        data: {
          id: `trans-freelance-${monthOffset}`,
          description: `Trabalho Freelance ${currentMonth.toLocaleDateString('pt-BR', { month: 'long' })}`,
          date: freelanceDate,
          status: 'COMPLETED',
          created_by: user.id,
          tenant_id: tenant.id,
          entries: {
            create: [
              {
                id: `entry-freelance-${monthOffset}`,
                account_id: accounts[0].id,
                category_id: categories[3].id, // Freelance
                credit: Math.round(freelanceAmount),
                debit: 0,
                description: 'Trabalho freelance',
              },
            ],
          },
        },
      });

      // Despesas do mês (várias ao longo do mês)
      const expenseCount = Math.floor(Math.random() * 15) + 10; // Entre 10 e 25 despesas
      for (let i = 0; i < expenseCount; i++) {
        const expenseDate = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          Math.floor(Math.random() * 28) + 1
        );

        const categoryOptions = [
          { category: categories[0], minAmount: 20, maxAmount: 150 }, // Alimentação
          { category: categories[2], minAmount: 15, maxAmount: 80 },  // Transporte
          { category: categories[4], minAmount: 50, maxAmount: 300 }, // Lazer
        ];

        const selectedCategory = categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
        const amount = Math.random() * (selectedCategory.maxAmount - selectedCategory.minAmount) + selectedCategory.minAmount;

        await prisma.transaction.create({
          data: {
            id: `trans-expense-${monthOffset}-${i}`,
            description: `${selectedCategory.category.name} - ${expenseDate.toLocaleDateString('pt-BR')}`,
            date: expenseDate,
            status: 'COMPLETED',
            created_by: user.id,
            tenant_id: tenant.id,
            entries: {
              create: [
                {
                  id: `entry-expense-${monthOffset}-${i}`,
                  account_id: Math.random() > 0.3 ? accounts[0].id : accounts[2].id, // 70% conta corrente, 30% cartão
                  category_id: selectedCategory.category.id,
                  credit: 0,
                  debit: Math.round(amount),
                  description: `Gasto com ${selectedCategory.category.name.toLowerCase()}`,
                },
              ],
            },
          },
        });
      }

      transactions.push(salaryTransaction, freelanceTransaction);
    }

    // Contar dados criados
    const finalCounts = {
      tenants: await prisma.tenant.count(),
      users: await prisma.user.count(),
      accounts: await prisma.account.count(),
      categories: await prisma.category.count(),
      transactions: await prisma.transaction.count(),
      entries: await prisma.entries.count(),
    };

    return NextResponse.json({
      success: true,
      message: 'Dados de exemplo criados com sucesso!',
      data: finalCounts,
    });

  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Verificar estado atual dos dados
    const counts = {
      tenants: await prisma.tenant.count(),
      users: await prisma.user.count(),
      accounts: await prisma.account.count(),
      categories: await prisma.category.count(),
      transactions: await prisma.transaction.count(),
      entries: await prisma.entries.count(),
    };

    return NextResponse.json({
      success: true,
      message: 'Estado atual do banco de dados',
      data: counts,
    });
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}