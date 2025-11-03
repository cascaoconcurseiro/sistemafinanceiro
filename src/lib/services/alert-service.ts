// =====================================================
// SERVIÇO DE ALERTAS E NOTIFICAÇÕES
// =====================================================

import { db } from '../config/database';
import { eventSystem, EventType } from '../events/event-system';
import {
  Alert,
  CreateAlertInput,
  UpdateAlertInput,
  AlertType,
  UUID,
  PaginatedResult,
  PaginationParams,
  ApiResponse,
  Account,
  CreditCard,
  Transaction
} from '../types/database';

// =====================================================
// INTERFACES ESPECÍFICAS DO SERVIÇO
// =====================================================

interface AlertTriggerData {
  account_id?: UUID;
  credit_card_id?: UUID;
  current_balance?: number;
  current_limit_used?: number;
  transaction_amount?: number;
  threshold_value?: number;
}

interface AlertCheckResult {
  shouldTrigger: boolean;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// =====================================================
// CLASSE DE SERVIÇO DE ALERTAS
// =====================================================

export class AlertService {
  private static instance: AlertService;

  private constructor() {
    // Registrar listeners para eventos que podem gerar alertas
    this.setupEventListeners();
  }

  /**
   * Singleton pattern
   */
  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  // =====================================================
  // CONFIGURAÇÃO DE LISTENERS
  // =====================================================

  /**
   * Configura listeners para eventos que podem gerar alertas
   */
  private setupEventListeners(): void {
    // Listener para mudanças de saldo
    eventSystem.on(EventType.ACCOUNT_BALANCE_UPDATED, async (event) => {
      if (event.payload.account) {
        await this.checkBalanceAlerts(event.payload.account);
      }
    });

    // Listener para mudanças em cartão de crédito
    eventSystem.on(EventType.CREDIT_CARD_UPDATED, async (event) => {
      if (event.payload.credit_card) {
        await this.checkCreditCardAlerts(event.payload.credit_card);
      }
    });

    // Listener para transações
    eventSystem.on(EventType.TRANSACTION_CREATED, async (event) => {
      if (event.payload.transaction) {
        await this.checkTransactionAlerts(event.payload.transaction);
      }
    });

      }

  // =====================================================
  // MÉTODOS DE CRIAÇÃO
  // =====================================================

  /**
   * Cria um novo alerta
   */
  public async createAlert(alertData: CreateAlertInput): Promise<ApiResponse<Alert>> {
    try {
      // Validar dados de entrada
      const validation = await this.validateCreateAlertInput(alertData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados inválidos',
          errors: validation.errors
        };
      }

      // Verificar se usuário existe
      const userExists = await this.checkUserExists(alertData.user_id);
      if (!userExists) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      // Validar referências específicas do tipo de alerta
      const referenceValidation = await this.validateAlertReferences(alertData);
      if (!referenceValidation.isValid) {
        return {
          success: false,
          error: referenceValidation.error
        };
      }

      // Inserir alerta no banco
      const query = `
        INSERT INTO alerts (
          user_id, type, title, message, threshold_value,
          account_id, credit_card_id, is_active, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const values = [
        alertData.user_id,
        alertData.type,
        alertData.title,
        alertData.message,
        alertData.threshold_value || null,
        alertData.account_id || null,
        alertData.credit_card_id || null
      ];

      const result = await db.queryOne<Alert>(query, values);

      if (!result) {
        return {
          success: false,
          error: 'Erro ao criar alerta'
        };
      }

      // Emitir evento de criação
      await eventSystem.emit(
        EventType.ALERT_CREATED,
        'alert',
        result.id,
        { alert: result },
        { user_id: result.user_id, source: 'alert-service' }
      );

      
      return {
        success: true,
        data: result,
        message: 'Alerta criado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao criar alerta:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Cria alerta automático do sistema
   */
  public async createSystemAlert(
    userId: UUID,
    type: AlertType,
    title: string,
    message: string,
    triggerData: AlertTriggerData
  ): Promise<Alert | null> {
    try {
      const query = `
        INSERT INTO alerts (
          user_id, type, title, message, threshold_value,
          account_id, credit_card_id, is_system_generated,
          triggered_at, is_active, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const values = [
        userId,
        type,
        title,
        message,
        triggerData.threshold_value || null,
        triggerData.account_id || null,
        triggerData.credit_card_id || null
      ];

      const result = await db.queryOne<Alert>(query, values);

      if (result) {
        // Emitir evento de alerta disparado
        await eventSystem.emit(
          EventType.ALERT_TRIGGERED,
          'alert',
          result.id,
          { alert: result, trigger_data: triggerData },
          { user_id: userId, source: 'alert-service', is_system: true }
        );

        console.log('🚨 Alerta do sistema disparado:', result.id, '-', title);
      }

      return result;

    } catch (error) {
      console.error('❌ Erro ao criar alerta do sistema:', error);
      return null;
    }
  }

