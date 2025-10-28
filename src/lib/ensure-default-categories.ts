import { prisma } from '@/lib/prisma';

const defaultCategories = [
  // Receitas
  { name: 'Salário', type: 'RECEITA', color: '#10B981', icon: '💰' },
  { name: 'Freelance', type: 'RECEITA', color: '#059669', icon: '💼' },
  { name: 'Investimentos', type: 'RECEITA', color: '#34D399', icon: '📈' },
  { name: 'Depósito', type: 'RECEITA', color: '#6EE7B7', icon: '💵' },
  { name: 'Outros', type: 'RECEITA', color: '#A7F3D0', icon: '📥' },
  
  // Despesas
  { name: 'Alimentação', type: 'DESPESA', color: '#EF4444', icon: '🍔' },
  { name: 'Transporte', type: 'DESPESA', color: '#DC2626', icon: '🚗' },
  { name: 'Moradia', type: 'DESPESA', color: '#B91C1C', icon: '🏠' },
  { name: 'Saúde', type: 'DESPESA', color: '#991B1B', icon: '🏥' },
  { name: 'Educação', type: 'DESPESA', color: '#7F1D1D', icon: '📚' },
  { name: 'Lazer', type: 'DESPESA', color: '#F59E0B', icon: '🎮' },
  { name: 'Compras', type: 'DESPESA', color: '#D97706', icon: '🛍️' },
  { name: 'Contas', type: 'DESPESA', color: '#B45309', icon: '📄' },
  { name: 'Outros', type: 'DESPESA', color: '#6B7280', icon: '📤' },
];

/**
 * Garante que o usuário tenha categorias padrão
 * Cria automaticamente se não existirem
 */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  try {
    // Verificar se o usuário já tem categorias
    const existingCategories = await prisma.category.count({
      where: { userId }
    });

    // Se já tem categorias, não fazer nada
    if (existingCategories > 0) {
      console.log(`✅ [ensureDefaultCategories] Usuário ${userId} já tem ${existingCategories} categorias`);
      return;
    }

    console.log(`📝 [ensureDefaultCategories] Criando categorias padrão para usuário ${userId}...`);

    // Criar todas as categorias padrão
    await prisma.category.createMany({
      data: defaultCategories.map(cat => ({
        userId,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
        isActive: true,
        isDefault: true
      }))
    });

    console.log(`✅ [ensureDefaultCategories] ${defaultCategories.length} categorias criadas para usuário ${userId}`);
  } catch (error) {
    console.error(`❌ [ensureDefaultCategories] Erro ao criar categorias para usuário ${userId}:`, error);
    throw error;
  }
}

/**
 * Busca ou cria uma categoria específica para o usuário
 */
export async function getOrCreateCategory(
  userId: string,
  name: string,
  type: 'RECEITA' | 'DESPESA'
): Promise<any> {
  try {
    // Tentar buscar categoria existente
    let category = await prisma.category.findFirst({
      where: {
        userId,
        name,
        type
      }
    });

    // Se não existe, criar
    if (!category) {
      const defaultCat = defaultCategories.find(c => c.name === name && c.type === type);
      
      category = await prisma.category.create({
        data: {
          name,
          type,
          color: defaultCat?.color || '#6B7280',
          icon: defaultCat?.icon || '📁',
          isActive: true,
          isDefault: true,
          user: {
            connect: { id: userId }
          }
        }
      });

      console.log(`✅ [getOrCreateCategory] Categoria "${name}" criada para usuário ${userId}`);
    }

    return category;
  } catch (error) {
    console.error(`❌ [getOrCreateCategory] Erro ao buscar/criar categoria "${name}":`, error);
    throw error;
  }
}
