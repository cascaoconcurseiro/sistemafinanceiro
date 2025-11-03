import { useState, useCallback } from 'react';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
}

interface UseConfirmDialogResult {
  dialogState: ConfirmDialogState;
  confirm: (options: Omit<ConfirmDialogState, 'isOpen'>) => void;
  closeDialog: () => void;
  handleConfirm: () => Promise<void>;
}

/**
 * Hook para gerenciar diálogos de confirmação
 *
 * @returns Objeto com estado do diálogo e funções de controle
 *
 * @example
 * const { dialogState, confirm, closeDialog, handleConfirm } = useConfirmDialog();
 *
 * // Abrir diálogo
 * confirm({
 *   title: 'Delete Transaction',
 *   message: 'Are you sure?',
 *   onConfirm: async () => await deleteTransaction(id)
 * });
 */
export function useConfirmDialog(): UseConfirmDialogResult {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirm = useCallback(
    (options: Omit<ConfirmDialogState, 'isOpen'>) => {
      setDialogState({
        ...options,
        isOpen: true,
      });
    },
    []
  );

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    await dialogState.onConfirm();
    closeDialog();
  }, [dialogState.onConfirm, closeDialog]);

  return {
    dialogState,
    confirm,
    closeDialog,
    handleConfirm,
  };
}
