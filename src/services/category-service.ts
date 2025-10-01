// =====================================================
// SERVIÇO DE CATEGORIAS - SISTEMA HIERÁRQUICO
// =====================================================

import { db } from '../config/database';
import { eventSystem, EventType } from '../events/event-system';
import {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryWithChildren,
  CategoryTree,
  UUID,
  PaginatedResult,
  PaginationParams,
  ApiResponse
} from '../types/database';

// =====================================================
// CLASSE DE SERVIÇO DE CATEGORIAS
// =====================================================

export class CategoryService {
  private static instance: CategoryService;

  private constructor() {}

  /**
   * Singleton pattern
   */
  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  // =====================================================
  // MÉTODOS DE CRIAÇÃO
  // =====================================================

  /**
   * Cria uma nova categoria
   */
  public async createCategory(categoryData: CreateCategoryInput): Promise<ApiResponse<Category>> {
    try {
      // Validar dados de entrada
      const validation = await this.validateCreateCategoryInput(categoryData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados inválidos',
          errors: validation.errors
        };
      }

      // Verificar se usuário existe
      const userExists = await this.checkUserExists(categoryData.user_id);
      if (!userExists) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      // Se é subcategoria, verificar se categoria pai existe
      if (categoryData.parent_id) {
        const parentCategory = await this.findCategoryById(categoryData.parent_id);
        if (!parentCategory) {
          return {
            success: false,
            error: 'Categoria pai não encontrada'
          };
        }

        // Verificar se categoria pai pertence ao mesmo usuário
        if (parentCategory.user_id !== categoryData.user_id) {
          return {
            success: false,
            error: 'Categoria pai deve pertencer ao mesmo usuário'
          };
        }

        // Verificar se categoria pai não é uma subcategoria (máximo 2 níveis)
        if (parentCategory.parent_id) {
          return {
            success: false,
            error: 'Não é possível criar subcategoria de uma subcategoria'
          };
        }
      }

      // Verificar se já existe categoria com o mesmo nome para o usuário
      const existingCategory = await this.findCategoryByName(categoryData.user_id, categoryData.name, categoryData.parent_id);
      if (existingCategory) {
        return {
          success: false,
          error: 'Já existe uma categoria com este nome'
        };
      }

      // Inserir categoria no banco
      const query = `
        INSERT INTO categories (user_id, name, description, color, icon, parent_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING *
      `;

      const values = [
        categoryData.user_id,
        categoryData.name,
        categoryData.description || null,
        categoryData.color || '#666666',
        categoryData.icon || null,
        categoryData.parent_id || null
      ];

      const result = await db.queryOne<Category>(query, values);

      if (!result) {
        return {
          success: false,
          error: 'Erro ao criar categoria'
        };
      }

      // Emitir evento de criação
      await eventSystem.emit(
        EventType.CATEGORY_CREATED,
        'category',
        result.id,
        { category: result },
        { user_id: result.user_id, source: 'category-service' }
      );

      console.log('✅ Categoria criada com sucesso:', result.id);

      return {
        success: true,
        data: result,
        message: 'Categoria criada com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao criar categoria:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // =====================================================
  // MÉTODOS DE LEITURA
  // =====================================================

  /**
   * Busca categoria por ID
   */
  public async findCategoryById(categoryId: UUID): Promise<Category | null> {
    try {
      const query = 'SELECT * FROM categories WHERE id = $1 AND is_active = true';
      return await db.queryOne<Category>(query, [categoryId]);
    } catch (error) {
      console.error('❌ Erro ao buscar categoria por ID:', error);
      return null;
    }
  }

  /**
   * Busca categoria por nome
   */
  public async findCategoryByName(userId: UUID, name: string, parentId?: UUID): Promise<Category | null> {
    try {
      const query = `
        SELECT * FROM categories 
        WHERE user_id = $1 AND LOWER(name) = LOWER($2) 
        AND ($3::uuid IS NULL AND parent_id IS NULL OR parent_id = $3)
        AND is_active = true
      `;
      
      return await db.queryOne<Category>(query, [userId, name, parentId || null]);
    } catch (error) {
      console.error('❌ Erro ao buscar categoria por nome:', error);
      return null;
    }
  }

  /**
   * Lista categorias do usuário (apenas categorias principais)
   */
  public async listUserCategories(userId: UUID, params: PaginationParams = {}): Promise<PaginatedResult<Category>> {
    try {
      const limit = Math.min(params.limit || 50, 200);
      const offset = params.offset || 0;

      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM categories 
        WHERE user_id = $1 AND parent_id IS NULL AND is_active = true
      `;
      
      const countResult = await db.queryOne<{ total: string }>(countQuery, [userId]);
      const total = parseInt(countResult?.total || '0');

      // Query para buscar dados
      const dataQuery = `
        SELECT * FROM categories 
        WHERE user_id = $1 AND parent_id IS NULL AND is_active = true
        ORDER BY name
        LIMIT $2 OFFSET $3
      `;

      const categories = await db.query<Category>(dataQuery, [userId, limit, offset]);

      return {
        data: categories,
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        total_pages: Math.ceil(total / limit),
        has_next: offset + limit < total,
        has_previous: offset > 0
      };

    } catch (error) {
      console.error('❌ Erro ao listar categorias do usuário:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: params.limit || 50,
        total_pages: 0,
        has_next: false,
        has_previous: false
      };
    }
  }

  /**
   * Lista subcategorias de uma categoria
   */
  public async listSubcategories(parentId: UUID): Promise<Category[]> {
    try {
      const query = `
        SELECT * FROM categories 
        WHERE parent_id = $1 AND is_active = true
        ORDER BY name
      `;

      return await db.query<Category>(query, [parentId]);

    } catch (error) {
      console.error('❌ Erro ao listar subcategorias:', error);
      return [];
    }
  }

  /**
   * Obtém árvore completa de categorias do usuário
   */
  public async getCategoryTree(userId: UUID): Promise<CategoryTree[]> {
    try {
      // Buscar todas as categorias do usuário
      const query = `
        SELECT * FROM categories 
        WHERE user_id = $1 AND is_active = true
        ORDER BY parent_id NULLS FIRST, name
      `;

      const allCategories = await db.query<Category>(query, [userId]);

      // Organizar em árvore
      const categoryMap = new Map<UUID, CategoryWithChildren>();
      const rootCategories: CategoryTree[] = [];

      // Primeiro, criar o mapa de todas as categorias
      allCategories.forEach(category => {
        categoryMap.set(category.id, {
          ...category,
          children: []
        });
      });

      // Depois, organizar a hierarquia
      allCategories.forEach(category => {
        const categoryWithChildren = categoryMap.get(category.id)!;

        if (category.parent_id) {
          // É uma subcategoria
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(categoryWithChildren);
          }
        } else {
          // É uma categoria principal
          rootCategories.push(categoryWithChildren);
        }
      });

      return rootCategories;

    } catch (error) {
      console.error('❌ Erro ao obter árvore de categorias:', error);
      return [];
    }
  }

  /**
   * Busca categorias por texto
   */
  public async searchCategories(userId: UUID, searchTerm: string, limit: number = 20): Promise<Category[]> {
    try {
      const query = `
        SELECT c.*, p.name as parent_name
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        WHERE c.user_id = $1 
        AND c.is_active = true
        AND (
          LOWER(c.name) LIKE LOWER($2) OR 
          LOWER(c.description) LIKE LOWER($2)
        )
        ORDER BY 
          CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END,
          c.name
        LIMIT $3
      `;

      const searchPattern = `%${searchTerm}%`;
      return await db.query<Category>(query, [userId, searchPattern, limit]);

    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return [];
    }
  }

  // =====================================================
  // MÉTODOS DE ATUALIZAÇÃO
  // =====================================================

  /**
   * Atualiza dados da categoria
   */
  public async updateCategory(categoryId: UUID, updateData: UpdateCategoryInput): Promise<ApiResponse<Category>> {
    try {
      // Verificar se categoria existe
      const existingCategory = await this.findCategoryById(categoryId);
      if (!existingCategory) {
        return {
          success: false,
          error: 'Categoria não encontrada'
        };
      }

      // Validar dados de entrada
      const validation = await this.validateUpdateCategoryInput(updateData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados inválidos',
          errors: validation.errors
        };
      }

      // Se está alterando o nome, verificar duplicatas
      if (updateData.name && updateData.name !== existingCategory.name) {
        const existingWithName = await this.findCategoryByName(
          existingCategory.user_id, 
          updateData.name, 
          existingCategory.parent_id
        );
        
        if (existingWithName && existingWithName.id !== categoryId) {
          return {
            success: false,
            error: 'Já existe uma categoria com este nome'
          };
        }
      }

      // Se está alterando categoria pai, validar
      if (updateData.parent_id !== undefined) {
        if (updateData.parent_id) {
          // Verificar se nova categoria pai existe
          const newParent = await this.findCategoryById(updateData.parent_id);
          if (!newParent) {
            return {
              success: false,
              error: 'Nova categoria pai não encontrada'
            };
          }

          // Verificar se nova categoria pai pertence ao mesmo usuário
          if (newParent.user_id !== existingCategory.user_id) {
            return {
              success: false,
              error: 'Nova categoria pai deve pertencer ao mesmo usuário'
            };
          }

          // Verificar se não está tentando criar loop (categoria pai não pode ser filha)
          if (newParent.parent_id === categoryId) {
            return {
              success: false,
              error: 'Não é possível criar referência circular'
            };
          }

          // Verificar se categoria pai não é uma subcategoria
          if (newParent.parent_id) {
            return {
              success: false,
              error: 'Não é possível criar subcategoria de uma subcategoria'
            };
          }

          // Se categoria tem filhos, não pode virar subcategoria
          const children = await this.listSubcategories(categoryId);
          if (children.length > 0) {
            return {
              success: false,
              error: 'Categoria com subcategorias não pode virar subcategoria'
            };
          }
        }
      }

      // Construir query de atualização dinamicamente
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateData.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(updateData.name);
      }

      if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(updateData.description);
      }

      if (updateData.color !== undefined) {
        updateFields.push(`color = $${paramIndex++}`);
        values.push(updateData.color);
      }

      if (updateData.icon !== undefined) {
        updateFields.push(`icon = $${paramIndex++}`);
        values.push(updateData.icon);
      }

      if (updateData.parent_id !== undefined) {
        updateFields.push(`parent_id = $${paramIndex++}`);
        values.push(updateData.parent_id);
      }

      if (updateData.is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(updateData.is_active);
      }

      if (updateFields.length === 0) {
        return {
          success: false,
          error: 'Nenhum campo para atualizar'
        };
      }

      // Adicionar updated_at
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(categoryId);

      const query = `
        UPDATE categories 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.queryOne<Category>(query, values);

      if (!result) {
        return {
          success: false,
          error: 'Erro ao atualizar categoria'
        };
      }

      // Emitir evento de atualização
      await eventSystem.emit(
        EventType.CATEGORY_UPDATED,
        'category',
        categoryId,
        { 
          old_data: existingCategory,
          new_data: result 
        },
        { user_id: result.user_id, source: 'category-service' }
      );

      console.log('✅ Categoria atualizada com sucesso:', categoryId);

      return {
        success: true,
        data: result,
        message: 'Categoria atualizada com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar categoria:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // =====================================================
  // MÉTODOS DE EXCLUSÃO
  // =====================================================

  /**
   * Desativa categoria (soft delete)
   */
  public async deactivateCategory(categoryId: UUID): Promise<ApiResponse<void>> {
    try {
      const existingCategory = await this.findCategoryById(categoryId);
      if (!existingCategory) {
        return {
          success: false,
          error: 'Categoria não encontrada'
        };
      }

      // Verificar se categoria tem transações associadas
      const hasTransactions = await this.checkCategoryHasTransactions(categoryId);
      if (hasTransactions) {
        return {
          success: false,
          error: 'Não é possível desativar categoria que possui transações'
        };
      }

      // Desativar categoria e suas subcategorias
      await db.transaction(async (client) => {
        // Desativar subcategorias primeiro
        await client.query(
          'UPDATE categories SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE parent_id = $1',
          [categoryId]
        );

        // Desativar categoria principal
        await client.query(
          'UPDATE categories SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [categoryId]
        );
      });

      // Emitir evento de desativação
      await eventSystem.emit(
        EventType.CATEGORY_DELETED,
        'category',
        categoryId,
        { category: existingCategory },
        { user_id: existingCategory.user_id, source: 'category-service' }
      );

      console.log('✅ Categoria desativada com sucesso:', categoryId);

      return {
        success: true,
        message: 'Categoria desativada com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao desativar categoria:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Reativa categoria
   */
  public async reactivateCategory(categoryId: UUID): Promise<ApiResponse<Category>> {
    try {
      const query = `
        UPDATE categories 
        SET is_active = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.queryOne<Category>(query, [categoryId]);

      if (!result) {
        return {
          success: false,
          error: 'Categoria não encontrada'
        };
      }

      console.log('✅ Categoria reativada com sucesso:', categoryId);

      return {
        success: true,
        data: result,
        message: 'Categoria reativada com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao reativar categoria:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // =====================================================
  // MÉTODOS DE RELATÓRIOS E ESTATÍSTICAS
  // =====================================================

  /**
   * Obtém estatísticas de uso das categorias
   */
  public async getCategoryUsageStats(userId: UUID, startDate?: string, endDate?: string): Promise<{
    category_id: UUID;
    category_name: string;
    transaction_count: number;
    total_amount: string;
    avg_amount: string;
  }[]> {
    try {
      const whereConditions = ['t.user_id = $1', 't.category_id IS NOT NULL'];
      const queryParams: any[] = [userId];
      let paramIndex = 2;

      if (startDate) {
        whereConditions.push(`t.transaction_date >= $${paramIndex++}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push(`t.transaction_date <= $${paramIndex++}`);
        queryParams.push(endDate);
      }

      const query = `
        SELECT 
          c.id as category_id,
          c.name as category_name,
          COUNT(t.id) as transaction_count,
          SUM(t.amount) as total_amount,
          AVG(t.amount) as avg_amount
        FROM categories c
        INNER JOIN transactions t ON c.id = t.category_id
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY c.id, c.name
        ORDER BY total_amount DESC
      `;

      const results = await db.query<{
        category_id: UUID;
        category_name: string;
        transaction_count: string;
        total_amount: string;
        avg_amount: string;
      }>(query, queryParams);

      return results.map(row => ({
        category_id: row.category_id,
        category_name: row.category_name,
        transaction_count: parseInt(row.transaction_count),
        total_amount: row.total_amount,
        avg_amount: parseFloat(row.avg_amount).toFixed(2)
      }));

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de categorias:', error);
      return [];
    }
  }

  // =====================================================
  // MÉTODOS DE VALIDAÇÃO
  // =====================================================

  /**
   * Valida dados de criação de categoria
   */
  private async validateCreateCategoryInput(data: CreateCategoryInput): Promise<{
    isValid: boolean;
    errors?: Record<string, string[]>;
  }> {
    const errors: Record<string, string[]> = {};

    // Validar nome
    if (!data.name || data.name.trim().length < 2) {
      errors.name = ['Nome da categoria deve ter pelo menos 2 caracteres'];
    }

    if (data.name && data.name.length > 50) {
      errors.name = ['Nome da categoria não pode ter mais de 50 caracteres'];
    }

    // Validar cor (formato hex)
    if (data.color && !this.isValidHexColor(data.color)) {
      errors.color = ['Cor deve estar no formato hexadecimal (#RRGGBB)'];
    }

    // Validar descrição
    if (data.description && data.description.length > 200) {
      errors.description = ['Descrição não pode ter mais de 200 caracteres'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  /**
   * Valida dados de atualização de categoria
   */
  private async validateUpdateCategoryInput(data: UpdateCategoryInput): Promise<{
    isValid: boolean;
    errors?: Record<string, string[]>;
  }> {
    const errors: Record<string, string[]> = {};

    // Validar nome (se fornecido)
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length < 2) {
        errors.name = ['Nome da categoria deve ter pelo menos 2 caracteres'];
      }

      if (data.name.length > 50) {
        errors.name = ['Nome da categoria não pode ter mais de 50 caracteres'];
      }
    }

    // Validar cor (se fornecida)
    if (data.color !== undefined && data.color && !this.isValidHexColor(data.color)) {
      errors.color = ['Cor deve estar no formato hexadecimal (#RRGGBB)'];
    }

    // Validar descrição (se fornecida)
    if (data.description !== undefined && data.description && data.description.length > 200) {
      errors.description = ['Descrição não pode ter mais de 200 caracteres'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  // =====================================================
  // MÉTODOS UTILITÁRIOS
  // =====================================================

  /**
   * Verifica se usuário existe
   */
  private async checkUserExists(userId: UUID): Promise<boolean> {
    try {
      const query = 'SELECT 1 FROM users WHERE id = $1 AND is_active = true';
      const result = await db.queryOne(query, [userId]);
      return result !== null;
    } catch (error) {
      console.error('❌ Erro ao verificar existência do usuário:', error);
      return false;
    }
  }

  /**
   * Verifica se categoria tem transações associadas
   */
  private async checkCategoryHasTransactions(categoryId: UUID): Promise<boolean> {
    try {
      const query = 'SELECT 1 FROM transactions WHERE category_id = $1 LIMIT 1';
      const result = await db.queryOne(query, [categoryId]);
      return result !== null;
    } catch (error) {
      console.error('❌ Erro ao verificar transações da categoria:', error);
      return false;
    }
  }

  /**
   * Valida formato de cor hexadecimal
   */
  private isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  /**
   * Conta total de categorias do usuário
   */
  public async getTotalUserCategories(userId: UUID): Promise<number> {
    try {
      const result = await db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM categories WHERE user_id = $1 AND is_active = true', [userId]);
      return parseInt(result?.count || '0');
    } catch (error) {
      console.error('❌ Erro ao contar categorias:', error);
      return 0;
    }
  }

  /**
   * Cria categorias padrão para novo usuário
   */
  public async createDefaultCategories(userId: UUID): Promise<void> {
    try {
      const defaultCategories = [
        { name: 'Alimentação', color: '#FF6B6B', icon: '🍽️', description: 'Gastos com comida e bebida' },
        { name: 'Transporte', color: '#4ECDC4', icon: '🚗', description: 'Gastos com transporte' },
        { name: 'Moradia', color: '#45B7D1', icon: '🏠', description: 'Aluguel, condomínio, IPTU' },
        { name: 'Saúde', color: '#96CEB4', icon: '🏥', description: 'Médicos, remédios, plano de saúde' },
        { name: 'Educação', color: '#FFEAA7', icon: '📚', description: 'Cursos, livros, material escolar' },
        { name: 'Lazer', color: '#DDA0DD', icon: '🎉', description: 'Entretenimento e diversão' },
        { name: 'Compras', color: '#FFB6C1', icon: '🛍️', description: 'Roupas, eletrônicos, diversos' },
        { name: 'Salário', color: '#90EE90', icon: '💰', description: 'Salário e rendimentos' },
        { name: 'Investimentos', color: '#87CEEB', icon: '📈', description: 'Rendimentos de investimentos' }
      ];

      for (const category of defaultCategories) {
        await this.createCategory({
          user_id: userId,
          ...category
        });
      }

      console.log('✅ Categorias padrão criadas para usuário:', userId);

    } catch (error) {
      console.error('❌ Erro ao criar categorias padrão:', error);
    }
  }
}

// =====================================================
// INSTÂNCIA GLOBAL
// =====================================================

export const categoryService = CategoryService.getInstance();
