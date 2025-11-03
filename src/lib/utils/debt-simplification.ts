/**
 * 🧮 SIMPLIFICAÇÃO DE DÍVIDAS
 *
 * Compensa automaticamente dívidas entre as mesmas pessoas.
 *
 * Exemplo:
 * - Wesley me deve: R$ 50,00
 * - Eu devo para Wesley: R$ 5,00
 * - Resultado: Wesley me deve R$ 45,00 (simplificado)
 */

export interface Debt {
  id: string;
  creditorId: string;
  debtorId: string;
  amount: number;
  description: string;
  status: string;
}

export interface SimplifiedDebt {
  personId: string;
  personName: string;
  netAmount: number; // Positivo = me devem, Negativo = eu devo
  type: 'CREDIT' | 'DEBIT';
  originalDebts: Debt[]; // Dívidas originais que geraram este saldo
}

/**
 * Simplifica dívidas calculando o saldo líquido por pessoa
 */
export function simplifyDebts(
  debts: Debt[],
  currentUserId: string,
  contacts: Array<{ id: string; name: string; email: string }>
): SimplifiedDebt[] {
  console.log('🧮 [Simplification] Iniciando simplificação de dívidas');
  console.log('🧮 [Simplification] Total de dívidas:', debts.length);
  console.log('🧮 [Simplification] User ID:', currentUserId);

  // Agrupar dívidas por pessoa
  const debtsByPerson = new Map<string, {
    owed: number;      // Quanto essa pessoa me deve
    owes: number;      // Quanto eu devo para essa pessoa
    debts: Debt[];     // Dívidas originais
  }>();

  // Processar cada dívida
  debts.forEach(debt => {
    let personId: string | null = null;
    let isCredit = false;

    // Se EU sou o credor (pessoa me deve)
    if (debt.creditorId === currentUserId) {
      personId = debt.debtorId;
      isCredit = true;
    }
    // Se EU sou o devedor (eu devo para pessoa)
    else if (debt.debtorId === currentUserId) {
      personId = debt.creditorId;
      isCredit = false;
    }

    if (personId) {
      if (!debtsByPerson.has(personId)) {
        debtsByPerson.set(personId, { owed: 0, owes: 0, debts: [] });
      }

      const personDebts = debtsByPerson.get(personId)!;

      if (isCredit) {
        personDebts.owed += debt.amount;
      } else {
        personDebts.owes += debt.amount;
      }

      personDebts.debts.push(debt);
    }
  });

  console.log('🧮 [Simplification] Dívidas agrupadas por pessoa:', debtsByPerson.size);

  // Calcular saldo líquido e criar resultado simplificado
  const simplified: SimplifiedDebt[] = [];

  debtsByPerson.forEach((data, personId) => {
    const netAmount = data.owed - data.owes;

    // Só incluir se houver saldo líquido diferente de zero
    if (Math.abs(netAmount) > 0.01) { // Tolerância para erros de arredondamento
      const contact = contacts.find(c => c.id === personId);
      const personName = contact?.name || contact?.email || personId;

      simplified.push({
        personId,
        personName,
        netAmount,
        type: netAmount > 0 ? 'CREDIT' : 'DEBIT',
        originalDebts: data.debts,
      });

      console.log(`🧮 [Simplification] ${personName}: ${netAmount > 0 ? '+' : ''}R$ ${netAmount.toFixed(2)}`);
    } else {
      console.log(`🧮 [Simplification] ${personId}: Saldo zerado (compensado)`);
    }
  });

  console.log('🧮 [Simplification] Total simplificado:', simplified.length, 'pessoas');

  return simplified;
}

/**
 * Calcula o total que me devem (créditos)
 */
export function getTotalCredit(simplified: SimplifiedDebt[]): number {
  return simplified
    .filter(d => d.type === 'CREDIT')
    .reduce((sum, d) => sum + d.netAmount, 0);
}

/**
 * Calcula o total que eu devo (débitos)
 */
export function getTotalDebit(simplified: SimplifiedDebt[]): number {
  return simplified
    .filter(d => d.type === 'DEBIT')
    .reduce((sum, d) => sum + Math.abs(d.netAmount), 0);
}

/**
 * Calcula o saldo líquido total
 */
export function getNetBalance(simplified: SimplifiedDebt[]): number {
  return simplified.reduce((sum, d) => sum + d.netAmount, 0);
}
