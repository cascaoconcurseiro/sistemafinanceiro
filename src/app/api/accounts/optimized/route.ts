/**
 * 🚀 Optimized Accounts API
 * Uses performance optimizations and real-time updates
 */

import { NextRequest } from 'next/server';
import { OptimizedApiBase } from '@/lib/performance/optimized-api-base';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const createAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  type: z.enum(['checking', 'savings', 'investment', 'credit']),
  balance: z.number().default(0),
  currency: z.string().default('BRL'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateAccountSchema = createAccountSchema.partial();

// Create optimized API instance
const api = new OptimizedApiBase({
  entity: 'accounts',
  requireAuth: true,
  cacheEnabled: true,
  enableOptimisticUpdates: true,
  enableBackgroundSync: true
});

// Fetch accounts from database
async function fetchAccounts(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    include: {
      _count: {
        select: { transactions: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return accounts.map(account => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balance: Number(account.balance),
    currency: account.currency,
    description: account.description,
    isActive: account.isActive,
    transactionCount: account._count.transactions,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }));
}

// Create account in database
async function createAccount(userId: string, data: z.infer<typeof createAccountSchema>) {
  const newAccount = await prisma.account.create({
    data: {
      ...data,
      userId,
      balance: data.balance || 0,
    },
    include: {
      _count: {
        select: { transactions: true }
      }
    }
  });

  return {
    id: newAccount.id,
    name: newAccount.name,
    type: newAccount.type,
    balance: Number(newAccount.balance),
    currency: newAccount.currency,
    description: newAccount.description,
    isActive: newAccount.isActive,
    transactionCount: newAccount._count.transactions,
    createdAt: newAccount.createdAt,
    updatedAt: newAccount.updatedAt,
  };
}

// Update account in database
async function updateAccount(userId: string, id: string, data: z.infer<typeof updateAccountSchema>) {
  const updatedAccount = await prisma.account.update({
    where: {
      id,
      userId
    },
    data,
    include: {
      _count: {
        select: { transactions: true }
      }
    }
  });

  return {
    id: updatedAccount.id,
    name: updatedAccount.name,
    type: updatedAccount.type,
    balance: Number(updatedAccount.balance),
    currency: updatedAccount.currency,
    description: updatedAccount.description,
    isActive: updatedAccount.isActive,
    transactionCount: updatedAccount._count.transactions,
    createdAt: updatedAccount.createdAt,
    updatedAt: updatedAccount.updatedAt,
  };
}

// Delete account from database
async function deleteAccount(userId: string, id: string) {
  // Check if account has transactions
  const transactionCount = await prisma.transaction.count({
    where: {
      accountId: id,
      userId
    }
  });

  if (transactionCount > 0) {
    throw new Error('Cannot delete account with existing transactions');
  }

  await prisma.account.delete({
    where: {
      id,
      userId
    }
  });
}

// Use optimized handlers
export const GET = api.createGetHandler(fetchAccounts);
export const POST = api.createPostHandler(
  createAccountSchema,
  createAccount,
  '/api/accounts/optimized'
);

// Individual account handlers would go in [id]/route.ts
// For now, we'll handle them here for simplicity
export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (id && id !== 'optimized') {
    const handler = api.createPutHandler(
      updateAccountSchema,
      updateAccount,
      '/api/accounts/optimized'
    );
    return handler(request, { params: { id } });
  }

  return api.errorResponse('Invalid request', 400);
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (id && id !== 'optimized') {
    const handler = api.createDeleteHandler(
      deleteAccount,
      '/api/accounts/optimized'
    );
    return handler(request, { params: { id } });
  }

  return api.errorResponse('Invalid request', 400);
}
