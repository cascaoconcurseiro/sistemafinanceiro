import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  console.error('❌ API Error:', error);

  // Erro customizado
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  // Erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2000':
        return NextResponse.json(
          { error: 'Valor muito longo para o campo', field: error.meta?.target },
          { status: 400 }
        );
      case 'P2001':
        return NextResponse.json(
          { error: 'Registro não encontrado na condição where' },
          { status: 404 }
        );
      case 'P2002':
        return NextResponse.json(
          { error: 'Registro duplicado', field: error.meta?.target },
          { status: 409 }
        );
      case 'P2003':
        return NextResponse.json(
          { error: 'Violação de chave estrangeira', field: error.meta?.field_name },
          { status: 400 }
        );
      case 'P2004':
        return NextResponse.json(
          { error: 'Constraint violada no banco de dados' },
          { status: 400 }
        );
      case 'P2005':
        return NextResponse.json(
          { error: 'Valor inválido para o tipo de campo' },
          { status: 400 }
        );
      case 'P2006':
        return NextResponse.json(
          { error: 'Valor fornecido é inválido' },
          { status: 400 }
        );
      case 'P2007':
        return NextResponse.json(
          { error: 'Erro de validação de dados' },
          { status: 400 }
        );
      case 'P2011':
        return NextResponse.json(
          { error: 'Constraint de não-nulo violada', field: error.meta?.target },
          { status: 400 }
        );
      case 'P2012':
        return NextResponse.json(
          { error: 'Campo obrigatório faltando' },
          { status: 400 }
        );
      case 'P2013':
        return NextResponse.json(
          { error: 'Argumento obrigatório faltando' },
          { status: 400 }
        );
      case 'P2014':
        return NextResponse.json(
          { error: 'Relação violada' },
          { status: 400 }
        );
      case 'P2015':
        return NextResponse.json(
          { error: 'Registro relacionado não encontrado' },
          { status: 404 }
        );
      case 'P2016':
        return NextResponse.json(
          { error: 'Erro de interpretação de query' },
          { status: 400 }
        );
      case 'P2017':
        return NextResponse.json(
          { error: 'Registros não conectados' },
          { status: 400 }
        );
      case 'P2018':
        return NextResponse.json(
          { error: 'Registros conectados requeridos não encontrados' },
          { status: 404 }
        );
      case 'P2019':
        return NextResponse.json(
          { error: 'Erro de entrada' },
          { status: 400 }
        );
      case 'P2020':
        return NextResponse.json(
          { error: 'Valor fora do intervalo permitido' },
          { status: 400 }
        );
      case 'P2021':
        return NextResponse.json(
          { error: 'Tabela não existe no banco de dados' },
          { status: 500 }
        );
      case 'P2022':
        return NextResponse.json(
          { error: 'Coluna não existe no banco de dados' },
          { status: 500 }
        );
      case 'P2023':
        return NextResponse.json(
          { error: 'Dados inconsistentes na coluna' },
          { status: 500 }
        );
      case 'P2024':
        return NextResponse.json(
          { error: 'Timeout ao conectar ao banco de dados' },
          { status: 504 }
        );
      case 'P2025':
        return NextResponse.json(
          { error: 'Registro não encontrado' },
          { status: 404 }
        );
      case 'P2026':
        return NextResponse.json(
          { error: 'Provedor de banco não suporta esta operação' },
          { status: 400 }
        );
      case 'P2027':
        return NextResponse.json(
          { error: 'Múltiplos erros no banco de dados' },
          { status: 500 }
        );
      default:
        return NextResponse.json(
          { error: 'Erro no banco de dados', code: error.code },
          { status: 500 }
        );
    }
  }

  // Erro de validação
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { error: 'Dados inválidos' },
      { status: 400 }
    );
  }

  // Erro genérico
  return NextResponse.json(
    {
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    },
    { status: 500 }
  );
}
