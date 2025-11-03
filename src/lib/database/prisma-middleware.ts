import { Prisma, PrismaClient } from '@prisma/client'
import { recalculateAccountBalance } from './transaction-audit.ts';

/**
 * Middleware do Prisma para atualização automática de saldos
 * Intercepta operações de transação e atualiza os saldos das contas automaticamente
 */

// Flag global para evitar recursão
let isRecalculating = false;

export function createBalanceUpdateMiddleware(prismaInstance?: PrismaClient) {
  return async (params: any, next: any) => {
    // Evitar recursão
    if (isRecalculating) {
      return next(params);
    }

    console.log(`🔍 Middleware interceptou: ${params.model}.${params.action}`)

    // Interceptar apenas operações do modelo Transaction
    if (params.model === 'Transaction') {
      console.log(`💰 Processando operação ${params.action} na Transaction`)
      console.log(`📊 Parâmetros:`, JSON.stringify(params.args, null, 2))

      // Para operações que precisam do accountId antes da execução
      let accountIdBefore: string | null = null

      if (params.action === 'update' && params.args?.where?.id) {
        // Buscar o accountId antes da atualização usando a instância do Prisma
        try {
          if (prismaInstance) {
            const existingTransaction = await prismaInstance.transaction.findUnique({
              where: { id: params.args.where.id },
              select: { accountId: true }
            })
            accountIdBefore = existingTransaction?.accountId
            console.log(`🔍 AccountId encontrado antes da atualização: ${accountIdBefore}`)
          }
        } catch (error) {
          console.error('❌ Erro ao buscar transação existente:', error)
        }
      }

      // Executar a operação original
      const result = await next(params)
      console.log(`✅ Resultado da operação:`, JSON.stringify(result, null, 2))

      // Recalcular saldo após a operação
      let accountId: string | null = null

      if (params.action === 'create') {
        accountId = result.accountId
      } else if (params.action === 'update' || params.action === 'delete') {
        accountId = accountIdBefore || result.accountId
      }

      if (accountId) {
        console.log(`🔄 Recalculando saldo para conta: ${accountId}`)
        try {
          isRecalculating = true;
          await recalculateAccountBalance(accountId)
          console.log(`✅ Saldo recalculado com sucesso para conta: ${accountId}`)
        } catch (error) {
          console.error(`❌ Erro ao recalcular saldo:`, error)
        } finally {
          isRecalculating = false;
        }
      }

      return result
    }

    // Para outros modelos, apenas executar a operação
    return next(params)
  }
}

/**
 * Middleware simplificado para operações críticas
 * Usado quando o middleware completo pode causar problemas de performance
 */
export function createSimpleBalanceMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const { model, action } = params

    if (model !== 'Transaction') {
      return next(params)
    }

    const result = await next(params)

    // Apenas para operações que sabemos que afetam o saldo
    if (['create', 'update', 'delete', 'upsert'].includes(action)) {
      try {
        let accountId: string | null = null

        if (action === 'create' || action === 'update' || action === 'upsert') {
          accountId = result?.accountId || params.args?.data?.accountId
        } else if (action === 'delete') {
          // Para delete, precisamos buscar o accountId antes da exclusão
          if (params.args?.where?.id) {
            const transaction = await params.runInThisContext(() => {
              return params.model.findUnique({
                where: { id: params.args.where.id },
                select: { accountId: true }
              })
            })
            accountId = transaction?.accountId
          }
        }

        if (accountId) {
          await recalculateAccountBalance(accountId)
        }
      } catch (error) {
        console.error('❌ Erro no middleware simples:', error)
      }
    }

    return result
  }
}
