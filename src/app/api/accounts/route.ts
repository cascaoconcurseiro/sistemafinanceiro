import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Singleton para evitar múltiplas instâncias do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// GET - Buscar todas as contas com saldo calculado automaticamente
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Calcular saldo real baseado nas transações para cada conta
    const accountsWithCalculatedBalance = await Promise.all(
      accounts.map(async (account) => {
        // Buscar todas as transações da conta
        const transactions = await prisma.transaction.findMany({
          where: {
            accountId: account.id
          }
        });

        // Calcular saldo baseado no saldo inicial + transações
        let calculatedBalance = Number(account.balance) || 0; // Começar com o saldo inicial da conta
        
        transactions.forEach(transaction => {
          const amount = Number(transaction.amount);
          
          if (transaction.type === 'income') {
            // Para receitas, sempre somar o valor (deve ser positivo)
            calculatedBalance += Math.abs(amount);
          } else if (transaction.type === 'expense') {
            // Para despesas, sempre subtrair o valor absoluto
            calculatedBalance -= Math.abs(amount);
          }
        });

        // Não atualizar o saldo no banco - manter o saldo inicial + transações
        // O saldo calculado já considera o saldo inicial da conta

        return {
          ...account,
          balance: calculatedBalance
        };
      })
    );
    
    return NextResponse.json(accountsWithCalculatedBalance);
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova conta
export async function POST(request: NextRequest) {
  try {
    const accountData = await request.json();
    
    // Validação básica
    if (!accountData.name || !accountData.type) {
      return NextResponse.json(
        { error: 'Nome e tipo da conta são obrigatórios' },
        { status: 400 }
      );
    }

    const account = await prisma.account.create({
      data: {
        name: accountData.name,
        type: accountData.type,
        balance: parseFloat(accountData.balance || 0),
        currency: accountData.currency || 'BRL',
        isActive: accountData.isActive !== false,
      }
    });

    return NextResponse.json({
      ...account,
      balance: Number(account.balance)
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar conta existente
export async function PUT(request: NextRequest) {
  try {
    const accountData = await request.json();
    
    if (!accountData.id) {
      return NextResponse.json(
        { error: 'ID da conta é obrigatório' },
        { status: 400 }
      );
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountData.id },
      data: {
        name: accountData.name,
        type: accountData.type,
        balance: parseFloat(accountData.balance || 0),
        currency: accountData.currency,
        isActive: accountData.isActive,
      }
    });

    return NextResponse.json({
      ...updatedAccount,
      balance: Number(updatedAccount.balance)
    });
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar conta
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteTransactions = searchParams.get('deleteTransactions') === 'true';
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da conta é obrigatório' },
        { status: 400 }
      );
    }

    // Se deleteTransactions for true, excluir as transações associadas primeiro
    if (deleteTransactions) {
      await prisma.transaction.deleteMany({
        where: { 
          OR: [
            { accountId: id },
            { toAccountId: id }
          ]
        }
      });
    }

    // Realmente deletar a conta do banco de dados
    await prisma.account.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
