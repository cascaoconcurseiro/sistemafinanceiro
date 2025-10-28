import { NextRequest, NextResponse } from 'next/server';
import { investmentService } from '@/lib/services/investment-service';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;
    
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'updates array is required' },
        { status: 400 }
      );
    }
    
    const results = await investmentService.updateMultiplePrices(updates);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating prices:', error);
    return NextResponse.json(
      { error: 'Failed to update prices' },
      { status: 500 }
    );
  }
}
