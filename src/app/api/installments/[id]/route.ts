import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { broadcastEvent } from '@/app/api/events/route'
import { logTransactionAudit, recalculateAccountBalance } from '@/lib/transaction-audit'

const prisma = new PrismaClient()

interface RouteParams {
  params: {
    id: string
  }
}

// Atualizar status de uma parcela específica
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const { status } = await request.json()

    if (!['pending', 'cleared'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Buscar a parcela
      const installment = await tx.transaction.findUnique({
        where: { id }
      })

      if (!installment) {
        throw new Error('Parcela não encontrada')
      }

      if (!installment.parentTransactionId) {
        throw new Error('Esta não é uma parcela válida')
      }

      // Atualizar status da parcela
      const updatedInstallment = await tx.transaction.update({
        where: { id },
        data: { status }
      })

      // Se mudou para cleared, recalcular saldo
      if (status === 'cleared' && installment.status !== 'cleared') {
        await recalculateAccountBalance(installment.accountId, tx)
      }
      // Se mudou de cleared para pending, recalcular saldo
      else if (status === 'pending' && installment.status === 'cleared') {
        await recalculateAccountBalance(installment.accountId, tx)
      }

      // Log de auditoria
      await logTransactionAudit(id, 'UPDATE', 'system', tx)

      return updatedInstallment
    })

    // Broadcast do evento
    broadcastEvent('transaction_updated', { transaction: result })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao atualizar parcela:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Buscar detalhes de um parcelamento
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    const installment = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        }
      }
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'Parcela não encontrada' },
        { status: 404 }
      )
    }

    // Se é uma parcela filha, buscar a transação mãe e todas as parcelas
    if (installment.parentTransactionId) {
      const parentTransaction = await prisma.transaction.findUnique({
        where: { id: installment.parentTransactionId }
      })

      const childTransactions = await prisma.transaction.findMany({
        where: {
          parentTransactionId: installment.parentTransactionId,
          deletedAt: null
        },
        orderBy: { installmentNumber: 'asc' }
      })

      return NextResponse.json({
        ...installment,
        parentTransaction,
        childTransactions
      })
    }

    // Se é uma transação mãe, buscar as parcelas filhas
    const childTransactions = await prisma.transaction.findMany({
      where: {
        parentTransactionId: installment.id,
        deletedAt: null
      },
      orderBy: { installmentNumber: 'asc' }
    })

    return NextResponse.json({
      ...installment,
      childTransactions
    })

  } catch (error) {
    console.error('Erro ao buscar parcela:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Cancelar um parcelamento completo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    const result = await prisma.$transaction(async (tx) => {
      // Buscar a transação (pode ser mãe ou filha)
      const transaction = await tx.transaction.findUnique({
        where: { id }
      })

      if (!transaction) {
        throw new Error('Transação não encontrada')
      }

      let parentId = transaction.parentTransactionId || transaction.id
      let accountId = transaction.accountId

      // Se é uma parcela, buscar a transação mãe
      if (transaction.parentTransactionId) {
        const parent = await tx.transaction.findUnique({
          where: { id: transaction.parentTransactionId }
        })
        if (parent) {
          parentId = parent.id
          accountId = parent.accountId
        }
      }

      // Marcar como deletadas todas as parcelas
      await tx.transaction.updateMany({
        where: {
          OR: [
            { id: parentId },
            { parentTransactionId: parentId }
          ]
        },
        data: {
          deletedAt: new Date()
        }
      })

      // Recalcular saldo da conta
      await recalculateAccountBalance(accountId, tx)

      // Log de auditoria
      await logTransactionAudit(parentId, 'DELETE', 'system', tx)

      return { success: true, deletedParentId: parentId }
    })

    // Broadcast do evento
    broadcastEvent('installment_deleted', { parentId: result.deletedParentId })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao cancelar parcelamento:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}