'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useTransactions } from './use-transactions-query';

/**
 * Hook para busca de transações com debounce
 * Evita requisições excessivas enquanto o usuário digita
 */
export function useSearchTransactions(initialFilters?: Record<string, any>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState(initialFilters || {});

  // Debounce de 500ms - só busca após usuário parar de digitar
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [debouncedFilters] = useDebounce(filters, 300);

  // Combina search term com filtros
  const finalFilters = {
    ...debouncedFilters,
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
  };

  // Usa o hook de transações com os filtros debounced
  const query = useTransactions(finalFilters);

  return {
    ...query,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    isSearching: searchTerm !== debouncedSearchTerm ||
                 JSON.stringify(filters) !== JSON.stringify(debouncedFilters),
  };
}
