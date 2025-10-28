import { useState, useCallback } from 'react';

/**
 * Hook customizado para gerenciar estados booleanos
 * 
 * @param initialValue - Valor inicial (padrão: false)
 * @returns Tupla com [value, toggle, setTrue, setFalse]
 * 
 * @example
 * const [isOpen, toggle, open, close] = useToggle();
 * const [isVisible, toggleVisible] = useToggle(true);
 */
export function useToggle(
  initialValue = false
): [boolean, () => void, () => void, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return [value, toggle, setTrue, setFalse];
}
