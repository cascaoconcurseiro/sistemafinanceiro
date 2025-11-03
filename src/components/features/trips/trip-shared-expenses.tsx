'use client';

import { SharedExpensesBilling } from '../shared-expenses/shared-expenses-billing';

interface TripSharedExpensesProps {
  tripId?: string;
  onUpdate?: () => void;
}

/**
 * Componente de Despesas Compartilhadas de uma Viagem Específica
 *
 * Este componente é apenas um wrapper que usa o SharedExpensesBilling
 * em modo 'trip' para garantir que a lógica de pagamento seja a mesma
 * em todas as páginas.
 *
 * TODO: Filtrar por tripId específico se fornecido
 */
export function TripSharedExpenses({ tripId, onUpdate }: TripSharedExpensesProps) {
  return <SharedExpensesBilling mode="trip" onUpdate={onUpdate} />;
}
