import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
  console.log('🧪 [Billing Test] API chamada!');
  }
  
  return NextResponse.json({
    success: true,
    message: 'API de teste funcionando!',
    timestamp: new Date().toISOString(),
  });
}
