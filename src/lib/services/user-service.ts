// =====================================================
// SERVIÇO DE USUÁRIOS - CRUD COMPLETO
// =====================================================

import bcrypt from 'bcrypt';
import { db } from '../config/database';
import { eventSystem, EventType } from '../events/event-system';
import {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserProfile,
  UUID,
  PaginatedResult,
  PaginationParams,
  ApiResponse
} from '../types/database';

// =====================================================
// CLASSE DE SERVIÇO DE USUÁRIOS
// =====================================================

export class UserService {
  private static instance: UserService;
  private readonly saltRounds = 12;

  private constructor() {}

  /**
   * Singleton pattern
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // =====================================================
  // MÉTODOS DE CRIAÇÃO
  // =====================================================

  /**
   * Cria um novo usuário
   */
  public async createUser(userData: CreateUserInput): Promise<ApiResponse<UserProfile>> {
    try {
      // Validar dados de entrada
      const validation = this.validateCreateUserInput(userData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados inválidos',
          errors: validation.errors
        };
      }

      // Verificar se email já existe
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'Email já está em uso'
        };
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(userData.password, this.saltRounds);

      // Inserir usuário no banco
      const query = `
        INSERT INTO users (email, password_hash, first_name, last_name, phone, avatar_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, phone, avatar_url, is_active, email_verified, created_at, updated_at
      `;

      const values = [
        userData.email,
        passwordHash,
        userData.first_name,
        userData.last_name,
        userData.phone || null,
        userData.avatar_url || null
      ];

      const result = await db.queryOne<UserProfile>(query, values);

      if (!result) {
        return {
          success: false,
          error: 'Erro ao criar usuário'
        };
      }

      // Emitir evento de criação
      await eventSystem.emit(
        EventType.USER_CREATED,
        'user',
        result.id,
        { user: result },
        { user_id: result.id, source: 'user-service' }
      );

      
      return {
        success: true,
        data: result,
        message: 'Usuário criado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
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
   * Busca usuário por ID
   */
  public async findById(userId: UUID): Promise<UserProfile | null> {
    try {
      const query = `
        SELECT id, email, first_name, last_name, phone, avatar_url,
               is_active, email_verified, created_at, updated_at
        FROM users
        WHERE id = $1 AND is_active = true
      `;

      return await db.queryOne<UserProfile>(query, [userId]);
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por ID:', error);
      return null;
    }
  }

  /**
   * Busca usuário por email
   */
  public async findByEmail(email: string): Promise<User | null> {
    try {
      const query = `
        SELECT * FROM users
        WHERE email = $1 AND is_active = true
      `;

      return await db.queryOne<User>(query, [email]);
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error);
      return null;
    }
  }

