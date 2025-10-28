/**
 * Otimizador de Queries
 * Previne problemas N+1 e otimiza queries do Prisma
 */

import { Prisma } from '@prisma/client';

/**
 * Includes otimizados para transações
 * Carrega todas as relações de uma vez
 */
export const transactionIncludes = {
  full: {
    account: true,
    categoryRef: true,
    creditCard: true,
    trip: true,
    goal: true,
    investment: true,
    budget: true,
    invoice: true,
  },
  
  basic: {
    account: {
      select: {
        id: true,
        name: true,
        type: true,
      }
    },
    categoryRef: {
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
      }
    },
  },
  
  minimal: {
    account: {
      select: {
        id: true,
        name: true,
      }
    },
  }
} satisfies Record<string, Prisma.TransactionInclude>;

/**
 * Includes otimizados para viagens
 */
export const tripIncludes = {
  full: {
    user: true,
    transactions: {
      include: transactionIncludes.basic
    },
    itinerary: true,
    shoppingItems: true,
    currencyExchanges: true,
  },
  
  basic: {
    transactions: {
      select: {
        id: true,
        amount: true,
        description: true,
        date: true,
        isShared: true,
        myShare: true,
      }
    },
  }
} satisfies Record<string, Prisma.TripInclude>;

/**
 * Includes otimizados para cartões de crédito
 */
export const creditCardIncludes = {
  full: {
    user: true,
    transactions: {
      include: transactionIncludes.basic
    },
    invoices: {
      include: {
        transactions: true,
        payments: true,
      }
    },
  },
  
  basic: {
    invoices: {
      where: {
        isPaid: false
      },
      select: {
        id: true,
        month: true,
        year: true,
        totalAmount: true,
        dueDate: true,
      }
    },
  }
} satisfies Record<string, Prisma.CreditCardInclude>;

/**
 * Helper para buscar transações otimizadas
 */
export async function getOptimizedTransactions(
  prisma: any,
  where: Prisma.TransactionWhereInput,
  options?: {
    include?: keyof typeof transactionIncludes;
    orderBy?: Prisma.TransactionOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }
) {
  const includeLevel = options?.include || 'basic';
  
  return await prisma.transaction.findMany({
    where,
    include: transactionIncludes[includeLevel],
    orderBy: options?.orderBy || { date: 'desc' },
    take: options?.take,
    skip: options?.skip,
  });
}

/**
 * Helper para buscar viagens otimizadas
 */
export async function getOptimizedTrips(
  prisma: any,
  where: Prisma.TripWhereInput,
  options?: {
    include?: keyof typeof tripIncludes;
  }
) {
  const includeLevel = options?.include || 'basic';
  
  return await prisma.trip.findMany({
    where,
    include: tripIncludes[includeLevel],
    orderBy: { startDate: 'desc' },
  });
}

/**
 * Helper para buscar cartões otimizados
 */
export async function getOptimizedCreditCards(
  prisma: any,
  where: Prisma.CreditCardWhereInput,
  options?: {
    include?: keyof typeof creditCardIncludes;
  }
) {
  const includeLevel = options?.include || 'basic';
  
  return await prisma.creditCard.findMany({
    where,
    include: creditCardIncludes[includeLevel],
    orderBy: { name: 'asc' },
  });
}

/**
 * Batch loader para evitar N+1
 * Carrega múltiplas entidades de uma vez
 */
export class DataLoader<T> {
  private cache = new Map<string, T>();
  private queue: string[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(
    private loadFn: (ids: string[]) => Promise<T[]>,
    private getKey: (item: T) => string
  ) {}

  async load(id: string): Promise<T | null> {
    // Verificar cache
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // Adicionar à fila
    this.queue.push(id);

    // Agendar batch
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.executeBatch(), 10);
    }

    // Aguardar batch
    return new Promise((resolve) => {
      const checkCache = () => {
        if (this.cache.has(id)) {
          resolve(this.cache.get(id)!);
        } else {
          setTimeout(checkCache, 5);
        }
      };
      checkCache();
    });
  }

  private async executeBatch(): void {
    const ids = [...new Set(this.queue)];
    this.queue = [];
    this.batchTimeout = null;

    const items = await this.loadFn(ids);
    items.forEach(item => {
      this.cache.set(this.getKey(item), item);
    });
  }
}
