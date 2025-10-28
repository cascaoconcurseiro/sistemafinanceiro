/**
 * CategoryService - Serviço de gerenciamento de categorias hierárquicas
 */

import { prisma } from '@/lib/prisma';
import { ValidationError } from './validation-service';

export class CategoryService {
    /**
     * Cria categoria com hierarquia
     * Requirements: 15.1, 15.2
     */
    async createCategory(data: {
        name: string;
        parentId?: string;
        type: string;
        color?: string;
        icon?: string;
    }): Promise<any> {
        // Validar que parent existe se fornecido
        if (data.parentId) {
            const parent = await prisma.category.findUnique({
                where: { id: data.parentId },
            });

            if (!parent) {
                throw new ValidationError('parentId', 'Categoria pai não encontrada', 'NOT_FOUND');
            }
        }

        const category = await prisma.category.create({
            data: {
                name: data.name,
                parentId: data.parentId,
                type: data.type,
                color: data.color,
                icon: data.icon,
            },
        });

        return category;
    }

    /**
     * Calcula totais incluindo subcategorias
     * Requirements: 15.4
     */
    async calculateCategoryTotal(
        categoryId: string,
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<number> {
        // Buscar categoria e todas as subcategorias
        const categoryIds = await this.getCategoryWithChildren(categoryId);

        // Somar transações de todas as categorias
        const result = await prisma.transaction.aggregate({
            where: {
                userId,
                categoryId: {
                    in: categoryIds,
                },
                deletedAt: null,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                amount: true,
            },
        });

        return Math.abs(Number(result._sum.amount || 0));
    }

    /**
     * Busca categoria e todas as subcategorias recursivamente
     */
    private async getCategoryWithChildren(categoryId: string): Promise<string[]> {
        const ids: string[] = [categoryId];

        const children = await prisma.category.findMany({
            where: { parentId: categoryId },
        });

        for (const child of children) {
            const childIds = await this.getCategoryWithChildren(child.id);
            ids.push(...childIds);
        }

        return ids;
    }

    /**
     * Exclui categoria
     * Requirements: 15.5
     */
    async deleteCategory(
        categoryId: string,
        targetCategoryId?: string
    ): Promise<void> {
        // Contar transações vinculadas
        const transactionCount = await prisma.transaction.count({
            where: {
                categoryId,
                deletedAt: null,
            },
        });

        if (transactionCount > 0 && !targetCategoryId) {
            throw new ValidationError(
                'categoryId',
                `Categoria tem ${transactionCount} transações. Forneça targetCategoryId para reatribuir.`,
                'HAS_TRANSACTIONS'
            );
        }

        // Reatribuir transações se necessário
        if (targetCategoryId) {
            await prisma.transaction.updateMany({
                where: { categoryId },
                data: { categoryId: targetCategoryId },
            });
        }

        // Excluir categoria
        await prisma.category.update({
            where: { id: categoryId },
            data: { isActive: false },
        });
    }
}

export const categoryService = new CategoryService();
