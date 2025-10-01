import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Primeiro, limpar e popular dados
    console.log('🗑️ Limpando dados existentes...');
    const seedResponse = await fetch('http://localhost:3000/api/seed-current', {
      method: 'POST',
    });
    
    if (!seedResponse.ok) {
      throw new Error('Erro ao popular dados');
    }
    
    const seedResult = await seedResponse.json();
    console.log('✅ Dados populados:', seedResult);

    // 2. Aguardar um momento para garantir consistência
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Testar as APIs corrigidas
    console.log('🧪 Testando APIs corrigidas...');
    
    const [accountsRes, incomeRes, expenseRes, cashFlowRes] = await Promise.all([
      fetch('http://localhost:3000/api/accounts/summary'),
      fetch('http://localhost:3000/api/transactions/summary?year=2025&month=9&type=income'),
      fetch('http://localhost:3000/api/transactions/summary?year=2025&month=9&type=expense'),
      fetch('http://localhost:3000/api/reports/cash-flow?startDate=2025-03-01&endDate=2025-09-30')
    ]);

    const accountsData = await accountsRes.json();
    const incomeData = await incomeRes.json();
    const expenseData = await expenseRes.json();
    const cashFlowData = await cashFlowRes.json();

    // 4. Calcular valores esperados
    const expectedValues = {
      totalIncome: 10500, // 8000 (salário) + 2500 (freelance)
      totalExpenses: 2945, // Soma das despesas criadas
      netFlow: 10500 - 2945,
      // Saldos das contas após as transações
      expectedAccountBalances: {
        'Conta Corrente': 10500 - 3000 - 2000 - (2945 - 800), // Receitas - transferência - investimento - despesas (exceto cartão)
        'Poupança': 3000, // Transferência recebida
        'Investimentos': 2000, // Aporte recebido
        'Cartão de Crédito': -800, // Compra no cartão
      }
    };

    // 5. Validar resultados
    const results = {
      seedData: seedResult,
      apiResults: {
        accounts: accountsData,
        income: incomeData,
        expense: expenseData,
        cashFlow: cashFlowData,
      },
      expectedValues,
      validations: {
        incomeCorrect: incomeData.data?.total === expectedValues.totalIncome,
        expenseCorrect: Math.abs(expenseData.data?.total - expectedValues.totalExpenses) < 100, // Margem de erro
        balanceCalculated: accountsData.success,
        cashFlowWorking: cashFlowData.success,
      },
      summary: {
        totalPatrimonio: accountsData.data?.totalBalance || 0,
        receitaSeptember: incomeData.data?.total || 0,
        despesaSeptember: expenseData.data?.total || 0,
        saldoLiquido: (incomeData.data?.total || 0) - Math.abs(expenseData.data?.total || 0),
        cashFlowMonths: cashFlowData.data?.monthlyData?.length || 0,
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Teste de correções concluído!',
      results,
    });

  } catch (error) {
    console.error('Erro no teste de correções:', error);
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