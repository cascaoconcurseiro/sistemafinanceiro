import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { ValidationService } from '@/lib/services/validation-service';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

/**
 * GET /api/validation/check-consistency
 * Verifica consistência de todos os dados do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const issues: any[] = [];

    // 1. Verificar saldos de contas
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id, deletedAt: null },
    });

    for (const account of accounts) {
      try {
        await ValidationService.validateAccountBalance(account);
      } catch (error) {
        issues.push({
          type: 'ACCOUNT_BALANCE',
          accountId: account.id,
          accountName: account.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    // 2. Verificar saldos de cartões
    const cards = await prisma.creditCard.findMany({
      where: { userId: session.user.id },
    });

    for (const card of cards) {
      try {
        await ValidationService.validateCreditCardBalance(card);
      } catch (error) {
        issues.push({
          type: 'CARD_BALANCE',
          cardId: card.id,
          cardName: card.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    // 3. Verificar totais de faturas
    const invoices = await prisma.invoice.findMany({
      where: { userId: session.user.id },
    });

    for (const invoice of invoices) {
      try {
        await ValidationService.validateInvoiceTotal(invoice.id);
      } catch (error) {
        issues.push({
          type: 'INVOICE_TOTAL',
          invoiceId: invoice.id,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    // 4. Verificar orçamentos
    const budgets = await prisma.budget.findMany({
      where: { userId: session.user.id, isActive: true },
    });

    for (const budget of budgets) {
      try {
        await ValidationService.validateBudget(budget);
      } catch (error) {
        issues.push({
          type: 'BUDGET',
          budgetId: budget.id,
          budgetName: budget.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    return NextResponse.json({
      success: true,
      isConsistent: issues.length === 0,
      issuesFound: issues.length,
      issues,
      summary: {
        accountsChecked: accounts.length,
        cardsChecked: cards.length,
        invoicesChecked: invoices.length,
        budgetsChecked: budgets.length,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar consistência:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao verificar consistência',
      },
      { status: 500 }
    );
  }
}