  // =====================================================
  // MÉTODOS DE LEITURA
  // =====================================================

  /**
   * Busca alerta por ID
   */
  public async findAlertById(alertId: UUID): Promise<Alert | null> {
    try {
      const query = 'SELECT * FROM alerts WHERE id = $1';
      return await db.queryOne<Alert>(query, [alertId]);
    } catch (error) {
      console.error('❌ Erro ao buscar alerta por ID:', error);
      return null;
    }
  }

  /**
   * Lista alertas do usuário
   */
  public async listUserAlerts(
    userId: UUID,
    params: PaginationParams & {
      type?: AlertType;
      is_read?: boolean;
      is_active?: boolean;
    } = {}
  ): Promise<PaginatedResult<Alert>> {
    try {
      const limit = Math.min(params.limit || 50, 200);
      const offset = params.offset || 0;

      // Construir condições WHERE
      const whereConditions = ['user_id = $1'];
      const queryParams: any[] = [userId];
      let paramIndex = 2;

      if (params.type) {
        whereConditions.push(`type = $${paramIndex++}`);
        queryParams.push(params.type);
      }

      if (params.is_read !== undefined) {
        whereConditions.push(`is_read = $${paramIndex++}`);
        queryParams.push(params.is_read);
      }

      if (params.is_active !== undefined) {
        whereConditions.push(`is_active = $${paramIndex++}`);
        queryParams.push(params.is_active);
      }

      const whereClause = whereConditions.join(' AND ');

      // Query para contar total
      const countQuery = `SELECT COUNT(*) as total FROM alerts WHERE ${whereClause}`;
      const countResult = await db.queryOne<{ total: string }>(countQuery, queryParams);
      const total = parseInt(countResult?.total || '0');

      // Query para buscar dados
      const dataQuery = `
        SELECT a.*,
               acc.name as account_name,
               cc.name as credit_card_name
        FROM alerts a
        LEFT JOIN accounts acc ON a.account_id = acc.id
        LEFT JOIN credit_cards cc ON a.credit_card_id = cc.id
        WHERE ${whereClause}
        ORDER BY
          CASE WHEN a.triggered_at IS NOT NULL THEN a.triggered_at ELSE a.created_at END DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);
      const alerts = await db.query<Alert>(dataQuery, queryParams);

      return {
        data: alerts,
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        total_pages: Math.ceil(total / limit),
        has_next: offset + limit < total,
        has_previous: offset > 0
      };

    } catch (error) {
      console.error('❌ Erro ao listar alertas do usuário:', error);
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
   * Lista alertas não lidos do usuário
   */
  public async getUnreadAlerts(userId: UUID): Promise<Alert[]> {
    try {
      const query = `
        SELECT a.*,
               acc.name as account_name,
               cc.name as credit_card_name
        FROM alerts a
        LEFT JOIN accounts acc ON a.account_id = acc.id
        LEFT JOIN credit_cards cc ON a.credit_card_id = cc.id
        WHERE a.user_id = $1 AND a.is_read = false AND a.is_active = true
        ORDER BY
          CASE WHEN a.triggered_at IS NOT NULL THEN a.triggered_at ELSE a.created_at END DESC
        LIMIT 50
      `;

      return await db.query<Alert>(query, [userId]);

    } catch (error) {
      console.error('❌ Erro ao buscar alertas não lidos:', error);
      return [];
    }
  }

  /**
   * Conta alertas não lidos
   */
  public async getUnreadAlertsCount(userId: UUID): Promise<number> {
    try {
      const result = await db.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM alerts WHERE user_id = $1 AND is_read = false AND is_active = true',
        [userId]
      );
      return parseInt(result?.count || '0');
    } catch (error) {
      console.error('❌ Erro ao contar alertas não lidos:', error);
      return 0;
    }
  }

  // =====================================================
  // MÉTODOS DE ATUALIZAÇÃO
  // =====================================================

  /**
   * Atualiza alerta
   */
  public async updateAlert(alertId: UUID, updateData: UpdateAlertInput): Promise<ApiResponse<Alert>> {
    try {
      const existingAlert = await this.findAlertById(alertId);
      if (!existingAlert) {
        return {
          success: false,
          error: 'Alerta não encontrado'
        };
      }

      // Validar dados de entrada
      const validation = await this.validateUpdateAlertInput(updateData);
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

      if (updateData.title !== undefined) {
        updateFields.push(`title = $${paramIndex++}`);
        values.push(updateData.title);
      }

      if (updateData.message !== undefined) {
        updateFields.push(`message = $${paramIndex++}`);
        values.push(updateData.message);
      }

      if (updateData.threshold_value !== undefined) {
        updateFields.push(`threshold_value = $${paramIndex++}`);
        values.push(updateData.threshold_value);
      }

      if (updateData.is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(updateData.is_active);
      }

      if (updateData.is_read !== undefined) {
        updateFields.push(`is_read = $${paramIndex++}`);
        values.push(updateData.is_read);

        if (updateData.is_read) {
          updateFields.push(`read_at = CURRENT_TIMESTAMP`);
        }
      }

      if (updateFields.length === 0) {
        return {
          success: false,
          error: 'Nenhum campo para atualizar'
        };
      }

      // Adicionar updated_at
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(alertId);

      const query = `
        UPDATE alerts
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.queryOne<Alert>(query, values);

      if (!result) {
        return {
          success: false,
          error: 'Erro ao atualizar alerta'
        };
      }

      // Emitir evento de atualização
      await eventSystem.emit(
        EventType.ALERT_UPDATED,
        'alert',
        alertId,
        {
          old_data: existingAlert,
          new_data: result
        },
        { user_id: result.user_id, source: 'alert-service' }
      );

      
      return {
        success: true,
        data: result,
        message: 'Alerta atualizado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar alerta:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Marca alerta como lido
   */
  public async markAsRead(alertId: UUID): Promise<ApiResponse<Alert>> {
    return this.updateAlert(alertId, { is_read: true });
  }

  /**
   * Marca todos os alertas do usuário como lidos
   */
  public async markAllAsRead(userId: UUID): Promise<ApiResponse<void>> {
    try {
      const query = `
        UPDATE alerts
        SET is_read = true, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND is_read = false
      `;

      await db.query(query, [userId]);

      
      return {
        success: true,
        message: 'Todos os alertas foram marcados como lidos'
      };

    } catch (error) {
      console.error('❌ Erro ao marcar todos os alertas como lidos:', error);
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
   * Desativa alerta
   */
  public async deactivateAlert(alertId: UUID): Promise<ApiResponse<void>> {
    try {
      const existingAlert = await this.findAlertById(alertId);
      if (!existingAlert) {
        return {
          success: false,
          error: 'Alerta não encontrado'
        };
      }

      const query = `
        UPDATE alerts
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await db.query(query, [alertId]);

      // Emitir evento de desativação
      await eventSystem.emit(
        EventType.ALERT_DELETED,
        'alert',
        alertId,
        { alert: existingAlert },
        { user_id: existingAlert.user_id, source: 'alert-service' }
      );

      
      return {
        success: true,
        message: 'Alerta desativado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao desativar alerta:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // =====================================================
  // MÉTODOS DE VERIFICAÇÃO DE ALERTAS
  // =====================================================

  /**
   * Verifica alertas de saldo baixo
   */
  public async checkBalanceAlerts(account: Account): Promise<void> {
    try {
      // Buscar alertas de saldo baixo para esta conta
      const alertsQuery = `
        SELECT * FROM alerts
        WHERE user_id = $1
        AND type = 'low_balance'
        AND (account_id = $2 OR account_id IS NULL)
        AND is_active = true
      `;

      const alerts = await db.query<Alert>(alertsQuery, [account.user_id, account.id]);

      for (const alert of alerts) {
        const checkResult = this.checkLowBalanceCondition(account, alert);

        if (checkResult.shouldTrigger) {
          await this.createSystemAlert(
            account.user_id,
            'low_balance',
            `Saldo baixo - ${account.name}`,
            checkResult.message,
            {
              account_id: account.id,
              current_balance: parseFloat(account.balance),
              threshold_value: alert.threshold_value ? parseFloat(alert.threshold_value) : undefined
            }
          );
        }
      }

      // Verificar saldo negativo
      if (parseFloat(account.balance) < 0) {
        await this.createSystemAlert(
          account.user_id,
          'negative_balance',
          `Saldo negativo - ${account.name}`,
          `Sua conta ${account.name} está com saldo negativo de R$ ${Math.abs(parseFloat(account.balance)).toFixed(2)}`,
          {
            account_id: account.id,
            current_balance: parseFloat(account.balance)
          }
        );
      }

    } catch (error) {
      console.error('❌ Erro ao verificar alertas de saldo:', error);
    }
  }

  /**
   * Verifica alertas de cartão de crédito
   */
  public async checkCreditCardAlerts(creditCard: CreditCard): Promise<void> {
    try {
      const limitUsed = parseFloat(creditCard.current_balance);
      const totalLimit = parseFloat(creditCard.credit_limit);
      const usagePercentage = (limitUsed / totalLimit) * 100;

      // Buscar alertas de limite de cartão
      const alertsQuery = `
        SELECT * FROM alerts
        WHERE user_id = $1
        AND type = 'credit_limit'
        AND (credit_card_id = $2 OR credit_card_id IS NULL)
        AND is_active = true
      `;

      const alerts = await db.query<Alert>(alertsQuery, [creditCard.user_id, creditCard.id]);

      for (const alert of alerts) {
        const thresholdPercentage = alert.threshold_value ? parseFloat(alert.threshold_value) : 80;

        if (usagePercentage >= thresholdPercentage) {
          await this.createSystemAlert(
            creditCard.user_id,
            'credit_limit',
            `Limite do cartão próximo - ${creditCard.name}`,
            `Seu cartão ${creditCard.name} está com ${usagePercentage.toFixed(1)}% do limite utilizado (R$ ${limitUsed.toFixed(2)} de R$ ${totalLimit.toFixed(2)})`,
            {
              credit_card_id: creditCard.id,
              current_limit_used: limitUsed,
              threshold_value: thresholdPercentage
            }
          );
        }
      }

      // Verificar se excedeu o limite
      if (limitUsed > totalLimit) {
        await this.createSystemAlert(
          creditCard.user_id,
          'credit_limit_exceeded',
          `Limite excedido - ${creditCard.name}`,
          `Seu cartão ${creditCard.name} excedeu o limite! Utilizado: R$ ${limitUsed.toFixed(2)} de R$ ${totalLimit.toFixed(2)}`,
          {
            credit_card_id: creditCard.id,
            current_limit_used: limitUsed
          }
        );
      }

    } catch (error) {
      console.error('❌ Erro ao verificar alertas de cartão:', error);
    }
  }

  /**
   * Verifica alertas de transação
   */
  public async checkTransactionAlerts(transaction: Transaction): Promise<void> {
    try {
      const amount = parseFloat(transaction.amount);

      // Buscar alertas de transação alta
      const alertsQuery = `
        SELECT * FROM alerts
        WHERE user_id = $1
        AND type = 'high_transaction'
        AND is_active = true
      `;

      const alerts = await db.query<Alert>(alertsQuery, [transaction.user_id]);

      for (const alert of alerts) {
        const threshold = alert.threshold_value ? parseFloat(alert.threshold_value) : 1000;

        if (Math.abs(amount) >= threshold) {
          const transactionType = amount > 0 ? 'receita' : 'despesa';

          await this.createSystemAlert(
            transaction.user_id,
            'high_transaction',
            `Transação de valor alto`,
            `${transactionType} de R$ ${Math.abs(amount).toFixed(2)} registrada${transaction.description ? ': ' + transaction.description : ''}`,
            {
              transaction_amount: Math.abs(amount),
              threshold_value: threshold
            }
          );
        }
      }

    } catch (error) {
      console.error('❌ Erro ao verificar alertas de transação:', error);
    }
  }

  // =====================================================
  // MÉTODOS DE VALIDAÇÃO
  // =====================================================

  /**
   * Verifica condição de saldo baixo
   */
  private checkLowBalanceCondition(account: Account, alert: Alert): AlertCheckResult {
    const currentBalance = parseFloat(account.balance);
    const threshold = alert.threshold_value ? parseFloat(alert.threshold_value) : 100;

    if (currentBalance <= threshold) {
      return {
        shouldTrigger: true,
        message: `Sua conta ${account.name} está com saldo baixo: R$ ${currentBalance.toFixed(2)}`,
        severity: currentBalance <= 0 ? 'critical' : currentBalance <= threshold * 0.5 ? 'high' : 'medium'
      };
    }

    return {
      shouldTrigger: false,
      message: '',
      severity: 'low'
    };
  }

  /**
   * Valida dados de criação de alerta
   */
  private async validateCreateAlertInput(data: CreateAlertInput): Promise<{
    isValid: boolean;
    errors?: Record<string, string[]>;
  }> {
    const errors: Record<string, string[]> = {};

    // Validar título
    if (!data.title || data.title.trim().length < 3) {
      errors.title = ['Título deve ter pelo menos 3 caracteres'];
    }

    if (data.title && data.title.length > 100) {
      errors.title = ['Título não pode ter mais de 100 caracteres'];
    }

    // Validar mensagem
    if (!data.message || data.message.trim().length < 5) {
      errors.message = ['Mensagem deve ter pelo menos 5 caracteres'];
    }

    if (data.message && data.message.length > 500) {
      errors.message = ['Mensagem não pode ter mais de 500 caracteres'];
    }

    // Validar tipo
    const validTypes: AlertType[] = ['low_balance', 'negative_balance', 'credit_limit', 'credit_limit_exceeded', 'high_transaction', 'budget_exceeded', 'goal_achieved', 'custom'];
    if (!validTypes.includes(data.type)) {
      errors.type = ['Tipo de alerta inválido'];
    }

    // Validar valor limite (se fornecido)
    if (data.threshold_value !== undefined && data.threshold_value !== null) {
      if (isNaN(data.threshold_value) || data.threshold_value < 0) {
        errors.threshold_value = ['Valor limite deve ser um número positivo'];
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  /**
   * Valida dados de atualização de alerta
   */
  private async validateUpdateAlertInput(data: UpdateAlertInput): Promise<{
    isValid: boolean;
    errors?: Record<string, string[]>;
  }> {
    const errors: Record<string, string[]> = {};

    // Validar título (se fornecido)
    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length < 3) {
        errors.title = ['Título deve ter pelo menos 3 caracteres'];
      }

      if (data.title.length > 100) {
        errors.title = ['Título não pode ter mais de 100 caracteres'];
      }
    }

    // Validar mensagem (se fornecida)
    if (data.message !== undefined) {
      if (!data.message || data.message.trim().length < 5) {
        errors.message = ['Mensagem deve ter pelo menos 5 caracteres'];
      }

      if (data.message.length > 500) {
        errors.message = ['Mensagem não pode ter mais de 500 caracteres'];
      }
    }

    // Validar valor limite (se fornecido)
    if (data.threshold_value !== undefined && data.threshold_value !== null) {
      if (isNaN(data.threshold_value) || data.threshold_value < 0) {
        errors.threshold_value = ['Valor limite deve ser um número positivo'];
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  /**
   * Valida referências do alerta
   */
  private async validateAlertReferences(data: CreateAlertInput): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    // Se especificou conta, verificar se existe e pertence ao usuário
    if (data.account_id) {
      const accountQuery = 'SELECT id FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true';
      const account = await db.queryOne(accountQuery, [data.account_id, data.user_id]);

      if (!account) {
        return {
          isValid: false,
          error: 'Conta especificada não encontrada ou não pertence ao usuário'
        };
      }
    }

    // Se especificou cartão, verificar se existe e pertence ao usuário
    if (data.credit_card_id) {
      const cardQuery = 'SELECT id FROM credit_cards WHERE id = $1 AND user_id = $2 AND is_active = true';
      const card = await db.queryOne(cardQuery, [data.credit_card_id, data.user_id]);

      if (!card) {
        return {
          isValid: false,
          error: 'Cartão especificado não encontrado ou não pertence ao usuário'
        };
      }
    }

    return { isValid: true };
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
   * Cria alertas padrão para novo usuário
   */
  public async createDefaultAlerts(userId: UUID): Promise<void> {
    try {
      const defaultAlerts: CreateAlertInput[] = [
        {
          user_id: userId,
          type: 'low_balance',
          title: 'Saldo baixo',
          message: 'Alerta quando o saldo de qualquer conta ficar abaixo de R$ 100',
          threshold_value: 100
        },
        {
          user_id: userId,
          type: 'credit_limit',
          title: 'Limite do cartão',
          message: 'Alerta quando usar mais de 80% do limite do cartão',
          threshold_value: 80
        },
        {
          user_id: userId,
          type: 'high_transaction',
          title: 'Transação alta',
          message: 'Alerta para transações acima de R$ 500',
          threshold_value: 500
        }
      ];

      for (const alertData of defaultAlerts) {
        await this.createAlert(alertData);
      }

      
    } catch (error) {
      console.error('❌ Erro ao criar alertas padrão:', error);
    }
  }

  /**
   * Limpa alertas antigos do sistema
   */
  public async cleanupOldAlerts(daysOld: number = 30): Promise<number> {
    try {
      const query = `
        UPDATE alerts
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE is_system_generated = true
        AND is_read = true
        AND created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
        AND is_active = true
      `;

      const result = await db.query(query);
      const cleanedCount = result.length;

      console.log(`✅ ${cleanedCount} alertas antigos limpos`);
      return cleanedCount;

    } catch (error) {
      console.error('❌ Erro ao limpar alertas antigos:', error);
      return 0;
    }
  }
}

// =====================================================
// INSTÂNCIA GLOBAL
// =====================================================

export const alertService = AlertService.getInstance();
