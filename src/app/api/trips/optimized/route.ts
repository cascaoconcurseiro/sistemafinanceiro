/**
 * 🚀 Optimized Trips API
 * Uses performance optimizations and real-time updates
 */

import { NextRequest } from 'next/server';
import { OptimizedApiBase } from '@/lib/performance/optimized-api-base';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const createTripSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  destination: z.string().min(1, 'Destino é obrigatório').max(200),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de fim é obrigatória'),
  budget: z.number().positive().optional(),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'cancelled']).default('planning'),
  isShared: z.boolean().default(false),
  sharedWith: z.array(z.string()).optional(),
});

const updateTripSchema = createTripSchema.partial();

// Create optimized API instance
const api = new OptimizedApiBase({
  entity: 'trips',
  requireAuth: true,
  cacheEnabled: true,
  enableOptimisticUpdates: true,
  enableBackgroundSync: true
});

// Fetch trips from database
async function fetchTrips(userId: string) {
  const trips = await prisma.trip.findMany({
    where: { userId },
    include: {
      transactions: {
        select: {
          id: true,
          description: true,
          amount: true,
          type: true,
          date: true,
          categoryId: true
        },
        orderBy: { date: 'desc' }
      },
      _count: {
        select: { transactions: true }
      }
    },
    orderBy: { startDate: 'desc' }
  });

  return trips.map(trip => {
    const totalSpent = trip.transactions.reduce((sum, t) => {
      return t.type === 'expense' ? sum + Number(t.amount) : sum;
    }, 0);

    const totalIncome = trip.transactions.reduce((sum, t) => {
      return t.type === 'income' ? sum + Number(t.amount) : sum;
    }, 0);

    return {
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget ? Number(trip.budget) : null,
      description: trip.description,
      status: trip.status,
      isShared: trip.isShared,
      sharedWith: trip.sharedWith ? JSON.parse(trip.sharedWith) : [],
      transactions: trip.transactions.map(t => ({
        ...t,
        amount: Number(t.amount)
      })),
      transactionCount: trip._count.transactions,
      totalSpent,
      totalIncome,
      remainingBudget: trip.budget ? Number(trip.budget) - totalSpent : null,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  });
}

// Create trip in database
async function createTrip(userId: string, data: z.infer<typeof createTripSchema>) {
  // Validate dates
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (endDate <= startDate) {
    throw new Error('End date must be after start date');
  }

  const newTrip = await prisma.trip.create({
    data: {
      ...data,
      userId,
      startDate,
      endDate,
      sharedWith: data.sharedWith ? JSON.stringify(data.sharedWith) : null,
    },
    include: {
      transactions: {
        select: {
          id: true,
          description: true,
          amount: true,
          type: true,
          date: true,
          categoryId: true
        }
      },
      _count: {
        select: { transactions: true }
      }
    }
  });

  return {
    id: newTrip.id,
    name: newTrip.name,
    destination: newTrip.destination,
    startDate: newTrip.startDate,
    endDate: newTrip.endDate,
    budget: newTrip.budget ? Number(newTrip.budget) : null,
    description: newTrip.description,
    status: newTrip.status,
    isShared: newTrip.isShared,
    sharedWith: newTrip.sharedWith ? JSON.parse(newTrip.sharedWith) : [],
    transactions: newTrip.transactions.map(t => ({
      ...t,
      amount: Number(t.amount)
    })),
    transactionCount: newTrip._count.transactions,
    totalSpent: 0,
    totalIncome: 0,
    remainingBudget: newTrip.budget ? Number(newTrip.budget) : null,
    createdAt: newTrip.createdAt,
    updatedAt: newTrip.updatedAt,
  };
}

// Update trip in database
async function updateTrip(userId: string, id: string, data: z.infer<typeof updateTripSchema>) {
  // Validate dates if provided
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }
  }

  const updateData: any = { ...data };

  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);
  if (data.sharedWith) updateData.sharedWith = JSON.stringify(data.sharedWith);

  const updatedTrip = await prisma.trip.update({
    where: {
      id,
      userId
    },
    data: updateData,
    include: {
      transactions: {
        select: {
          id: true,
          description: true,
          amount: true,
          type: true,
          date: true,
          categoryId: true
        }
      },
      _count: {
        select: { transactions: true }
      }
    }
  });

  const totalSpent = updatedTrip.transactions.reduce((sum, t) => {
    return t.type === 'expense' ? sum + Number(t.amount) : sum;
  }, 0);

  const totalIncome = updatedTrip.transactions.reduce((sum, t) => {
    return t.type === 'income' ? sum + Number(t.amount) : sum;
  }, 0);

  return {
    id: updatedTrip.id,
    name: updatedTrip.name,
    destination: updatedTrip.destination,
    startDate: updatedTrip.startDate,
    endDate: updatedTrip.endDate,
    budget: updatedTrip.budget ? Number(updatedTrip.budget) : null,
    description: updatedTrip.description,
    status: updatedTrip.status,
    isShared: updatedTrip.isShared,
    sharedWith: updatedTrip.sharedWith ? JSON.parse(updatedTrip.sharedWith) : [],
    transactions: updatedTrip.transactions.map(t => ({
      ...t,
      amount: Number(t.amount)
    })),
    transactionCount: updatedTrip._count.transactions,
    totalSpent,
    totalIncome,
    remainingBudget: updatedTrip.budget ? Number(updatedTrip.budget) - totalSpent : null,
    createdAt: updatedTrip.createdAt,
    updatedAt: updatedTrip.updatedAt,
  };
}

// Delete trip from database
async function deleteTrip(userId: string, id: string) {
  // Check if trip has transactions
  const transactionCount = await prisma.transaction.count({
    where: {
      tripId: id,
      userId
    }
  });

  if (transactionCount > 0) {
    throw new Error('Cannot delete trip with existing transactions');
  }

  await prisma.trip.delete({
    where: {
      id,
      userId
    }
  });
}

// Use optimized handlers
export const GET = api.createGetHandler(fetchTrips);
export const POST = api.createPostHandler(
  createTripSchema,
  createTrip,
  '/api/trips/optimized'
);

// Individual trip handlers
export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (id && id !== 'optimized') {
    const handler = api.createPutHandler(
      updateTripSchema,
      updateTrip,
      '/api/trips/optimized'
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
      deleteTrip,
      '/api/trips/optimized'
    );
    return handler(request, { params: { id } });
  }

  return api.errorResponse('Invalid request', 400);
}
