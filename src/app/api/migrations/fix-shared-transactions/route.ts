import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';


/**
 * Script de migração para preencher sharedWith em transações antigas
 *
 * Este script identifica transações que deveriam ser compartilhadas
 * mas não têm o campo sharedWith preenchido
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    
    // Buscar membros da família do usuário
    const familyMembers = await prisma.familyMember.findMany({
      where: { userId: auth.userId },
      select: { id: true, name: true }
    });

    if (familyMembers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum membro da família encontrado. Cadastre membros primeiro.',
        updated: 0
      });
    }

    console.log(`👥 [Migration] Encontrados ${familyMembers.length} membros da família`);

    // Buscar transações que parecem ser compartilhadas mas não têm sharedWith
    // Critérios: isShared = true OU description contém palavras-chave
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: auth.userId,
        deletedAt: null,
        OR: [
          { isShared: true },
          { description: { contains: 'compartilhad', mode: 'insensitive' } },
          { description: { contains: 'dividid', mode: 'insensitive' } },
          { description: { contains: 'rateio', mode: 'insensitive' } },
        ]
      }
    });

    console.log(`📋 [Migration] Encontradas ${transactions.length} transações candidatas`);

    let updated = 0;
    let skipped = 0;

    for (const transaction of transactions) {
      // Verificar se já tem sharedWith preenchido
      if (transaction.sharedWith) {
        try {
          const parsed = JSON.parse(transaction.sharedWith);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`⏭️ [Migration] Transação ${transaction.id} já tem sharedWith, pulando...`);
            skipped++;
            continue;
          }
        } catch (e) {
          // Se der erro no parse, vamos preencher
        }
      }

      // Preencher com todos os membros da família
      const sharedWithIds = familyMembers.map(m => m.id);
      const totalParticipants = sharedWithIds.length + 1; // +1 para o usuário
      const amountPerPerson = Math.abs(Number(transaction.amount)) / totalParticipants;

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          isShared: true,
          sharedWith: JSON.stringify(sharedWithIds),
          myShare: -amountPerPerson, // Minha parte (negativa para despesa)
          totalSharedAmount: transaction.amount, // Valor total
        }
      });

      console.log(`✅ [Migration] Transação ${transaction.id} atualizada com ${sharedWithIds.length} participantes`);
      updated++;
    }

    console.log(`🎉 [Migration] Migração concluída! ${updated} atualizadas, ${skipped} puladas`);

    return NextResponse.json({
      success: true,
      message: `Migração concluída com sucesso!`,
      updated,
      skipped,
      total: transactions.length,
      familyMembers: familyMembers.map(m => m.name)
    });

  } catch (error) {
    console.error('❌ [Migration] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro ao executar migração',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
