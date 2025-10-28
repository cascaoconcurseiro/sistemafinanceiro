import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success || !auth.userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const scheduled = await prisma.scheduledTransaction.findMany({
    where: {
      account: { userId: auth.userId },
      status: 'PENDING'
    },
    include: { account: true },
    orderBy: { scheduledDate: 'asc' }
  });

  return NextResponse.json({ success: true, scheduled });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success || !auth.userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();

  const scheduled = await prisma.scheduledTransaction.create({
    data: {
      description: body.description,
      amount: body.amount,
      type: body.type,
      category: body.category,
      accountId: body.accountId,
      scheduledDate: new Date(body.scheduledDate),
      status: 'PENDING'
    }
  });

  return NextResponse.json({ success: true, scheduled });
}

export const dynamic = 'force-dynamic';
