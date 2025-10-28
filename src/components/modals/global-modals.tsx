'use client';

import { useGlobalModal } from '@/contexts/ui/global-modal-context';
import { SharedExpenseModal } from '../features/shared-expenses/shared-expense-modal';

export function GlobalModals() {
  const {
    closeAllModals,
    transactionModalOpen,
    sharedExpenseModalOpen,
  } = useGlobalModal();

  return (
    <>
      {/* Modal de Despesas Compartilhadas */}
      {sharedExpenseModalOpen && (
        <SharedExpenseModal
          onClose={closeAllModals}
          onSave={() => {
            // Recarregar dados após salvar
            window.dispatchEvent(new CustomEvent('sharedExpensesUpdated'));
            closeAllModals();
          }}
        />
      )}

      {/* Modal de Transações - temporariamente desabilitado */}
      {transactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Modal Temporariamente Desabilitado</h3>
            <p className="text-gray-600 mb-4">
              O modal de transações está temporariamente desabilitado para resolver problemas de carregamento.
            </p>
            <button
              onClick={closeAllModals}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
