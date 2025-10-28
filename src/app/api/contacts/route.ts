import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    let whereClause: any = {
      userId: auth.userId // ✅ Isolamento de dados
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    let contacts = [];
    try {
      contacts = await prisma.contact.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      console.log('Tabela contact não existe ou erro na consulta:', error);
      // Retornar dados vazios se a tabela não existir
      contacts = [];
    }

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ContactSchema.parse(body);

    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        userId: auth.userId // ✅ Associar ao usuário autenticado
      }
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar contato:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do contato é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se o contato pertence ao usuário
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        userId: auth.userId
      }
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contato não encontrado ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    const validatedData = ContactSchema.partial().parse(updateData);

    const contact = await prisma.contact.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do contato é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se o contato pertence ao usuário
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        userId: auth.userId
      }
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contato não encontrado ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    await prisma.contact.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar contato:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}