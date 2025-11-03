import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { doubleEntryService } from '@/lib/services/double-entry-service';

export const dynamic = 'force-dynamic';

// POST - Transferir dinheiro entre contas
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { fromAccountId, toAccountId, amount, description, date } = body;

    if (!fromAccountId || !toAccountId || !amount || !description) {
      return NextResponse.json(
        { error: 'Conta origem, conta destino, valor e descrição são obrigatórios' },
        { status: 400 }
      );
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json(
        { error: 'Conta origem e destino não podem ser iguais' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Valor deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Verificar se ambas as contas existem e pertencem ao usuário
    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({
        where: { id: fromAccountId, userId: auth.userId, deletedAt: null },
      }),
      prisma.account.findFirst({
        where: { id: toAccountId, userId: auth.userId, deletedAt: null },
      }),
    ]);

    if (!fromAccount || !toAccount) {
      return NextResponse.json(
        { error: 'Uma ou ambas as contas não foram encontradas' },
        { status: 404 }
      );
    }

    // ✅ VALIDAÇÃO CRÍTICA: Verificar se contas estão ativas
    if (!fromAccount.isActive || fromAccount.deletedAt) {
      return NextResponse.json(
        { error: 'Conta origem está inativa ou deletada' },
        { status: 400 }
      );
    }

    if (!toAccount.isActive || toAccount.deletedAt) {
      return NextResponse.json(
        { error: 'Conta destino está inativa ou deletada' },
        { status: 400 }
      );
    }

    // ✅ VALIDAÇÃO CRÍTICA: Verificar moedas diferentes
    if (fromAccount.currency !== toAccount.currency) {
      return NextResponse.json(
        {
          error: 'Transferência entre moedas diferentes não é permitida',
          details: `Conta origem: ${fromAccount.currency}, Conta destino: ${toAccount.currency}`,
          suggestion: 'Use a funcionalidade de câmbio para converter entre moedas'
        },
        { status: 400 }
      );
    }

    // Calcular saldo da conta origem
    const fromAccountTransactions = await prisma.transaction.findMany({
      where: { accountId: fromAccountId, deletedAt: null },
    });

    const fromAccountBalance = fromAccountTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
    }, 0);

    // Verificar se há saldo suficiente
    if (fromAccountBalance < amount) {
      return NextResponse.json(
        { error: 'Saldo insuficiente na conta origem' },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO: Usar partida dobrada para transferências com transação atômica
    const transferDate = date ? new Date(date) : new Date();

    // ✅ USAR TRANSAÇÃO ATÔMICA para garantir que ambas as operações aconteçam
    const transaction = await prisma.$transaction(async (tx) => {
      // Criar transação de saída (despesa na conta origem)
      const outTransaction = await tx.transaction.create({
        data: {
          userId: auth.userId,
          accountId: fromAccountId,
          amount: -Math.abs(amount),
          description: `Transferência para ${toAccount.name}: ${description}`,
          type: 'TRANSFERENCIA',
          date: transferDate,
          status: 'cleared',
          isTransfer: true,
          transferType: 'out'
        }
      });

      // Criar transação de entrada (receita na conta destino)
      const inTransaction = await tx.transaction.create({
        data: {
          userId: auth.userId,
          accountId: toAccountId,
          amount: Math.abs(amount),
          description: `Transferência de ${fromAccount.name}: ${description}`,
          type: 'TRANSFERENCIA',
          date: transferDate, // ✅ MESMA DATA
          status: 'cleared',
          isTransfer: true,
          transferType: 'in',
          transferId: outTransaction.id // Vincular as duas transações
        }
      });

      // Atualizar a transação de saída com o ID da entrada
      await tx.transaction.update({
        where: { id: outTransaction.id },
        data: { transferId: inTransaction.id }
      });

      return { outTransaction, inTransaction };
    });

    return NextResponse.json({
      success: true,
      message: 'Transferência realizada com sucesso!',
      data: {
        transaction,
        fromAccount: fromAccount.name,
        toAccount: toAccount.name,
        amount,
      },
    });
  } catch (error) {
    console.error('Erro ao realizar transferência:', error);
    return NextResponse.json(
      { error: 'Erro ao processar transferência' },
      { status: 500 }
    );
  }
}

