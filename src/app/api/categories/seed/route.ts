import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

// 🇧🇷 CATEGORIAS COMPLETAS PARA O BRASIL (45 categorias)
const COMPLETE_CATEGORIES = [
  // RECEITAS (10)
  { name: 'Salário', type: 'RECEITA', icon: '💰', color: '#10b981' },
  { name: 'Freelance', type: 'RECEITA', icon: '💼', color: '#3b82f6' },
  { name: 'Investimentos', type: 'RECEITA', icon: '📈', color: '#8b5cf6' },
  { name: 'Aluguel Recebido', type: 'RECEITA', icon: '🏠', color: '#06b6d4' },
  { name: 'Pensão', type: 'RECEITA', icon: '👨‍👩‍👧', color: '#14b8a6' },
  { name: 'Bonificação', type: 'RECEITA', icon: '🎁', color: '#22c55e' },
  { name: 'Venda', type: 'RECEITA', icon: '🏷️', color: '#84cc16' },
  { name: 'Reembolso', type: 'RECEITA', icon: '💵', color: '#10b981' },
  { name: 'Prêmio', type: 'RECEITA', icon: '🏆', color: '#f59e0b' },
  { name: 'Outras Receitas', type: 'RECEITA', icon: '💸', color: '#6366f1' },

  // DESPESAS (35)
  { name: 'Alimentação', type: 'DESPESA', icon: '🍔', color: '#ef4444' },
  { name: 'Supermercado', type: 'DESPESA', icon: '🛒', color: '#dc2626' },
  { name: 'Delivery', type: 'DESPESA', icon: '🍕', color: '#f97316' },
  { name: 'Padaria', type: 'DESPESA', icon: '🥖', color: '#fb923c' },
  { name: 'Transporte', type: 'DESPESA', icon: '🚗', color: '#f59e0b' },
  { name: 'Combustível', type: 'DESPESA', icon: '⛽', color: '#eab308' },
  { name: 'Uber/Taxi', type: 'DESPESA', icon: '🚕', color: '#facc15' },
  { name: 'Estacionamento', type: 'DESPESA', icon: '🅿️', color: '#fde047' },
  { name: 'Manutenção Veículo', type: 'DESPESA', icon: '🔧', color: '#fef08a' },
  { name: 'Aluguel', type: 'DESPESA', icon: '🏠', color: '#8b5cf6' },
  { name: 'Condomínio', type: 'DESPESA', icon: '🏢', color: '#a78bfa' },
  { name: 'Energia', type: 'DESPESA', icon: '💡', color: '#c4b5fd' },
  { name: 'Água', type: 'DESPESA', icon: '💧', color: '#06b6d4' },
  { name: 'Internet/TV', type: 'DESPESA', icon: '📺', color: '#0ea5e9' },
  { name: 'Saúde', type: 'DESPESA', icon: '🏥', color: '#ec4899' },
  { name: 'Farmácia', type: 'DESPESA', icon: '💊', color: '#f472b6' },
  { name: 'Plano de Saúde', type: 'DESPESA', icon: '🩺', color: '#f9a8d4' },
  { name: 'Academia', type: 'DESPESA', icon: '💪', color: '#fda4af' },
  { name: 'Educação', type: 'DESPESA', icon: '📚', color: '#3b82f6' },
  { name: 'Material Escolar', type: 'DESPESA', icon: '✏️', color: '#60a5fa' },
  { name: 'Cursos Online', type: 'DESPESA', icon: '💻', color: '#93c5fd' },
  { name: 'Lazer', type: 'DESPESA', icon: '🎮', color: '#f97316' },
  { name: 'Cinema/Teatro', type: 'DESPESA', icon: '🎬', color: '#fb923c' },
  { name: 'Streaming', type: 'DESPESA', icon: '📺', color: '#fdba74' },
  { name: 'Viagens', type: 'DESPESA', icon: '✈️', color: '#fed7aa' },
  { name: 'Hobbies', type: 'DESPESA', icon: '🎨', color: '#ffedd5' },
  { name: 'Roupas', type: 'DESPESA', icon: '👕', color: '#a855f7' },
  { name: 'Calçados', type: 'DESPESA', icon: '👟', color: '#c084fc' },
  { name: 'Beleza', type: 'DESPESA', icon: '💄', color: '#e9d5ff' },
  { name: 'Telefone', type: 'DESPESA', icon: '📱', color: '#6366f1' },
  { name: 'Seguros', type: 'DESPESA', icon: '🛡️', color: '#818cf8' },
  { name: 'Impostos', type: 'DESPESA', icon: '📄', color: '#a5b4fc' },
  { name: 'Pets', type: 'DESPESA', icon: '🐕', color: '#c7d2fe' },
  { name: 'Doações', type: 'DESPESA', icon: '❤️', color: '#e0e7ff' },
  { name: 'Outros Gastos', type: 'DESPESA', icon: '📦', color: '#64748b' },
];

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = auth.userId;

    // Verificar categorias existentes
    const existingCategories = await prisma.category.findMany({
      where: { userId }
    });

    let created = 0;
    let skipped = 0;

    for (const category of COMPLETE_CATEGORIES) {
      // Verificar se já existe
      const exists = existingCategories.find(
        c => c.name === category.name && c.type === category.type
      );

      if (exists) {
        skipped++;
        continue;
      }

      // Criar categoria
      await prisma.category.create({
        data: {
          userId,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          isDefault: true,
          isActive: true
        }
      });

      created++;
    }

    return NextResponse.json({
      success: true,
      message: `${created} categorias criadas, ${skipped} já existiam`,
      total: COMPLETE_CATEGORIES.length,
      created,
      skipped
    });

  } catch (error) {
    console.error('Erro ao criar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao criar categorias' },
      { status: 500 }
    );
  }
}
