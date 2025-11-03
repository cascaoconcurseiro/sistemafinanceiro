/**
 * SERVIÇO DE EVENTOS
 * Gerencia eventos do sistema para ações derivadas
 */

import { prisma } from '@/lib/prisma';

type EventType =
  | 'transaction_created'
  | 'transaction_updated'
  | 'transaction_deleted'
  | 'invoice_paid'
  | 'transfer_created'
  | 'period_closed'
  | 'period_reopened'
  | 'account_created'
  | 'account_updated';

type EntityType = 'transaction' | 'invoice' | 'account' | 'period';

export class EventService {
  /**
   * Emite um evento
   */
  static async emit(
    eventType: EventType,
    entityType: EntityType,
    entityId: string,
    data?: any,
    userId?: string
  ) {
    const event = await prisma.systemEvent.create({
      data: {
        userId,
        type: eventType, // Campo obrigatório
        eventType,
        entityType,
        entityId,
        data: data ? JSON.stringify(data) : null,
        processed: false
      }
    });

    console.log(`📢 Evento emitido: ${eventType} (${entityId})`);

    // Processar evento imediatamente (síncrono)
    await this.processEvent(event.id);

    return event;
  }

  /**
   * Processa um evento
   */
  static async processEvent(eventId: string) {
    const event = await prisma.systemEvent.findUnique({
      where: { id: eventId }
    });

    if (!event || event.processed) {
      return;
    }

    console.log(`⚙️ Processando evento: ${event.eventType}`);

    try {
      switch (event.eventType) {
        case 'transaction_created':
          await this.handleTransactionCreated(event);
          break;
        case 'transaction_deleted':
          await this.handleTransactionDeleted(event);
          break;
        case 'invoice_paid':
          await this.handleInvoicePaid(event);
          break;
        case 'transfer_created':
          await this.handleTransferCreated(event);
          break;
        case 'period_closed':
          await this.handlePeriodClosed(event);
          break;
        case 'account_updated':
          await this.handleAccountUpdated(event);
          break;
      }

      // Marcar como processado
      await prisma.systemEvent.update({
        where: { id: eventId },
        data: {
          processed: true,
          processedAt: new Date()
        }
      });

      console.log(`✅ Evento processado: ${event.eventType}`);
    } catch (error) {
      console.error(`❌ Erro ao processar evento ${event.eventType}:`, error);
    }
  }

  /**
   * Handlers de eventos
   */

  private static async handleTransactionCreated(event: any) {
    const data = event.data ? JSON.parse(event.data) : {};
    
    // Registrar no histórico de saldos
    if (data.accountId) {
      const { AccountHistoryService } = await import('./account-history-service');
      const account = await prisma.account.findUnique({
        where: { id: data.accountId }
      });
      
      if (account) {
        await AccountHistoryService.recordBalanceChange(
          data.accountId,
          new Date(),
          Number(account.balance),
          `Transação criada: ${data.description}`
        );
      }
    }
  }

  private static async handleTransactionDeleted(event: any) {
    const data = event.data ? JSON.parse(event.data) : {};
    
    // Registrar no histórico
    if (data.accountId) {
      const { AccountHistoryService } = await import('./account-history-service');
      const account = await prisma.account.findUnique({
        where: { id: data.accountId }
      });
      
      if (account) {
        await AccountHistoryService.recordBalanceChange(
          data.accountId,
          new Date(),
          Number(account.balance),
          `Transação deletada: ${data.description}`
        );
      }
    }
  }

  private static async handleInvoicePaid(event: any) {
    const data = event.data ? JSON.parse(event.data) : {};
    console.log(`💳 Fatura paga: ${data.invoiceId}`);
    
    // Aqui você pode adicionar notificações, webhooks, etc
  }

  private static async handleTransferCreated(event: any) {
    const data = event.data ? JSON.parse(event.data) : {};
    console.log(`💸 Transferência criada: R$ ${data.amount}`);
  }

  private static async handlePeriodClosed(event: any) {
    const data = event.data ? JSON.parse(event.data) : {};
    console.log(`🔒 Período fechado: ${data.period}`);
    
    // Gerar relatórios automáticos, backups, etc
  }

  private static async handleAccountUpdated(event: any) {
    const data = event.data ? JSON.parse(event.data) : {};
    
    // Registrar mudança de saldo
    if (data.balanceChanged) {
      const { AccountHistoryService } = await import('./account-history-service');
      await AccountHistoryService.recordBalanceChange(
        event.entityId,
        new Date(),
        data.newBalance,
        'Saldo atualizado'
      );
    }
  }

  /**
   * Processa eventos pendentes (para job/cron)
   */
  static async processPendingEvents(limit: number = 100) {
    const events = await prisma.systemEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
      take: limit
    });

    console.log(`📋 Processando ${events.length} eventos pendentes`);

    for (const event of events) {
      await this.processEvent(event.id);
    }

    return events.length;
  }

  /**
   * Limpa eventos antigos
   */
  static async cleanOldEvents(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await prisma.systemEvent.deleteMany({
      where: {
        processed: true,
        createdAt: { lt: cutoffDate }
      }
    });

    console.log(`🗑️ Eventos limpos: ${deleted.count} registros removidos`);

    return deleted.count;
  }
}
