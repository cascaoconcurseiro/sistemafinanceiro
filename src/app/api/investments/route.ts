import { NextRequest, NextResponse } from 'next/server';
import { investmentService } from '@/lib/services/investment-service';
import { CreateInvestmentDTO } from '@/types/investment';

// GET - Listar investimentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    const investments = await investmentService.findByUserId(userId);
    
    return NextResponse.json(investments);
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investments' },
      { status: 500 }
    );
  }
}

// POST - Criar investimento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const data: CreateInvestmentDTO = {
      userId: body.userId,
      ticker: body.ticker,
      name: body.name,
      type: body.type,
      category: body.category,
      quantity: body.quantity,
      averagePrice: body.averagePrice,
      purchaseDate: new Date(body.purchaseDate),
      broker: body.broker,
      brokerageFee: body.brokerageFee,
      otherFees: body.otherFees,
      notes: body.notes,
      createTransaction: body.createTransaction,
      accountId: body.accountId,
      interestRate: body.interestRate,
      indexer: body.indexer,
      maturityDate: body.maturityDate ? new Date(body.maturityDate) : undefined,
      liquidity: body.liquidity,
    };
    
    const investment = await investmentService.create(data);
    
    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    console.error('Error creating investment:', error);
    return NextResponse.json(
      { error: 'Failed to create investment' },
      { status: 500 }
    );
  }
}