  /**
   * Lista usuários com paginação
   */
  public async listUsers(params: PaginationParams = {}): Promise<PaginatedResult<UserProfile>> {
    try {
      const limit = Math.min(params.limit || 20, 100);
      const offset = params.offset || 0;

      // Query para contar total
      const countQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
      const countResult = await db.queryOne<{ total: string }>(countQuery);
      const total = parseInt(countResult?.total || '0');

      // Query para buscar dados
      const dataQuery = `
        SELECT id, email, first_name, last_name, phone, avatar_url,
               is_active, email_verified, created_at, updated_at
        FROM users
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const users = await db.query<UserProfile>(dataQuery, [limit, offset]);

      return {
        data: users,
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        total_pages: Math.ceil(total / limit),
        has_next: offset + limit < total,
        has_previous: offset > 0
      };

    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: params.limit || 20,
        total_pages: 0,
        has_next: false,
        has_previous: false
      };
    }
  }

  /**
   * Busca usuários por nome
   */
  public async searchByName(searchTerm: string, limit: number = 10): Promise<UserProfile[]> {
    try {
      const query = `
        SELECT id, email, first_name, last_name, phone, avatar_url,
               is_active, email_verified, created_at, updated_at
        FROM users
        WHERE is_active = true
        AND (
          LOWER(first_name) LIKE LOWER($1) OR
          LOWER(last_name) LIKE LOWER($1) OR
          LOWER(first_name || ' ' || last_name) LIKE LOWER($1)
        )
        ORDER BY first_name, last_name
        LIMIT $2
      `;

      const searchPattern = `%${searchTerm}%`;
      return await db.query<UserProfile>(query, [searchPattern, limit]);

    } catch (error) {
      console.error('❌ Erro ao buscar usuários por nome:', error);
      return [];
    }
  }

  // =====================================================
  // MÉTODOS DE ATUALIZAÇÃO
  // =====================================================

  /**
   * Atualiza dados do usuário
   */
  public async updateUser(userId: UUID, updateData: UpdateUserInput): Promise<ApiResponse<UserProfile>> {
    try {
      // Verificar se usuário existe
      const existingUser = await this.findById(userId);
      if (!existingUser) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      // Validar dados de entrada
      const validation = this.validateUpdateUserInput(updateData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados inválidos',
          errors: validation.errors
        };
      }

      // Construir query de atualização dinamicamente
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateData.first_name !== undefined) {
        updateFields.push(`first_name = $${paramIndex++}`);
        values.push(updateData.first_name);
      }

      if (updateData.last_name !== undefined) {
        updateFields.push(`last_name = $${paramIndex++}`);
        values.push(updateData.last_name);
      }

      if (updateData.phone !== undefined) {
        updateFields.push(`phone = $${paramIndex++}`);
        values.push(updateData.phone);
      }

      if (updateData.avatar_url !== undefined) {
        updateFields.push(`avatar_url = $${paramIndex++}`);
        values.push(updateData.avatar_url);
      }

      if (updateData.is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(updateData.is_active);
      }

      if (updateData.email_verified !== undefined) {
        updateFields.push(`email_verified = $${paramIndex++}`);
        values.push(updateData.email_verified);
      }

      if (updateFields.length === 0) {
        return {
          success: false,
          error: 'Nenhum campo para atualizar'
        };
      }

      // Adicionar updated_at
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, first_name, last_name, phone, avatar_url,
                  is_active, email_verified, created_at, updated_at
      `;

      const result = await db.queryOne<UserProfile>(query, values);

      if (!result) {
        return {
          success: false,
          error: 'Erro ao atualizar usuário'
        };
      }

      // Emitir evento de atualização
      await eventSystem.emit(
        EventType.USER_UPDATED,
        'user',
        userId,
        {
          old_data: existingUser,
          new_data: result
        },
        { user_id: userId, source: 'user-service' }
      );

      
      return {
        success: true,
        data: result,
        message: 'Usuário atualizado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Atualiza senha do usuário
   */
  public async updatePassword(userId: UUID, currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      // Buscar usuário com senha
      const user = await this.findByEmail((await this.findById(userId))?.email || '');
      if (!user) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Senha atual incorreta'
        };
      }

      // Validar nova senha
      if (!this.isValidPassword(newPassword)) {
        return {
          success: false,
          error: 'Nova senha não atende aos critérios de segurança'
        };
      }

      // Hash da nova senha
      const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Atualizar senha no banco
      const query = `
        UPDATE users
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      await db.query(query, [newPasswordHash, userId]);

      
      return {
        success: true,
        message: 'Senha atualizada com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar senha:', error);
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
   * Desativa usuário (soft delete)
   */
  public async deactivateUser(userId: UUID): Promise<ApiResponse<void>> {
    try {
      const existingUser = await this.findById(userId);
      if (!existingUser) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      const query = `
        UPDATE users
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await db.query(query, [userId]);

      // Emitir evento de desativação
      await eventSystem.emit(
        EventType.USER_DELETED,
        'user',
        userId,
        { user: existingUser },
        { user_id: userId, source: 'user-service' }
      );

      
      return {
        success: true,
        message: 'Usuário desativado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao desativar usuário:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Reativa usuário
   */
  public async reactivateUser(userId: UUID): Promise<ApiResponse<UserProfile>> {
    try {
      const query = `
        UPDATE users
        SET is_active = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, first_name, last_name, phone, avatar_url,
                  is_active, email_verified, created_at, updated_at
      `;

      const result = await db.queryOne<UserProfile>(query, [userId]);

      if (!result) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      
      return {
        success: true,
        data: result,
        message: 'Usuário reativado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao reativar usuário:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // =====================================================
  // MÉTODOS DE AUTENTICAÇÃO
  // =====================================================

  /**
   * Autentica usuário com email e senha
   */
  public async authenticate(email: string, password: string): Promise<ApiResponse<UserProfile>> {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'Credenciais inválidas'
        };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Credenciais inválidas'
        };
      }

      if (!user.is_active) {
        return {
          success: false,
          error: 'Conta desativada'
        };
      }

      // Retornar dados do usuário sem a senha
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        email_verified: user.email_verified,
        created_at: user.created_at
      };

      return {
        success: true,
        data: userProfile,
        message: 'Autenticação realizada com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // =====================================================
  // MÉTODOS DE VALIDAÇÃO
  // =====================================================

  /**
   * Valida dados de criação de usuário
   */
  private validateCreateUserInput(data: CreateUserInput): {
    isValid: boolean;
    errors?: Record<string, string[]>;
  } {
    const errors: Record<string, string[]> = {};

    // Validar email
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.email = ['Email inválido'];
    }

    // Validar senha
    if (!data.password || !this.isValidPassword(data.password)) {
      errors.password = ['Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número'];
    }

    // Validar nome
    if (!data.first_name || data.first_name.trim().length < 2) {
      errors.first_name = ['Nome deve ter pelo menos 2 caracteres'];
    }

    if (!data.last_name || data.last_name.trim().length < 2) {
      errors.last_name = ['Sobrenome deve ter pelo menos 2 caracteres'];
    }

    // Validar telefone (opcional)
    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.phone = ['Telefone inválido'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  /**
   * Valida dados de atualização de usuário
   */
  private validateUpdateUserInput(data: UpdateUserInput): {
    isValid: boolean;
    errors?: Record<string, string[]>;
  } {
    const errors: Record<string, string[]> = {};

    // Validar nome (se fornecido)
    if (data.first_name !== undefined && (!data.first_name || data.first_name.trim().length < 2)) {
      errors.first_name = ['Nome deve ter pelo menos 2 caracteres'];
    }

    if (data.last_name !== undefined && (!data.last_name || data.last_name.trim().length < 2)) {
      errors.last_name = ['Sobrenome deve ter pelo menos 2 caracteres'];
    }

    // Validar telefone (se fornecido)
    if (data.phone !== undefined && data.phone && !this.isValidPhone(data.phone)) {
      errors.phone = ['Telefone inválido'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  /**
   * Valida formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida força da senha
   */
  private isValidPassword(password: string): boolean {
    // Pelo menos 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Valida formato de telefone
   */
  private isValidPhone(phone: string): boolean {
    // Aceita formatos brasileiros
    const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
    return phoneRegex.test(phone);
  }

  // =====================================================
  // MÉTODOS UTILITÁRIOS
  // =====================================================

  /**
   * Conta total de usuários ativos
   */
  public async getTotalActiveUsers(): Promise<number> {
    try {
      const result = await db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE is_active = true');
      return parseInt(result?.count || '0');
    } catch (error) {
      console.error('❌ Erro ao contar usuários:', error);
      return 0;
    }
  }

  /**
   * Verifica se email está disponível
   */
  public async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const user = await this.findByEmail(email);
      return user === null;
    } catch (error) {
      console.error('❌ Erro ao verificar disponibilidade do email:', error);
      return false;
    }
  }
}

// =====================================================
// INSTÂNCIA GLOBAL
// =====================================================

export const userService = UserService.getInstance();
