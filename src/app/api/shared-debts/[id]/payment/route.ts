import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/services/database-service'
export const dynamic = 'force-dynamic';

// POST /api/shared-debts/[id]/payment - Processar pagamento de dívida
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Valor do pagamento deve ser maior que zero' },
        { status: 400 }
      )
    }

    const updatedDebt = await databaseService.processDebtPayment(
      params.id,
      Number(body.amount)
    )

    return NextResponse.json({
      success: true,
      debt: updatedDebt,
      message: updatedDebt.status === 'paid'
        ? 'Dívida quitada completamente!'
        : `Pagamento processado. Valor restante: R$ ${updatedDebt.currentAmount.toFixed(2)}`
    })
  } catch (error) {
    console.error('Erro ao processar pagamento:', error)

    if (error instanceof Error && error.message === 'Dívida não encontrada') {
      return NextResponse.json(
        { error: 'Dívida não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
