import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

interface InstallmentData {
  userId: string;
  accountId?: string;
  creditCardId?: string;
  amount: number;
  description: string;
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
  date: Date;
  totalInstallments: number;
  categoryId?: string;
  tripId?: string;
  isShared?: boolean;
  sharedWith?: string[];
}

export const installmentEngine = {
  /**
   * Cria transação parcelada com transação atômica
   * Garante que ou todas as parcelas são criadas ou nenhuma
   */
  createInstallment: async (data: InstallmentData) => {
    try {
      // Validações
      if (!data.accountId && !data.creditCardId) {
        throw new Error('Conta ou cartão obrigatório');
      }

      if (data.totalInstallments < 2 || data.totalInstallments > 60) {
        throw new Error('Parcelas devem ser entre 2 e 60');
      }

      // Criar todas as parcelas em uma transação atômica
      const transactions = await prisma.$transaction(async (tx) => {
        const installmentGroupId = `installment-${Date.now()}`;
        const installmentAmount = new Decimal(data.amount).div(data.totalInstallments);
        const createdTransactions = [];

        for (let i = 1; i <= data.totalInstallments; i++) {
          // Calcular data da parcela
          const installmentDate = new Date(data.date);
          installmentDate.setMonth(data.date.getMonth() + (i - 1));

          // Criar transação
          const transaction = await tx.transaction.create({
            data: {
              userId: data.userId,
              accountId: data.accountId || null,
              creditCardId: data.creditCardId || null,
              categoryId: data.categoryId || null,
              amount: installmentAmount,
              description: `${data.description} (${i}/${data.totalInstallments})`,
              type: data.type,
              date: installmentDate,
              status: 'cleared',
              isInstallment: true,
              installmentNumber: i,
              totalInstallments: data.totalInstallments,
              installmentGroupId,
              tripId: data.tripId || null,
              isShared: data.isShared || false,
              sharedWith: data.sharedWith ? JSON.stringify(data.sharedWith) : null,
            }
          });

          createdTransactions.push(transaction);

          // Se for cartão, atualizar limite
          if (data.creditCardId && data.type === 'DESPESA') {
            await tx.creditCard.update({
              where: { id: data.creditCardId },
              data: {
                currentBalance: {
                  increment: installmentAmount
                }
              }
            });
          }
        }

        return createdTransactions;
      });

      return {
        success: true,
        transactions,
        message: `${transactions.length} parcelas criadas com sucesso`
      };

    } catch (error) {
      console.error('❌ Erro ao criar parcelamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar parcelamento'
      };
    }
  }
};
