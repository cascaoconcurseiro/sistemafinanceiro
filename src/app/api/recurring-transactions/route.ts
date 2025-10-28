import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success || !auth.userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const templates = await prisma.recurringTransactionTemplate.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ success: true, templates });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success || !auth.userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { transactionData, frequency, startDate, endDate, occurrences } = body;

  const template = await prisma.recurringTransactionTemplate.create({
    data: {
      userId: auth.userId,
      templateData: JSON.stringify(transactionData),
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      occurrences,
      nextGeneration: new Date(startDate),
      isActive: true
    }
  });

  return NextResponse.json({ success: true, template });
}

export const dynamic = 'force-dynamic';
