/**
 * 💰 DEBT HELPERS - Funções auxiliares para dívidas compartilhadas
 */

/**
 * Criar ou atualizar dívida compartilhada
 */
export async function createOrUpdateDebt(
  creditor: string,
  debtor: string,
  amount: number,
  description: string,
  transactionId?: string
): Promise<any> {
  try {
    const response = await fetch('/api/shared-debts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        creditor,
        debtor,
        amount,
        description,
        transactionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar dívida');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar dívida:', error);
    throw error;
  }
}

/**
 * Buscar dívidas do usuário
 */
export async function getDebts(userId: string = 'user', status: string = 'active'): Promise<any> {
  try {
    const params = new URLSearchParams();
    params.append('userId', userId);
    params.append('status', status);

    const response = await fetch(`/api/shared-debts?${params.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar dívidas');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao buscar dívidas:', error);
    return {
      all: [],
      iOwe: [],
      oweMe: [],
      summary: { totalIOwe: 0, totalOweMe: 0 },
    };
  }
}

/**
 * Pagar/quitar dívida
 */
export async function payDebt(debtId: string, amountPaid: number): Promise<any> {
  try {
    const response = await fetch('/api/shared-debts', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        debtId,
        amountPaid,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao pagar dívida');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao pagar dívida:', error);
    throw error;
  }
}

/**
 * Processar lógica de "pago por outra pessoa"
 * Retorna informações sobre créditos/débitos
 */
export async function processSharedPayment(
  paidBy: string,
  participants: Array<{ id: string; name: string; share: number }>,
  totalAmount: number,
  description: string,
  transactionId?: string
): Promise<{
  debtsCreated: any[];
  creditsCreated: any[];
  summary: {
    totalDebts: number;
    totalCredits: number;
  };
}> {
  const debtsCreated: any[] = [];
  const creditsCreated: any[] = [];

  try {
    // Para cada participante (exceto quem pagou)
    for (const participant of participants) {
      if (participant.id === paidBy) continue;

      // Criar dívida: participante deve para quem pagou
      const debt = await createOrUpdateDebt(
        paidBy, // Credor (quem pagou)
        participant.id, // Devedor
        participant.share,
        `${description} - Parte de ${participant.name}`,
        transactionId
      );

      debtsCreated.push(debt);
    }

    // Calcular totais
    const totalDebts = debtsCreated.reduce((sum, d) => sum + Number(d.currentAmount), 0);

    return {
      debtsCreated,
      creditsCreated,
      summary: {
        totalDebts,
        totalCredits: 0,
      },
    };
  } catch (error) {
    console.error('❌ Erro ao processar pagamento compartilhado:', error);
    throw error;
  }
}
