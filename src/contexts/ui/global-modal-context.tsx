'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
interface ModalConfig {
  id: string;
  title?: string;
  content: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  onClose?: () => void;
}

interface GlobalModalContextType {
  // Modal state
  activeModal: string | null;
  transactionModalOpen: boolean;
  investmentModalOpen: boolean;
  goalModalOpen: boolean;
  tripModalOpen: boolean;
  sharedExpenseModalOpen: boolean;
  transactionsListModalOpen: boolean;
  globalSearchModalOpen: boolean;

  // Modal actions
  openTransactionModal: () => void;
  openSharedExpenseModal: () => void;
  openInvestmentModal: () => void;
  openGoalModal: () => void;
  openTripModal: () => void;
  openTransactionsListModal: () => void;
  openGlobalSearch: () => void;
  closeAllModals: () => void;

  // Legacy modal system
  modals: ModalConfig[];
  openModal: (config: Omit<ModalConfig, 'id'>) => string;
  closeModal: (id: string) => void;
}

// Context
const GlobalModalContext = createContext<GlobalModalContextType>({
  activeModal: null,
  transactionModalOpen: false,
  investmentModalOpen: false,
  goalModalOpen: false,
  tripModalOpen: false,
  sharedExpenseModalOpen: false,
  transactionsListModalOpen: false,
  globalSearchModalOpen: false,

  openTransactionModal: () => {},
  openSharedExpenseModal: () => {},
  openInvestmentModal: () => {},
  openGoalModal: () => {},
  openTripModal: () => {},
  openTransactionsListModal: () => {},
  openGlobalSearch: () => {},
  closeAllModals: () => {},

  modals: [],
  openModal: () => '',
  closeModal: () => {},
});

// Provider
interface GlobalModalProviderProps {
  children: ReactNode;
}

export function GlobalModalProvider({ children }: GlobalModalProviderProps) {
  const [modals, setModals] = useState<ModalConfig[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (config: Omit<ModalConfig, 'id'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const modalConfig: ModalConfig = {
      ...config,
      id,
      size: config.size || 'md',
      closable: config.closable !== false,
    };

    setModals(prev => [...prev, modalConfig]);
    return id;
  };

  const closeModal = (id: string) => {
    setModals(prev => {
      const modal = prev.find(m => m.id === id);
      if (modal?.onClose) {
        modal.onClose();
      }
      return prev.filter(m => m.id !== id);
    });
  };

  const closeAllModals = () => {
    modals.forEach(modal => {
      if (modal.onClose) {
        modal.onClose();
      }
    });
    setModals([]);
    setActiveModal(null);
  };

  // New modal system methods
  const openTransactionModal = () => {
    setActiveModal('transaction');
  };

  const openSharedExpenseModal = () => {
    setActiveModal('shared-expense');
  };

  const openInvestmentModal = () => {
    setActiveModal('investment');
  };

  const openGoalModal = () => {
    setActiveModal('goal');
  };

  const openTripModal = () => {
    setActiveModal('trip');
  };

  const openTransactionsListModal = () => {
    setActiveModal('transactions-list');
  };

  const openGlobalSearch = () => {
    setActiveModal('global-search');
  };

  return (
    <GlobalModalContext.Provider
      value={{
        activeModal,
        transactionModalOpen: activeModal === 'transaction',
        investmentModalOpen: activeModal === 'investment',
        goalModalOpen: activeModal === 'goal',
        tripModalOpen: activeModal === 'trip',
        sharedExpenseModalOpen: activeModal === 'shared-expense',
        transactionsListModalOpen: activeModal === 'transactions-list',
        globalSearchModalOpen: activeModal === 'global-search',

        openTransactionModal,
        openSharedExpenseModal,
        openInvestmentModal,
        openGoalModal,
        openTripModal,
        openTransactionsListModal,
        openGlobalSearch,
        closeAllModals,

        modals,
        openModal,
        closeModal,
      }}
    >
      {children}
      {/* Modal Renderer */}
      {modals.map(modal => (
        <div
          key={modal.id}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && modal.closable) {
              closeModal(modal.id);
            }
          }}
        >
          <div
            className={`
              bg-white rounded-lg shadow-xl max-h-[90vh] overflow-auto
              ${modal.size === 'sm' ? 'max-w-sm' : ''}
              ${modal.size === 'md' ? 'max-w-md' : ''}
              ${modal.size === 'lg' ? 'max-w-lg' : ''}
              ${modal.size === 'xl' ? 'max-w-xl' : ''}
            `}
          >
            {modal.title && (
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">{modal.title}</h3>
                {modal.closable && (
                  <button
                    onClick={() => closeModal(modal.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            <div className="p-4">
              {modal.content}
            </div>
          </div>
        </div>
      ))}
    </GlobalModalContext.Provider>
  );
}

// Hook
export function useGlobalModal() {
  const context = useContext(GlobalModalContext);
  if (!context) {
    throw new Error('useGlobalModal must be used within a GlobalModalProvider');
  }
  return context;
}
