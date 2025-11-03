/**
 * 🚀 Optimized Categories API
 * Uses performance optimizations and real-time updates
 */

import { NextRequest } from 'next/server';
import { OptimizedApiBase } from '@/lib/performance/optimized-api-base';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
export const dynamic = 'force-dynamic';

// Validation schema
const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  type: z.enum(['income', 'expense']),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateCategorySchema = createCategorySchema.partial();

// Create optimized API instance
const api = new OptimizedApiBase({
  entity: 'categories',
  requireAuth: true,
  cacheEnabled: true,
  enableOptimisticUpdates: true,
  enableBackgroundSync: true
});

// Fetch categories from database
async function fetchCategories(userId: string) {
  const categories = await prisma.category.findMany({
    where: { userId },
    include: {
      parent: {
        select: { id: true, name: true }
      },
      children: {
        select: { id: true, name: true }
      },
      _count: {
        select: { transactions: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return categories.map(category => ({
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    description: category.description,
    parentId: category.parentId,
    parent: category.parent,
    children: category.children,
    transactionCount: category._count.transactions,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  }));
}

// Create category in database
async function createCategory(userId: string, data: z.infer<typeof createCategorySchema>) {
  // Validate parent category if provided
  if (data.parentId) {
    const parentCategory = await prisma.category.findFirst({
      where: {
        id: data.parentId,
        userId
      }
    });

    if (!parentCategory) {
      throw new Error('Parent category not found');
    }

    if (parentCategory.type !== data.type) {
      throw new Error('Parent category must have the same type');
    }
  }

  const newCategory = await prisma.category.create({
    data: {
      ...data,
      userId,
    },
    include: {
      parent: {
        select: { id: true, name: true }
      },
      children: {
        select: { id: true, name: true }
      },
      _count: {
        select: { transactions: true }
      }
    }
  });

  return {
    id: newCategory.id,
    name: newCategory.name,
    type: newCategory.type,
    color: newCategory.color,
    icon: newCategory.icon,
    description: newCategory.description,
    parentId: newCategory.parentId,
    parent: newCategory.parent,
    children: newCategory.children,
    transactionCount: newCategory._count.transactions,
    isActive: newCategory.isActive,
    createdAt: newCategory.createdAt,
    updatedAt: newCategory.updatedAt,
  };
}

// Update category in database
async function updateCategory(userId: string, id: string, data: z.infer<typeof updateCategorySchema>) {
  // Validate parent category if provided
  if (data.parentId) {
    const parentCategory = await prisma.category.findFirst({
      where: {
        id: data.parentId,
        userId
      }
    });

    if (!parentCategory) {
      throw new Error('Parent category not found');
    }

    if (data.type && parentCategory.type !== data.type) {
      throw new Error('Parent category must have the same type');
    }
  }

  const updatedCategory = await prisma.category.update({
    where: {
      id,
      userId
    },
    data,
    include: {
      parent: {
        select: { id: true, name: true }
      },
      children: {
        select: { id: true, name: true }
      },
      _count: {
        select: { transactions: true }
      }
    }
  });

  return {
    id: updatedCategory.id,
    name: updatedCategory.name,
    type: updatedCategory.type,
    color: updatedCategory.color,
    icon: updatedCategory.icon,
    description: updatedCategory.description,
    parentId: updatedCategory.parentId,
    parent: updatedCategory.parent,
    children: updatedCategory.children,
    transactionCount: updatedCategory._count.transactions,
    isActive: updatedCategory.isActive,
    createdAt: updatedCategory.createdAt,
    updatedAt: updatedCategory.updatedAt,
  };
}

// Delete category from database
async function deleteCategory(userId: string, id: string) {
  // Check if category has transactions
  const transactionCount = await prisma.transaction.count({
    where: {
      categoryId: id,
      userId
    }
  });

  if (transactionCount > 0) {
    throw new Error('Cannot delete category with existing transactions');
  }

  // Check if category has children
  const childrenCount = await prisma.category.count({
    where: {
      parentId: id,
      userId
    }
  });

  if (childrenCount > 0) {
    throw new Error('Cannot delete category with subcategories');
  }

  await prisma.category.delete({
    where: {
      id,
      userId
    }
  });
}

// Use optimized handlers
export const GET = api.createGetHandler(fetchCategories);
export const POST = api.createPostHandler(
  createCategorySchema,
  createCategory,
  '/api/categories/optimized'
);

// Individual category handlers
export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (id && id !== 'optimized') {
    const handler = api.createPutHandler(
      updateCategorySchema,
      updateCategory,
      '/api/categories/optimized'
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
      deleteCategory,
      '/api/categories/optimized'
    );
    return handler(request, { params: { id } });
  }

  return api.errorResponse('Invalid request', 400);
}
