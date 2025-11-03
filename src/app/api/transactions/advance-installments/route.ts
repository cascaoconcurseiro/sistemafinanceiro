import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { transactionId, installmentGroupId, installmentsToAdvance, accountId } = body;

    if (!transactionId || !installmentGroupId || !installmentsToAdvance || !accountId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Buscar a transação original
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!originalTransaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    if (originalTransaction.userId !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Buscar todas as parcelas do grupo
    const allInstallments = await prisma.transaction.findMany({
      where: {
        installmentGroupId,
        userId: user.id,
      },
      orderBy: {
        installmentNumber: 'asc',
      },
    });

    if (allInstallments.length === 0) {
      return NextResponse.json({ error: 'Parcelas não encontradas' }, { status: 404 });
    }

    const currentInstallment = originalTransaction.installmentNumber || 1;
    const totalInstallments = originalTransaction.totalInstallments || 1;

    // Validar se há parcelas suficientes para adiantar
    const remainingInstallments = totalInstallments - currentInstallment;
    if (installmentsToAdvance > remainingInstallments) {
      return NextResponse.json(
        { error: 'Número de parcelas a adiantar excede as parcelas restantes' },
        { status: 400 }
      );
    }

    // Buscar a conta para débito
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== user.id) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // Selecionar as parcelas a serem adiantadas (próximas N parcelas após a atual)
    const installmentsToUpdate = allInstallments.filter(
      (inst) =>
        inst.installmentNumber &&
        inst.installmentNumber > currentInstallment &&
        inst.installmentNumber <= currentInstallment + installmentsToAdvance
    );

    if (installmentsToUpdate.length !== installmentsToAdvance) {
      return NextResponse.json(
        { error: 'Erro ao localizar parcelas para adiantar' },
        { status: 400 }
      );
    }

    // Calcular valor total
    const totalAmount = installmentsToUpdate.reduce(
      (sum, inst) => sum + Math.abs(Number(inst.amount)),
      0
    );

    // Verificar saldo da conta (se não permitir saldo negativo)
    if (!account.allowNegativeBalance && Number(account.balance) < totalAmount) {
      return NextResponse.json(
        { error: 'Saldo insuficiente na conta' },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO: Buscar o cartão de crédito associado às parcelas
    const creditCardId = originalTransaction.creditCardId;
    let creditCardAccount = null;

    if (creditCardId) {
      creditCardAccount = await prisma.account.findUnique({
        where: { id: creditCardId },
      });

      if (!creditCardAccount || creditCardAccount.userId !== user.id) {
        return NextResponse.json(
          { error: 'Cartão de crédito não encontrado' },
          { status: 404 }
        );
      }
    }

    // Executar transação no banco de dados
    const result = await prisma.$transaction(async (tx) => {
      // 1. Marcar parcelas como pagas (status: paid)
      // ✅ CORREÇÃO: Usar "paid" em vez de "completed" para indicar pagamento antecipado
      const updatedInstallments = await Promise.all(
        installmentsToUpdate.map((inst) =>
          tx.transaction.update({
            where: { id: inst.id },
            data: {
              status: 'paid', // ✅ Status específico para pagamento antecipado
              metadata: JSON.stringify({
                ...(inst.metadata ? JSON.parse(inst.metadata as string) : {}),
                advancedAt: new Date().toISOString(),
                advancedFromAccount: accountId,
                advancedPaymentId: null, // Será preenchido depois
              }),
            },
          })
        )
      );

      // 2. ✅ CORREÇÃO: Criar transação de PAGAMENTO DE FATURA (não despesa comum)
      // Esta é a transação que representa o pagamento antecipado
      const paymentTransaction = await tx.transaction.create({
        data: {
          userId: user.id,
          accountId: accountId, // Conta de onde sai o dinheiro
          amount: -totalAmount, // Negativo porque é saída de dinheiro
          description: `💳 Pagamento Antecipado - ${installmentsToAdvance}x de ${originalTransaction.description}`,
          type: 'DESPESA',
          date: new Date(),
          status: 'completed',
          categoryId: originalTransaction.categoryId,
          creditCardId: creditCardId, // ✅ Vincular ao cartão
          metadata: JSON.stringify({
            type: 'installment_advance_payment',
            originalTransactionId: transactionId,
            installmentGroupId,
            installmentsAdvanced: installmentsToAdvance,
            installmentIds: installmentsToUpdate.map((i) => i.id),
            installmentNumbers: installmentsToUpdate.map((i) => i.installmentNumber),
          }),
        },
      });

      // 3. ✅ NOVO: Atualizar metadata das parcelas com o ID do pagamento
      await Promise.all(
        installmentsToUpdate.map((inst) =>
          tx.transaction.update({
            where: { id: inst.id },
            data: {
              metadata: JSON.stringify({
                ...(inst.metadata ? JSON.parse(inst.metadata as string) : {}),
                advancedAt: new Date().toISOString(),
                advancedFromAccount: accountId,
                advancedPaymentId: paymentTransaction.id, // ✅ Rastreabilidade
              }),
            },
          })
        )
      );

      // 4. ✅ CORREÇÃO: Atualizar saldo da conta corrente (débito)
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            decrement: totalAmount,
          },
        },
      });

      // 5. ✅ NOVO: Se for cartão de crédito, liberar o limite (crédito)
      // O limite do cartão aumenta porque a dívida diminuiu
      if (creditCardAccount) {
        await tx.account.update({
          where: { id: creditCardId },
          data: {
            balance: {
              increment: totalAmount, // ✅ Libera o limite (reduz a dívida)
            },
          },
        });
      }

      return {
        updatedInstallments,
        paymentTransaction,
        creditCardUpdated: !!creditCardAccount,
      };
    });

    return NextResponse.json({
      success: true,
      message: `${installmentsToAdvance} parcela(s) adiantada(s) com sucesso`,
      data: result,
    });
  } catch (error) {
    console.error('Erro ao adiantar parcelas:', error);
    return NextResponse.json(
      { error: 'Erro ao processar adiantamento' },
      { status: 500 }
    );
  }
}
