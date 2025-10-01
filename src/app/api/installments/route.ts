import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { broadcastEvent } from '@/app/api/events/route'
import { logTransactionAudit, recalculateAccountBalance } from '@/lib/transaction-audit'

const prisma = new PrismaClient()

interface CreateInstallmentData {
  accountId: string
  amount: number
  description: string
  category: string
  type: 'debit' | 'credit'
  totalInstallments: number
  startDate: string
  status?: 'pending' | 'cleared'
}

export async function POST(request: NextRequest) {
  try {
    const installmentData: CreateInstallmentData = await request.json()

    // Validar dados básicos
    if (!installmentData.accountId || !installmentData.amount || !installmentData.description || 
        !installmentData.totalInstallments || installmentData.totalInstallments < 2) {
      return NextResponse.json(
        { error: 'Dados inválidos para parcelamento' },
        { status: 400 }
      )
    }

    // Calcular valor das parcelas com arredondamento adequado
    const baseInstallmentAmount = Math.round((installmentData.amount / installmentData.totalInstallments) * 100) / 100
    const startDate = new Date(installmentData.startDate)
    const transactions = []

    // Criar transação dentro de uma transação do Prisma
    const result = await prisma.$transaction(async (tx) => {
      // Criar transação mãe
      const parentTransaction = await tx.transaction.create({
        data: {
          accountId: installmentData.accountId,
          amount: installmentData.amount,
          description: `${installmentData.description} (Parcelado ${installmentData.totalInstallments}x)`,
          category: installmentData.category,
          type: installmentData.type,
          date: startDate,
          status: 'pending',
          isRecurring: false,
          totalInstallments: installmentData.totalInstallments,
          installmentNumber: 0 // Transação mãe tem número 0
        }
      })

      // Criar transações filhas (parcelas)
      for (let i = 1; i <= installmentData.totalInstallments; i++) {
        const installmentDate = new Date(startDate)
        installmentDate.setMonth(installmentDate.getMonth() + (i - 1))

        // Ajustar a última parcela para compensar diferenças de arredondamento
        const installmentAmount = i === installmentData.totalInstallments 
          ? installmentData.amount - (baseInstallmentAmount * (installmentData.totalInstallments - 1))
          : baseInstallmentAmount

        const childTransaction = await tx.transaction.create({
          data: {
            accountId: installmentData.accountId,
            amount: installmentAmount,
            description: `${installmentData.description} (${i}/${installmentData.totalInstallments})`,
            category: installmentData.category,
            type: installmentData.type,
            date: installmentDate,
            status: i === 1 ? (installmentData.status || 'cleared') : 'pending',
            isRecurring: false,
            parentTransactionId: parentTransaction.id,
            installmentNumber: i,
            totalInstallments: installmentData.totalInstallments
          }
        })

        transactions.push(childTransaction)

        // Se é a primeira parcela e está cleared, atualizar saldo
        if (i === 1 && childTransaction.status === 'cleared') {
          await recalculateAccountBalance(installmentData.accountId, tx)
        }
      }

      // Log de auditoria
      await logTransactionAudit(parentTransaction.id, 'CREATE', 'system', tx)

      return {
        parentTransaction,
        installments: transactions
      }
    })

    // Broadcast do evento
    broadcastEvent('transaction_created', {
      transaction: result.parentTransaction,
      installments: result.installments
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao criar parcelamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    const where: any = {
      deletedAt: null,
      parentTransactionId: null, // Apenas transações mãe
      totalInstallments: { gt: 1 }
    }

    if (accountId) {
      where.accountId = accountId
    }

    const installments = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Para cada transação mãe, buscar as parcelas filhas
    const installmentsWithChildren = await Promise.all(
      installments.map(async (parent) => {
        const childTransactions = await prisma.transaction.findMany({
          where: {
            parentTransactionId: parent.id,
            deletedAt: null
          },
          orderBy: { installmentNumber: 'asc' }
        })

        return {
          ...parent,
          childTransactions
        }
      })
    )

    return NextResponse.json(installmentsWithChildren)

  } catch (error) {
    console.error('Erro ao buscar parcelamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}