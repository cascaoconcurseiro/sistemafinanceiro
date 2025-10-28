'use client';

import { SharedExpensesBilling } from './shared-expenses-billing';

interface TravelSharedExpensesProps {
  onUpdate?: () => void;
}

/**
 * Componente de Despesas Compartilhadas de Viagem
 * 
 * Este componente é apenas um wrapper que usa o SharedExpensesBilling
 * em modo 'trip' para garantir que a lógica de pagamento seja a mesma
 * em todas as páginas.
 */
export function TravelSharedExpenses({ onUpdate }: TravelSharedExpensesProps) {
  return <SharedExpensesBilling mode="trip" onUpdate={onUpdate} />;
}
