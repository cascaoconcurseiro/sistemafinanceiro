/**
 * 🚀 Simplified Transactions API
 * Simple transactions endpoint without complex optimizations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';

// Optimized validation schema
const createTransactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['income', 'expense', 'RECEITA', 'DESPESA']), // ✅ CORREÇÃO: Aceitar ambos os formatos
  date: z.string().min(1, 'Data é obrigatória'),
  accountId: z.string().optional(),
  account: z.string().optional(),
  categoryId: z.string().min(1, 'ID da categoria é obrigatório'),
  category: z.string().optional().nullable(), // Nome da categoria (para compatibilidade)
  notes: z.string().optional(),
  isShared: z.boolean().optional(),
  tripId: z.string().optional().nullable(),
  creditCardId: z.string().optional(), // ✅ NOVO: Suporte a cartão de crédito
  sharedWith: z.union([z.array(z.string()), z.string()]).optional().nullable(), // ✅ NOVO: Lista de pessoas (JSON string ou array)
  myShare: z.number().optional(),
  totalSharedAmount: z.number().optional(),
  installments: z.number().min(1).max(60).optional(),
  parentTransactionId: z.string().optional().nullable(),
  installmentNumber: z.number().min(1).optional(),
  paidBy: z.string().optional().nullable(), // ✅ NOVO: ID de quem pagou
}).refine(
  (data) => {
    // ✅ CORREÇÃO: Conta é obrigatória EXCETO quando paidBy está definido
    if (data.paidBy) return true; // Se pago por outra pessoa, não precisa de conta
    return data.accountId || data.account;
  },
  {
    message: 'É obrigatório especificar uma conta (exceto quando pago por outra pessoa)',
    path: ['accountId']
  }
);

// Fetch transactions from database
async function fetchTransactions(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      account: { select: { id: true, name: true, type: true } },
      categoryRef: { select: { id: true, name: true } }
    },
    orderBy: { date: 'desc' }
  });

  return transactions.map(t => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    date: t.date,
    status: t.status,
    category: t.categoryRef?.name || 'Sem categoria',
    categoryId: t.categoryId,
    account: t.account?.name || 'Sem conta',
    accountId: t.accountId,
    isShared: t.isShared,
    sharedWith: t.sharedWith ? JSON.parse(t.sharedWith) : null,
    myShare: t.myShare ? Number(t.myShare) : null,
    totalSharedAmount: t.totalSharedAmount ? Number(t.totalSharedAmount) : null,
    parentTransactionId: t.parentTransactionId,
    installmentNumber: t.installmentNumber,
    totalInstallments: t.totalInstallments,
    notes: t.description,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
}

// Create transaction in database
async function createTransaction(userId: string, data: z.infer<typeof createTransactionSchema>) {
  console.log('🔍 [createTransaction] Iniciando criação:', { userId, data });
  
  // ✅ CASO ESPECIAL: Pago por outra pessoa
  if (data.paidBy) {
    console.log('💳 [createTransaction] PAGO POR OUTRA PESSOA detectado');
    console.log('💳 [createTransaction] Pagador:', data.paidBy);
    
    // Calcular divisão automática
    const participants = data.sharedWith ? 
      (Array.isArray(data.sharedWith) ? data.sharedWith : JSON.parse(data.sharedWith)) : 
      [];
    
    // Adicionar o usuário atual e o pagador aos participantes
    const allParticipants = [userId, ...participants];
    const uniqueParticipants = [...new Set(allParticipants)];
    const totalParticipants = uniqueParticipants.length;
    const sharePerPerson = data.amount / totalParticipants;
    
    console.log('💳 [createTransaction] Divisão:', {
      totalParticipants,
      sharePerPerson,
      participants: uniqueParticipants
    });
    
    // NÃO criar transação ainda - apenas registrar dívida
    // Criar dívida para cada participante (exceto quem pagou)
    for (const participantId of uniqueParticipants) {
      if (participantId !== data.paidBy) {
        await prisma.sharedDebt.create({
          data: {
            userId: participantId,
            creditorId: data.paidBy,
            debtorId: participantId,
            originalAmount: sharePerPerson,
            currentAmount: sharePerPerson,
            paidAmount: 0,
            description: data.description,
            status: 'active',
            transactionId: null, // Será preenchido quando pagar
          },
        });
        
        console.log('✅ [createTransaction] Dívida criada:', {
          debtor: participantId,
          creditor: data.paidBy,
          amount: sharePerPerson
        });
      }
    }
    
    return {
      id: 'debt-created',
      description: data.description,
      amount: sharePerPerson,
      type: 'DESPESA',
      date: new Date(data.date),
      status: 'pending',
      paidBy: data.paidBy,
      myShare: sharePerPerson,
      totalSharedAmount: data.amount,
      isDebt: true,
      message: `Dívida de R$ ${sharePerPerson.toFixed(2)} registrada com ${data.paidBy}`,
    };
  }
  
  // ✅ FLUXO NORMAL: EU paguei
  // Process account ID and credit card ID
  let accountId = data.accountId || data.account;
  let creditCardId = data.creditCardId || null;
  
  console.log('🔍 [createTransaction] accountId original:', accountId);
  console.log('🔍 [createTransaction] creditCardId original:', creditCardId);
  
  // Remove prefixes
  if (accountId?.startsWith('account-')) {
    accountId = accountId.replace('account-', '');
    console.log('🔍 [createTransaction] accountId após remover prefixo:', accountId);
  } else if (accountId?.startsWith('card-')) {
    creditCardId = accountId.replace('card-', '');
    accountId = null; // Cartão não tem accountId
    console.log('🔍 [createTransaction] É cartão de crédito:', creditCardId);
  }
  
  // Se creditCardId também tem prefixo, remover
  if (creditCardId?.startsWith('card-')) {
    creditCardId = creditCardId.replace('card-', '');
    console.log('🔍 [createTransaction] creditCardId após remover prefixo:', creditCardId);
  }

  // Validate account or credit card exists
  if (accountId) {
    console.log('🔍 [createTransaction] Validando conta...');
    const account = await prisma.account.findFirst({
      where: { 
        id: accountId,
        userId 
      }
    });

    if (!account) {
      console.log('❌ [createTransaction] Conta não encontrada:', accountId);
      throw new Error('Account not found');
    }
    console.log('✅ [createTransaction] Conta validada:', account.name);
  } else if (creditCardId) {
    console.log('🔍 [createTransaction] Validando cartão de crédito...');
    const creditCard = await prisma.creditCard.findFirst({
      where: { 
        id: creditCardId,
        userId 
      }
    });

    if (!creditCard) {
      console.log('❌ [createTransaction] Cartão não encontrado:', creditCardId);
      throw new Error('Credit card not found');
    }
    console.log('✅ [createTransaction] Cartão validado:', creditCard.name);
  }

  // Create transaction
  console.log('💾 [createTransaction] Criando transação no banco...');
  console.log('💾 [createTransaction] Dados:', { accountId, creditCardId, tripId: data.tripId });
  
  // ✅ CORREÇÃO: Normalizar tipo de transação
  let transactionType = data.type;
  if (transactionType === 'income') transactionType = 'RECEITA';
  if (transactionType === 'expense') transactionType = 'DESPESA';
  
  console.log('💾 [createTransaction] Tipo normalizado:', transactionType);
  
  const newTransaction = await prisma.transaction.create({
    data: {
      description: data.description,
      amount: data.amount,
      type: transactionType, // ✅ Usar tipo normalizado
      date: new Date(data.date),
      accountId: accountId || null,
      categoryId: data.categoryId,
      creditCardId: creditCardId, // ✅ Usar variável processada
      userId: userId,
      status: 'completed',
      isShared: data.isShared || false, // ✅ Salvar isShared
      sharedWith: typeof data.sharedWith === 'string' ? data.sharedWith : (data.sharedWith ? JSON.stringify(data.sharedWith) : null), // ✅ NOVO: Salvar sharedWith
      myShare: data.myShare || null, // ✅ NOVO: Salvar myShare
      totalSharedAmount: data.totalSharedAmount || null, // ✅ NOVO: Salvar totalSharedAmount
      paidBy: data.paidBy || null, // ✅ NOVO: Salvar paidBy
      parentTransactionId: data.parentTransactionId || null, // ✅ NOVO: Para parcelamentos
      installmentNumber: data.installmentNumber || null, // ✅ NOVO: Número da parcela
      totalInstallments: data.installments || null, // ✅ NOVO: Total de parcelas
      tripId: data.tripId || null, // ✅ Salvar tripId
      metadata: JSON.stringify({
        notes: data.notes,
        createdVia: 'optimized-api'
      })
    },
    include: {
      account: { select: { id: true, name: true, type: true } },
      categoryRef: { select: { id: true, name: true } },
      creditCard: { select: { id: true, name: true } }, // ✅ NOVO: Incluir cartão
      trip: { select: { id: true, name: true, destination: true } } // ✅ NOVO: Incluir viagem
    }
  });
  
  console.log('✅ [createTransaction] Transação criada:', newTransaction.id);
  
  // ✅ Se for despesa compartilhada (EU paguei), criar dívidas
  if (data.isShared && data.sharedWith) {
    const participants = Array.isArray(data.sharedWith) ? data.sharedWith : JSON.parse(data.sharedWith);
    const sharePerPerson = data.myShare || (data.amount / (participants.length + 1));
    
    console.log('💰 [createTransaction] Criando dívidas para participantes:', participants);
    
    for (const participantId of participants) {
      await prisma.sharedDebt.create({
        data: {
          userId: userId,
          creditorId: userId, // EU sou o credor
          debtorId: participantId, // Participante é o devedor
          originalAmount: sharePerPerson,
          currentAmount: sharePerPerson,
          paidAmount: 0,
          description: data.description,
          status: 'active',
          transactionId: newTransaction.id,
        },
      });
      
      console.log('✅ [createTransaction] Dívida criada para:', participantId);
    }
  }

  return {
    id: newTransaction.id,
    description: newTransaction.description,
    amount: Number(newTransaction.amount),
    type: newTransaction.type,
    date: newTransaction.date,
    status: newTransaction.status,
    category: newTransaction.categoryRef?.name || 'Sem categoria',
    categoryId: newTransaction.categoryId,
    account: newTransaction.account?.name || 'Sem conta',
    accountId: newTransaction.accountId,
    isShared: newTransaction.isShared,
    sharedWith: newTransaction.sharedWith ? JSON.parse(newTransaction.sharedWith) : null,
    myShare: newTransaction.myShare ? Number(newTransaction.myShare) : null,
    totalSharedAmount: newTransaction.totalSharedAmount ? Number(newTransaction.totalSharedAmount) : null,
    paidBy: newTransaction.paidBy,
    parentTransactionId: newTransaction.parentTransactionId,
    installmentNumber: newTransaction.installmentNumber,
    totalInstallments: newTransaction.totalInstallments,
    notes: newTransaction.description,
    createdAt: newTransaction.createdAt,
    updatedAt: newTransaction.updatedAt,
  };
}

// Simple GET handler
export async function GET(request: NextRequest) {
  console.log('📊 [Transactions API] Iniciando busca de transações...');
  
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      console.log('❌ [Transactions API] Não autenticado');
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = auth.userId;
    console.log('✅ [Transactions API] Usuário autenticado:', userId);

    const transactions = await fetchTransactions(userId);
    
    console.log('✅ [Transactions API] Transações encontradas:', transactions.length);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('❌ [Transactions API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Simple POST handler
export async function POST(request: NextRequest) {
  console.log('📝 [Transactions API] Criando nova transação...');
  
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      console.log('❌ [Transactions API] Não autenticado');
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await request.json();
    
    console.log('📦 [Transactions API] Dados recebidos:', JSON.stringify(body, null, 2));

    // Validate data
    const validation = createTransactionSchema.safeParse(body);
    if (!validation.success) {
      console.log('❌ [Transactions API] Dados inválidos:', validation.error.errors);
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    console.log('✅ [Transactions API] Dados validados com sucesso');
    
    const newTransaction = await createTransaction(userId, validation.data);
    
    console.log('✅ [Transactions API] Transação criada:', newTransaction.id);
    
    // ✅ CORREÇÃO: Invalidar cache do contexto unificado
    console.log('🔄 [Transactions API] Invalidando cache...');

    return NextResponse.json({
      ...newTransaction,
      _meta: {
        cacheInvalidated: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [Transactions API] ERRO COMPLETO:', error);
    console.error('❌ [Transactions API] Mensagem:', error instanceof Error ? error.message : 'Unknown');
    console.error('❌ [Transactions API] Stack:', error instanceof Error ? error.stack : 'N/A');
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

