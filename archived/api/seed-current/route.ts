import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Limpar dados existentes
    await prisma.entries.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

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
      prisma.account.create({
        data: {
          id: 'acc-investimentos',
          name: 'Conta Investimentos',
          type: 'investment',
          tenant_id: tenant.id,
        },
      }),
    ]);

    // Criar transações APENAS para setembro de 2025 (mês atual)
    const now = new Date();
    const currentYear = 2025; // Fixar em 2025 para consistência
    const currentMonth = 8; // setembro = 8 (0-based)

    // Salário de setembro - dia 5
    const salaryDate = new Date(currentYear, currentMonth, 5);
    await prisma.transaction.create({
      data: {
        id: 'trans-salario-set',
        description: 'Salário Setembro 2025',
        date: salaryDate,
        status: 'COMPLETED',
        created_by: user.id,
        tenant_id: tenant.id,
        entries: {
          create: [
            {
              id: 'entry-salario-set',
              account_id: accounts[0].id, // Conta corrente
              category_id: categories[1].id, // Salário
              credit: 8000,
              debit: 0,
              description: 'Salário mensal',
            },
          ],
        },
      },
    });

    // Freelance de setembro - dia 15
    const freelanceDate = new Date(currentYear, currentMonth, 15);
    await prisma.transaction.create({
      data: {
        id: 'trans-freelance-set',
        description: 'Trabalho Freelance Setembro',
        date: freelanceDate,
        status: 'COMPLETED',
        created_by: user.id,
        tenant_id: tenant.id,
        entries: {
          create: [
            {
              id: 'entry-freelance-set',
              account_id: accounts[0].id,
              category_id: categories[3].id, // Freelance
              credit: 2500,
              debit: 0,
              description: 'Trabalho freelance',
            },
          ],
        },
      },
    });

    // Transferência para poupança - dia 10
    const transferDate = new Date(currentYear, currentMonth, 10);
    await prisma.transaction.create({
      data: {
        id: 'trans-transfer-poupanca',
        description: 'Transferência para Poupança',
        date: transferDate,
        status: 'COMPLETED',
        created_by: user.id,
        tenant_id: tenant.id,
        entries: {
          create: [
            // Saída da conta corrente
            {
              id: 'entry-transfer-out',
              account_id: accounts[0].id,
              category_id: categories[1].id, // Usando categoria salário como transferência
              credit: 0,
              debit: 3000,
              description: 'Transferência para poupança',
            },
            // Entrada na poupança
            {
              id: 'entry-transfer-in',
              account_id: accounts[1].id,
              category_id: categories[1].id,
              credit: 3000,
              debit: 0,
              description: 'Transferência da conta corrente',
            },
          ],
        },
      },
    });

    // Investimento - dia 16
    const investmentDate = new Date(currentYear, currentMonth, 16);
    await prisma.transaction.create({
      data: {
        id: 'trans-investimento',
        description: 'Aporte em Investimentos',
        date: investmentDate,
        status: 'COMPLETED',
        created_by: user.id,
        tenant_id: tenant.id,
        entries: {
          create: [
            // Saída da conta corrente
            {
              id: 'entry-invest-out',
              account_id: accounts[0].id,
              category_id: categories[1].id,
              credit: 0,
              debit: 2000,
              description: 'Aporte investimentos',
            },
            // Entrada nos investimentos
            {
              id: 'entry-invest-in',
              account_id: accounts[3].id,
              category_id: categories[1].id,
              credit: 2000,
              debit: 0,
              description: 'Aporte recebido',
            },
          ],
        },
      },
    });

    // Despesas de setembro (espalhadas ao longo do mês) - valores mais realistas
    const expenses = [
      { day: 2, amount: 350, category: 0, description: 'Supermercado' },
      { day: 3, amount: 45, category: 2, description: 'Uber' },
      { day: 5, amount: 120, category: 0, description: 'Restaurante' },
      { day: 7, amount: 150, category: 4, description: 'Cinema e jantar' },
      { day: 9, amount: 280, category: 0, description: 'Supermercado' },
      { day: 12, amount: 80, category: 2, description: 'Combustível' },
      { day: 14, amount: 65, category: 0, description: 'Delivery' },
      { day: 16, amount: 400, category: 4, description: 'Compras shopping' },
      { day: 18, amount: 95, category: 0, description: 'Farmácia' },
      { day: 20, amount: 180, category: 4, description: 'Show' },
      { day: 21, amount: 800, category: 0, description: 'Compras do mês', account: 2 }, // Cartão
      { day: 25, amount: 150, category: 2, description: 'Manutenção carro' },
      { day: 28, amount: 200, category: 4, description: 'Jantar especial' },
    ];

    for (let i = 0; i < expenses.length; i++) {
      const expense = expenses[i];
      const expenseDate = new Date(currentYear, currentMonth, expense.day);
      
      await prisma.transaction.create({
        data: {
          id: `trans-expense-set-${i}`,
          description: expense.description,
          date: expenseDate,
          status: 'COMPLETED',
          created_by: user.id,
          tenant_id: tenant.id,
          entries: {
            create: [
              {
                id: `entry-expense-set-${i}`,
                account_id: accounts[expense.account || 0].id, // Conta corrente por padrão, ou cartão
                category_id: categories[expense.category].id,
                credit: 0,
                debit: expense.amount,
                description: `Gasto: ${expense.description}`,
              },
            ],
          },
        },
      });
    }

    // Adicionar dados históricos dos últimos 6 meses (para cash flow)
    for (let monthOffset = 1; monthOffset <= 5; monthOffset++) {
      const monthDate = new Date(currentYear, currentMonth - monthOffset, 5);
      const monthStr = monthDate.toISOString().substring(0, 7);
      
      // Receita do mês (mais consistente)
      const monthlyIncome = monthOffset <= 2 ? 7500 : 6500; // Valores mais consistentes
      await prisma.transaction.create({
        data: {
          id: `trans-hist-income-${monthOffset}`,
          description: `Salário ${monthStr}`,
          date: monthDate,
          status: 'COMPLETED',
          created_by: user.id,
          tenant_id: tenant.id,
          entries: {
            create: [
              {
                id: `entry-hist-income-${monthOffset}`,
                account_id: accounts[0].id,
                category_id: categories[1].id,
                credit: monthlyIncome,
                debit: 0,
                description: 'Salário mensal',
              },
            ],
          },
        },
      });

      // Despesas do mês (mais realistas)
      const monthlyExpenses = monthOffset <= 2 ? 4200 : 3800; // Gastos consistentes
      await prisma.transaction.create({
        data: {
          id: `trans-hist-expense-${monthOffset}`,
          description: `Despesas Gerais ${monthStr}`,
          date: new Date(monthDate.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 dias depois
          status: 'COMPLETED',
          created_by: user.id,
          tenant_id: tenant.id,
          entries: {
            create: [
              {
                id: `entry-hist-expense-${monthOffset}`,
                account_id: accounts[0].id,
                category_id: categories[0].id,
                credit: 0,
                debit: monthlyExpenses,
                description: 'Despesas mensais',
              },
            ],
          },
        },
      });
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
      message: 'Dados atuais criados com sucesso!',
      data: {
        ...finalCounts,
        currentMonth: currentMonth + 1,
        currentYear,
        note: 'Dados criados para setembro de 2025 + histórico dos últimos 6 meses'
      },
    });

  } catch (error) {
    console.error('Erro ao criar dados atuais:', error);
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