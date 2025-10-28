/**
 * 💳 INVOICE HELPERS - Funções auxiliares para faturas de cartão
 */

/**
 * Criar ou atualizar fatura de cartão de crédito
 */
export async function createOrUpdateInvoice(
  creditCardId: string,
  date: Date,
  amount: number
): Promise<any> {
  try {
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const year = date.getFullYear();

    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        creditCardId,
        month,
        year,
        amount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar fatura');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar fatura:', error);
    throw error;
  }
}

/**
 * Buscar faturas de um cartão
 */
export async function getInvoices(
  creditCardId?: string,
  month?: number,
  year?: number
): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (creditCardId) params.append('creditCardId', creditCardId);
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const response = await fetch(`/api/invoices?${params.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar faturas');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao buscar faturas:', error);
    return [];
  }
}

/**
 * Calcular total de uma fatura incluindo parcelas
 */
export function calculateInvoiceTotal(transactions: any[]): number {
  return transactions.reduce((sum, t) => {
    return sum + Math.abs(Number(t.amount));
  }, 0);
}

/**
 * Agrupar transações por tipo (parcelas, compras únicas, etc)
 */
export function groupInvoiceTransactions(transactions: any[]) {
  const installments = transactions.filter(t => t.isInstallment);
  const regular = transactions.filter(t => !t.isInstallment);
  const shared = transactions.filter(t => t.isShared);

  return {
    installments,
    regular,
    shared,
    all: transactions,
  };
}
