/**
 * AuditService - Serviço de auditoria e histórico
 */

import { prisma } from '@/lib/prisma';

export class AuditService {
    /**
     * Registra alteração em entidade
     * Requirements: 11.1, 11.2
     */
    async logChange(data: {
        userId: string;
        entityType: string;
        entityId: string;
        action: string;
        fieldName?: string;
        oldValue?: any;
        newValue?: any;
    }): Promise<void> {
        await prisma.auditEvent.create({
            data: {
                userId: data.userId,
                tableName: data.entityType,
                recordId: data.entityId,
                operation: data.action,
                oldValues: data.oldValue ? JSON.stringify(data.oldValue) : null,
                newValues: data.newValue ? JSON.stringify(data.newValue) : null,
                metadata: data.fieldName ? JSON.stringify({ fieldName: data.fieldName }) : null,
            },
        });
    }

    /**
     * Consulta histórico de alterações
     * Requirements: 11.3
     */
    async getAuditHistory(entityId: string, entityType?: string): Promise<any[]> {
        const where: any = {
            recordId: entityId,
        };

        if (entityType) {
            where.tableName = entityType;
        }

        const history = await prisma.auditEvent.findMany({
            where,
            orderBy: {
                timestamp: 'desc',
            },
            take: 100,
        });

        return history;
    }

    /**
     * Exporta log de auditoria
     * Requirements: 11.4, 11.5
     */
    async exportAuditLog(
        userId: string,
        startDate: Date,
        endDate: Date,
        format: 'CSV' | 'JSON' = 'JSON'
    ): Promise<string> {
        const logs = await prisma.auditEvent.findMany({
            where: {
                userId,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });

        if (format === 'JSON') {
            return JSON.stringify(logs, null, 2);
        } else {
            // CSV format
            const headers = ['Timestamp', 'Table', 'Record ID', 'Operation', 'Old Values', 'New Values'];
            const rows = logs.map((log) => [
                log.timestamp.toISOString(),
                log.tableName,
                log.recordId,
                log.operation,
                log.oldValues || '',
                log.newValues || '',
            ]);

            const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
            return csv;
        }
    }
}

export const auditService = new AuditService();
