import { NextRequest, NextResponse } from 'next/server';
import { investmentService } from '@/lib/services/investment-service';
import { CreateDividendDTO } from '@/types/investment';

// GET - Listar dividendos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const investmentId = searchParams.get('investmentId');
    const year = searchParams.get('year');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    let dividends;
    
    if (investmentId) {
      dividends = await investmentService.getDividendsByInvestment(investmentId);
    } else {
      dividends = await investmentService.getDividendsByUser(
        userId,
        year ? parseInt(year) : undefined
      );
    }
    
    return NextResponse.json(dividends);
  } catch (error) {
    console.error('Error fetching dividends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dividends' },
      { status: 500 }
    );
  }
}

// POST - Criar dividendo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const data: CreateDividendDTO = {
      investmentId: body.investmentId,
      userId: body.userId,
      type: body.type,
      grossAmount: body.grossAmount,
      taxAmount: body.taxAmount || 0,
      paymentDate: new Date(body.paymentDate),
      exDate: body.exDate ? new Date(body.exDate) : undefined,
      description: body.description,
      notes: body.notes,
      createTransaction: body.createTransaction,
      accountId: body.accountId,
    };
    
    const dividend = await investmentService.createDividend(data);
    
    return NextResponse.json(dividend, { status: 201 });
  } catch (error) {
    console.error('Error creating dividend:', error);
    return NextResponse.json(
      { error: 'Failed to create dividend' },
      { status: 500 }
    );
  }
}
