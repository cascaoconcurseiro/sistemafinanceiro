import { NextRequest, NextResponse } from 'next/server';
import { investmentService } from '@/lib/services/investment-service';
import { UpdateInvestmentDTO } from '@/types/investment';

// GET - Buscar investimento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const investment = await investmentService.findById(params.id);
    
    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(investment);
  } catch (error) {
    console.error('Error fetching investment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investment' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar investimento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const data: UpdateInvestmentDTO = {
      ticker: body.ticker,
      name: body.name,
      quantity: body.quantity,
      averagePrice: body.averagePrice,
      currentPrice: body.currentPrice,
      broker: body.broker,
      notes: body.notes,
      status: body.status,
      interestRate: body.interestRate,
      indexer: body.indexer,
      maturityDate: body.maturityDate ? new Date(body.maturityDate) : undefined,
      liquidity: body.liquidity,
    };
    
    const investment = await investmentService.update(params.id, data);
    
    return NextResponse.json(investment);
  } catch (error) {
    console.error('Error updating investment:', error);
    return NextResponse.json(
      { error: 'Failed to update investment' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar investimento (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await investmentService.delete(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting investment:', error);
    return NextResponse.json(
      { error: 'Failed to delete investment' },
      { status: 500 }
    );
  }
}
