/**
 * TESTES DE INTEGRAÇÃO: Transactions API
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/transactions/route';

// Mock do Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    journalEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      transaction: {
        create: jest.fn().mockResolvedValue({
          id: 'tx-1',
          description: 'Teste',
          amount: -100,
          type: 'DESPESA',
          date: new Date(),
          userId: 'user-1',
          accountId: 'account-1',
          categoryId: 'category-1',
        }),
      },
      journalEntry: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([
          { entryType: 'DEBITO', amount: 100 },
          { entryType: 'CREDITO', amount: 100 },
        ]),
      },
      account: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'account-1',
          balance: 1000,
          allowNegativeBalance: false,
        }),
        update: jest.fn(),
      },
      category: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'category-1',
          name: 'Alimentação',
          type: 'DESPESA',
          isActive: true,
        }),
      },
    })),
  },
}));

// Mock de autenticação
jest.mock('@/lib/utils/auth-helpers', () => ({
  authenticateRequest: jest.fn().mockResolvedValue({
    success: true,
    userId: 'user-1',
  }),
}));

describe('POST /api/transactions', () => {
  it('deve criar transação com sucesso', async () => {
    const request = new NextRequest('http://localhost:3000/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Almoço',
        amount: -100,
        type: 'DESPESA',
        date: new Date().toISOString(),
        categoryId: 'category-1',
        accountId: 'account-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.transaction).toBeDefined();
  });

  it('deve rejeitar transação sem categoria', async () => {
    const request = new NextRequest('http://localhost:3000/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Teste',
        amount: -100,
        type: 'DESPESA',
        date: new Date().toISOString(),
        accountId: 'account-1',
        // categoryId ausente
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});

describe('GET /api/transactions', () => {
  it('deve listar transações com paginação', async () => {
    const { prisma } = require('@/lib/prisma');
    
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 'tx-1',
        description: 'Teste 1',
        amount: -100,
        type: 'DESPESA',
        date: new Date(),
      },
    ]);
    
    prisma.transaction.count.mockResolvedValue(1);

    const request = new NextRequest('http://localhost:3000/api/transactions?page=1&limit=10');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.transactions).toHaveLength(1);
    expect(data.pagination).toBeDefined();
  });
});
