import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
export const dynamic = 'force-dynamic';

// GET - Buscar conta por ID
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da conta é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ BLOQUEIO: Não permitir acesso a cartões de crédito por esta API
    if (id.startsWith('card-')) {
      return NextResponse.json(
        { error: 'Use a API de cartões de crédito para gerenciar cartões' },
        { status: 403 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Buscar apenas contas do usuário autenticado
    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: auth.userId // ✅ Isolamento de dados
      },
      include: {
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Conta não encontrada ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...account,
      balance: Number(account.balance)
    });
  } catch (error) {
    console.error('Erro ao buscar conta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar conta por ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;
    const accountData = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID da conta é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ BLOQUEIO: Não permitir acesso a cartões de crédito por esta API
    if (id.startsWith('card-')) {
      return NextResponse.json(
        { error: 'Use a API de cartões de crédito para gerenciar cartões' },
        { status: 403 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se a conta pertence ao usuário
    const existingAccount = await prisma.account.findFirst({
      where: {
        id,
        userId: auth.userId
      }
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Conta não encontrada ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        name: accountData.name,
        type: accountData.type,
        currency: accountData.currency || 'BRL',
        isActive: accountData.isActive !== undefined ? accountData.isActive : true,
      }
    });

    return NextResponse.json({
      ...updatedAccount,
      balance: Number(updatedAccount.balance)
    });
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar conta por ID
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da conta é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ BLOQUEIO: Não permitir acesso a cartões de crédito por esta API
    if (id.startsWith('card-')) {
      return NextResponse.json(
        { error: 'Use a API de cartões de crédito para gerenciar cartões' },
        { status: 403 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se a conta pertence ao usuário
    const existingAccount = await prisma.account.findFirst({
      where: {
        id,
        userId: auth.userId
      }
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Conta não encontrada ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar transações apenas do usuário
    const transactionCount = await prisma.transaction.count({
      where: {
        accountId: id,
        userId: auth.userId // ✅ Isolamento de dados
      }
    });

    if (transactionCount > 0) {
      // Desativar em vez de deletar se houver transações
      const deactivatedAccount = await prisma.account.update({
        where: { id },
        data: { isActive: false }
      });

      return NextResponse.json({
        message: 'Conta desativada (possui transações)',
        account: {
          ...deactivatedAccount,
          balance: Number(deactivatedAccount.balance)
        }
      });
    } else {
      // Deletar se não houver transações
      await prisma.account.delete({
        where: { id }
      });

      return NextResponse.json({
        message: 'Conta deletada com sucesso'
      });
    }
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
