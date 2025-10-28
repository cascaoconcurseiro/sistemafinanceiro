import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { calculateAllBalances } from '@/lib/utils/financial-calculations';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

// Schema de validação para criação de conta (permissivo)
const createAccountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório').max(100, 'Nome muito longo'),
  type: z.string().min(1, 'Tipo é obrigatório'),
  initialBalance: z.union([z.number(), z.string()]).optional().transform(val => {
    if (typeof val === 'string') return parseFloat(val) || 0;
    return val || 0;
  }),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

// Tipos válidos de conta para usuários
const VALID_ACCOUNT_TYPES = ['checking', 'savings', 'investment', 'credit_card', 'cash'] as const;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const userId = auth.userId!;

    console.log('📊 [API Accounts] Buscando contas...');
    
    // ✅ CORREÇÃO: Filtrar apenas contas válidas do usuário
    const [accounts, allTransactions] = await Promise.all([
      prisma.account.findMany({
        where: { 
          userId, 
          deletedAt: null,
          type: { in: VALID_ACCOUNT_TYPES } // ✅ Apenas tipos válidos
        },
        orderBy: { name: 'asc' }
      }),
      prisma.transaction.findMany({
        where: { userId, deletedAt: null }
      })
    ]);
    
    // ✅ CORREÇÃO: Usar saldo armazenado (mais eficiente)
    // Obter mês e ano atual para filtrar transações
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() retorna 0-11
    const currentYear = now.getFullYear();
    
    const accountsWithBalance = accounts.map(account => {
      // Usar saldo armazenado no banco (partida dobrada garante consistência)
      const balance = Number(account.balance);
      
      // Filtrar transações do mês atual para esta conta
      const currentMonthTransactions = allTransactions.filter(t => {
        if (t.accountId !== account.id) return false;
        
        const transactionDate = new Date(t.date);
        const transactionMonth = transactionDate.getMonth() + 1;
        const transactionYear = transactionDate.getFullYear();
        
        return transactionMonth === currentMonth && transactionYear === currentYear;
      });
      
      return {
        ...account,
        balance: balance, // ✅ CORREÇÃO: Usar saldo armazenado
        transactionCount: currentMonthTransactions.length,
        totalTransactions: allTransactions.filter(t => t.accountId === account.id).length // Para debug
      };
    });

    console.log('✅ [API Accounts] Retornando', accounts.length, 'contas');
    console.log('🔍 [API Accounts] Debug transações por conta:');
    accountsWithBalance.forEach(account => {
      console.log(`  ${account.name}: ${account.transactionCount} transações no mês atual (${account.totalTransactions} total)`);
    });
    
    return NextResponse.json(accountsWithBalance);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const userId = auth.userId!;
    
    console.log('🔍 API Accounts - UserId autenticado:', userId);
    
    // Validar se o userId existe no banco
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!userExists) {
      console.log('❌ API Accounts - UserId não existe no banco:', userId);
      return NextResponse.json(
        { 
          error: 'Usuário não encontrado no banco de dados',
          details: 'Seu token de autenticação está desatualizado. Faça logout e login novamente.'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('🔍 API Accounts - Body recebido:', JSON.stringify(body, null, 2));
    console.log('🔍 API Accounts - Tipo do campo type:', typeof body.type, body.type);
    
    // Validar dados de entrada com Zod
    try {
      const validatedData = createAccountSchema.parse(body);
      console.log('✅ [API Accounts] Dados validados com sucesso');
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('❌ [API Accounts] Erro de validação:', JSON.stringify(error.errors, null, 2));
        return NextResponse.json(
          { 
            error: 'Dados inválidos', 
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        );
      }
      throw error;
    }
    
    const { name, type, initialBalance = 0, description, isActive = true } = body;
    console.log('🔍 API Accounts - Dados extraídos:', { name, type, initialBalance, description, isActive });

    // Verificar se já existe conta com mesmo nome
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId,
        name,
        isActive: true,
        deletedAt: null
      }
    });

    if (existingAccount) {
      console.log('❌ API Accounts - Conta já existe:', existingAccount.name);
      return NextResponse.json(
        { error: 'Já existe uma conta com este nome' },
        { status: 400 }
      );
    }
    
    console.log('✅ API Accounts - Nome da conta disponível');
    console.log('🔍 API Accounts - Dados para criar conta:', {
      name,
      type,
      currency: 'BRL',
      userId,
      isActive,
      balance: initialBalance || 0
    });
    
    const account = await prisma.account.create({
      data: {
        name,
        type, // ✅ Usar tipo direto
        currency: 'BRL',
        userId,
        isActive,
        balance: initialBalance || 0 // ✅ Definir saldo inicial diretamente
      },
    });
    
    console.log('✅ API Accounts - Conta criada com sucesso:', account.id);

    // ✅ Se há saldo inicial, criar transação de depósito inicial
    if (initialBalance && initialBalance > 0) {
      try {
        // Buscar ou criar categoria "Depósito"
        const { getOrCreateCategory } = await import('@/lib/ensure-default-categories');
        const depositCategory = await getOrCreateCategory(userId, 'Depósito', 'RECEITA');

        // Criar transação de depósito inicial
        await prisma.transaction.create({
          data: {
            userId,
            accountId: account.id,
            categoryId: depositCategory.id,
            amount: initialBalance,
            description: 'Depósito Inicial',
            type: 'RECEITA',
            date: new Date(),
            status: 'completed'
          }
        });
      } catch (error) {
        console.error('Erro ao criar transação de depósito inicial:', error);
        // Não falhar a criação da conta se houver erro na transação
      }
    }
    
    return NextResponse.json({
      ...account,
      balance: Number(account.balance) || 0
    }, { status: 201 });
  } catch (error) {
    console.error('❌ [API Accounts POST] Erro:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    
    // Erro específico de foreign key
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { 
          error: 'Erro ao criar conta: usuário não encontrado no banco de dados',
          details: 'O ID do usuário autenticado não existe no banco. Tente fazer logout e login novamente.'
        },
        { status: 400 }
      );
    }
    
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const userId = auth.userId!;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');
    const force = searchParams.get('force') === 'true'; // Forçar exclusão permanente

    if (!accountId) {
      return NextResponse.json(
        { error: 'ID da conta é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a conta existe e pertence ao usuário
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    // ✅ CORREÇÃO: Deletar PERMANENTEMENTE do banco de dados
    console.log('🗑️ Deletando conta permanentemente:', accountId);
    
    // 1. Deletar lançamentos contábeis
    const deletedEntries = await prisma.journalEntry.deleteMany({
      where: { accountId }
    });
    console.log(`   ✅ Deletados ${deletedEntries.count} lançamentos contábeis`);
    
    // 2. Deletar transações
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: { accountId, userId }
    });
    console.log(`   ✅ Deletadas ${deletedTransactions.count} transações`);
    
    // 3. Deletar conta
    await prisma.account.delete({
      where: { id: accountId }
    });
    console.log(`   ✅ Conta deletada permanentemente`);

    return NextResponse.json({
      message: 'Conta deletada permanentemente do banco de dados',
      deletedTransactions: deletedTransactions.count,
      deletedEntries: deletedEntries.count
    });
  } catch (error) {
    return handleApiError(error);
  }
}
