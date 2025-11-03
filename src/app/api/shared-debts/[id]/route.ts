import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/services/database-service'
import { authenticateRequest } from '@/lib/utils/auth-helpers'
export const dynamic = 'force-dynamic';

// GET /api/shared-debts/[id] - Buscar dívida específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // ✅ CORREÇÃO CRÍTICA: Buscar apenas dívidas do usuário autenticado
    const debts = await databaseService.getSharedDebts()
    const debt = debts.find(d => d.id === params.id && d.userId === auth.userId)

    if (!debt) {
      return NextResponse.json(
        { error: 'Dívida não encontrada ou não pertence ao usuário' },
        { status: 403 }
      )
    }

    return NextResponse.json(debt)
  } catch (error) {
    console.error('Erro ao buscar dívida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/shared-debts/[id] - Atualizar dívida específica
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json()

    // ✅ CORREÇÃO CRÍTICA: Verificar se a dívida pertence ao usuário
    const debts = await databaseService.getSharedDebts()
    const debt = debts.find(d => d.id === params.id && d.userId === auth.userId)

    if (!debt) {
      return NextResponse.json(
        { error: 'Dívida não encontrada ou não pertence ao usuário' },
        { status: 403 }
      )
    }

    // Validação do valor se fornecido
    if (body.originalAmount !== undefined && body.originalAmount <= 0) {
      return NextResponse.json(
        { error: 'O valor da dívida deve ser maior que zero' },
        { status: 400 }
      )
    }

    if (body.currentAmount !== undefined && body.currentAmount < 0) {
      return NextResponse.json(
        { error: 'O valor atual da dívida não pode ser negativo' },
        { status: 400 }
      )
    }

    await databaseService.updateSharedDebt(params.id, body)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar dívida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/shared-debts/[id] - Deletar dívida específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se a dívida pertence ao usuário
    const debts = await databaseService.getSharedDebts()
    const debt = debts.find(d => d.id === params.id && d.userId === auth.userId)

    if (!debt) {
      return NextResponse.json(
        { error: 'Dívida não encontrada ou não pertence ao usuário' },
        { status: 403 }
      )
    }

    await databaseService.deleteSharedDebt(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar dívida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
