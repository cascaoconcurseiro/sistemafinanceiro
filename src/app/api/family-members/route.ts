import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';

// ✅ CORREÇÃO: Schema de validação mais flexível
const createFamilyMemberSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  relationship: z.string().optional().default('Familiar'),
  birthDate: z.string().optional().nullable(),
  email: z.union([
    z.string().email('Email inválido'),
    z.literal(''),
    z.null(),
    z.undefined()
  ]).optional().nullable(),
  phone: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    
    const members = await prisma.familyMember.findMany({
      where: {
        userId: auth.userId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    
    return NextResponse.json(members);
  } catch (error) {
    console.error('❌ [API FamilyMembers] Erro ao buscar:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar membros da família' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 [API FamilyMembers] Dados recebidos:', body);

    // Validar dados
    try {
      createFamilyMemberSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
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

    // Verificar se já existe membro com mesmo nome
    const existing = await prisma.familyMember.findFirst({
      where: {
        userId: auth.userId,
        name: body.name,
        isActive: true
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um membro da família com este nome' },
        { status: 400 }
      );
    }

    // Criar membro
    const member = await prisma.familyMember.create({
      data: {
        userId: auth.userId,
        name: body.name,
        relationship: body.relationship,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        email: body.email || null,
        phone: body.phone || null,
        avatar: body.avatar || null,
        notes: body.notes || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      }
    });

    
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('❌ [API FamilyMembers] Erro ao criar:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar membro da família' },
      { status: 500 }
    );
  }
}
