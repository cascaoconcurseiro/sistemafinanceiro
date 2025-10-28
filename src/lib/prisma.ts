import { PrismaClient } from '@prisma/client';
import { createBalanceUpdateMiddleware } from './prisma-middleware.ts';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  middlewareApplied: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

// Adicionar middleware para atualização automática de saldos
// Garantir que o middleware seja aplicado apenas uma vez
if (!globalForPrisma.middlewareApplied) {
  prisma.$use(createBalanceUpdateMiddleware(prisma));
  globalForPrisma.middlewareApplied = true;
  console.log('✅ Middleware de atualização automática de saldos ativado');
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
